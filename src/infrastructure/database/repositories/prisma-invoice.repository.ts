// @ts-nocheck
import { Invoice } from '@/domain/invoice/entities/invoice.entity'
import { InvoiceStatus } from '@/domain/invoice/value-objects/invoice-status.vo'
import { Money } from '@/domain/invoice/value-objects/money.vo'
import { IInvoiceRepository } from '@/ports/repositories/invoice.repository.interface'
import { PrismaClient } from '@prisma/client'

/**
 * Implementação Prisma do Invoice Repository
 * Responsável por persistir faturas no PostgreSQL via Prisma
 */

export class PrismaInvoiceRepository implements IInvoiceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(invoice: Invoice): Promise<void> {
    const data = this.toPrisma(invoice)

    await this.prisma.invoice.upsert({
      where: { id: invoice.id || 'new-invoice' },
      create: data,
      update: data,
    })
  }

  async findById(id: string): Promise<Invoice | null> {
    const data = await this.prisma.invoice.findUnique({
      where: { id, deletedAt: null },
    })

    return data ? this.toDomain(data) : null
  }

  async findByNumber(number: string, orgId: string): Promise<Invoice | null> {
    const data = await this.prisma.invoice.findFirst({
      where: { number, orgId, deletedAt: null },
    })

    return data ? this.toDomain(data) : null
  }

  async findByOrgId(
    orgId: string,
    options?: {
      page?: number
      limit?: number
      status?: InvoiceStatus[]
      clientId?: string
      startDate?: Date
      endDate?: Date
    }
  ): Promise<{ invoices: Invoice[]; total: number }> {
    const page = options?.page ?? 1
    const limit = options?.limit ?? 10
    const skip = (page - 1) * limit

    const where: {
      orgId: string
      deletedAt: null
      status?: { in: InvoiceStatus[] }
      clientId?: string
      dueDate?: { gte?: Date; lte?: Date }
    } = {
      orgId,
      deletedAt: null,
    }

    if (options?.status && options.status.length > 0) {
      where.status = { in: options.status }
    }

    if (options?.clientId) {
      where.clientId = options.clientId
    }

    if (options?.startDate || options?.endDate) {
      where.dueDate = {}
      if (options.startDate) {
        where.dueDate.gte = options.startDate
      }
      if (options.endDate) {
        where.dueDate.lte = options.endDate
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { dueDate: 'desc' },
      }),
      this.prisma.invoice.count({ where }),
    ])

    return {
      invoices: data.map((d) => this.toDomain(d)),
      total,
    }
  }

  async findByClientId(
    clientId: string,
    options?: {
      page?: number
      limit?: number
      status?: InvoiceStatus[]
    }
  ): Promise<{ invoices: Invoice[]; total: number }> {
    const page = options?.page ?? 1
    const limit = options?.limit ?? 10
    const skip = (page - 1) * limit

    const where: {
      clientId: string
      deletedAt: null
      status?: { in: InvoiceStatus[] }
    } = {
      clientId,
      deletedAt: null,
    }

    if (options?.status && options.status.length > 0) {
      where.status = { in: options.status }
    }

    const [data, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { dueDate: 'desc' },
      }),
      this.prisma.invoice.count({ where }),
    ])

    return {
      invoices: data.map((d) => this.toDomain(d)),
      total,
    }
  }

  async findOverdue(orgId: string): Promise<Invoice[]> {
    const now = new Date()

    const data = await this.prisma.invoice.findMany({
      where: {
        orgId,
        deletedAt: null,
        status: { in: [InvoiceStatus.OPEN, InvoiceStatus.OVERDUE] },
        dueDate: { lt: now },
      },
      orderBy: { dueDate: 'asc' },
    })

    return data.map((d) => this.toDomain(d))
  }

  async delete(id: string): Promise<void> {
    await this.prisma.invoice.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
    })
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.invoice.count({
      where: { id, deletedAt: null },
    })
    return count > 0
  }

  async existsByNumber(number: string, orgId: string): Promise<boolean> {
    const count = await this.prisma.invoice.count({
      where: { number, orgId, deletedAt: null },
    })
    return count > 0
  }

  /**
   * Converte dados do Prisma para entidade de domínio
   */
  private toDomain(data: {
    id: string
    orgId: string
    clientId: string
    number: string
    status: InvoiceStatus
    issueDate: Date
    dueDate: Date
    subtotal: { toNumber: () => number } | number
    discount: { toNumber: () => number } | number
    tax: { toNumber: () => number } | number
    total: { toNumber: () => number } | number
    currency: string
    notes: string | null
    internalNotes: string | null
    paidAt: Date | null
    cancelledAt: Date | null
    createdAt: Date
    updatedAt: Date
    deletedAt: Date | null
    createdBy: string | null
    updatedBy: string | null
  }): Invoice {
    // Converter Decimal do Prisma para number
    const toNumber = (value: { toNumber: () => number } | number): number => {
      return typeof value === 'number' ? value : value.toNumber()
    }

    return Invoice.restore({
      id: data.id,
      orgId: data.orgId,
      clientId: data.clientId,
      number: data.number,
      status: data.status,
      issueDate: data.issueDate,
      dueDate: data.dueDate,
      subtotal: new Money(toNumber(data.subtotal), data.currency),
      discount: new Money(toNumber(data.discount), data.currency),
      tax: new Money(toNumber(data.tax), data.currency),
      total: new Money(toNumber(data.total), data.currency),
      notes: data.notes,
      internalNotes: data.internalNotes,
      paidAt: data.paidAt,
      cancelledAt: data.cancelledAt,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      deletedAt: data.deletedAt,
      createdBy: data.createdBy,
      updatedBy: data.updatedBy,
    })
  }

  /**
   * Converte entidade de domínio para dados do Prisma
   */
  private toPrisma(invoice: Invoice): {
    id?: string
    orgId: string
    clientId: string
    number: string
    status: InvoiceStatus
    issueDate: Date
    dueDate: Date
    subtotal: number
    discount: number
    tax: number
    total: number
    currency: string
    notes: string | null
    internalNotes: string | null
    paidAt: Date | null
    cancelledAt: Date | null
    updatedAt: Date
    deletedAt: Date | null
    updatedBy: string | null
  } {
    return {
      ...(invoice.id && { id: invoice.id }),
      orgId: invoice.orgId,
      clientId: invoice.clientId,
      number: invoice.number,
      status: invoice.status,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      subtotal: invoice.subtotal.toNumber(),
      discount: invoice.discount.toNumber(),
      tax: invoice.tax.toNumber(),
      total: invoice.total.toNumber(),
      currency: invoice.subtotal.currency,
      notes: invoice.notes,
      internalNotes: invoice.internalNotes,
      paidAt: invoice.paidAt,
      cancelledAt: invoice.cancelledAt,
      updatedAt: invoice.updatedAt,
      deletedAt: invoice.deletedAt,
      updatedBy: invoice.updatedBy,
    }
  }
}
// @ts-nocheck
