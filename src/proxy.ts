import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

// Lê role do cookie para controle de acesso básico no middleware
function getRole(req: NextRequest): string | null {
  const role = req.cookies.get('role')?.value
  if (!role) return null
  if (['OWNER', 'STAFF', 'CLIENT'].includes(role)) return role
  return null
}

export async function proxy(req: NextRequest) {
  const token = req.cookies.get('auth')?.value

  const pathname = req.nextUrl.pathname
  const isLoginRoute = pathname.startsWith('/login')
  const isAuthCallback = pathname.startsWith('/auth/callback')
  const isInviteValidation =
    pathname.startsWith('/api/invites/accept') && req.method === 'GET'

  // Cria response que será modificada com headers de segurança
  const response = NextResponse.next()

  // Adiciona headers de segurança
  if (process.env.NODE_ENV === 'production') {
    // CORS - apenas permite o domínio da aplicação
    const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL
    if (appUrl) {
      response.headers.set('Access-Control-Allow-Origin', appUrl)
      response.headers.set(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, PATCH, DELETE, OPTIONS'
      )
      response.headers.set(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization'
      )
    }

    // Security headers
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'SAMEORIGIN')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=()'
    )

    // Content Security Policy - Completo para Google OAuth + Firebase + Sentry
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://accounts.google.com https://apis.google.com https://*.googletagmanager.com https://www.gstatic.com",
      "script-src-elem 'self' 'unsafe-inline' https://accounts.google.com https://apis.google.com https://*.googletagmanager.com https://www.gstatic.com",
      "worker-src 'self' blob:",
      "connect-src 'self' https://*.googleapis.com https://apis.google.com https://*.firebaseio.com https://*.cloudfunctions.net wss://*.firebaseio.com https://*.ingest.us.sentry.io https://*.ingest.sentry.io https://securetoken.googleapis.com https://identitytoolkit.googleapis.com https://*.google.com https://www.googleapis.com https://*.r2.cloudflarestorage.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://www.gstatic.com",
      "font-src 'self' data: https://fonts.gstatic.com https://www.gstatic.com",
      "img-src 'self' data: https: blob:",
      "frame-src 'self' https://accounts.google.com https://*.firebaseapp.com",
      "form-action 'self' https://accounts.google.com",
      "frame-ancestors 'self'",
    ]

    response.headers.set('Content-Security-Policy', cspDirectives.join('; '))
  }

  // Permite rota de callback passar sem verificação (ela mesma valida o token)
  if (isAuthCallback) {
    return response
  }

  if (!token) {
    // Permite validar convite sem autenticação (GET /api/invites/accept)
    if (isInviteValidation) return response

    if (isLoginRoute) return response

    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (isLoginRoute) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  // Controle de acesso baseado em role (validação adicional nas páginas via getSessionProfile)
  const role = getRole(req)

  // Bloqueia CLIENT de acessar áreas administrativas
  if (pathname.startsWith('/dashboard') && role === 'CLIENT') {
    return NextResponse.redirect(new URL('/clients', req.url))
  }

  // Apenas OWNER pode acessar admin e billing
  if (
    (pathname.startsWith('/admin') || pathname.startsWith('/billing')) &&
    role &&
    role !== 'OWNER'
  ) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return response
}

export const config = {
  matcher: [
    '/',
    '/clients/:path*',
    '/client/:path*',
    '/admin/:path*',
    '/dashboard/:path*',
    '/api/invites/:path*',
    '/onboarding/:path*',
    '/login/:path*',
    '/auth/:path*',
  ],
}
