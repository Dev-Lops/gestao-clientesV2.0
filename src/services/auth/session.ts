import { logger } from '@/lib/logger'
import type { AppRole } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

export interface SessionProfile {
  user: {
    id: string
    email: string
    name: string | null
    image: string | null
  } | null
  orgId: string | null
  role: AppRole | null
}

export async function getSessionProfile(): Promise<SessionProfile> {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth')?.value
  if (!token) return { user: null, orgId: null, role: null }

  try {
    // Lazy-load Firebase Admin to avoid throwing at module load time
    // (some deployments may not have Firebase envs configured and that would cause
    // a top-level throw preventing the route from executing and returning a generic 500).
    let adminAuth: any = null
    try {
      const mod = await import('@/lib/firebaseAdmin')
      adminAuth = (mod as any).adminAuth
    } catch (e) {
      logger.error('Firebase Admin não disponível ao verificar token', e)
      // Fail-safe: return null session so routes can respond with 401 instead of crashing
      return { user: null, orgId: null, role: null }
    }

    const decoded = await adminAuth.verifyIdToken(token)
    const user = await prisma.user.findUnique({
      where: { firebaseUid: decoded.uid },
      include: { memberships: true },
    })
    if (!user) return { user: null, orgId: null, role: null }

    // Prefer an active membership
    const membership =
      user.memberships.find(
        (m: { isActive?: boolean }) => m.isActive !== false
      ) || user.memberships[0]

    if (!membership) {
      logger.warn('Usuário sem membership', { email: user.email })
      return { user: null, orgId: null, role: null }
    }

    // O Prisma retorna enums como strings, então fazemos o cast direto
    const role = membership.role as AppRole

    const profile = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      },
      orgId: membership.orgId,
      role,
    }

    logger.debug('Session profile carregado', {
      userId: profile.user.id,
      role: profile.role,
      orgId: profile.orgId,
    })

    return profile
  } catch (e) {
    logger.error('Erro ao obter sessão', e)
    return { user: null, orgId: null, role: null }
  }
}
