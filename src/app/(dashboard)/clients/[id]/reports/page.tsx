import { redirect } from "next/navigation";

interface ClientReportsPageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientReportsPage({
  params,
}: ClientReportsPageProps) {
  const { id } = await params;
  redirect(`/clients/${id}/info`);
}
