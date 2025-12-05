import { Client } from '@/core/domain/client/entities/client.entity'
import { ClientStatus } from '@/core/domain/client/value-objects/client-status.vo'
import { Email } from '@/core/domain/client/value-objects/email.vo'
import { IClientRepository } from '@/core/ports/repositories/client.repository.interface'
import { CreateClientUseCase } from '@/core/use-cases/client/create-client.use-case'
import { DeleteClientUseCase } from '@/core/use-cases/client/delete-client.use-case'
import { GetClientUseCase } from '@/core/use-cases/client/get-client.use-case'
import { ListClientsUseCase } from '@/core/use-cases/client/list-clients.use-case'
import { UpdateClientUseCase } from '@/core/use-cases/client/update-client.use-case'
import { beforeEach, describe, expect, it } from 'vitest'

// UUID Generator
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// Mock Repository
class MockClientRepository implements IClientRepository {
  private clients: Map<string, Client> = new Map()

  async save(client: Client): Promise<void> {
    this.clients.set(client.id, client)
  }

  async findById(id: string): Promise<Client | null> {
    return this.clients.get(id) ?? null
  }

  async findByEmail(email: string, orgId: string): Promise<Client | null> {
    for (const client of this.clients.values()) {
      if (
        client.email.value === email &&
        client.orgId === orgId &&
        !client.isDeleted
      ) {
        return client
      }
    }
    return null
  }

  async findByCNPJ(cnpj: string, orgId: string): Promise<Client | null> {
    const cleanCNPJ = cnpj.replace(/\D/g, '')
    for (const client of this.clients.values()) {
      if (
        client.cnpj?.value === cleanCNPJ &&
        client.orgId === orgId &&
        !client.isDeleted
      ) {
        return client
      }
    }
    return null
  }

  async findByOrgId(
    orgId: string,
    options?: {
      page?: number
      limit?: number
      status?: string[]
      search?: string
    }
  ): Promise<{ clients: Client[]; total: number }> {
    let filtered = Array.from(this.clients.values()).filter(
      (c) => c.orgId === orgId && !c.isDeleted
    )

    if (options?.status) {
      filtered = filtered.filter((c) => options.status!.includes(c.status))
    }

    if (options?.search) {
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(options.search!.toLowerCase()) ||
          c.email.value.includes(options.search!)
      )
    }

    const page = options?.page ?? 1
    const limit = options?.limit ?? 10
    const start = (page - 1) * limit

    return {
      clients: filtered.slice(start, start + limit),
      total: filtered.length,
    }
  }

  async delete(id: string): Promise<void> {
    const client = this.clients.get(id)
    if (client) {
      client.softDelete()
      this.clients.set(id, client)
    }
  }

  async exists(id: string): Promise<boolean> {
    const client = this.clients.get(id)
    return client ? !client.isDeleted : false
  }

  addClient(client: Client): void {
    this.clients.set(client.id, client)
  }
}

describe('Client Use Cases', () => {
  let repository: MockClientRepository
  const orgId = generateUUID()

  beforeEach(() => {
    repository = new MockClientRepository()
  })

  describe('CreateClientUseCase', () => {
    it('should create a new client successfully', async () => {
      const useCase = new CreateClientUseCase(repository)
      const result = await useCase.execute({
        name: 'Test Company',
        email: 'test@company.com',
        phone: '+55 11 98765-4321',
        orgId,
      })

      expect(result.clientId).toBeDefined()
      const saved = await repository.findById(result.clientId)
      expect(saved?.name).toBe('Test Company')
    })

    it('should reject duplicate email', async () => {
      const useCase = new CreateClientUseCase(repository)

      await useCase.execute({
        name: 'First',
        email: 'test@test.com',
        orgId,
      })

      await expect(
        useCase.execute({
          name: 'Second',
          email: 'test@test.com',
          orgId,
        })
      ).rejects.toThrow()
    })
  })

  describe('GetClientUseCase', () => {
    it('should get a client by id', async () => {
      const useCase = new GetClientUseCase(repository)
      const clientId = generateUUID()

      const client = Client.create({
        id: clientId,
        name: 'Test Client',
        email: new Email('test@test.com'),
        orgId,
        status: ClientStatus.ACTIVE,
      })
      repository.addClient(client)

      const result = await useCase.execute({ clientId, orgId })
      expect(result.client.name).toBe('Test Client')
    })

    it('should throw error when not found', async () => {
      const useCase = new GetClientUseCase(repository)

      await expect(
        useCase.execute({ clientId: generateUUID(), orgId })
      ).rejects.toThrow()
    })
  })

  describe('ListClientsUseCase', () => {
    it('should list clients with pagination', async () => {
      const useCase = new ListClientsUseCase(repository)

      for (let i = 0; i < 5; i++) {
        const client = Client.create({
          id: generateUUID(),
          name: `Client ${i}`,
          email: new Email(`client${i}@test.com`),
          orgId,
          status: ClientStatus.ACTIVE,
        })
        repository.addClient(client)
      }

      const result = await useCase.execute({ orgId, page: 1, limit: 10 })
      expect(result.clients).toHaveLength(5)
      expect(result.total).toBe(5)
    })
  })

  describe('UpdateClientUseCase', () => {
    it('should update client successfully', async () => {
      const useCase = new UpdateClientUseCase(repository)
      const clientId = generateUUID()

      const client = Client.create({
        id: clientId,
        name: 'Old Name',
        email: new Email('test@test.com'),
        orgId,
        status: ClientStatus.ACTIVE,
      })
      repository.addClient(client)

      await useCase.execute({
        clientId,
        orgId,
        name: 'New Name',
      })

      const updated = await repository.findById(clientId)
      expect(updated?.name).toBe('New Name')
    })
  })

  describe('DeleteClientUseCase', () => {
    it('should delete a client', async () => {
      const useCase = new DeleteClientUseCase(repository)
      const clientId = generateUUID()

      const client = Client.create({
        id: clientId,
        name: 'To Delete',
        email: new Email('delete@test.com'),
        orgId,
        status: ClientStatus.ACTIVE,
      })
      repository.addClient(client)

      await useCase.execute({ clientId, orgId })

      const exists = await repository.exists(clientId)
      expect(exists).toBe(false)
    })
  })
})
