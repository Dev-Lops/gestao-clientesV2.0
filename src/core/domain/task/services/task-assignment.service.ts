import { PrismaClient, Role } from '@prisma/client'

/**
 * Service: Task Assignment
 * Responsável por atribuir tasks automaticamente ao owner ou staff
 */
export class TaskAssignmentService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Obtém o usuário responsável pela task (owner ou staff)
   * Prioridade: Owner > Staff > null
   */
  async getResponsibleUser(orgId: string): Promise<string | null> {
    // 1. Tenta buscar o owner da organização
    const org = await this.prisma.org.findUnique({
      where: { id: orgId },
      select: { ownerId: true },
    })

    if (org?.ownerId) {
      return org.ownerId
    }

    // 2. Se não houver owner, tenta buscar um staff
    const staff = await this.prisma.member.findFirst({
      where: {
        orgId,
        role: Role.STAFF,
        isActive: true,
      },
      select: { userId: true },
      orderBy: { createdAt: 'asc' }, // Pega o primeiro staff cadastrado
    })

    return staff?.userId ?? null
  }

  /**
   * Obtém todos os usuários que podem ser atribuídos (owner e staff ativos)
   */
  async getAssignableUsers(orgId: string): Promise<string[]> {
    const org = await this.prisma.org.findUnique({
      where: { id: orgId },
      select: { ownerId: true },
    })

    const staffMembers = await this.prisma.member.findMany({
      where: {
        orgId,
        role: Role.STAFF,
        isActive: true,
      },
      select: { userId: true },
    })

    const assignableUsers: string[] = []

    if (org?.ownerId) {
      assignableUsers.push(org.ownerId)
    }

    staffMembers.forEach((member) => {
      assignableUsers.push(member.userId)
    })

    return assignableUsers
  }

  /**
   * Distribui tasks entre owner e staff de forma equilibrada
   * Útil para distribuir carga de trabalho
   */
  async getBalancedAssignee(orgId: string): Promise<string | null> {
    const assignableUsers = await this.getAssignableUsers(orgId)

    if (assignableUsers.length === 0) {
      return null
    }

    if (assignableUsers.length === 1) {
      return assignableUsers[0]
    }

    // Conta as tasks ativas atribuídas a cada usuário
    const userTaskCounts = await Promise.all(
      assignableUsers.map(async (userId) => {
        const count = await this.prisma.task.count({
          where: {
            assignee: userId,
            status: { not: 'DONE' },
            deletedAt: null,
          },
        })
        return { userId, count }
      })
    )

    // Retorna o usuário com menos tasks
    const userWithFewestTasks = userTaskCounts.reduce((prev, current) =>
      prev.count < current.count ? prev : current
    )

    return userWithFewestTasks.userId
  }
}
