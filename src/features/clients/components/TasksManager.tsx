"use client";

import { TasksPanel } from "@/features/tasks/components/TasksPanel";
import { Task } from "@/features/tasks/types";

interface TasksManagerProps { clientId: string; initialTasks?: Task[] }

export function TasksManager({ clientId, initialTasks }: TasksManagerProps) {
  return <TasksPanel clientId={clientId} initialTasks={initialTasks} />
}
