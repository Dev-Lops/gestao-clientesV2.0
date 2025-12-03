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

  // Gera um nonce único para esta requisição (CSP)
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')

  // Cria response que será modificada com headers de segurança
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-nonce', nonce)

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

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

    // Content Security Policy - Completo para Google OAuth + Firebase + Sentry + R2 Media + PostHog com nonce
    const cspDirectives = [
      "default-src 'self'",
      `script-src 'self' 'nonce-${nonce}' https://accounts.google.com https://apis.google.com https://*.googletagmanager.com https://www.gstatic.com https://us.i.posthog.com`,
      `script-src-elem 'self' 'nonce-${nonce}' https://accounts.google.com https://apis.google.com https://*.googletagmanager.com https://www.gstatic.com https://us.i.posthog.com`,
      "worker-src 'self' blob:",
      "connect-src 'self' https://*.googleapis.com https://apis.google.com https://*.firebaseio.com https://*.cloudfunctions.net wss://*.firebaseio.com https://*.ingest.us.sentry.io https://*.ingest.sentry.io https://securetoken.googleapis.com https://identitytoolkit.googleapis.com https://*.google.com https://www.googleapis.com https://*.r2.cloudflarestorage.com https://us.i.posthog.com https://*.posthog.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://www.gstatic.com",
      "font-src 'self' data: https://fonts.gstatic.com https://www.gstatic.com",
      "img-src 'self' data: https: blob:",
      "media-src 'self' https://*.r2.cloudflarestorage.com blob: data:",
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
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
