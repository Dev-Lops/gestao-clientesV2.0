import { getSessionProfile } from '@/services/auth/session';
import { TasksPanel } from "@/features/tasks/components/TasksPanel";

interface ClientTasksPageProps { params: Promise<{ id: string }> }

// Server component wrapper awaiting dynamic route params (Next.js streams params as Promise)
export default async function ClientTasksPage({ params }: ClientTasksPageProps) {
  const { id } = await params;
  
  // Obter orgId da session
  const { orgId } = await getSessionProfile();
  
  return <TasksPanel clientId={id} orgId={orgId || undefined} />;
}
