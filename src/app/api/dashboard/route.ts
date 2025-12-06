import { getDashboardData } from '@/modules/dashboard/actions/getDashboardData'
import { applySecurityHeaders } from '@/proxy'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const monthKey = url.searchParams.get('month') ?? undefined
    const data = await getDashboardData(monthKey)
    const res = NextResponse.json(data, { status: 200 })
    return applySecurityHeaders(req, res)
  } catch (error) {
    console.error('[dashboard] error', error)
    const res = NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
    return applySecurityHeaders(req, res)
  }
}
