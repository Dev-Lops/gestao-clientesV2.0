import { z } from 'zod'

export const clientListQuerySchema = z.object({
  lite: z.union([z.literal('0'), z.literal('1')]).optional(),
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : undefined))
    .refine((v) => (v === undefined ? true : v > 0 && v <= 200), {
      message: 'limit deve estar entre 1 e 200',
    }),
  cursor: z.string().optional(),
})

export const createClientSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  status: z.string().optional(),
  plan: z.string().optional(),
  mainChannel: z.string().optional(),
  contractStart: z.string().datetime().optional(),
  contractEnd: z.string().datetime().optional(),
  paymentDay: z.number().int().min(1).max(31).optional(),
  contractValue: z.number().optional(),
  isInstallment: z.boolean().optional(),
  installmentCount: z.number().int().min(1).max(60).optional(),
  installmentValue: z.number().optional(),
  installmentPaymentDays: z.array(z.number().int().min(1).max(31)).optional(),
})

export type CreateClientInput = z.infer<typeof createClientSchema>
export type ClientListQuery = z.infer<typeof clientListQuerySchema>
