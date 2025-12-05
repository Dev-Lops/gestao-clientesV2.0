import { Client } from '@/domain/client/entities/client.entity'

/**
 * Interface do Repository de Clientes
 * Define o contrato para persistência de clientes
 */

export interface IClientRepository {
  /**
   * Salva um cliente (create ou update)
   */
  save(client: Client): Promise<void>

  /**
   * Busca um cliente por ID
   */
  findById(id: string): Promise<Client | null>

  /**
   * Busca um cliente por email
   */
  findByEmail(email: string, orgId: string): Promise<Client | null>

  /**
   * Busca um cliente por CNPJ
   */
  findByCNPJ(cnpj: string, orgId: string): Promise<Client | null>

  /**
   * Lista clientes de uma organização
   */
  findByOrgId(
    orgId: string,
    options?: {
      page?: number
      limit?: number
      status?: string[]
      search?: string
    }
  ): Promise<{ clients: Client[]; total: number }>

  /**
   * Deleta um cliente (soft delete)
   */
  delete(id: string): Promise<void>

  /**
   * Verifica se um cliente existe
   */
  exists(id: string): Promise<boolean>
}
