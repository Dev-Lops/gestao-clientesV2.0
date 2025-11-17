import BrandingPage from "@/components/branding/BrandingPage";
import { prisma } from "@/lib/prisma";
import { getClientById } from "@/services/repositories/clients";

interface ClientBrandingPageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientBrandingPage({ params }: ClientBrandingPageProps) {
  const { id } = await params;
  const client = await getClientById(id as string);
  if (!client) return null;

  // load existing brandings (latest first)
  const brandings = await prisma.branding.findMany({ where: { clientId: id as string }, orderBy: { createdAt: 'desc' }, take: 1 });
  const initial = brandings && brandings.length ? brandings[0] : null;
  // stringify/parse to ensure Dates become serializable strings
  const initialSerializable = initial ? JSON.parse(JSON.stringify(initial)) : null;

  return <BrandingPage clientId={id as string} clientName={client.name} initialBranding={initialSerializable} />;
}
