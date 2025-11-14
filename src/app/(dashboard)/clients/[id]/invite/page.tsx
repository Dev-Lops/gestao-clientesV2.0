import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, UserPlus } from "lucide-react";

interface ClientInvitePageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientInvitePage({
  params,
}: ClientInvitePageProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id } = await params;
  // TODO: Implementar envio de convites usando id

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
            <form className="space-y-4">
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
