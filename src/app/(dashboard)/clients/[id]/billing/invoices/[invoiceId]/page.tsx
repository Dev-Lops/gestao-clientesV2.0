




import ClientInvoiceDetail from "@/components/ClientInvoiceDetail";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getSessionProfile } from "@/services/auth/session";

interface InvoiceDetailPageProps { params: Promise<{ id: string; invoiceId: string }> }

export default async function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const { id, invoiceId } = await params;
  const { orgId, role } = await getSessionProfile();
  if (!orgId || !role) return null;
  if (!can(role, "read", "finance")) return null;

  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId }, include: { items: true, payments: true, client: true } });
  if (!invoice || invoice.orgId !== orgId || invoice.clientId !== id) return null;

  return <ClientInvoiceDetail invoice={invoice} role={role} />;
}
