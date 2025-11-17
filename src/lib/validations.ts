/**
 * Schemas Zod para validação de payloads de API
 * Garante type-safety e validação runtime
 */

import { z } from 'zod'

/**
 * Notification schemas
 */
export const notificationSchema = z.object({
  id: z.string().cuid(),
  type: z.string(),
  title: z.string(),
  message: z.string().optional(),
  time: z.string(),
  unread: z.boolean(),
  link: z.string().optional(),
  priority: z.string().optional(),
  clientId: z.string().optional(),
  createdAt: z.coerce.date(),
})

export const notificationsResponseSchema = z.object({
  notifications: z.array(notificationSchema),
  total: z.number().int().nonnegative(),
  unreadCount: z.number().int().nonnegative(),
  hasMore: z.boolean(),
})

/**
 * Task schemas
 */
export const taskSchema = z.object({
  id: z.string().cuid(),
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional().nullable(),
  status: z.enum(['todo', 'in-progress', 'done', 'completed']),
  priority: z.enum(['low', 'medium', 'high']),
  assignee: z.string().optional().nullable(),
  dueDate: z.coerce.date().optional().nullable(),
  clientId: z.string().cuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(200),
  description: z.string().max(5000).optional(),
  status: z.enum(['todo', 'in-progress', 'done']).default('todo'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  assignee: z.string().optional(),
  dueDate: z.coerce.date().optional(),
  clientId: z.string().cuid(),
})

export const updateTaskSchema = createTaskSchema.partial()

/**
 * Client schemas
 */
export const clientSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  status: z.enum(['new', 'onboarding', 'active', 'paused', 'closed']),
  plan: z.string().optional().nullable(),
  mainChannel: z.string().optional().nullable(),
  contractValue: z.number().nonnegative().optional().nullable(),
  paymentDay: z.number().int().min(1).max(31).optional().nullable(),
  contractStart: z.coerce.date().optional().nullable(),
  contractEnd: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export const createClientSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(200),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(20).optional(),
  status: z
    .enum(['new', 'onboarding', 'active', 'paused', 'closed'])
    .default('new'),
  plan: z.string().optional(),
  mainChannel: z.string().optional(),
  contractValue: z.number().nonnegative().optional(),
  paymentDay: z.number().int().min(1).max(31).optional(),
  contractStart: z.coerce.date().optional(),
  contractEnd: z.coerce.date().optional(),
})

/**
 * Meeting schemas
 */
export const meetingSchema = z.object({
  id: z.string().cuid(),
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional().nullable(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  location: z.string().optional().nullable(),
  status: z.enum(['scheduled', 'completed', 'cancelled']),
  notes: z.string().optional().nullable(),
  clientId: z.string().cuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export const createMeetingSchema = z
  .object({
    title: z.string().min(1, 'Título é obrigatório').max(200),
    description: z.string().max(2000).optional(),
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
    location: z.string().max(200).optional(),
    status: z
      .enum(['scheduled', 'completed', 'cancelled'])
      .default('scheduled'),
    notes: z.string().max(5000).optional(),
    clientId: z.string().cuid(),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: 'Horário de término deve ser após o horário de início',
    path: ['endTime'],
  })

/**
 * Finance schemas
 */
export const financeSchema = z.object({
  id: z.string().cuid(),
  type: z.enum(['income', 'expense']),
  amount: z.number().positive('Valor deve ser maior que zero'),
  description: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  date: z.coerce.date(),
  clientId: z.string().cuid().optional().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export const createFinanceSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.number().positive('Valor deve ser maior que zero'),
  description: z.string().max(500).optional(),
  category: z.string().max(100).optional(),
  date: z.coerce.date().default(() => new Date()),
  clientId: z.string().cuid().optional(),
})

/**
 * Media schemas
 */
export const mediaSchema = z.object({
  id: z.string().cuid(),
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional().nullable(),
  fileKey: z.string().optional().nullable(),
  mimeType: z.string().optional().nullable(),
  fileSize: z.number().int().nonnegative().optional().nullable(),
  url: z.string().url().optional().nullable(),
  thumbUrl: z.string().url().optional().nullable(),
  type: z.enum(['image', 'video', 'document']),
  tags: z.array(z.string()).default([]),
  folderId: z.string().cuid().optional().nullable(),
  clientId: z.string().cuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export const createMediaSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(200),
  description: z.string().max(1000).optional(),
  fileKey: z.string().optional(),
  mimeType: z.string().optional(),
  fileSize: z.number().int().nonnegative().optional(),
  url: z.string().url().optional(),
  thumbUrl: z.string().url().optional(),
  type: z.enum(['image', 'video', 'document']),
  tags: z.array(z.string()).default([]),
  folderId: z.string().cuid().optional(),
  clientId: z.string().cuid(),
})

/**
 * Dashboard schemas
 */
export const dashboardStatsSchema = z.object({
  tasks: z.object({
    total: z.number().int().nonnegative(),
    todo: z.number().int().nonnegative(),
    inProgress: z.number().int().nonnegative(),
    done: z.number().int().nonnegative(),
    overdue: z.number().int().nonnegative(),
  }),
  brandings: z.number().int().nonnegative(),
  media: z.number().int().nonnegative(),
  mediaByType: z.object({
    images: z.number().int().nonnegative(),
    videos: z.number().int().nonnegative(),
    documents: z.number().int().nonnegative(),
  }),
  strategies: z.number().int().nonnegative(),
  meetings: z.object({
    total: z.number().int().nonnegative(),
    upcoming: z.number().int().nonnegative(),
    past: z.number().int().nonnegative(),
    scheduledToday: z.number().int().nonnegative(),
  }),
  finance: z.object({
    income: z.number(),
    expense: z.number(),
    net: z.number(),
  }),
})

/**
 * Types exportados dos schemas
 */
export type Notification = z.infer<typeof notificationSchema>
export type NotificationsResponse = z.infer<typeof notificationsResponseSchema>
export type Task = z.infer<typeof taskSchema>
export type CreateTaskInput = z.infer<typeof createTaskSchema>
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>
export type Client = z.infer<typeof clientSchema>
export type CreateClientInput = z.infer<typeof createClientSchema>
export type Meeting = z.infer<typeof meetingSchema>
export type CreateMeetingInput = z.infer<typeof createMeetingSchema>
export type Finance = z.infer<typeof financeSchema>
export type CreateFinanceInput = z.infer<typeof createFinanceSchema>
export type Media = z.infer<typeof mediaSchema>
export type CreateMediaInput = z.infer<typeof createMediaSchema>
export type DashboardStats = z.infer<typeof dashboardStatsSchema>
