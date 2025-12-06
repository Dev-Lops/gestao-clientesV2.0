import { Task } from '@/domain/task/entities/task.entity'
import { TaskPriority } from '@/domain/task/value-objects/task-type.vo'
import { TaskAssignmentService } from '@/domain/task/services/task-assignment.service'
import { ITaskRepository } from '@/ports/repositories/task.repository.interface'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

export const CreateTaskInputSchema = z.object({
  title: z.string().min(3).max(255),
  orgId: z.string().uuid(),
  priority: z.nativeEnum(TaskPriority),
  description: z.string().optional(),
  clientId: z.string().uuid().optional(),
  assignee: z.string().uuid().optional(),
  dueDate: z.date().optional(),
  createdBy: z.string().uuid().optional(),
  autoAssign: z.boolean().optional().default(true), // Habilita atribuição automática
})

export type CreateTaskInput = z.infer<typeof CreateTaskInputSchema>

export interface CreateTaskOutput {
  taskId: string
  assignee: string | null
}

/**
 * Use Case: Criar Tarefa com Atribuição Automática
 * Se não houver assignee e autoAssign=true, atribui automaticamente ao owner ou staff
 */
export class CreateTaskUseCase {
  private assignmentService: TaskAssignmentService

  constructor(
    private readonly repository: ITaskRepository,
    prisma: PrismaClient
  ) {
    this.assignmentService = new TaskAssignmentService(prisma)
  }

  async execute(input: CreateTaskInput): Promise<CreateTaskOutput> {
    const validated = CreateTaskInputSchema.parse(input)

    // Se não houver assignee e autoAssign estiver habilitado, busca o responsável
    let assignee: string | null = validated.assignee ?? null
    if (!assignee && validated.autoAssign) {
      assignee = await this.assignmentService.getResponsibleUser(
        validated.orgId
      )
    }

    const task = Task.create({
      title: validated.title,
      orgId: validated.orgId,
      priority: validated.priority,
      description: validated.description,
      clientId: validated.clientId,
      assignee: assignee ?? undefined,
      dueDate: validated.dueDate,
      createdBy: validated.createdBy,
    })

    await this.repository.save(task)

    return { taskId: task.id, assignee }
  }
}
