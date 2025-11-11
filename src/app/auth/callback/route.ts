import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebaseAdmin'
import { handleUserOnboarding } from '@/services/auth/onboarding'

export async function GET(req: Request) {
  const cookieStore = await cookies() // 👈 cookies() é assíncrono em Next 14+
  const token = cookieStore.get('auth')?.value

  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token)

    const onboardingResult = await handleUserOnboarding({
      uid: decoded.uid,
      email: decoded.email!,
      name: decoded.name || decoded.email!.split('@')[0],
    })

    const destination = onboardingResult.hasOrganization
      ? '/dashboard'
      : '/onboarding'

    return NextResponse.redirect(new URL(destination, req.url))
  } catch (err) {
    console.error('Erro ao validar token:', err)
    return NextResponse.redirect(new URL('/login', req.url))
  }
}
