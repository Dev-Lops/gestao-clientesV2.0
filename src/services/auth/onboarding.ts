
import { randomUUID } from 'crypto'
import { getFirestore, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'

export interface OnboardingData {
  uid: string
  email: string
  name: string
}

/**
 * Cria o usuário e a organização na primeira autenticação.
 * Se já existir, apenas atualiza o último login.
 */
export async function handleUserOnboarding({ uid, email, name }: OnboardingData) {
  const db = getFirestore()
  const userRef = doc(db, 'users', uid)
  const userSnap = await getDoc(userRef)

  if (userSnap.exists()) {
    // Usuário já existe → apenas atualiza login
    await updateDoc(userRef, { lastLogin: new Date() })
    return
  }

  // ✅ Cria nova org
  const orgId = randomUUID()
  const orgRef = doc(db, 'orgs', orgId)

  await setDoc(orgRef, {
    name: `${name}'s Org`,
    ownerId: uid,
    members: [uid],
    createdAt: new Date(),
  })

  // ✅ Cria usuário vinculado à org
  await setDoc(userRef, {
    uid,
    email,
    name,
    orgId,
    role: 'OWNER',
    createdAt: new Date(),
    lastLogin: new Date(),
  })

  console.log(`✅ Novo usuário criado: ${name} (${email})`)
}
