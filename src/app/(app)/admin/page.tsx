import AppShell from "@/components/layout/AppShell";
import { Card } from "@/components/ui/card";
import { getSessionProfile } from "@/services/auth/session";
import { redirect } from "next/navigation";
import MembersAdminPage from "./members/page";

export default async function AdminPage() {
  const { user, orgId, role } = await getSessionProfile();

  if (!user || !orgId) {
    redirect("/login");
  }

  if (role !== "OWNER") {
    return (
      <AppShell>
        <Card className="p-8 text-center max-w-md mx-auto">
          <div className="space-y-4">
            <div className="text-5xl">🔒</div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
              Acesso Restrito
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              Apenas proprietários da organização podem acessar esta página.
            </p>
          </div>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <MembersAdminPage />
    </AppShell>
  );
}
