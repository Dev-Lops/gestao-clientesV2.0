import { Client } from '@/domain/client/entities/client.entity'
import { ClientStatus } from '@/domain/client/value-objects/client-status.vo'
import { CNPJ } from '@/domain/client/value-objects/cnpj.vo'
import { Email } from '@/domain/client/value-objects/email.vo'
import { IClientRepository } from '@/ports/repositories/client.repository.interface'
import { PrismaClient } from '@prisma/client'

/**
 * Implementação do Repository de Clientes usando Prisma
 */
export class PrismaClientRepository implements IClientRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(client: Client): Promise<void> {
    const data = {
      id: client.id,
      name: client.name,
      email: client.email.value,
      phone: client.phone,
      cnpj: client.cnpj?.value ?? null,
      cpf: client.cpf,
      status: client.status,
      orgId: client.orgId,
      updatedAt: client.updatedAt,
      deletedAt: client.deletedAt,
    }

    await this.prisma.client.upsert({
      where: { id: client.id },
      create: {
        ...data,
        createdAt: client.createdAt,
      },
      update: data,
    })
  }

  async findById(id: string): Promise<Client | null> {
    const data = await this.prisma.client.findUnique({
      where: { id },
    })

    return data ? this.toDomain(data) : null
  }

  async findByEmail(email: string, orgId: string): Promise<Client | null> {
    const data = await this.prisma.client.findFirst({
      where: {
        email: email.toLowerCase(),
        orgId,
        deletedAt: null,
      },
    })

    return data ? this.toDomain(data) : null
  }

  async findByCNPJ(cnpj: string, orgId: string): Promise<Client | null> {
    const cleanCNPJ = cnpj.replace(/\D/g, '')
    const data = await this.prisma.client.findFirst({
      where: {
        cnpj: cleanCNPJ,
        orgId,
        deletedAt: null,
      },
    })

    return data ? this.toDomain(data) : null
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
    const page = options?.page ?? 1
    const limit = options?.limit ?? 10
    const skip = (page - 1) * limit

    const where: {
      orgId: string
      deletedAt: null
      status?: { in: string[] }
      OR?: Array<{
        name?: { contains: string; mode: 'insensitive' }
        email?: { contains: string; mode: 'insensitive' }
      }>
    } = {
      orgId,
      deletedAt: null,
    }

    if (options?.status && options.status.length > 0) {
      where.status = { in: options.status }
    }

    if (options?.search) {
      where.OR = [
        { name: { contains: options.search, mode: 'insensitive' } },
        { email: { contains: options.search, mode: 'insensitive' } },
      ]
    }

    const [data, total] = await Promise.all([
      this.prisma.client.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.client.count({ where }),
    ])

    return {
      clients: data.map((d) => this.toDomain(d)),
      total,
    }
  }

  async delete(id: string): Promise<void> {
    await this.prisma.client.update({
      where: { id },
      data: {
        status: ClientStatus.DELETED,
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
    })
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.client.count({
      where: { id, deletedAt: null },
    })
    return count > 0
  }

  /**
   * Converte dados do Prisma para entidade de domínio
   */
  private toDomain(data: {
    id: string
    name: string
    email: string
    phone: string | null
    cnpj: string | null
    cpf: string | null
    status: string
    orgId: string
    createdAt: Date
    updatedAt: Date
    deletedAt: Date | null
  }): Client {
    return Client.restore({
      id: data.id,
      name: data.name,
      email: new Email(data.email),
      phone: data.phone,
      cnpj: data.cnpj ? new CNPJ(data.cnpj) : null,
      cpf: data.cpf,
      status: data.status as ClientStatus,
      orgId: data.orgId,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      deletedAt: data.deletedAt,
    })
  }
}
