/**
 * Handlers de resposta HTTP padronizados
 * Centraliza contratos de resposta para APIs
 */

import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'

export interface ApiError {
  error: string
  message?: string
  details?: unknown
  code?: string
}

export interface ApiSuccess<T = unknown> {
  data: T
  message?: string
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage?: boolean
  hasPreviousPage?: boolean
  nextCursor?: string | null
}

export interface PaginatedResponse<T = unknown> {
  data: T[]
  meta: PaginationMeta
}

/**
 * Classe utilitária para respostas HTTP padronizadas
 */
export class ApiResponseHandler {
  /**
   * Resposta de sucesso genérica
   */
  static success<T>(data: T, message?: string, status = 200): NextResponse {
    const body: ApiSuccess<T> = { data }
    if (message) body.message = message
    return NextResponse.json(body, { status })
  }

  /**
   * Resposta de criação (201)
   */
  static created<T>(data: T, message?: string): NextResponse {
    return this.success(data, message, 201)
  }

  /**
   * Resposta sem conteúdo (204)
   */
  static noContent(): NextResponse {
    return new NextResponse(null, { status: 204 })
  }

  /**
   * Resposta de lista paginada
   */
  static paginatedList<T>(data: T[], meta: PaginationMeta): NextResponse {
    const body: PaginatedResponse<T> = { data, meta }
    return NextResponse.json(body, { status: 200 })
  }

  /**
   * Erro de validação (400)
   */
  static badRequest(message: string, details?: unknown): NextResponse {
    const body: ApiError = {
      error: 'Bad Request',
      message,
      details,
      code: 'BAD_REQUEST',
    }
    return NextResponse.json(body, { status: 400 })
  }

  /**
   * Erro de validação (400) - Alias para compatibilidade
   */
  static validationError(message: string, details?: unknown): NextResponse {
    const body: ApiError = {
      error: 'Validation Error',
      message,
      details,
      code: 'VALIDATION_ERROR',
    }
    return NextResponse.json(body, { status: 400 })
  }

  /**
   * Erro de autenticação (401)
   */
  static unauthorized(message = 'Não autorizado'): NextResponse {
    const body: ApiError = {
      error: 'Unauthorized',
      message,
      code: 'UNAUTHORIZED',
    }
    return NextResponse.json(body, { status: 401 })
  }

  /**
   * Erro de permissão (403)
   */
  static forbidden(message = 'Acesso negado'): NextResponse {
    const body: ApiError = {
      error: 'Forbidden',
      message,
      code: 'FORBIDDEN',
    }
    return NextResponse.json(body, { status: 403 })
  }

  /**
   * Recurso não encontrado (404)
   */
  static notFound(resource = 'Recurso', message?: string): NextResponse {
    const body: ApiError = {
      error: 'Not Found',
      message: message || `${resource} não encontrado`,
      code: 'NOT_FOUND',
    }
    return NextResponse.json(body, { status: 404 })
  }

  /**
   * Conflito (409) - Ex.: duplicação de registro
   */
  static conflict(message: string, details?: unknown): NextResponse {
    const body: ApiError = {
      error: 'Conflict',
      message,
      details,
      code: 'CONFLICT',
    }
    return NextResponse.json(body, { status: 409 })
  }

  /**
   * Rate limit excedido (429)
   */
  static rateLimitExceeded(resetAt?: string): NextResponse {
    const body: ApiError = {
      error: 'Too Many Requests',
      message: 'Rate limit excedido. Tente novamente mais tarde.',
      code: 'RATE_LIMIT_EXCEEDED',
      ...(resetAt && { details: { resetAt } }),
    }
    return NextResponse.json(body, { status: 429 })
  }

  /**
   * Erro interno do servidor (500)
   */
  static internalError(
    error: unknown,
    context?: string,
    logToSentry = true
  ): NextResponse {
    // Log estruturado
    console.error(`[API Error]${context ? ` ${context}` : ''}:`, error)

    // Enviar para Sentry
    if (logToSentry) {
      if (context) {
        Sentry.addBreadcrumb({
          category: 'api',
          message: context,
          level: 'error',
        })
      }
      Sentry.captureException(error)
    }

    const body: ApiError = {
      error: 'Internal Server Error',
      message: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR',
    }

    // Em desenvolvimento, incluir detalhes do erro
    if (process.env.NODE_ENV === 'development') {
      body.details = error instanceof Error ? error.message : String(error)
    }

    return NextResponse.json(body, { status: 500 })
  }

  /**
   * Erro customizado genérico
   */
  static error(error: unknown, context?: string, status = 500): NextResponse {
    return this.internalError(error, context, true)
  }

  /**
   * Erro com status customizado
   */
  static errorWithStatus(
    status: number,
    error: string,
    message?: string,
    details?: unknown
  ): NextResponse {
    const body: ApiError = {
      error,
      message,
      details,
    }
    return NextResponse.json(body, { status })
  }
}
