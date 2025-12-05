import { Client } from '@/domain/client/entities/client.entity'
import { ClientStatus } from '@/domain/client/value-objects/client-status.vo'
import { CNPJ } from '@/domain/client/value-objects/cnpj.vo'
import { Email } from '@/domain/client/value-objects/email.vo'
import { IClientRepository } from '@/ports/repositories/client.repository.interface'
import { z } from 'zod'

/**
 * Input Schema para criar cliente
 */
export const CreateClientInputSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional().nullable(),
  cnpj: z.string().optional().nullable(),
  cpf: z.string().optional().nullable(),
  orgId: z.string().uuid('OrgId inválido'),
})

export type CreateClientInput = z.infer<typeof CreateClientInputSchema>

/**
 * Output do use case
 */
export interface CreateClientOutput {
  clientId: string
}

/**
 * Use Case: Criar Cliente
 * Responsável por criar um novo cliente no sistema
 */
export class CreateClientUseCase {
  constructor(private readonly clientRepository: IClientRepository) {}

  async execute(input: CreateClientInput): Promise<CreateClientOutput> {
    // 1. Validar input
    const validatedInput = CreateClientInputSchema.parse(input)

    // 2. Verificar duplicidade de email
    const existingEmail = await this.clientRepository.findByEmail(
      validatedInput.email,
      validatedInput.orgId
    )
    if (existingEmail) {
      throw new Error('Já existe um cliente com este email')
    }

    // 3. Verificar duplicidade de CNPJ (se fornecido)
    if (validatedInput.cnpj) {
      const existingCNPJ = await this.clientRepository.findByCNPJ(
        validatedInput.cnpj,
        validatedInput.orgId
      )
      if (existingCNPJ) {
        throw new Error('Já existe um cliente com este CNPJ')
      }
    }

    // 4. Criar entidade Cliente
    const client = Client.create({
      id: crypto.randomUUID(),
      name: validatedInput.name,
      email: new Email(validatedInput.email),
      phone: validatedInput.phone,
      cnpj: validatedInput.cnpj ? new CNPJ(validatedInput.cnpj) : null,
      cpf: validatedInput.cpf,
      status: ClientStatus.ACTIVE,
      orgId: validatedInput.orgId,
    })

    // 5. Persistir
    await this.clientRepository.save(client)

    // 6. Retornar resultado
    return {
      clientId: client.id,
    }
  }
}
