import type { NextRequest } from 'next/server'
import { proxy as proxyFn } from './src/proxy'

export function middleware(req: NextRequest) {
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

export default middleware
