import { logger } from '@/lib/logger'
import { prisma } from '@/lib/prisma'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'

export interface OnboardingData {
  uid: string
  email: string
  name: string
  skipOrgCreation?: boolean // Se true, não cria org automaticamente (caso de convite)
}

/**
 * Cria o usuário e a organização na primeira autenticação.
 * Persiste tanto no Firestore (tempo real) quanto no PostgreSQL (queries).
 * Se já existir, apenas atualiza o último login.
 * Se skipOrgCreation=true, cria apenas o usuário sem org (usado quando aceita convite).
 */
export async function handleUserOnboarding({
  uid,
  email,
  name,
  skipOrgCreation = false,
}: OnboardingData) {
  const db = getFirestore()
  const userRef = db.collection('users').doc(uid)

  // 🔍 Primeiro verifica no PostgreSQL (fonte da verdade)
  const existingUser = await prisma.user.findUnique({
    where: { firebaseUid: uid },
  })

  if (existingUser) {
    // Usuário já existe → apenas atualiza último login
    await prisma.user.update({
      where: { firebaseUid: uid },
      data: { updatedAt: new Date() },
    })

    // Sincroniza com Firestore se necessário
    const userSnap = await userRef.get()
    if (userSnap.exists) {
      await userRef.update({ lastLogin: new Date() })
    } else {
      console.warn(
        `⚠️ Usuário ${uid} existe no PostgreSQL mas não no Firestore. Sincronizando...`
      )
      const member = await prisma.member.findFirst({
        where: { userId: existingUser.id },
        include: { org: true },
      })

      if (member) {
        await userRef.set({
          uid,
          email: existingUser.email,
          name: existingUser.name,
          orgId: member.orgId,
          role: member.role,
          createdAt: existingUser.createdAt,
          lastLogin: new Date(),
        })
        // Garante presença na lista de membros da org
        const orgRef = db.collection('orgs').doc(member.orgId)
        await orgRef.set(
          { members: FieldValue.arrayUnion(uid) },
          { merge: true }
        )
      }
    }
    return
  }

  // 🆕 Novo usuário - verifica se deve criar org ou apenas o usuário
  // Primeiro, tenta localizar usuário por e-mail (evita duplicidade P2002)
  const existingByEmail = await prisma.user.findUnique({ where: { email } })
  if (existingByEmail) {
    // Vincula/atualiza o firebaseUid e lastLogin; NÃO cria nova org aqui
    const updated = await prisma.user.update({
      where: { email },
      data: {
        firebaseUid: uid,
        name: existingByEmail.name || name,
        updatedAt: new Date(),
      },
    })

    // Sincroniza Firestore
    const member = await prisma.member.findFirst({
      where: { userId: updated.id },
      include: { org: true },
    })

    await userRef.set(
      member
        ? {
            uid,
            email: updated.email,
            name: updated.name,
            orgId: member.orgId,
            role: member.role,
            lastLogin: new Date(),
          }
        : {
            uid,
            email: updated.email,
            name: updated.name,
            lastLogin: new Date(),
          },
      { merge: true }
    )

    // Se houver vínculo com org no banco, garanta que o Firestore reflita a membresia
    if (member) {
      const orgRef = db.collection('orgs').doc(member.orgId)
      await orgRef.set({ members: FieldValue.arrayUnion(uid) }, { merge: true })
    }

    console.log(
      `🔗 Usuário existente vinculado ao Firebase UID: ${updated.email}`
    )
    return
  }

  if (skipOrgCreation) {
    // Caso de convite e sem usuário prévio: cria apenas o usuário sem org
    const user = await prisma.user.create({
      data: {
        firebaseUid: uid,
        email,
        name,
      },
    })

    // Cria também no Firestore sem orgId (será atualizado quando aceitar convite)
    await userRef.set({
      uid,
      email,
      name,
      createdAt: new Date(),
      lastLogin: new Date(),
    })

    logger.info('Novo usuário criado sem organização', {
      userId: user.id,
      name,
      email,
    })
    return
  }

  // ✅ Cria novo usuário e org no PostgreSQL (transação)
  const result = await prisma.$transaction(async (tx) => {
    // Cria User
    const user = await tx.user.create({
      data: {
        firebaseUid: uid,
        email,
        name,
      },
    })

    // Cria Org com owner
    const org = await tx.org.create({
      data: {
        name: `${name}'s Org`,
        ownerId: user.id,
      },
    })

    // Cria Member (vínculo do owner com a org)
    await tx.member.create({
      data: {
        userId: user.id,
        orgId: org.id,
        role: 'OWNER',
      },
    })

    return { user, org }
  })

  // ✅ Cria também no Firestore (para queries em tempo real)
  const orgId = result.org.id
  const orgRef = db.collection('orgs').doc(orgId)

  await orgRef.set({
    name: result.org.name,
    ownerId: uid,
    members: [uid],
    createdAt: new Date(),
  })

  await userRef.set({
    uid,
    email,
    name,
    orgId,
    role: 'OWNER',
    createdAt: new Date(),
    lastLogin: new Date(),
  })

  console.log(`✅ Novo usuário criado: ${name} (${email})`)
  console.log(
    `✅ Persistido no PostgreSQL (User ID: ${result.user.id}, Org ID: ${result.org.id})`
  )
}
