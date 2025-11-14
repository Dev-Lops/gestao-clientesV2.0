import { MediaManager } from "@/features/clients/components/MediaManager";

interface ClientMediaPageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientMediaPage({
  params,
}: ClientMediaPageProps) {
  const { id } = await params;
  return <MediaManager clientId={id} />;
}
