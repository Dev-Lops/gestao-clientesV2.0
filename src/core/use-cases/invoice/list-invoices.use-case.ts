import { Invoice } from '@/core/domain/invoice/entities/invoice.entity'
import { InvoiceStatus } from '@/core/domain/invoice/value-objects/invoice-status.vo'
import { IInvoiceRepository } from '@/ports/repositories/invoice.repository.interface'
import { z } from 'zod'

/**
 * Input Schema para listar faturas
 */
export const ListInvoicesInputSchema = z.object({
  orgId: z.string().uuid(),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(200).optional().default(50),
  status: z.array(z.nativeEnum(InvoiceStatus)).optional(),
  clientId: z.string().uuid().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
})

export type ListInvoicesInput = z.infer<typeof ListInvoicesInputSchema>

/**
 * Output do use case
 */
export interface ListInvoicesOutput {
  invoices: Invoice[]
  total: number
  page: number
  limit: number
  totalPages: number
}

/**
 * Use Case: Listar Faturas
 * Responsável por listar faturas com filtros e paginação
 */
export class ListInvoicesUseCase {
  constructor(private readonly invoiceRepository: IInvoiceRepository) {}

  async execute(input: ListInvoicesInput): Promise<ListInvoicesOutput> {
    // 1. Validar input
    const validated = ListInvoicesInputSchema.parse(input)

    // 2. Buscar faturas
    const { invoices, total } = await this.invoiceRepository.findByOrgId(
      validated.orgId,
      {
        page: validated.page,
        limit: validated.limit,
        status: validated.status,
        clientId: validated.clientId,
        startDate: validated.startDate,
        endDate: validated.endDate,
      }
    )

    // 3. Atualizar status de faturas vencidas
    for (const invoice of invoices) {
      invoice.checkAndUpdateOverdue()
    }

    // 4. Calcular total de páginas
    const totalPages = Math.ceil(total / validated.limit)

    // 5. Retornar resultado
    return {
      invoices,
      total,
      page: validated.page,
      limit: validated.limit,
      totalPages,
    }
  }
}
