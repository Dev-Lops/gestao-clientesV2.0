import AppShell from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageLayout } from "@/components/layout/PageLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card } from "@/components/ui/card";
import { getSessionProfile } from "@/services/auth/session";
import { User as UserIcon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const { user, role } = await getSessionProfile();
  if (!user) redirect("/login");

  return (
    <ProtectedRoute>
      <AppShell>
        <PageLayout centered={false} maxWidth="3xl">
          <PageHeader
            title="Meu Perfil"
            description="Veja e edite suas informações pessoais."
            icon={UserIcon}
            iconColor="bg-blue-600"
          />

          <Card className="p-8">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-lg font-semibold">
                {(user.name ?? user.email).slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="text-lg font-semibold text-slate-900 dark:text-white">
                  {user.name ?? "Sem nome"}
                </div>
                <div className="text-sm text-slate-500">{user.email}</div>
                <div className="mt-2 flex gap-4">
                  <Link
                    href="/settings"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Editar perfil
                  </Link>
                  {role === "OWNER" && (
                    <Link
                      href="/settings#org"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Editar organização
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </PageLayout>
      </AppShell>
    </ProtectedRoute>
  );
}
