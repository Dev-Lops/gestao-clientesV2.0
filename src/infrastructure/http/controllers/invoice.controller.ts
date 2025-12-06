import { InvoiceStatus } from '@/domain/invoice/value-objects/invoice-status.vo'
import { Role } from '@prisma/client'
import { authenticateRequest } from '@/infrastructure/http/middlewares/auth.middleware'
import { PrismaInvoiceRepository } from '@/infrastructure/database/repositories/prisma-invoice.repository'
import { prisma } from '@/lib/prisma'
import { CancelInvoiceUseCase } from '@/use-cases/invoice/cancel-invoice.use-case'
import { CreateInvoiceUseCase } from '@/use-cases/invoice/create-invoice.use-case'
import { ListInvoicesUseCase } from '@/use-cases/invoice/list-invoices.use-case'
import { PayInvoiceUseCase } from '@/use-cases/invoice/pay-invoice.use-case'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Controller HTTP para Invoices
 * Responsável por lidar com requisições HTTP relacionadas a faturas
 */
export class InvoiceController {
  private readonly invoiceRepository: PrismaInvoiceRepository

  constructor() {
    this.invoiceRepository = new PrismaInvoiceRepository(prisma)
  }

  /**
   * POST /api/invoices - Criar nova fatura
   */
  async create(request: NextRequest): Promise<NextResponse> {
    try {
      // 1. Autenticação
      const authResult = await authenticateRequest(request, {
        allowedRoles: [Role.OWNER, Role.STAFF],
        requireOrg: true,
      })

      if ('error' in authResult) {
        return authResult.error
      }

      const { orgId } = authResult.context

      // 2. Parse do body
      const body = await request.json()

      // 3. Converter datas de string para Date
      const input = {
        ...body,
        orgId,
        issueDate: body.issueDate ? new Date(body.issueDate) : new Date(),
        dueDate: new Date(body.dueDate),
      }

      // 4. Executar use case
      const createInvoiceUseCase = new CreateInvoiceUseCase(
        this.invoiceRepository
      )
      const result = await createInvoiceUseCase.execute(input)

      // 5. Retornar sucesso
      return NextResponse.json({ id: result.invoiceId }, { status: 201 })
    } catch (error) {
      console.error('Erro ao criar fatura:', error)

      if (error instanceof Error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }
  }

  /**
   * GET /api/invoices - Listar faturas
   */
  async list(request: NextRequest): Promise<NextResponse> {
    try {
      // 1. Autenticação
      const authResult = await authenticateRequest(request, {
        requireOrg: true,
      })

      if ('error' in authResult) {
        return authResult.error
      }

      const { orgId } = authResult.context

      // 2. Parse dos query params
      const { searchParams } = new URL(request.url)
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '50')
      const clientId = searchParams.get('clientId') || undefined
      const statusParam = searchParams.get('status')
      const startDateParam = searchParams.get('startDate')
      const endDateParam = searchParams.get('endDate')

      // Mapear strings para InvoiceStatus enum
      const status = statusParam
        ? statusParam
            .split(',')
            .map((s) => {
              const upper = s.toUpperCase()
              return upper in InvoiceStatus
                ? InvoiceStatus[upper as keyof typeof InvoiceStatus]
                : undefined
            })
            .filter((s): s is InvoiceStatus => s !== undefined)
        : undefined

      const startDate = startDateParam ? new Date(startDateParam) : undefined
      const endDate = endDateParam ? new Date(endDateParam) : undefined

      // 3. Executar use case
      const listInvoicesUseCase = new ListInvoicesUseCase(
        this.invoiceRepository
      )
      const result = await listInvoicesUseCase.execute({
        orgId,
        page,
        limit,
        status,
        clientId,
        startDate,
        endDate,
      })

      // 4. Retornar sucesso
      return NextResponse.json(result)
    } catch (error) {
      console.error('Erro ao listar faturas:', error)

      if (error instanceof Error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }
  }

  /**
   * POST /api/invoices/:id/pay - Marcar fatura como paga
   */
  async pay(request: NextRequest, invoiceId: string): Promise<NextResponse> {
    try {
      // 1. Autenticação
      const authResult = await authenticateRequest(request, {
        allowedRoles: [Role.OWNER, Role.STAFF],
        requireOrg: true,
      })

      if ('error' in authResult) {
        return authResult.error
      }

      const { orgId } = authResult.context

      // 2. Parse do body (opcional - data de pagamento)
      const body = await request.json().catch(() => ({}))
      const paidAt = body.paidAt ? new Date(body.paidAt) : undefined

      // 3. Executar use case
      const payInvoiceUseCase = new PayInvoiceUseCase(this.invoiceRepository)
      const result = await payInvoiceUseCase.execute({
        invoiceId,
        orgId,
        paidAt,
      })

      // 4. Retornar sucesso
      return NextResponse.json(result)
    } catch (error) {
      console.error('Erro ao marcar fatura como paga:', error)

      if (error instanceof Error) {
        return NextResponse.json(
          { error: error.message },
          {
            status: error.message === 'Fatura não encontrada' ? 404 : 400,
          }
        )
      }

      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }
  }

  /**
   * POST /api/invoices/:id/cancel - Cancelar fatura
   */
  async cancel(request: NextRequest, invoiceId: string): Promise<NextResponse> {
    try {
      // 1. Autenticação
      const authResult = await authenticateRequest(request, {
        allowedRoles: [Role.OWNER, Role.STAFF],
        requireOrg: true,
      })

      if ('error' in authResult) {
        return authResult.error
      }

      const { orgId } = authResult.context

      // 2. Executar use case
      const cancelInvoiceUseCase = new CancelInvoiceUseCase(
        this.invoiceRepository
      )
      const result = await cancelInvoiceUseCase.execute({
        invoiceId,
        orgId,
      })

      // 3. Retornar sucesso
      return NextResponse.json(result)
    } catch (error) {
      console.error('Erro ao cancelar fatura:', error)

      if (error instanceof Error) {
        return NextResponse.json(
          { error: error.message },
          {
            status: error.message === 'Fatura não encontrada' ? 404 : 400,
          }
        )
      }

      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }
  }
}
