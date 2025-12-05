import { IClientRepository } from '@/core/ports/repositories/client.repository.interface'
import { z } from 'zod'

/**
 * Input Schema para deletar cliente
 */
export const DeleteClientInputSchema = z.object({
  clientId: z.string().uuid(),
  orgId: z.string().uuid(),
})

export type DeleteClientInput = z.infer<typeof DeleteClientInputSchema>

/**
 * Output do use case
 */
export interface DeleteClientOutput {
  clientId: string
}

/**
 * Use Case: Deletar Cliente
 * Responsável por fazer soft delete de um cliente
 */
export class DeleteClientUseCase {
  constructor(private readonly clientRepository: IClientRepository) {}

  async execute(input: DeleteClientInput): Promise<DeleteClientOutput> {
    // 1. Validar input
    const validated = DeleteClientInputSchema.parse(input)

    // 2. Buscar cliente existente
    const client = await this.clientRepository.findById(validated.clientId)
    if (!client) {
      throw new Error('Cliente não encontrado')
    }

    // 3. Validar se pertence à org
    if (client.orgId !== validated.orgId) {
      throw new Error('Cliente não pertence a esta organização')
    }

    // 4. Validar se pode ser deletado
    if (!client.canBeDeleted()) {
      throw new Error('Cliente não pode ser deletado')
    }

    // 5. Fazer soft delete
    client.softDelete()

    // 6. Persistir alterações
    await this.clientRepository.save(client)

    // 7. Retornar resultado
    return {
      clientId: client.id,
    }
  }
}
