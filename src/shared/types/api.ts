import type {
  clientListQuerySchema,
  createClientSchema,
} from '@/domain/clients/validators'
import type { z } from 'zod'

export type ApiCreateClientRequest = z.infer<typeof createClientSchema>
export type ApiClientListQuery = z.infer<typeof clientListQuerySchema>

export type ApiResponse<T> = {
  data?: T
  error?: string
  details?: unknown
  meta?: Record<string, unknown>
}
