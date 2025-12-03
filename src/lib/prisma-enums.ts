/**
 * Valores dos enums do Prisma Schema
 * Este arquivo centraliza todos os valores de enums definidos no schema.prisma
 */

import {
  BillingInterval,
  ClientPlan,
  InviteStatus,
  InvoiceStatus,
  PaymentStatus,
  Role,
  SocialChannel,
  SubscriptionStatus,
} from '@prisma/client'

// ==================== CLIENT PLANS ====================
export const CLIENT_PLANS = Object.values(ClientPlan)

export const CLIENT_PLAN_LABELS: Record<ClientPlan, string> = {
  GESTAO: 'Gestão',
  ESTRUTURA: 'Estrutura',
  FREELANCER: 'Freelancer',
  PARCERIA: 'Parceria',
  CONSULTORIA: 'Consultoria',
  OUTRO: 'Outro',
}

// ==================== SOCIAL CHANNELS ====================
export const SOCIAL_CHANNELS = Object.values(SocialChannel)

export const SOCIAL_CHANNEL_LABELS: Record<SocialChannel, string> = {
  INSTAGRAM: 'Instagram',
  FACEBOOK: 'Facebook',
  TIKTOK: 'TikTok',
  YOUTUBE: 'YouTube',
  LINKEDIN: 'LinkedIn',
  TWITTER: 'Twitter',
  OUTRO: 'Outro',
}

// ==================== PAYMENT STATUS ====================
export const PAYMENT_STATUSES = Object.values(PaymentStatus)

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmado',
  LATE: 'Atrasado',
}

// ==================== INVOICE STATUS ====================
export const INVOICE_STATUSES = Object.values(InvoiceStatus)

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  DRAFT: 'Rascunho',
  OPEN: 'Em Aberto',
  PAID: 'Pago',
  VOID: 'Cancelado',
  OVERDUE: 'Vencido',
  CANCELED: 'Cancelado',
}

// ==================== ROLES ====================
export const ROLES = Object.values(Role)

export const ROLE_LABELS: Record<Role, string> = {
  OWNER: 'Proprietário',
  STAFF: 'Equipe',
  CLIENT: 'Cliente',
}

// ==================== INVITE STATUS ====================
export const INVITE_STATUSES = Object.values(InviteStatus)

export const INVITE_STATUS_LABELS: Record<InviteStatus, string> = {
  PENDING: 'Pendente',
  ACCEPTED: 'Aceito',
  CANCELED: 'Cancelado',
  EXPIRED: 'Expirado',
}

// ==================== SUBSCRIPTION STATUS ====================
export const SUBSCRIPTION_STATUSES = Object.values(SubscriptionStatus)

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  ACTIVE: 'Ativo',
  TRIALING: 'Em Teste',
  PAST_DUE: 'Vencido',
  CANCELED: 'Cancelado',
  INACTIVE: 'Inativo',
}

// ==================== BILLING INTERVAL ====================
export const BILLING_INTERVALS = Object.values(BillingInterval)

export const BILLING_INTERVAL_LABELS: Record<BillingInterval, string> = {
  MONTH: 'Mensal',
  YEAR: 'Anual',
}

// ==================== CLIENT STATUS (não é enum no schema, mas vamos padronizar) ====================
export const CLIENT_STATUSES = [
  'new',
  'onboarding',
  'active',
  'paused',
  'closed',
] as const
export type ClientStatus = (typeof CLIENT_STATUSES)[number]

export const CLIENT_STATUS_LABELS: Record<ClientStatus, string> = {
  new: 'Novo',
  onboarding: 'Em Onboarding',
  active: 'Ativo',
  paused: 'Pausado',
  closed: 'Encerrado',
}

// ==================== TASK STATUS (não é enum no schema, mas vamos padronizar) ====================
export const TASK_STATUSES = [
  'todo',
  'in-progress',
  'done',
  'cancelled',
] as const
export type TaskStatus = (typeof TASK_STATUSES)[number]

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'A Fazer',
  'in-progress': 'Em Progresso',
  done: 'Concluído',
  cancelled: 'Cancelado',
}

// ==================== MEETING STATUS (não é enum no schema, mas vamos padronizar) ====================
export const MEETING_STATUSES = ['scheduled', 'completed', 'cancelled'] as const
export type MeetingStatus = (typeof MEETING_STATUSES)[number]

export const MEETING_STATUS_LABELS: Record<MeetingStatus, string> = {
  scheduled: 'Agendada',
  completed: 'Realizada',
  cancelled: 'Cancelada',
}

// ==================== STRATEGY TYPES ====================
export const STRATEGY_TYPES = [
  'objective',
  'action-plan',
  'target-audience',
  'kpi',
] as const
export type StrategyType = (typeof STRATEGY_TYPES)[number]

export const STRATEGY_TYPE_LABELS: Record<StrategyType, string> = {
  objective: 'Objetivo',
  'action-plan': 'Plano de Ação',
  'target-audience': 'Público-Alvo',
  kpi: 'KPI',
}

// ==================== FINANCE TYPES ====================
export const FINANCE_TYPES = ['income', 'expense'] as const
export type FinanceType = (typeof FINANCE_TYPES)[number]

export const FINANCE_TYPE_LABELS: Record<FinanceType, string> = {
  income: 'Receita',
  expense: 'Despesa',
}

// ==================== FINANCE CATEGORIES ====================
export const INCOME_CATEGORIES = [
  'Mensalidade',
  'Projeto',
  'Consultoria',
  'Freelancer',
  'Outro',
] as const

export const EXPENSE_CATEGORIES = [
  'Infraestrutura',
  'Marketing',
  'Ferramentas',
  'Pessoal',
  'Impostos',
  'Outro',
] as const
