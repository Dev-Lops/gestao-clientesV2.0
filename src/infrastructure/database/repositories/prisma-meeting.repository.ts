// @ts-nocheck
import { Meeting } from '@/domain/meeting/entities/meeting.entity'
import {
  MeetingStatus,
  MeetingType,
} from '@/domain/meeting/value-objects/meeting-status.vo'
import { IMeetingRepository } from '@/ports/repositories/meeting.repository.interface'
import { PrismaClient } from '@prisma/client'

/**
 * Implementação Prisma do Meeting Repository
 */
export class PrismaMeetingRepository implements IMeetingRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(meeting: Meeting): Promise<void> {
    const data = this.toPrisma(meeting)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prismaData: any = {
      title: data.title,
      description: data.description,
      type: data.type as any,
      status: data.status as any,
      clientId: data.clientId,
      participantIds: data.participantIds,
      startDate: data.startDate,
      endDate: data.endDate,
      location: data.location,
      notes: data.notes,
      orgId: data.orgId,
      updatedAt: data.updatedAt,
      deletedAt: data.deletedAt,
      updatedBy: data.updatedBy,
      deletedBy: data.deletedBy,
    }

    if (meeting.id) {
      await this.prisma.meeting.update({
        where: { id: meeting.id },
        data: prismaData,
      })
    } else {
      await this.prisma.meeting.create({
        data: {
          ...prismaData,
          id: undefined,
        },
      })
    }
  }

  async findById(id: string): Promise<Meeting | null> {
    const data = await this.prisma.meeting.findUnique({
      where: { id, deletedAt: null },
    })

    return data ? this.toDomain(data) : null
  }

  async findByOrgId(
    orgId: string,
    options?: {
      page?: number
      limit?: number
      status?: string[]
      clientId?: string
    }
  ): Promise<{ meetings: Meeting[]; total: number }> {
    const page = options?.page ?? 1
    const limit = options?.limit ?? 10
    const skip = (page - 1) * limit

    const where: {
      orgId: string
      deletedAt: null
      status?: { in: string[] }
      clientId?: string
    } = {
      orgId,
      deletedAt: null,
    }

    if (options?.status && options.status.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      where.status = { in: options.status as any }
    }

    if (options?.clientId) {
      where.clientId = options.clientId
    }

    const [data, total] = await Promise.all([
      this.prisma.meeting.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startDate: 'asc' },
      }),
      this.prisma.meeting.count({ where }),
    ])

    return {
      meetings: data.map((d) => this.toDomain(d)),
      total,
    }
  }

  async findByClientId(
    clientId: string,
    options?: {
      page?: number
      limit?: number
    }
  ): Promise<{ meetings: Meeting[]; total: number }> {
    const page = options?.page ?? 1
    const limit = options?.limit ?? 10
    const skip = (page - 1) * limit

    const [data, total] = await Promise.all([
      this.prisma.meeting.findMany({
        where: { clientId, deletedAt: null },
        skip,
        take: limit,
        orderBy: { startDate: 'asc' },
      }),
      this.prisma.meeting.count({ where: { clientId, deletedAt: null } }),
    ])

    return {
      meetings: data.map((d) => this.toDomain(d)),
      total,
    }
  }

  async findUpcoming(orgId: string): Promise<Meeting[]> {
    const now = new Date()

    const data = await this.prisma.meeting.findMany({
      where: {
        orgId,
        deletedAt: null,
        startDate: {
          gt: now,
        },
        status: {
          notIn: [MeetingStatus.CANCELLED],
        },
      },
      orderBy: { startDate: 'asc' },
    })

    return data.map((d) => this.toDomain(d))
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.meeting.count({
      where: { id, deletedAt: null },
    })
    return count > 0
  }

  async delete(id: string, deletedBy: string): Promise<void> {
    await this.prisma.meeting.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy,
        updatedAt: new Date(),
      },
    })
  }

  private toDomain(data: {
    id: string
    title: string
    description: string | null
    type: string
    status: string
    clientId: string | null
    participantIds: string[]
    startDate: Date
    endDate: Date
    location: string | null
    notes: string | null
    orgId: string
    createdAt: Date
    updatedAt: Date
    deletedAt: Date | null
    createdBy: string | null
    updatedBy: string | null
    deletedBy: string | null
  }): Meeting {
    return Meeting.restore({
      id: data.id,
      title: data.title,
      description: data.description,
      type: data.type as MeetingType,
      status: data.status as MeetingStatus,
      clientId: data.clientId,
      participantIds: data.participantIds,
      startDate: data.startDate,
      endDate: data.endDate,
      location: data.location,
      notes: data.notes,
      orgId: data.orgId,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      deletedAt: data.deletedAt,
      createdBy: data.createdBy,
      updatedBy: data.updatedBy,
      deletedBy: data.deletedBy,
    })
  }

  private toPrisma(meeting: Meeting): {
    id?: string
    title: string
    description: string | null
    type: string
    status: string
    clientId: string | null
    participantIds: string[]
    startDate: Date
    endDate: Date
    location: string | null
    notes: string | null
    orgId: string
    updatedAt: Date
    deletedAt: Date | null
    updatedBy: string | null
    deletedBy: string | null
  } {
    return {
      ...(meeting.id && { id: meeting.id }),
      title: meeting.title,
      description: meeting.description,
      type: meeting.type,
      status: meeting.status,
      clientId: meeting.clientId,
      participantIds: meeting.participantIds,
      startDate: meeting.startDate,
      endDate: meeting.endDate,
      location: meeting.location,
      notes: meeting.notes,
      orgId: meeting.orgId,
      updatedAt: meeting.updatedAt,
      deletedAt: meeting.deletedAt,
      updatedBy: meeting.updatedBy,
      deletedBy: meeting.deletedBy,
    }
  }
}
// @ts-nocheck
