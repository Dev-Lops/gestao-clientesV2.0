import { adminAuth } from '@/lib/firebaseAdmin'
import { prisma } from '@/lib/prisma'
import {
  authRatelimit,
  checkRateLimit,
  getIdentifier,
  rateLimitExceeded,
} from '@/lib/ratelimit'
import { applySecurityHeaders, guardAccess } from '@/proxy'
import { handleUserOnboarding } from '@/services/auth/onboarding'
import { getSessionProfile } from '@/services/auth/session'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// GET: return session info
export async function GET(req: NextRequest) {
  try {
    const guard = guardAccess(req as any)
    if (guard) return guard
    const { user, orgId, role } = await getSessionProfile()
    if (!user || !orgId)
      return applySecurityHeaders(
        req as any,
        NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
      )
    const res = NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name },
      orgId,
      role,
    })
    return applySecurityHeaders(req as any, res)
  } catch (err) {
    console.error('[Session API] GET error', err)
    return applySecurityHeaders(
      req as any,
      NextResponse.json({ error: 'Session error' }, { status: 500 })
    )
  }
}

// POST: create session from Firebase idToken, optionally accept inviteToken atomically
export async function POST(req: NextRequest) {
  try {
    const identifier = getIdentifier(req)
    const rateLimitResult = await checkRateLimit(identifier, authRatelimit)
    if (!rateLimitResult.success)
      return rateLimitExceeded(rateLimitResult.reset)

    const body = (await req.json()) as {
      idToken?: string
      skipOrgCreation?: boolean
      inviteToken?: string | null
    }
    const { idToken, skipOrgCreation, inviteToken } = body
    if (!idToken)
      return NextResponse.json({ error: 'Missing idToken' }, { status: 400 })

    const decoded = await adminAuth.verifyIdToken(idToken)
    const cookieStore = await cookies()
    const expires = new Date(decoded.exp * 1000)
    const isProduction = process.env.NODE_ENV === 'production'

    // Auth cookie endurecida: sameSite 'strict' para mitigar CSRF
    cookieStore.set('auth', idToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      path: '/',
      expires,
    })

    await handleUserOnboarding({
      uid: decoded.uid,
      email: decoded.email!,
      name: decoded.name || decoded.email!.split('@')[0],
      skipOrgCreation: !!skipOrgCreation,
    })

    const userFromDb = await prisma.user.findUnique({
      where: { firebaseUid: decoded.uid },
    })

    let nextPath: string | null = null
    let inviteStatus: {
      status: string
      email?: string
      reason?: string
    } | null = null

    if (inviteToken && userFromDb) {
      try {
        const invite = await prisma.invite.findUnique({
          where: { token: inviteToken },
        })
        if (!invite) {
          inviteStatus = { status: 'not_found' }
        } else if (
          invite.email.toLowerCase() === decoded.email!.toLowerCase() &&
          invite.status === 'PENDING' &&
          invite.expiresAt > new Date()
        ) {
          const existing = await prisma.member.findFirst({
            where: { orgId: invite.orgId, userId: userFromDb.id },
          })
          if (!existing) {
            await prisma.member.create({
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
          inviteStatus = { status: 'accepted', email: invite.email }

          try {
            if (userFromDb.firebaseUid) {
              const db = getFirestore()
              const userRef = db.collection('users').doc(userFromDb.firebaseUid)
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
            console.error('[Session API] Firestore update error', fsErr)
          }

          const { revalidatePath } = await import('next/cache')
          revalidatePath('/admin/members')
        } else {
          if (invite.status !== 'PENDING')
            inviteStatus = {
              status: 'invalid_status',
              email: invite.email,
              reason: invite.status,
            }
          else if (invite.expiresAt <= new Date())
            inviteStatus = { status: 'expired', email: invite.email }
          else inviteStatus = { status: 'mismatch', email: invite.email }
        }
      } catch (e) {
        console.error('[Session API] Error processing inviteToken', e)
      }
    }

    const { role } = await getSessionProfile()
    if (role)
      cookieStore.set('role', role, {
        httpOnly: false,
        secure: isProduction,
        sameSite: 'lax',
        path: '/',
        expires,
      })

    const resp: any = { ok: true, nextPath }
    if (inviteStatus) resp.inviteStatus = inviteStatus
    return applySecurityHeaders(req, NextResponse.json(resp))
  } catch (err) {
    console.error('[Session API] POST error', err)
    try {
      const body = await req
        .clone()
        .json()
        .catch(() => ({}))
      const raw: string | undefined = body?.idToken
      if (raw) {
        const parts = raw.split('.')
        if (parts.length === 3) {
          const payload = JSON.parse(
            Buffer.from(parts[1], 'base64').toString('utf8')
          )
          return applySecurityHeaders(
            req,
            NextResponse.json(
              {
                error: 'Invalid token',
                details: {
                  uid: payload.user_id,
                  aud: payload.aud,
                  iss: payload.iss,
                  iat: payload.iat,
                  exp: payload.exp,
                },
              },
              { status: 401 }
            )
          )
        }
      }
    } catch {}
    return applySecurityHeaders(
      req,
      NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    )
  }
}
