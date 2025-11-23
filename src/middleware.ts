import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

// CSP completo para Google OAuth + Firebase + Sentry
const CSP_HEADER = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' https://accounts.google.com https://apis.google.com https://*.googletagmanager.com https://www.gstatic.com;
  script-src-elem 'self' 'unsafe-inline' https://accounts.google.com https://apis.google.com https://*.googletagmanager.com https://www.gstatic.com;
  worker-src 'self' blob:;
  connect-src 'self' https://*.googleapis.com https://apis.google.com https://*.firebaseio.com https://*.cloudfunctions.net wss://*.firebaseio.com https://*.ingest.us.sentry.io https://*.ingest.sentry.io https://securetoken.googleapis.com https://identitytoolkit.googleapis.com https://*.google.com https://www.googleapis.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://www.gstatic.com;
  img-src 'self' data: https: blob:;
  font-src 'self' data: https://fonts.gstatic.com https://www.gstatic.com;
  frame-src 'self' https://accounts.google.com https://*.firebaseapp.com;
  form-action 'self' https://accounts.google.com;
  frame-ancestors 'self';
`
  .replace(/\s+/g, ' ')
  .trim()

export function middleware(request: NextRequest) {
  // Clonar resposta para adicionar headers
  const response = NextResponse.next()

  // Adicionar headers de segurança
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  )
  response.headers.set('Content-Security-Policy', CSP_HEADER)

  return response
}

// Aplicar em todas as rotas
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
