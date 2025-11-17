/**
 * Lógica de domínio para cálculo de importância/urgência de tarefas
 */

export interface TaskForUrgency {
  id: string
  title: string
  status: string
  priority: string
  dueDate: Date | null
  description: string | null
  createdAt: Date
}

export interface UrgentTask extends TaskForUrgency {
  urgencyScore: number
}

/**
 * Calcula score de urgência baseado em prioridade e prazo
 * Score mais alto = mais urgente
 */
export function computeUrgencyScore(
  task: TaskForUrgency,
  now: Date = new Date()
): number {
  // Base score pela prioridade
  let score = 0
  if (task.priority === 'high') score += 3
  else if (task.priority === 'medium') score += 2
  else score += 1

  // Adiciona peso pelo prazo
  if (task.dueDate) {
    const diffDays =
      (task.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)

    if (diffDays <= 0)
      score += 4 // Atrasado
    else if (diffDays <= 1)
      score += 3 // Hoje ou amanhã
    else if (diffDays <= 3)
      score += 2 // Próximos 3 dias
    else if (diffDays <= 7) score += 1 // Próxima semana
  }

  return score
}

/**
 * Filtra e ordena tarefas urgentes
 */
export function getUrgentTasks(
  tasks: TaskForUrgency[],
  threshold: number = 5,
  limit: number = 20,
  now: Date = new Date()
): UrgentTask[] {
  const completedStatuses = ['done', 'completed']

  return tasks
    .filter((t) => !completedStatuses.includes(t.status))
    .map((t) => ({
      ...t,
      urgencyScore: computeUrgencyScore(t, now),
    }))
    .filter((t) => t.urgencyScore >= threshold)
    .sort((a, b) => b.urgencyScore - a.urgencyScore)
    .slice(0, limit)
}

/**
 * Calcula estatísticas de tarefas
 */
export function computeTaskStats(
  tasks: TaskForUrgency[],
  now: Date = new Date()
) {
  const completedStatuses = ['done', 'completed']
  const inProgressStatuses = ['in-progress', 'in_progress']

  return {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === 'todo').length,
    inProgress: tasks.filter((t) => inProgressStatuses.includes(t.status))
      .length,
    done: tasks.filter((t) => completedStatuses.includes(t.status)).length,
    overdue: tasks.filter(
      (t) =>
        t.dueDate && t.dueDate < now && !completedStatuses.includes(t.status)
    ).length,
  }
}
