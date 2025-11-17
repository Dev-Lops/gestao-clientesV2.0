import { z } from 'zod'

/**
 * Schema de validação para variáveis de ambiente obrigatórias
 *
 * Define todas as variáveis de ambiente necessárias para o funcionamento
 * da aplicação, tanto em client-side quanto server-side.
 */

// Schema para variáveis públicas (client-side)
const clientEnvSchema = z.object({
  NEXT_PUBLIC_FIREBASE_API_KEY: z
    .string()
    .min(1, 'NEXT_PUBLIC_FIREBASE_API_KEY é obrigatório'),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z
    .string()
    .min(1, 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN é obrigatório'),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z
    .string()
    .min(1, 'NEXT_PUBLIC_FIREBASE_PROJECT_ID é obrigatório'),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_APP_ID: z
    .string()
    .min(1, 'NEXT_PUBLIC_FIREBASE_APP_ID é obrigatório'),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
})

// Schema para variáveis privadas (server-side)
const serverEnvSchema = z.object({
  // Database
  DATABASE_URL: z.string().url('DATABASE_URL deve ser uma URL válida'),

  // Firebase Admin
  FIREBASE_CLIENT_EMAIL: z
    .string()
    .email('FIREBASE_CLIENT_EMAIL deve ser um email válido'),
  FIREBASE_PRIVATE_KEY: z.string().min(1, 'FIREBASE_PRIVATE_KEY é obrigatório'),
  FIREBASE_API_SECRET_KEY: z.string().optional(),

  // AWS S3 (opcional, pode usar storage local)
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
  USE_S3: z.enum(['true', 'false']).optional(),

  // Email (opcional)
  RESEND_API_KEY: z.string().optional(),

  // Outros
  NODE_ENV: z.enum(['development', 'production', 'test']).optional(),
  LOCAL_UPLOAD_DIR: z.string().optional(),
})

// Schema combinado
const envSchema = clientEnvSchema.merge(serverEnvSchema)

type EnvSchema = z.infer<typeof envSchema>
type ClientEnvSchema = z.infer<typeof clientEnvSchema>
type ServerEnvSchema = z.infer<typeof serverEnvSchema>

/**
 * Valida as variáveis de ambiente do cliente
 * Deve ser chamada em componentes client-side
 */
export function validateClientEnv(): { valid: boolean; errors?: string[] } {
  const env = {
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID:
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  }

  try {
    clientEnvSchema.parse(env)
    return { valid: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map(
        (err: z.ZodIssue) => `${err.path.join('.')}: ${err.message}`
      )
      return { valid: false, errors }
    }
    return { valid: false, errors: ['Erro desconhecido na validação'] }
  }
}

/**
 * Valida as variáveis de ambiente do servidor
 * Deve ser chamada apenas em server-side
 */
export function validateServerEnv(): { valid: boolean; errors?: string[] } {
  // Não executar no cliente
  if (typeof window !== 'undefined') {
    throw new Error('validateServerEnv() deve ser chamado apenas no servidor')
  }

  const env = {
    DATABASE_URL: process.env.DATABASE_URL,
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
    FIREBASE_API_SECRET_KEY: process.env.FIREBASE_API_SECRET_KEY,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_REGION: process.env.AWS_REGION,
    AWS_S3_BUCKET: process.env.AWS_S3_BUCKET,
    USE_S3: process.env.USE_S3,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    NODE_ENV: process.env.NODE_ENV,
    LOCAL_UPLOAD_DIR: process.env.LOCAL_UPLOAD_DIR,
  }

  try {
    serverEnvSchema.parse(env)
    return { valid: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map(
        (err: z.ZodIssue) => `${err.path.join('.')}: ${err.message}`
      )
      return { valid: false, errors }
    }
    return { valid: false, errors: ['Erro desconhecido na validação'] }
  }
}

/**
 * Valida todas as variáveis de ambiente (client + server)
 * Deve ser chamado no startup da aplicação (middleware ou api route)
 */
export function validateAllEnv(): { valid: boolean; errors?: string[] } {
  // Não executar no cliente
  if (typeof window !== 'undefined') {
    throw new Error('validateAllEnv() deve ser chamado apenas no servidor')
  }

  try {
    envSchema.parse(process.env)
    return { valid: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map(
        (err: z.ZodIssue) => `${err.path.join('.')}: ${err.message}`
      )
      return { valid: false, errors }
    }
    return { valid: false, errors: ['Erro desconhecido na validação'] }
  }
}

/**
 * Retorna as variáveis de ambiente validadas (type-safe)
 * Lança erro se alguma variável obrigatória estiver faltando
 */
export function getValidatedEnv(): EnvSchema {
  const result = validateAllEnv()

  if (!result.valid) {
    const errorMessage = [
      '❌ Variáveis de ambiente inválidas:',
      '',
      ...(result.errors || []),
      '',
      '💡 Verifique seu arquivo .env.local e reinicie o servidor.',
    ].join('\n')

    throw new Error(errorMessage)
  }

  return process.env as EnvSchema
}

/**
 * Utility para verificar se estamos em modo de desenvolvimento
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}

/**
 * Utility para verificar se estamos em modo de produção
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

/**
 * Utility para verificar se S3 está habilitado
 */
export function isS3Enabled(): boolean {
  return process.env.USE_S3 === 'true'
}

// Export types
export type { ClientEnvSchema, EnvSchema, ServerEnvSchema }
