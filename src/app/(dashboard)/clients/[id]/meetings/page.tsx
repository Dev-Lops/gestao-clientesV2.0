import { MeetingsManager } from "@/features/clients/components/MeetingsManager";

interface ClientMeetingsPageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientMeetingsPage({
  params,
}: ClientMeetingsPageProps) {
  const { id } = await params;

  return <MeetingsManager clientId={id} />;
}
