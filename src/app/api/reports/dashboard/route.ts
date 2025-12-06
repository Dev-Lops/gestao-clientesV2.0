import { authenticateRequest } from '@/infrastructure/http/middlewares/auth.middleware'
import { ApiResponseHandler } from '@/infrastructure/http/response'
import { cacheManager } from '@/lib/cache'
import { ReportingService } from '@/services/financial'
import * as Sentry from '@sentry/nextjs'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request, {
      allowedRoles: ['OWNER'],
      rateLimit: true,
      requireOrg: true,
    })

    if ('error' in authResult) {
      return authResult.error
    }

    const { orgId } = authResult.context
    const { searchParams } = new URL(request.url)
    const year = parseInt(
      searchParams.get('year') || new Date().getFullYear().toString()
    )
    const month = parseInt(
      searchParams.get('month') || (new Date().getMonth() + 1).toString()
    )

    // Normalize to full month range (inclusive end-of-day)
    const dateFrom = new Date(year, month - 1, 1, 0, 0, 0, 0)
    const lastDay = new Date(year, month, 0)
    const dateTo = new Date(
      lastDay.getFullYear(),
      lastDay.getMonth(),
      lastDay.getDate(),
      23,
      59,
      59,
      999
    )

    // Try cache first (5 min TTL for dashboard)
    const cacheKey = `dashboard:${orgId}:${year}-${month}`
    const cached = cacheManager.get(cacheKey)
    if (cached) {
      return ApiResponseHandler.success(cached)
    }

    const dashboard = await ReportingService.getDashboard(
      orgId,
      dateFrom,
      dateTo
    )

    // Cache for 5 minutes
    cacheManager.set(cacheKey, dashboard, 300)

    return ApiResponseHandler.success(dashboard, 'Dashboard carregado')
  } catch (error) {
    Sentry.captureException(error)
    console.error('Error getting dashboard:', error)
    return ApiResponseHandler.error(error, 'Erro ao carregar dashboard')
  }
}
