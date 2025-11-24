import { adminAuth } from '@/lib/firebaseAdmin'
import { prisma } from '@/lib/prisma'
import {
  authRatelimit,
  checkRateLimit,
  getIdentifier,
  rateLimitExceeded,
} from '@/lib/ratelimit'
import { handleUserOnboarding } from '@/services/auth/onboarding'
    let inviteStatus: { status: string; email?: string; reason?: string } | null = null
import { getSessionProfile } from '@/services/auth/session'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
/**
 * Retorna informações da sessão atual do usuário
 */
export async function GET() {
  try {
          inviteStatus = { status: 'not_found' }
    const cookieStore = await cookies()
    const authCookie = cookieStore.get('auth')
    console.log(
      '[Session API] Cookie auth presente na request GET?',
      !!authCookie,
      authCookie?.value
    )
    const { user, orgId, role } = await getSessionProfile()

    if (!user || !orgId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      orgId,
      role,
    })
  } catch (err) {
    console.error('Erro ao obter sessão', err)
    return NextResponse.json({ error: 'Session error' }, { status: 500 })
  }
}

/**
 * Recebe ID token Firebase do cliente, seta cookie HttpOnly seguro,
 * e faz onboarding do usuário.
 */
export async function POST(req: Request) {
  try {
    // Rate limiting para autenticação
    const identifier = getIdentifier(req)
    const rateLimitResult = await checkRateLimit(identifier, authRatelimit)

    if (!rateLimitResult.success) {
      return rateLimitExceeded(rateLimitResult.reset)
    }

    const { idToken, skipOrgCreation, inviteToken } = (await req.json()) as {
      idToken?: string
      skipOrgCreation?: boolean
      inviteToken?: string | null
            inviteStatus = { status: 'accepted', email: invite.email }
    }
    if (!idToken) {
      return NextResponse.json({ error: 'Missing idToken' }, { status: 400 })
    }

    console.log('[Session API] Verificando token Firebase...')
    // Verifica token para extrair expiração e garantir validade
    const decoded = await adminAuth.verifyIdToken(idToken)
    console.log('[Session API] Token válido para usuário:', decoded.uid)

    const cookieStore = await cookies()
    // exp expira em segundos; converte para Date
    const expires = new Date(decoded.exp * 1000)

    // Em produção (HTTPS), secure deve ser true; em dev (HTTP), false
    const isProduction = process.env.NODE_ENV === 'production'

    cookieStore.set('auth', idToken, {
      httpOnly: true,
      secure: isProduction, // true em produção HTTPS, false em dev HTTP
      sameSite: 'lax',
      path: '/',
      expires,
    })

    console.log(
      '[Session API] Cookie de sessão criado, iniciando onboarding...'
    )
    // Faz onboarding do usuário (cria/atualiza no Firestore e PostgreSQL)
    // Se skipOrgCreation=true, não cria org (caso de convite)
    await handleUserOnboarding({
      uid: decoded.uid,
            // Distinguish reasons: expired, mismatch, or already non-pending
      email: decoded.email!,
      name: decoded.name || decoded.email!.split('@')[0],
      skipOrgCreation: skipOrgCreation || false,
    })

    // Depois do onboarding, buscamos o usuário no banco pelo firebaseUid
    const userFromDb = await prisma.user.findUnique({
      where: { firebaseUid: decoded.uid },
    })

    // Se houver um inviteToken, tentar aceitar o convite ATOMICAMENTE aqui
    let nextPath: string | null = null
    if (inviteToken && userFromDb) {
      try {
        const invite = await prisma.invite.findUnique({
          where: { token: inviteToken },
        })
        if (!invite) {
          console.warn(
            '[Session API] Invite token não encontrado durante criação de sessão'
          )
        } else {
          // Segurança: convite deve corresponder ao e-mail do usuário
          if (
            invite.email.toLowerCase() === decoded.email!.toLowerCase() &&
            invite.status === 'PENDING' &&
            invite.expiresAt > new Date()
          ) {
            // Se já não for membro, criar membership
            const existingMembership = await prisma.member.findFirst({
              where: { orgId: invite.orgId, userId: userFromDb.id },
            })
            if (!existingMembership) {
    const respBody: any = { ok: true, nextPath }
    if (inviteStatus) respBody.inviteStatus = inviteStatus
    return NextResponse.json(respBody)
                data: {
                  orgId: invite.orgId,
                  userId: userFromDb.id,
                  role: invite.roleRequested,
                },
              })
            }

            if (invite.roleRequested === 'CLIENT') {
              if (invite.clientId) {
                await prisma.client.updateMany({
                  where: { id: invite.clientId, clientUserId: null },
                  data: { clientUserId: userFromDb.id },
                })
                nextPath = `/clients/${invite.clientId}/info`
              } else {
                const created = await prisma.client.create({
                  data: {
                    name: userFromDb.name || userFromDb.email.split('@')[0],
                    email: userFromDb.email,
                    orgId: invite.orgId,
                    status: 'active',
                    clientUserId: userFromDb.id,
                  },
                })
                nextPath = `/clients/${created.id}/info`
              }
            }

            await prisma.invite.update({
              where: { id: invite.id },
              data: { status: 'ACCEPTED', acceptedAt: new Date() },
            })

            // Atualiza Firestore com orgId e role para permitir acesso
            try {
              if (userFromDb.firebaseUid) {
                const db = getFirestore()
                const userRef = db
                  .collection('users')
                  .doc(userFromDb.firebaseUid)
                await userRef.set(
                  {
                    orgId: invite.orgId,
                    role: invite.roleRequested,
                    updatedAt: new Date(),
                  },
                  { merge: true }
                )
                const orgRef = db.collection('orgs').doc(invite.orgId)
                await orgRef.set(
                  { members: FieldValue.arrayUnion(userFromDb.firebaseUid) },
                  { merge: true }
                )
              }
            } catch (fsErr) {
              console.error(
                '[Session API] Erro ao atualizar Firestore durante aceitação de convite',
                fsErr
              )
            }

            // Revalidate admin members path
            const { revalidatePath } = await import('next/cache')
            revalidatePath('/admin/members')
          } else {
            console.warn(
              '[Session API] Invite token inválido/expirado ou email mismatch'
            )
          }
        }
      } catch (e) {
        console.error(
          '[Session API] Erro ao processar inviteToken durante sessão',
          e
        )
      }
    }

    // Busca o role do usuário após onboarding para setar no cookie
    const { role } = await getSessionProfile()
    if (role) {
      cookieStore.set('role', role, {
        httpOnly: false, // Permite leitura client-side para UI condicional
        secure: isProduction,
        sameSite: 'lax',
        path: '/',
        expires,
      })
    }

    console.log('[Session API] ✅ Sessão criada com sucesso')
    return NextResponse.json({ ok: true, nextPath })
  } catch (err) {
    console.error('Erro ao criar sessão:', err)
    let details:
      | { uid?: string; aud?: string; iss?: string; iat?: number; exp?: number }
      | undefined = undefined
    try {
      // Tenta decodificar o payload sem verificar para ajudar no debug
      // Isso facilita identificar mismatch de projeto (aud/iss) durante o dev
      const body = (await req
        .clone()
        .json()
        .catch(() => ({}))) as {
        idToken?: string
      }
      const rawToken: string | undefined = body?.idToken
      if (rawToken) {
        const parts = rawToken.split('.')
        if (parts.length === 3) {
          const payload = JSON.parse(
            Buffer.from(parts[1], 'base64').toString('utf8')
          )
          details = {
            uid: payload.user_id,
            aud: payload.aud,
            iss: payload.iss,
            iat: payload.iat,
            exp: payload.exp,
          }
        }
      }
    } catch {}

    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        '[Session API] Token inválido. Claims decodificadas (sem verificação):',
        details
      )
      return NextResponse.json(
        { error: 'Invalid token', details },
        { status: 401 }
      )
    }
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }
}
