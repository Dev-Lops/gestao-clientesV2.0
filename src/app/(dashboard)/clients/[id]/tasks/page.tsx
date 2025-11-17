import { TasksPanel } from "@/features/tasks/components/TasksPanel";

interface ClientTasksPageProps { params: Promise<{ id: string }> }

// Server component wrapper awaiting dynamic route params (Next.js streams params as Promise)
export default async function ClientTasksPage({ params }: ClientTasksPageProps) {
  const { id } = await params;
  return <TasksPanel clientId={id} />;
}
