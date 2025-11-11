import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
import { initializeApp, cert, getApps } from 'firebase-admin/app'

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    }),
  })
}

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('auth')?.value

  if (!token && !req.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (token) {
    try {
      const decoded = await getAuth().verifyIdToken(token)
      const db = getFirestore()
      const userSnap = await db.collection('users').doc(decoded.uid).get()
      const user = userSnap.data()

      // Se o usuário ainda não tem organização, redireciona pro onboarding
      if (!user?.orgId && !req.nextUrl.pathname.startsWith('/onboarding')) {
        return NextResponse.redirect(new URL('/onboarding', req.url))
      }

      // Se já tem org e tenta ir pro login, manda direto pro dashboard
      if (user?.orgId && req.nextUrl.pathname.startsWith('/login')) {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    } catch (e) {
      console.error('Erro no middleware:', e)
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/onboarding/:path*', '/login/:path*'],
}
