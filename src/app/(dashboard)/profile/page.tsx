import AppShell from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageLayout } from "@/components/layout/PageLayout";
import { Card } from "@/components/ui/card";
import { getSessionProfile } from "@/services/auth/session";
import { getSessionOrg } from "@/services/org/session";
import { User as UserIcon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const { user, role } = await getSessionProfile();
  if (!user) redirect("/login");

  // Função de logout (simples, pode ser aprimorada)
  async function handleLogout() {
    'use server';
    redirect("/logout");
  }

  // Busca dados da organização diretamente do serviço server-side
  const org = await getSessionOrg();

  return (
    <AppShell>
      <PageLayout centered={false} maxWidth="2xl" className="p-2 sm:p-4 md:p-6 lg:p-8 w-full">
        <PageHeader
          title="Meu Perfil"
          description="Veja e edite suas informações pessoais."
          icon={UserIcon}
          iconColor="bg-blue-600"
        />

        <Card className="p-4 sm:p-8 md:p-10 shadow-lg rounded-xl w-full">
          <div className="flex flex-col md:flex-row items-center gap-4 sm:gap-6 md:gap-8 w-full">
            {/* Avatar com ícone */}
            <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl sm:text-3xl font-bold shadow-md" aria-label="Avatar do usuário">
              {user.name ? user.name.slice(0, 2).toUpperCase() : user.email.slice(0, 2).toUpperCase()}
              <span className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow">
                <UserIcon className="h-5 w-5 text-blue-600" aria-hidden="true" />
              </span>
            </div>
            {/* Informações do usuário */}
            <div className="flex-1 w-full min-w-0">
              <div className="text-lg sm:text-2xl font-semibold text-slate-900 dark:text-white mb-1 truncate">
                {user.name ?? "Sem nome"}
              </div>
              <div className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mb-2 truncate">{user.email}</div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 font-medium" aria-label="Papel do usuário">
                  {role === "OWNER"
                    ? "Administrador"
                    : role === "STAFF"
                      ? "Equipe"
                      : role === "CLIENT"
                        ? "Cliente"
                        : "Usuário"}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 sm:gap-3 mt-2">
                <Link
                  href="/settings"
                  className="text-sm text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
                  aria-label="Editar perfil"
                >
                  Editar perfil
                </Link>
                {role === "OWNER" && (
                  <Link
                    href="/settings#org"
                    className="text-sm text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
                    aria-label="Editar organização"
                  >
                    Editar organização
                  </Link>
                )}
                <form action={handleLogout} className="inline">
                  <button
                    type="submit"
                    className="text-sm text-red-600 hover:underline focus:outline-none focus:ring-2 focus:ring-red-400 rounded ml-2"
                    aria-label="Sair da conta"
                  >
                    Sair
                  </button>
                </form>
              </div>
            </div>
          </div>
        </Card>

        {/* Card de informações da organização */}
        {org && (
          <Card className="mt-4 sm:mt-8 p-4 sm:p-8 md:p-10 shadow rounded-xl w-full">
            <div className="mb-2 sm:mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Organização</h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Informações da empresa vinculada à sua conta.</p>
            </div>
            <div className="grid gap-2 sm:gap-3 grid-cols-1 md:grid-cols-2">
              <div>
                <span className="font-medium">Nome:</span> {org.name || "-"}
              </div>
              <div>
                <span className="font-medium">CNPJ:</span> {org.cnpj || "-"}
              </div>
              <div>
                <span className="font-medium">Telefone:</span> {org.phone || "-"}
              </div>
              <div>
                <span className="font-medium">Website:</span> {org.website || "-"}
              </div>
              <div className="md:col-span-2">
                <span className="font-medium">Endereço:</span> {org.addressLine1 || "-"} {org.addressLine2 ? `, ${org.addressLine2}` : ""}
              </div>
              <div>
                <span className="font-medium">Cidade:</span> {org.city || "-"}
              </div>
              <div>
                <span className="font-medium">Estado:</span> {org.state || "-"}
              </div>
              <div>
                <span className="font-medium">CEP:</span> {org.postalCode || "-"}
              </div>
              <div>
                <span className="font-medium">País:</span> {org.country || "-"}
              </div>
              {org.description && (
                <div className="md:col-span-2">
                  <span className="font-medium">Descrição:</span> {org.description}
                </div>
              )}
            </div>
          </Card>
        )}
      </PageLayout>
    </AppShell>
  );
}
