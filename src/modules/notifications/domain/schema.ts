import { z } from 'zod'

// Enumerations (string enums kept flexible; restrict as project evolves)
export const NotificationTypeEnum = z.enum([
  'task_created',
  'task_updated',
  'task_completed',
  'task_overdue',
  'meeting_created',
  'meeting_updated',
  'meeting_cancelled',
  'payment_confirmed',
  'payment_overdue',
  'installment_created',
  'client_created',
  'client_updated',
  'client_deleted',
  'member_added',
  'member_removed',
  'finance_created',
  'finance_updated',
  // fallback generic
  'generic',
])

export const NotificationPriorityEnum = z
  .enum(['low', 'normal', 'high', 'urgent'])
  .default('normal')

// Base notification as stored
export const NotificationSchema = z.object({
  id: z.string(),
  orgId: z.string().nullable().optional(),
  userId: z.string().nullable().optional(),
  type: z.string().min(1), // allow dynamic types beyond enum list
  title: z.string().min(1),
  message: z.string().nullable().optional(),
  link: z.string().url().nullable().optional(),
  clientId: z.string().nullable().optional(),
  priority: z.string().nullable().optional(),
  read: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
})
export type Notification = z.infer<typeof NotificationSchema>

// Normalized shape for UI consumption (converted dates, computed flags)
export const UINotificationSchema = NotificationSchema.transform((n) => ({
  ...n,
  unread: !n.read,
  timeISO: n.createdAt.toISOString(),
}))
export type UINotification = z.infer<typeof UINotificationSchema>

// Response for listing notifications
export const NotificationListResponseSchema = z.object({
  notifications: z.array(UINotificationSchema),
  total: z.number(),
  unreadCount: z.number(),
  hasMore: z.boolean(),
})
export type NotificationListResponse = z.infer<
  typeof NotificationListResponseSchema
>

// Input schemas for server actions
export const MarkNotificationReadInput = z.object({ id: z.string().min(1) })
export const MarkMultipleReadInput = z.object({
  ids: z.array(z.string().min(1)).min(1),
})
export const DeleteNotificationInput = z.object({ id: z.string().min(1) })
export const MarkAllReadInput = z.object({
  scope: z.enum(['user', 'org']).default('user'),
})

// Utility: map raw Prisma objects (with Date) into validated UI list
// Accept unknown list and validate each element through schema to ensure runtime safety
export function parseNotificationList(raw: unknown[]): UINotification[] {
  return raw.map((r) => UINotificationSchema.parse(r))
}
