"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { can } from "@/lib/permissions";
import { Mail, ShieldX, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface ClientInvitePageProps {
  params: Promise<{ id: string }>;
}

export default function ClientInvitePage({
  params,
}: ClientInvitePageProps) {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Buscar role do usuário
    fetch("/api/session").then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        setUserRole(data.role);
      }
      setLoading(false);
    });
  }, []);

  // Verificar permissão
  const canInvite = userRole ? can(userRole as "OWNER" | "STAFF" | "CLIENT", "create", "invite") : false;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-slate-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!canInvite) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <ShieldX className="h-5 w-5" />
              Acesso Negado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-700 mb-4">
              Você não tem permissão para enviar convites. Apenas proprietários (OWNER) podem realizar esta ação.
            </p>
            <Button
              variant="outline"
              onClick={() => router.back()}
            >
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

   
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { id } = await params;
    // TODO: Implementar envio de convites usando id
    console.log("Enviando convite para cliente:", id);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">
          Convidar Usuário
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Convide um usuário para acessar a área deste cliente
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Novo Convite
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail do usuário</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="usuario@exemplo.com"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Mensagem (opcional)</Label>
                <textarea
                  id="message"
                  rows={4}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Adicione uma mensagem personalizada ao convite..."
                />
              </div>

              <Button type="submit" className="w-full gap-2">
                <UserPlus className="h-4 w-4" />
                Enviar Convite
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Convites Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-slate-500">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Nenhum convite pendente</p>
              <p className="text-sm mt-1">
                Os convites enviados aparecerão aqui
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="shrink-0">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <UserPlus className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-slate-900 mb-1">
                Como funciona?
              </h3>
              <p className="text-sm text-slate-600">
                Ao enviar o convite, o usuário receberá um e-mail com um link
                especial. Quando aceitar, ele terá acesso exclusivo à área deste
                cliente, podendo visualizar tarefas, mídias e outras informações
                relacionadas.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
