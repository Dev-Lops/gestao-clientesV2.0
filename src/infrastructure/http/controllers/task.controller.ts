import { PrismaTaskRepository } from '@/infrastructure/database/repositories/prisma-task.repository'
import {
  CreateTaskInput,
  CreateTaskUseCase,
} from '@/use-cases/task/create-task.use-case'
import { DeleteTaskUseCase } from '@/use-cases/task/delete-task.use-case'
import { GetTaskUseCase } from '@/use-cases/task/get-task.use-case'
import {
  ListTasksInput,
  ListTasksUseCase,
} from '@/use-cases/task/list-tasks.use-case'
import {
  UpdateTaskInput,
  UpdateTaskUseCase,
} from '@/use-cases/task/update-task.use-case'
import { PrismaClient } from '@prisma/client'

/**
 * Task Controller
 * Coordena requisições HTTP para tarefas
 */
export class TaskController {
  private repository: PrismaTaskRepository
  private createUseCase: CreateTaskUseCase
  private listUseCase: ListTasksUseCase
  private getUseCase: GetTaskUseCase
  private updateUseCase: UpdateTaskUseCase
  private deleteUseCase: DeleteTaskUseCase

  constructor(private prisma: PrismaClient) {
    this.repository = new PrismaTaskRepository(prisma)
    // Passa prisma para CreateTaskUseCase para ativar atribuição automática
    this.createUseCase = new CreateTaskUseCase(this.repository, prisma)
    this.listUseCase = new ListTasksUseCase(this.repository)
    this.getUseCase = new GetTaskUseCase(this.repository)
    this.updateUseCase = new UpdateTaskUseCase(this.repository)
    this.deleteUseCase = new DeleteTaskUseCase(this.repository)
  }

  async create(input: CreateTaskInput) {
    return this.createUseCase.execute(input)
  }

  async list(input: ListTasksInput) {
    return this.listUseCase.execute(input)
  }

  async get(input: { taskId: string }) {
    return this.getUseCase.execute(input)
  }

  async update(input: UpdateTaskInput) {
    return this.updateUseCase.execute(input)
  }

  async delete(input: { taskId: string }) {
    return this.deleteUseCase.execute(input)
  }
}
