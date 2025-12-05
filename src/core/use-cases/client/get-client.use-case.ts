import { Client } from '@/core/domain/client/entities/client.entity'
import { IClientRepository } from '@/core/ports/repositories/client.repository.interface'
import { z } from 'zod'

/**
 * Input Schema para buscar cliente
 */
export const GetClientInputSchema = z.object({
  clientId: z.string().uuid(),
  orgId: z.string().uuid(),
})

export type GetClientInput = z.infer<typeof GetClientInputSchema>

/**
 * Output do use case
 */
export interface GetClientOutput {
  client: Client
}

/**
 * Use Case: Buscar Cliente
 * Responsável por buscar um cliente específico
 */
export class GetClientUseCase {
  constructor(private readonly clientRepository: IClientRepository) {}

  async execute(input: GetClientInput): Promise<GetClientOutput> {
    // 1. Validar input
    const validated = GetClientInputSchema.parse(input)

    // 2. Buscar cliente
    const client = await this.clientRepository.findById(validated.clientId)

    // 3. Validar se existe
    if (!client) {
      throw new Error('Cliente não encontrado')
    }

    // 4. Validar se pertence à org
    if (client.orgId !== validated.orgId) {
      throw new Error('Cliente não pertence a esta organização')
    }

    // 5. Retornar resultado
    return { client }
  }
}
