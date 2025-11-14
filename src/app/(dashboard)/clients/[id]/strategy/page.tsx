import { StrategyManager } from "@/features/clients/components/StrategyManager";

interface ClientStrategyPageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientStrategyPage({
  params,
}: ClientStrategyPageProps) {
  const { id } = await params;

  return <StrategyManager clientId={id} />;
}
