import type { NextRequest } from 'next/server'
import { proxy as proxyFn } from './src/proxy'

// Export a local middleware wrapper so Next.js can statically analyze it
export function middleware(req: NextRequest) {
  return proxyFn(req)
}

// Config must be defined locally (no re-exports) for Turbopack/static analysis
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

export default middleware
