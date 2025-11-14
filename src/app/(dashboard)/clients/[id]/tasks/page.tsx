import { TasksManager } from "@/features/clients/components/TasksManager";

interface ClientTasksPageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientTasksPage({
  params,
}: ClientTasksPageProps) {
  const { id } = await params;
  return <TasksManager clientId={id} />;
}
