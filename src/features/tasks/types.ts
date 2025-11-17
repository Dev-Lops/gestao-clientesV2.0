export type TaskStatus = 'todo' | 'in-progress' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high'

export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  assignee?: string
  dueDate?: string // ISO (yyyy-mm-dd) for UI form
  createdAt: Date
}

export interface TaskStats {
  total: number
  todo: number
  doing: number
  done: number
}
