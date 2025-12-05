import { authenticateRequest } from '@/infrastructure/http/middlewares/auth.middleware'
import { ApiResponseHandler } from '@/infrastructure/http/response'
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
    const yearParam = searchParams.get('year')
    const year = yearParam ? parseInt(yearParam) : undefined

    const summary = await ReportingService.getGlobalSummary(orgId, year)
    return ApiResponseHandler.success(summary, 'Resumo geral carregado')
  } catch (error) {
    Sentry.captureException(error)
    console.error('Error getting global summary:', error)
    return ApiResponseHandler.error(error, 'Erro ao buscar resumo geral')
  }
}
