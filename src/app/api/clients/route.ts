import { authenticateRequest } from '@/infra/http/auth-middleware'
import { ApiResponseHandler } from '@/infra/http/response'
import { applySecurityHeaders } from '@/proxy'
import {
  createClientController,
  listClientsController,
} from '@/infrastructure/http/controllers/client.controller'
import * as Sentry from '@sentry/nextjs'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    // ✨ Autenticação centralizada com middleware
    const authResult = await authenticateRequest(req, {
      allowedRoles: ['OWNER'],
      rateLimit: true,
      requireOrg: true,
    })

    if ('error' in authResult) {
      return authResult.error
    }

    const { orgId } = authResult.context
    const response = await createClientController(await req.json(), orgId)
    return applySecurityHeaders(req, response)
  } catch (error) {
    Sentry.captureException(error)
    console.error('Erro ao criar cliente:', error)
    return ApiResponseHandler.error(error, 'Erro ao criar cliente')
  }
}

export async function GET(req: NextRequest) {
  try {
    // ✨ Autenticação centralizada
    const authResult = await authenticateRequest(req, {
      rateLimit: true,
      requireOrg: true,
    })

    if ('error' in authResult) {
      return authResult.error
    }

    const { user, orgId, role } = authResult.context
    const response = await listClientsController(req.nextUrl.searchParams, {
      orgId,
      role,
      userId: user.id,
    })
    return applySecurityHeaders(req, response)
  } catch (e) {
    Sentry.captureException(e)
    console.error('Erro ao listar clientes', e)
    return ApiResponseHandler.error(e, 'Erro ao listar clientes')
  }
}
