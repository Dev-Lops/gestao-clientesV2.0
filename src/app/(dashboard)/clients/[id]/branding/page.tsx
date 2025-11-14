import { BrandingManager } from "@/features/clients/components/BrandingManager";

interface ClientBrandingPageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientBrandingPage({
  params,
}: ClientBrandingPageProps) {
  const { id } = await params;
  return <BrandingManager clientId={id} />;
}
