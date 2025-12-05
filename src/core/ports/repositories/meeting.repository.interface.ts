import { Meeting } from '@/domain/meeting/entities/meeting.entity'

/**
 * Interface do Meeting Repository
 * Define os métodos de persistência para a entidade Meeting
 */
export interface IMeetingRepository {
  /**
   * Salva uma reunião (create ou update)
   */
  save(meeting: Meeting): Promise<void>

  /**
   * Busca uma reunião por ID
   */
  findById(id: string): Promise<Meeting | null>

  /**
   * Busca reuniões da organização
   */
  findByOrgId(
    orgId: string,
    options?: {
      page?: number
      limit?: number
      status?: string[]
      clientId?: string
    }
  ): Promise<{ meetings: Meeting[]; total: number }>

  /**
   * Busca reuniões de um cliente
   */
  findByClientId(
    clientId: string,
    options?: {
      page?: number
      limit?: number
    }
  ): Promise<{ meetings: Meeting[]; total: number }>

  /**
   * Busca reuniões futuras não canceladas
   */
  findUpcoming(orgId: string): Promise<Meeting[]>

  /**
   * Verifica se reunião existe
   */
  exists(id: string): Promise<boolean>

  /**
   * Deleta uma reunião (soft delete)
   */
  delete(id: string, deletedBy: string): Promise<void>
}
