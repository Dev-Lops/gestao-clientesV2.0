import { Client } from '@/core/domain/client/entities/client.entity'
import { ClientStatus } from '@/core/domain/client/value-objects/client-status.vo'
import { IClientRepository } from '@/core/ports/repositories/client.repository.interface'
import { z } from 'zod'

/**
 * Input Schema para listar clientes
 */
export const ListClientsInputSchema = z.object({
  orgId: z.string().uuid(),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(200).optional().default(50),
  status: z.array(z.nativeEnum(ClientStatus)).optional(),
  search: z.string().optional(),
})

export type ListClientsInput = z.infer<typeof ListClientsInputSchema>

/**
 * Output do use case
 */
export interface ListClientsOutput {
  clients: Client[]
  total: number
  page: number
  limit: number
  totalPages: number
}

/**
 * Use Case: Listar Clientes
 * Responsável por listar clientes com filtros e paginação
 */
export class ListClientsUseCase {
  constructor(private readonly clientRepository: IClientRepository) {}

  async execute(input: ListClientsInput): Promise<ListClientsOutput> {
    // 1. Validar input
    const validated = ListClientsInputSchema.parse(input)

    // 2. Buscar clientes
    const { clients, total } = await this.clientRepository.findByOrgId(
      validated.orgId,
      {
        page: validated.page,
        limit: validated.limit,
        status: validated.status?.map((s) => s.toString()),
        search: validated.search,
      }
    )

    // 3. Calcular total de páginas
    const totalPages = Math.ceil(total / validated.limit)

    // 4. Retornar resultado
    return {
      clients,
      total,
      page: validated.page,
      limit: validated.limit,
      totalPages,
    }
  }
}
