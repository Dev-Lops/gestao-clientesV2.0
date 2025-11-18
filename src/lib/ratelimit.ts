import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Verifica se as variáveis de ambiente do Upstash estão configuradas
const upstashConfigured =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN

// Rate limiters para diferentes casos de uso
export const authRatelimit = upstashConfigured
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(5, '60 s'), // 5 tentativas por minuto
      analytics: true,
      prefix: 'ratelimit:auth',
    })
  : null

export const apiRatelimit = upstashConfigured
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(30, '60 s'), // 30 requests por minuto
      analytics: true,
      prefix: 'ratelimit:api',
    })
  : null

export const uploadRatelimit = upstashConfigured
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(10, '60 s'), // 10 uploads por minuto
      analytics: true,
      prefix: 'ratelimit:upload',
    })
  : null

export const publicRatelimit = upstashConfigured
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 requests por 10 segundos
      analytics: true,
      prefix: 'ratelimit:public',
    })
  : null

/**
 * Verifica se o rate limit foi excedido
 * @param identifier - Identificador único (IP, userId, email, etc)
 * @param limiter - Instância do rate limiter a usar
 * @returns { success: boolean, limit: number, remaining: number, reset: Date }
 */
export async function checkRateLimit(
  identifier: string,
  limiter: Ratelimit | null
) {
  // Se não configurado, permite todas as requisições
  if (!limiter) {
    return {
      success: true,
      limit: 999999,
      remaining: 999999,
      reset: new Date(Date.now() + 60000),
    }
  }

  const result = await limiter.limit(identifier)

  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: new Date(result.reset),
  }
}

/**
 * Helper para extrair identificador da requisição
 */
export function getIdentifier(request: Request): string {
  // Tenta pegar IP real (considerando proxies)
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0] ?? 'unknown'
  return ip
}

/**
 * Cria response de rate limit excedido
 */
export function rateLimitExceeded(reset: Date) {
  return new Response(
    JSON.stringify({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      resetAt: reset.toISOString(),
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': Math.ceil(
          (reset.getTime() - Date.now()) / 1000
        ).toString(),
      },
    }
  )
}
