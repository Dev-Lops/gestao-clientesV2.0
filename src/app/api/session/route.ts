import { adminAuth } from '@/lib/firebaseAdmin'
import { handleUserOnboarding } from '@/services/auth/onboarding'
import { getSessionProfile } from '@/services/auth/session'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
/**
 * Retorna informações da sessão atual do usuário
 */
export async function GET() {
  try {
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
    const { idToken, skipOrgCreation } = (await req.json()) as {
      idToken?: string
      skipOrgCreation?: boolean
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

    cookieStore.set('auth', idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
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
      email: decoded.email!,
      name: decoded.name || decoded.email!.split('@')[0],
      skipOrgCreation: skipOrgCreation || false,
    })

    console.log('[Session API] ✅ Sessão criada com sucesso')
    return NextResponse.json({ ok: true })
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
