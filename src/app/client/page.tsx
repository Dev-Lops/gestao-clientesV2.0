import { prisma } from "@/lib/prisma";
import { getSessionProfile } from "@/services/auth/session";
import { redirect } from "next/navigation";

export default async function ClientPage() {
  const { user, orgId, role } = await getSessionProfile();

  if (!user || !orgId) {
    redirect("/login");
  }

  // Se for CLIENT, redireciona para sua página específica
  if (role === "CLIENT") {
    const client = await prisma.client.findFirst({
      where: { orgId, clientUserId: user.id },
      select: { id: true },
    });

    if (client) {
      redirect(`/clients/${client.id}/info`);
    } else {
      // Cliente vinculado não encontrado
      redirect("/login?error=client-not-found");
    }
  }

  // OWNER/STAFF vão para lista de clientes
  redirect("/clients");
}
