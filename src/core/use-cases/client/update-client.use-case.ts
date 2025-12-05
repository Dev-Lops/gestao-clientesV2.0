import { Email } from '@/core/domain/client/value-objects/email.vo'
import { IClientRepository } from '@/core/ports/repositories/client.repository.interface'
import { z } from 'zod'

/**
 * Input Schema para atualizar cliente
 */
export const UpdateClientInputSchema = z.object({
  clientId: z.string().uuid(),
  orgId: z.string().uuid(),
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional().nullable(),
  cnpj: z.string().optional().nullable(),
  cpf: z.string().optional().nullable(),
})

export type UpdateClientInput = z.infer<typeof UpdateClientInputSchema>

/**
 * Output do use case
 */
export interface UpdateClientOutput {
  clientId: string
}

/**
 * Use Case: Atualizar Cliente
 * Responsável por atualizar dados de um cliente
 */
export class UpdateClientUseCase {
  constructor(private readonly clientRepository: IClientRepository) {}

  async execute(input: UpdateClientInput): Promise<UpdateClientOutput> {
    // 1. Validar input
    const validated = UpdateClientInputSchema.parse(input)

    // 2. Buscar cliente existente
    const client = await this.clientRepository.findById(validated.clientId)
    if (!client) {
      throw new Error('Cliente não encontrado')
    }

    // 3. Validar se pertence à org
    if (client.orgId !== validated.orgId) {
      throw new Error('Cliente não pertence a esta organização')
    }

    // 4. Validar se pode ser atualizado
    if (!client.canBeUpdated()) {
      throw new Error('Cliente não pode ser atualizado')
    }

    // 5. Atualizar campos
    if (validated.name) {
      client.updateName(validated.name)
    }

    if (validated.email) {
      // Verificar se o novo email já está em uso
      const existingEmail = await this.clientRepository.findByEmail(
        validated.email,
        validated.orgId
      )
      if (existingEmail && existingEmail.id !== client.id) {
        throw new Error('Email já está em uso por outro cliente')
      }
      client.updateEmail(new Email(validated.email))
    }

    if (validated.phone !== undefined) {
      client.updatePhone(validated.phone)
    }

    // 6. Persistir alterações
    await this.clientRepository.save(client)

    // 7. Retornar resultado
    return {
      clientId: client.id,
    }
  }
}
