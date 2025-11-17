/**
 * Enums e tipos constantes do domínio
 * Centraliza status e estados usados no front-end
 * Deve estar alinhado com Prisma schema
 */

// Task Status
export const TASK_STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'in-progress',
  DONE: 'done',
  COMPLETED: 'completed', // alias para done (compatibilidade)
} as const

export type TaskStatus = (typeof TASK_STATUS)[keyof typeof TASK_STATUS]

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  [TASK_STATUS.TODO]: 'A Fazer',
  [TASK_STATUS.IN_PROGRESS]: 'Em Progresso',
  [TASK_STATUS.DONE]: 'Concluído',
  [TASK_STATUS.COMPLETED]: 'Concluído',
}

// Task Priority
export const TASK_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const

export type TaskPriority = (typeof TASK_PRIORITY)[keyof typeof TASK_PRIORITY]

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  [TASK_PRIORITY.LOW]: 'Baixa',
  [TASK_PRIORITY.MEDIUM]: 'Média',
  [TASK_PRIORITY.HIGH]: 'Alta',
}

// Client Status
export const CLIENT_STATUS = {
  NEW: 'new',
  ONBOARDING: 'onboarding',
  ACTIVE: 'active',
  PAUSED: 'paused',
  CLOSED: 'closed',
} as const

export type ClientStatus = (typeof CLIENT_STATUS)[keyof typeof CLIENT_STATUS]

export const CLIENT_STATUS_LABELS: Record<ClientStatus, string> = {
  [CLIENT_STATUS.NEW]: 'Novo',
  [CLIENT_STATUS.ONBOARDING]: 'Onboarding',
  [CLIENT_STATUS.ACTIVE]: 'Ativo',
  [CLIENT_STATUS.PAUSED]: 'Pausado',
  [CLIENT_STATUS.CLOSED]: 'Encerrado',
}

// Payment Status
export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  LATE: 'LATE',
} as const

export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS]

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  [PAYMENT_STATUS.PENDING]: 'Pendente',
  [PAYMENT_STATUS.CONFIRMED]: 'Confirmado',
  [PAYMENT_STATUS.LATE]: 'Atrasado',
}

// Invoice Status
export const INVOICE_STATUS = {
  DRAFT: 'DRAFT',
  OPEN: 'OPEN',
  PAID: 'PAID',
  VOID: 'VOID',
  OVERDUE: 'OVERDUE',
} as const

export type InvoiceStatus = (typeof INVOICE_STATUS)[keyof typeof INVOICE_STATUS]

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  [INVOICE_STATUS.DRAFT]: 'Rascunho',
  [INVOICE_STATUS.OPEN]: 'Aberto',
  [INVOICE_STATUS.PAID]: 'Pago',
  [INVOICE_STATUS.VOID]: 'Cancelado',
  [INVOICE_STATUS.OVERDUE]: 'Vencido',
}

// Meeting Status
export const MEETING_STATUS = {
  SCHEDULED: 'scheduled',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const

export type MeetingStatus = (typeof MEETING_STATUS)[keyof typeof MEETING_STATUS]

export const MEETING_STATUS_LABELS: Record<MeetingStatus, string> = {
  [MEETING_STATUS.SCHEDULED]: 'Agendada',
  [MEETING_STATUS.COMPLETED]: 'Concluída',
  [MEETING_STATUS.CANCELLED]: 'Cancelada',
}

// Media Types
export const MEDIA_TYPE = {
  IMAGE: 'image',
  VIDEO: 'video',
  DOCUMENT: 'document',
} as const

export type MediaType = (typeof MEDIA_TYPE)[keyof typeof MEDIA_TYPE]

export const MEDIA_TYPE_LABELS: Record<MediaType, string> = {
  [MEDIA_TYPE.IMAGE]: 'Imagem',
  [MEDIA_TYPE.VIDEO]: 'Vídeo',
  [MEDIA_TYPE.DOCUMENT]: 'Documento',
}

// User Roles
export const USER_ROLE = {
  OWNER: 'OWNER',
  STAFF: 'STAFF',
  CLIENT: 'CLIENT',
} as const

export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE]

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  [USER_ROLE.OWNER]: 'Proprietário',
  [USER_ROLE.STAFF]: 'Equipe',
  [USER_ROLE.CLIENT]: 'Cliente',
}

// Notification Types
export const NOTIFICATION_TYPE = {
  TASK_ASSIGNED: 'task_assigned',
  TASK_COMPLETED: 'task_completed',
  PAYMENT_RECEIVED: 'payment_received',
  PAYMENT_OVERDUE: 'payment_overdue',
  MEETING_REMINDER: 'meeting_reminder',
  GENERAL: 'general',
} as const

export type NotificationType =
  (typeof NOTIFICATION_TYPE)[keyof typeof NOTIFICATION_TYPE]

// Notification Priority
export const NOTIFICATION_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const

export type NotificationPriority =
  (typeof NOTIFICATION_PRIORITY)[keyof typeof NOTIFICATION_PRIORITY]

/**
 * Helpers para verificação de tipo
 */
export function isTaskStatus(value: string): value is TaskStatus {
  return Object.values(TASK_STATUS).includes(value as TaskStatus)
}

export function isTaskPriority(value: string): value is TaskPriority {
  return Object.values(TASK_PRIORITY).includes(value as TaskPriority)
}

export function isClientStatus(value: string): value is ClientStatus {
  return Object.values(CLIENT_STATUS).includes(value as ClientStatus)
}

export function isPaymentStatus(value: string): value is PaymentStatus {
  return Object.values(PAYMENT_STATUS).includes(value as PaymentStatus)
}

export function isMeetingStatus(value: string): value is MeetingStatus {
  return Object.values(MEETING_STATUS).includes(value as MeetingStatus)
}
