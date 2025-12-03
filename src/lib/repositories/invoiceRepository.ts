import { prisma } from '@/lib/prisma'
import { getApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const DUAL_WRITE = process.env.DUAL_WRITE?.toLowerCase() === 'true'

export type InvoiceCreateInput = {
  orgId: string
  clientId: string
  number: string
  dueDate: Date
  status?: string
  subtotal?: number
  discount?: number
  tax?: number
  total?: number
  currency?: string
  notes?: string | null
  externalId?: string | null
}

export async function createInvoice(input: InvoiceCreateInput) {
  const invoice = await prisma.invoice.create({
    data: {
      orgId: input.orgId,
      clientId: input.clientId,
      number: input.number,
      dueDate: input.dueDate,
      status: (input.status as any) ?? undefined,
      subtotal: input.subtotal ?? undefined,
      discount: input.discount ?? undefined,
      tax: input.tax ?? undefined,
      total: input.total ?? undefined,
      currency: input.currency ?? undefined,
      notes: input.notes ?? undefined,
      externalId: input.externalId ?? undefined,
    },
  })

  if (DUAL_WRITE) {
    try {
      const firestore = getFirestore(getApp())
      await firestore
        .collection('orgs')
        .doc(input.orgId)
        .collection('clients')
        .doc(input.clientId)
        .collection('invoices')
        .doc(invoice.id)
        .set({
          id: invoice.id,
          number: invoice.number,
          status: invoice.status,
          dueDate: invoice.dueDate.toISOString(),
          subtotal: invoice.subtotal,
          discount: invoice.discount,
          tax: invoice.tax,
          total: invoice.total,
          currency: invoice.currency,
          notes: invoice.notes ?? null,
          createdAt: invoice.createdAt.toISOString(),
          updatedAt: invoice.updatedAt.toISOString(),
        })
    } catch (err) {
      // Enfileira para retry via WebhookEvent
      try {
        await prisma.webhookEvent.create({
          data: {
            provider: 'dual-write',
            eventType: 'firestore',
            payload: {
              entity: 'invoice',
              op: 'create',
              attempts: 0,
              orgId: input.orgId,
              clientId: input.clientId,
              data: {
                id: invoice.id,
                number: invoice.number,
                status: invoice.status,
                dueDate: invoice.dueDate.toISOString(),
                subtotal: invoice.subtotal,
                discount: invoice.discount,
                tax: invoice.tax,
                total: invoice.total,
                currency: invoice.currency,
                notes: invoice.notes ?? null,
                createdAt: invoice.createdAt.toISOString(),
                updatedAt: invoice.updatedAt.toISOString(),
              },
            },
          },
        })
      } catch (e) {
        console.error('[dual-write:invoice:create] falhou enfileirar Outbox', e)
      }
      console.error('[dual-write:invoice:create] falhou no Firestore', err)
    }
  }

  return invoice
}
