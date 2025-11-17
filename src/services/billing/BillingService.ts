import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export type InvoiceStatusFilter = 'DRAFT' | 'OPEN' | 'PAID' | 'VOID' | 'OVERDUE'
export interface InvoiceListFilters {
  status?: InvoiceStatusFilter
  q?: string
  page?: number
  pageSize?: number
}

export class BillingService {
  static async listClientInvoices(clientId: string, orgId: string) {
    const client = await prisma.client.findFirst({
      where: { id: clientId, orgId },
    })
    if (!client) throw new Error('Cliente não encontrado')

    return prisma.invoice.findMany({
      where: { clientId, orgId },
      orderBy: { issueDate: 'desc' },
      include: { items: true, payments: true },
    })
  }

  static async listClientInvoicesPaged(
    clientId: string,
    orgId: string,
    filters: InvoiceListFilters = {}
  ) {
    const client = await prisma.client.findFirst({
      where: { id: clientId, orgId },
    })
    if (!client) throw new Error('Cliente não encontrado')

    const { status, q, page = 1, pageSize = 20 } = filters
    const where: Prisma.InvoiceWhereInput = { clientId, orgId }
    if (status) where.status = status
    if (q && q.trim()) {
      where.OR = [
        { number: { contains: q, mode: 'insensitive' } },
        { notes: { contains: q, mode: 'insensitive' } },
      ]
    }
    const skip = (Math.max(1, page) - 1) * Math.max(1, pageSize)
    const take = Math.max(1, pageSize)

    const [items, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take,
        orderBy: { issueDate: 'desc' },
        include: { items: true, payments: true },
      }),
      prisma.invoice.count({ where }),
    ])

    return { items, total, page, pageSize }
  }

  static async listOrgInvoices(
    orgId: string,
    filters: InvoiceListFilters = {}
  ) {
    const { status, q, page = 1, pageSize = 20 } = filters
    const where: Prisma.InvoiceWhereInput = { orgId }
    if (status) where.status = status
    if (q && q.trim()) {
      where.OR = [
        { number: { contains: q, mode: 'insensitive' } },
        { notes: { contains: q, mode: 'insensitive' } },
        { client: { name: { contains: q, mode: 'insensitive' } } },
      ]
    }
    const skip = (Math.max(1, page) - 1) * Math.max(1, pageSize)
    const take = Math.max(1, pageSize)

    const [items, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take,
        orderBy: { issueDate: 'desc' },
        include: { client: true },
      }),
      prisma.invoice.count({ where }),
    ])

    return { items, total, page, pageSize }
  }

  static async generateMonthlyInvoice(clientId: string, orgId: string) {
    const client = await prisma.client.findFirst({
      where: { id: clientId, orgId },
    })
    if (!client) throw new Error('Cliente não encontrado')
    if (!client.contractValue) throw new Error('Valor de contrato não definido')

    const now = new Date()
    const periodKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const dueDay = Math.min(Math.max(client.paymentDay || 5, 1), 28)
    const dueDate = new Date(now.getFullYear(), now.getMonth(), dueDay)

    const existing = await prisma.invoice.findFirst({
      where: { clientId, orgId, notes: { contains: `period:${periodKey}` } },
    })
    if (existing) return existing

    const number = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

    const subtotal = client.contractValue
    const discount = 0
    const tax = 0
    const total = subtotal - discount + tax

    return prisma.invoice.create({
      data: {
        orgId,
        clientId,
        number,
        status: 'OPEN',
        issueDate: now,
        dueDate,
        subtotal,
        discount,
        tax,
        total,
        currency: 'BRL',
        notes: `Mensalidade ${now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })} | period:${periodKey}`,
        items: {
          create: [
            {
              description: 'Mensalidade',
              quantity: 1,
              unitAmount: subtotal,
              total,
            },
          ],
        },
      },
    })
  }

  static async markInvoicePaid(
    invoiceId: string,
    orgId: string,
    method: string,
    amount?: number
  ) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { client: true },
    })
    if (!invoice || invoice.orgId !== orgId)
      throw new Error('Fatura não encontrada')

    const paidAmount = amount ?? invoice.total

    const [updatedInvoice] = await prisma.$transaction([
      prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: 'PAID' },
      }),
      prisma.payment.create({
        data: {
          orgId,
          clientId: invoice.clientId,
          invoiceId: invoice.id,
          amount: paidAmount,
          method,
          status: 'PAID',
          paidAt: new Date(),
          provider: 'manual',
        },
      }),
      prisma.finance.create({
        data: {
          orgId,
          clientId: invoice.clientId,
          type: 'income',
          amount: paidAmount,
          description: `Pagamento fatura ${invoice.number}`,
          category: 'Mensalidade',
          date: new Date(),
        },
      }),
      prisma.client.update({
        where: { id: invoice.clientId },
        data: { paymentStatus: 'CONFIRMED' },
      }),
    ])

    return updatedInvoice
  }

  static async cancelInvoice(invoiceId: string, orgId: string) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { payments: true, client: true },
    })
    if (!invoice || invoice.orgId !== orgId)
      throw new Error('Fatura não encontrada')
    if (invoice.status === 'PAID')
      throw new Error('Fatura já paga; não pode cancelar')
    if (invoice.status === 'VOID') throw new Error('Fatura já cancelada')
    if (invoice.payments.length > 0)
      throw new Error('Fatura possui pagamentos registrados')

    const updated = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'VOID',
        notes: invoice.notes ? invoice.notes : undefined,
      },
    })

    // notificação interna opcional
    await prisma.notification
      .create({
        data: {
          orgId,
          clientId: invoice.clientId,
          type: 'billing_invoice_void',
          title: `Fatura ${invoice.number} cancelada`,
          message: `Cancelada manualmente em ${new Date().toLocaleDateString('pt-BR')}`,
          link: `/clients/${invoice.clientId}/billing/invoices/${invoice.id}`,
          priority: 'low',
        },
      })
      .catch(() => {})

    return updated
  }

  /**
   * Gera mensagem profissional para cobrança via WhatsApp.
   * Inclui itens, total, vencimento e chave PIX.
   */
  static async composeInvoiceWhatsAppMessage(invoiceId: string, orgId: string) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { client: true, items: true },
    })
    if (!invoice || invoice.orgId !== orgId)
      throw new Error('Fatura não encontrada')

    const org = await prisma.org.findUnique({ where: { id: orgId } })
    const pixKey =
      process.env.PIX_KEY ||
      process.env.PIX_CHAVE ||
      'CHAVE_PIX_NAO_CONFIGURADA'
    const portalUrl = `${process.env.APP_URL || 'https://app.example.com'}/clients/${invoice.clientId}/billing/invoices/${invoice.id}`

    const itemsLines =
      invoice.items
        .map(
          (it) =>
            `• ${it.description} (${it.quantity}x) = ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: invoice.currency || 'BRL' }).format(it.total)}`
        )
        .join('\n') || '• Mensalidade'
    const totalFmt = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: invoice.currency || 'BRL',
    }).format(invoice.total)
    const dueFmt = new Date(invoice.dueDate).toLocaleDateString('pt-BR')
    const issueFmt = new Date(invoice.issueDate).toLocaleDateString('pt-BR')

    return (
      `Olá ${invoice.client.name}!\n\n` +
      `Segue sua cobrança referente aos serviços prestados em ${issueFmt}.\n\n` +
      `Fatura: ${invoice.number}\n` +
      `Vencimento: ${dueFmt}\n` +
      `Status: ${invoice.status}\n\n` +
      `Itens:\n${itemsLines}\n\n` +
      `Total: ${totalFmt}\n\n` +
      `Chave PIX para pagamento: ${pixKey}\n` +
      (org?.name ? `Razão Social: ${org.name}\n` : '') +
      (org?.cnpj ? `CNPJ: ${org.cnpj}\n` : '') +
      `Link da fatura / portal: ${portalUrl}\n\n` +
      `Por favor, após realizar o pagamento, confirme pelo portal ou aguarde atualização automática.\n` +
      `Muito obrigado!`
    )
  }

  static async dailyJob(
    orgId: string,
    options?: { sendNotifications?: boolean; sendWhatsAppFull?: boolean }
  ) {
    const clients = await prisma.client.findMany({ where: { orgId } })
    const now = new Date()
    const generated: string[] = []
    const generatedInvoices: { id: string; clientId: string }[] = []
    for (const c of clients) {
      try {
        if (c.contractValue && !c.isInstallment) {
          const inv = await this.generateMonthlyInvoice(c.id, orgId)
          generated.push(inv.id)
          // Só consideramos como "nova" se status estiver OPEN e issueDate dentro do dia (evita antigas retornadas)
          if (
            inv.status === 'OPEN' &&
            inv.issueDate >=
              new Date(now.getFullYear(), now.getMonth(), now.getDate())
          ) {
            generatedInvoices.push({ id: inv.id, clientId: inv.clientId })
          }
        }
      } catch {
        // continue
      }
    }

    // marcar OVERDUE
    const overdue = await prisma.invoice.updateMany({
      where: { orgId, status: 'OPEN', dueDate: { lt: now } },
      data: { status: 'OVERDUE' },
    })
    // Notificações: vencendo em 3 dias e vencidas
    const soon = new Date(now)
    soon.setDate(soon.getDate() + 3)
    const dueSoon = await prisma.invoice.findMany({
      where: { orgId, status: 'OPEN', dueDate: { gte: now, lte: soon } },
      select: { id: true, clientId: true, number: true, dueDate: true },
    })
    const becameOverdue = await prisma.invoice.findMany({
      where: {
        orgId,
        status: 'OVERDUE',
        updatedAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
      },
      select: { id: true, clientId: true, number: true, dueDate: true },
    })
    const notifs: Prisma.PrismaPromise<unknown>[] = []
    const sendExternal = !!options?.sendNotifications
    for (const inv of dueSoon) {
      notifs.push(
        prisma.notification.create({
          data: {
            orgId,
            type: 'billing_due_soon',
            title: `Fatura ${inv.number} vence em breve`,
            message: `Vence em ${inv.dueDate.toLocaleDateString('pt-BR')}`,
            link: `/clients/${inv.clientId}/billing/invoices/${inv.id}`,
            clientId: inv.clientId,
            priority: 'medium',
          },
        })
      )
    }
    for (const inv of becameOverdue) {
      notifs.push(
        prisma.notification.create({
          data: {
            orgId,
            type: 'billing_overdue',
            title: `Fatura ${inv.number} vencida`,
            message: `Venceu em ${inv.dueDate.toLocaleDateString('pt-BR')}`,
            link: `/clients/${inv.clientId}/billing/invoices/${inv.id}`,
            clientId: inv.clientId,
            priority: 'high',
          },
        })
      )
    }
    if (notifs.length) await prisma.$transaction(notifs)

    // Optional WhatsApp notifications sketch
    const sendFullAuto =
      options?.sendWhatsAppFull ||
      process.env.WHATSAPP_SEND_AUTOMATIC === 'true'

    if (sendExternal || sendFullAuto) {
      const { WhatsAppService } = await import(
        '../notifications/WhatsAppService'
      )
      if (WhatsAppService.isEnabled()) {
        // Fetch phones for involved clients
        const clientIds = Array.from(
          new Set([...dueSoon, ...becameOverdue].map((x) => x.clientId))
        )
        const clients = await prisma.client.findMany({
          where: { id: { in: clientIds } },
          select: { id: true, name: true, phone: true },
        })
        const phoneById = new Map(clients.map((c) => [c.id, c.phone || '']))

        // ALERTAS simples (vencimento próximo)
        for (const inv of dueSoon) {
          const phone = phoneById.get(inv.clientId)
          if (!phone) continue
          const body = `Olá! Sua fatura ${inv.number} vence em ${inv.dueDate.toLocaleDateString('pt-BR')}. Acesse o portal para detalhes.`
          // fire and forget
          WhatsAppService.send({ to: phone, body }).catch(() => {})
        }
        // FICOU VENCIDA recentemente (alerta + opcional mensagem completa)
        for (const inv of becameOverdue) {
          const phone = phoneById.get(inv.clientId)
          if (!phone) continue
          if (sendFullAuto) {
            // Mensagem completa da fatura
            this.composeInvoiceWhatsAppMessage(inv.id, orgId)
              .then((full) => WhatsAppService.send({ to: phone!, body: full }))
              .catch(() => {})
          } else {
            const body = `Atenção: sua fatura ${inv.number} venceu em ${inv.dueDate.toLocaleDateString('pt-BR')}. Para detalhes e pagamento PIX acesse o portal.`
            WhatsAppService.send({ to: phone, body }).catch(() => {})
          }
        }
        // NOVAS FATURAS GERADAS (envio completo, opcional)
        if (sendFullAuto) {
          for (const inv of generatedInvoices) {
            const phone = phoneById.get(inv.clientId)
            if (!phone) continue
            this.composeInvoiceWhatsAppMessage(inv.id, orgId)
              .then((full) => WhatsAppService.send({ to: phone!, body: full }))
              .catch(() => {})
          }
        }
      }
    }

    return {
      generatedCount: generated.length,
      overdueMarked: overdue.count,
      dueSoon: dueSoon.length,
      overdueNotified: becameOverdue.length,
      notificationsSent: !!options?.sendNotifications,
      whatsappFullSentNew: sendFullAuto ? generatedInvoices.length : 0,
      whatsappFullSentOverdue: sendFullAuto ? becameOverdue.length : 0,
    }
  }

  static async countFinancialAlerts(orgId: string) {
    return prisma.notification.count({
      where: {
        orgId,
        read: false,
        type: { in: ['billing_due_soon', 'billing_overdue'] },
      },
    })
  }
}
