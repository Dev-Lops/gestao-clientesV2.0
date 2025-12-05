/**
 * Middleware de autorização reutilizável para APIs
 * Centraliza validação de sessão, rate limiting e verificação de papéis
 */

import { apiRatelimit, checkRateLimit, getIdentifier } from '@/lib/ratelimit'
import { getSessionProfile } from '@/services/auth/session'
import { Role } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { ApiResponseHandler } from '../response'

export interface AuthContext {
  userId: string
  user: {
    id: string
    email?: string
  }
  orgId: string
  role: Role
  email?: string
}

export interface AuthOptions {
  /** Papéis permitidos para acessar o endpoint */
  allowedRoles?: Role[]
  /** Se deve aplicar rate limiting */
  rateLimit?: boolean
  /** Se permite acesso sem organização (ex.: setup inicial) */
  requireOrg?: boolean
}

/**
 * Middleware principal de autenticação/autorização
 * Retorna contexto de autenticação ou uma resposta de erro
 */
export async function authenticateRequest(
  req: NextRequest | Request,
  options: AuthOptions = {}
): Promise<{ context: AuthContext } | { error: NextResponse }> {
  const { allowedRoles, rateLimit = true, requireOrg = true } = options

  // Rate limiting
  if (rateLimit) {
    const id = getIdentifier(req as Request)
    const rl = await checkRateLimit(id, apiRatelimit)
    if (!rl.success) {
      return {
        error: ApiResponseHandler.rateLimitExceeded(rl.reset.toISOString()),
      }
    }
  }

  // Verificar sessão
  const profile = await getSessionProfile()

  if (!profile || !profile.user) {
    return {
      error: ApiResponseHandler.unauthorized('Sessão inválida ou expirada'),
    }
  }

  // Verificar se tem orgId quando necessário
  if (requireOrg && !profile.orgId) {
    return {
      error: ApiResponseHandler.forbidden(
        'Usuário não está associado a nenhuma organização'
      ),
    }
  }

  // Verificar papéis permitidos
  if (allowedRoles && allowedRoles.length > 0) {
    if (!profile.role || !allowedRoles.includes(profile.role)) {
      return {
        error: ApiResponseHandler.forbidden(
          `Acesso negado. Papéis permitidos: ${allowedRoles.join(', ')}`
        ),
      }
    }
  }

  // Retornar contexto autenticado
  return {
    context: {
      userId: profile.user.id,
      user: {
        id: profile.user.id,
        email: profile.user.email ?? undefined,
      },
      orgId: profile.orgId!,
      role: profile.role!,
      email: profile.user.email ?? undefined,
    },
  }
}

/**
 * Helper para endpoints que permitem apenas OWNER
 */
export async function authenticateOwner(
  req: NextRequest | Request
): Promise<{ context: AuthContext } | { error: NextResponse }> {
  return authenticateRequest(req, {
    allowedRoles: ['OWNER'],
    rateLimit: true,
    requireOrg: true,
  })
}

/**
 * Helper para endpoints que permitem OWNER e STAFF
 */
export async function authenticateStaff(
  req: NextRequest | Request
): Promise<{ context: AuthContext } | { error: NextResponse }> {
  return authenticateRequest(req, {
    allowedRoles: ['OWNER', 'STAFF'],
    rateLimit: true,
    requireOrg: true,
  })
}

/**
 * Helper para endpoints que permitem qualquer usuário autenticado
 */
export async function authenticateUser(
  req: NextRequest | Request,
  options: Omit<AuthOptions, 'allowedRoles'> = {}
): Promise<{ context: AuthContext } | { error: NextResponse }> {
  return authenticateRequest(req, {
    ...options,
    allowedRoles: undefined, // Qualquer papel
  })
}
