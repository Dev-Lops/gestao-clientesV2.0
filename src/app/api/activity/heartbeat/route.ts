import { prisma } from '@/lib/prisma'
import { applySecurityHeaders, guardAccess } from '@/proxy'
import { getSessionProfile } from '@/services/auth/session'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const guard = guardAccess(req as any)
    if (guard) return guard
    const { user } = await getSessionProfile()
    if (!user)
      return applySecurityHeaders(
        req as any,
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      )
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    })
    return applySecurityHeaders(req as any, NextResponse.json({ ok: true }))
  } catch (e) {
    console.error('[activity/heartbeat] failed', e)
    return applySecurityHeaders(
      req as any,
      NextResponse.json({ error: 'Failed' }, { status: 500 })
    )
  }
}
