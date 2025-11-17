import { z } from 'zod'

// Basic reusable status helpers
export const TaskStatusEnum = z.enum([
  'todo',
  'in-progress',
  'in_progress',
  'done',
  'completed',
  'pending',
])
export const PriorityEnum = z.enum(['low', 'medium', 'high'])

export const ClientSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().nullable(),
  createdAt: z.coerce.date(),
})

export const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: TaskStatusEnum,
  description: z.string().nullable(),
  createdAt: z.coerce.date(),
  priority: PriorityEnum,
  dueDate: z.coerce.date().nullable(),
  client: z.object({ id: z.string(), name: z.string() }),
  clientId: z.string(),
})

export const ActivitySchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.enum(['meeting', 'task']),
  date: z.coerce.date(),
  clientId: z.string(),
  clientName: z.string(),
  status: TaskStatusEnum.optional(),
})

export const UrgentTaskSchema = TaskSchema.extend({
  urgencyScore: z.number(),
})

export const ClientsHealthSchema = z.object({
  clientId: z.string(),
  clientName: z.string(),
  completionRate: z.number(),
  balance: z.number(),
  daysActive: z.number(),
  tasksTotal: z.number(),
  tasksCompleted: z.number(),
  tasksPending: z.number(),
  tasksOverdue: z.number(),
})

export const FinancialPointSchema = z.object({
  month: z.string(),
  receitas: z.number(),
  despesas: z.number(),
  saldo: z.number(),
})

export const MetricsSchema = z.object({
  totals: z.object({ clients: z.number(), tasks: z.number() }),
  mostPendingClient: z
    .object({ clientId: z.string(), pending: z.number(), name: z.string() })
    .nullable(),
  mostUrgentClient: z
    .object({ clientId: z.string(), urgent: z.number(), name: z.string() })
    .nullable(),
  urgentTasks: z.array(UrgentTaskSchema),
  taskAggByClient: z.record(
    z.string(),
    z.object({
      total: z.number(),
      pending: z.number(),
      inProgress: z.number(),
      done: z.number(),
      urgent: z.number(),
      name: z.string(),
    })
  ),
})

export const DashboardDataSchema = z.object({
  clients: z.array(ClientSummarySchema),
  tasks: z.array(TaskSchema),
  metrics: MetricsSchema.optional(),
  clientsHealth: z.array(ClientsHealthSchema).optional(),
  activities: z.array(ActivitySchema).optional(),
  financialData: z.array(FinancialPointSchema).optional(),
  user: z.object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.string(),
  }),
})

export type DashboardData = z.infer<typeof DashboardDataSchema>
