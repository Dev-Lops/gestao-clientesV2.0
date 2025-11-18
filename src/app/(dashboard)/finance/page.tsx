import AppShell from "@/components/layout/AppShell";
import { PageLayout } from "@/components/layout/PageLayout";
import { FinanceManagerGlobal } from "@/features/finance/components/FinanceManagerGlobalLazy";
import { can, type AppRole } from "@/lib/permissions";
import { getSessionProfile } from "@/services/auth/session";
import { redirect } from "next/navigation";

export default async function FinancePage() {
  const { user, orgId, role } = await getSessionProfile();
  if (!user) redirect("/login");
  if (!orgId) redirect("/");
  if (!role || !can(role as unknown as AppRole, "read", "finance"))
    redirect("/");

  return (
    <AppShell>
      <PageLayout centered={false}>
        <FinanceManagerGlobal orgId={orgId} />
      </PageLayout>
    </AppShell>
  );
}
