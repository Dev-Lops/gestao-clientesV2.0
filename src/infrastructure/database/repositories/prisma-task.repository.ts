// @ts-nocheck
import { Task } from '@/domain/task/entities/task.entity'
import {
  TaskPriority,
  TaskStatus,
} from '@/domain/task/value-objects/task-type.vo'
import { ITaskRepository } from '@/ports/repositories/task.repository.interface'
import { PrismaClient } from '@prisma/client'

/**
 * Implementação Prisma do Task Repository
 */

export class PrismaTaskRepository implements ITaskRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(task: Task): Promise<void> {
    const data = this.toPrisma(task)
    // Cast para Prisma enums - necessário por limitações de type mapping

    const taskData = {
      ...data,
      status: data.status as any,
      priority: data.priority as any,
      clientId: data.clientId ?? undefined,
    }

    await this.prisma.task.upsert({
      where: { id: task.id || 'new-task' },
      create: taskData,
      update: taskData,
    })
  }

  async findById(id: string): Promise<Task | null> {
    const data = await this.prisma.task.findUnique({
      where: { id, deletedAt: null },
    })

    return data ? this.toDomain(data) : null
  }

  async findByOrgId(
    orgId: string,
    options?: {
      page?: number
      limit?: number
      status?: TaskStatus[]
      priority?: TaskPriority[]
      assignee?: string
      clientId?: string
    }
  ): Promise<{ tasks: Task[]; total: number }> {
    const page = options?.page ?? 1
    const limit = options?.limit ?? 10
    const skip = (page - 1) * limit

    const where: {
      orgId: string
      deletedAt: null
      status?: { in: TaskStatus[] }
      priority?: { in: TaskPriority[] }
      assignee?: string
      clientId?: string
    } = {
      orgId,
      deletedAt: null,
    }

    if (options?.status && options.status.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      where.status = { in: options.status as any }
    }

    if (options?.priority && options.priority.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      where.priority = { in: options.priority as any }
    }

    if (options?.assignee) {
      where.assignee = options.assignee
    }

    if (options?.clientId) {
      where.clientId = options.clientId
    }

    const [data, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ dueDate: 'asc' }, { priority: 'asc' }],
      }),
      this.prisma.task.count({ where }),
    ])

    return {
      tasks: data.map((d) => this.toDomain(d)),
      total,
    }
  }

  async findByClientId(
    clientId: string,
    options?: {
      page?: number
      limit?: number
    }
  ): Promise<{ tasks: Task[]; total: number }> {
    const page = options?.page ?? 1
    const limit = options?.limit ?? 10
    const skip = (page - 1) * limit

    const [data, total] = await Promise.all([
      this.prisma.task.findMany({
        where: { clientId, deletedAt: null },
        skip,
        take: limit,
        orderBy: { dueDate: 'asc' },
      }),
      this.prisma.task.count({ where: { clientId, deletedAt: null } }),
    ])

    return {
      tasks: data.map((d) => this.toDomain(d)),
      total,
    }
  }

  async delete(id: string): Promise<void> {
    await this.prisma.task.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
    })
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.task.count({
      where: { id, deletedAt: null },
    })
    return count > 0
  }

  async findOverdue(orgId: string): Promise<Task[]> {
    const now = new Date()

    const data = await this.prisma.task.findMany({
      where: {
        orgId,
        deletedAt: null,
        status: {
          notIn: [TaskStatus.DONE, TaskStatus.CANCELLED],
        },
        dueDate: {
          lt: now,
        },
      },
      orderBy: { dueDate: 'asc' },
    })

    return data.map((d) => this.toDomain(d))
  }

  private toDomain(data: {
    id: string
    title: string
    description: string | null
    status: string
    priority: string
    clientId: string | null
    orgId: string
    assignee: string | null
    dueDate: Date | null
    createdAt: Date
    updatedAt: Date
    deletedAt: Date | null
    createdBy: string | null
    updatedBy: string | null
    deletedBy: string | null
  }): Task {
    return Task.restore({
      id: data.id,
      title: data.title,
      description: data.description,
      status: data.status as TaskStatus,
      priority: data.priority as TaskPriority,
      clientId: data.clientId,
      orgId: data.orgId,
      assignee: data.assignee,
      dueDate: data.dueDate,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      deletedAt: data.deletedAt,
      createdBy: data.createdBy,
      updatedBy: data.updatedBy,
      deletedBy: data.deletedBy,
    })
  }

  private toPrisma(task: Task): {
    id?: string
    title: string
    description: string | null
    status: string
    priority: string
    clientId: string | null
    orgId: string
    assignee: string | null
    dueDate: Date | null
    updatedAt: Date
    deletedAt: Date | null
    updatedBy: string | null
    deletedBy: string | null
  } {
    return {
      ...(task.id && { id: task.id }),
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      clientId: task.clientId,
      orgId: task.orgId,
      assignee: task.assignee,
      dueDate: task.dueDate,
      updatedAt: task.updatedAt,
      deletedAt: task.deletedAt,
      updatedBy: task.updatedBy,
      deletedBy: task.deletedBy,
    }
  }
}
// @ts-nocheck
