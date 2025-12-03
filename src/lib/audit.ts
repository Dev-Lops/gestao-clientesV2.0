import { prisma } from '@/lib/prisma'

type AuditParams = {
  orgId?: string | null
  userId?: string | null
  type: string
  title: string
  message?: string | null
  link?: string | null
  clientId?: string | null
  priority?: string | null
}

/**
 * Audit log baseado em Notification para evitar migração de schema.
 * Salva com type='AUDIT:<tipo>'.
 */
export async function auditLog(params: AuditParams) {
  const type = params.type.startsWith('AUDIT:')
    ? params.type
    : `AUDIT:${params.type}`
  await prisma.notification.create({
    data: {
      orgId: params.orgId || null,
      userId: params.userId || null,
      type,
      title: params.title,
      message: params.message || null,
      link: params.link || null,
      clientId: params.clientId || null,
      priority: params.priority || null,
    },
  })
}
