import { getTasksBoardData } from '@/modules/tasks/actions/getTasksBoardData'
import { updateTaskStatus } from '@/modules/tasks/actions/updateTaskStatus'
import type { Metadata } from 'next'
import TasksClient from './tasks.client'

export const metadata: Metadata = {
  title: 'Kanban de Tarefas',
  description: 'Organize e acompanhe tarefas por status',
  alternates: { canonical: '/tasks' },
}

export default async function TasksPage() {
  const data = await getTasksBoardData()
  return <TasksClient initialTasks={data.tasks} updateTaskStatusAction={updateTaskStatus} />
}
