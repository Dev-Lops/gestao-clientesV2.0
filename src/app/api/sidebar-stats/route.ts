import { prisma } from '@/lib/prisma'
import { applySecurityHeaders, guardAccess } from '@/proxy'
import { getSessionProfile } from '@/services/auth/session'
import { BillingService } from '@/services/billing/BillingService'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  try {
    const guard = guardAccess(req as any)
    if (guard) return guard
    const { orgId, role } = await getSessionProfile()
    if (!orgId || !role)
      return applySecurityHeaders(
        req as any,
        NextResponse.json({ orgName: null, role: null, alertsCount: 0 })
      )

    const org = await prisma.org.findUnique({
      where: { id: orgId },
      select: { name: true },
    })
    let alertsCount = 0
    try {
      alertsCount = await BillingService.countFinancialAlerts(orgId)
    } catch {
      alertsCount = 0
    }

    const res = NextResponse.json({
      orgName: org?.name ?? null,
      role,
      alertsCount,
    })
    return applySecurityHeaders(req as any, res)
  } catch {
    return applySecurityHeaders(
      req as any,
      NextResponse.json({ orgName: null, role: null, alertsCount: 0 })
    )
  }
}
