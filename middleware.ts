import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { proxy as proxyFn } from './src/proxy'

export function middleware(req: NextRequest) {
  if (process.env.NETLIFY_DISABLE_MIDDLEWARE === 'true') {
    // No-op on Netlify to avoid middleware nft checks during build
    return NextResponse.next()
  }
  return proxyFn(req)
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

// Do not export default; Next.js expects a named export `middleware`
