import {
  createClientController,
  listClientsController,
} from '@/infrastructure/http/controllers/client.controller'
import { NextRequest } from 'next/server'

/**
 * POST /api/clients/v2 - Criar novo cliente
 */
export async function POST(request: NextRequest) {
  const body = await request.json()
  const orgId = request.headers.get('x-org-id') ?? ''
  return createClientController(body, orgId)
}

/**
 * GET /api/clients/v2 - Listar clientes
 */
export async function GET(request: NextRequest) {
  const orgId = request.headers.get('x-org-id') ?? ''
  const role = request.headers.get('x-user-role') ?? ''
  const userId = request.headers.get('x-user-id') ?? ''
  return listClientsController(request.nextUrl.searchParams, {
    orgId,
    role,
    userId,
  })
}
