import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

// Lightweight role hints encoded in cookie (optional future @todo: JWT with role claim)
function parseRole(req: NextRequest): string | null {
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
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=()'
    )

    // Content Security Policy
    response.headers.set(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://accounts.google.com https://*.googletagmanager.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com data:",
        "img-src 'self' data: https: blob:",
        "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.cloudfunctions.net wss://*.firebaseio.com",
        "frame-src 'self' https://accounts.google.com",
      ].join('; ')
    )
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

  // Role-based redirects (simple gate before hitting page server logic)
  const role = parseRole(req)
  if (pathname.startsWith('/dashboard') && role === 'CLIENT') {
    // Clients não acessam dashboard geral
    return NextResponse.redirect(new URL('/clients', req.url))
  }

  // Exemplo: bloquear rotas admin para non-OWNER
  if (pathname.startsWith('/admin') && role && role !== 'OWNER') {
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
