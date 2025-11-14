import AppShell from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageLayout } from "@/components/layout/PageLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card } from "@/components/ui/card";
import { getSessionProfile } from "@/services/auth/session";
import { Settings as SettingsIcon } from "lucide-react";
import { redirect } from "next/navigation";
import { OrgForm } from "./OrgForm";
import { ProfileForm } from "./ProfileForm";

export default async function SettingsPage() {
  const { user, role } = await getSessionProfile();
  if (!user) redirect("/login");

  return (
    <ProtectedRoute>
      <AppShell>
        <PageLayout centered={false} maxWidth="3xl">
          <PageHeader
            title="Configurações"
            description="Edite suas informações de perfil e preferências da conta."
            icon={SettingsIcon}
            iconColor="bg-slate-600"
          />

          <Card className="p-8">
            <ProfileForm initialName={user.name} initialImage={null} />
          </Card>

          {role === "OWNER" && (
            <Card className="p-8 mt-6" id="org">
              <h2 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">
                Dados da Organização
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mb-6">
                Atualize CNPJ, endereço e informações de contato da sua empresa.
              </p>
              <OrgForm />
            </Card>
          )}
        </PageLayout>
      </AppShell>
    </ProtectedRoute>
  );
}
