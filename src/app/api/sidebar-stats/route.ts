import { prisma } from '@/lib/prisma'
import { getSessionProfile } from '@/services/auth/session'
import { BillingService } from '@/services/billing/BillingService'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const { orgId, role } = await getSessionProfile()
    if (!orgId || !role)
      return NextResponse.json({ orgName: null, role: null, alertsCount: 0 })

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

    return NextResponse.json({ orgName: org?.name ?? null, role, alertsCount })
  } catch {
    return NextResponse.json({ orgName: null, role: null, alertsCount: 0 })
  }
}
