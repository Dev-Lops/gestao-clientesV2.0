import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-lg border-border">
        <CardHeader className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-linear-to-br from-red-600 to-rose-600 flex items-center justify-center shadow-md">
            <ShieldAlert className="h-5 w-5 text-white" />
          </div>
          <CardTitle>Cliente não encontrado ou sem acesso</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Não conseguimos exibir este cliente. Isso pode acontecer quando o
            cliente não existe, pertence a outra organização, ou seu usuário não
            tem permissão para acessá-lo.
          </p>
          <div className="pt-2">
            <Link href="/clients">
              <Button variant="outline" className="gap-2 rounded-full">
                <ArrowLeft className="h-4 w-4" />
                Voltar para clientes
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
