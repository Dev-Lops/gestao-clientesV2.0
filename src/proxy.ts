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

  // Permite rota de callback passar sem verificação (ela mesma valida o token)
  if (isAuthCallback) {
    return NextResponse.next()
  }

  if (!token) {
    // Permite validar convite sem autenticação (GET /api/invites/accept)
    if (isInviteValidation) return NextResponse.next()

    if (isLoginRoute) return NextResponse.next()

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

  return NextResponse.next()
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
