import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('auth')?.value

  const pathname = req.nextUrl.pathname
  const isLoginRoute = pathname.startsWith('/login')

  if (!token) {
    if (isLoginRoute) return NextResponse.next()

    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (isLoginRoute) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/onboarding/:path*', '/login/:path*'],
}
