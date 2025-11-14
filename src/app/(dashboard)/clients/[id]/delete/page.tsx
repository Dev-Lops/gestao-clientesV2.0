"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface ClientDeletePageProps {
  params: Promise<{ id: string }>;
}

export default function ClientDeletePage({ params }: ClientDeletePageProps) {
  const router = useRouter();
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);

  // Precisa ser async para unwrap params
  const handleDelete = async () => {
    const { id } = await params;

    if (confirmation !== "EXCLUIR") {
      return;
    }

    setLoading(true);
    try {
      // TODO: Implementar API de exclusão
      console.log("Excluindo cliente:", id);

      // Simulação de delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      router.push("/clients");
    } catch (error) {
      console.error("Erro ao excluir cliente:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-semibold text-red-600">Zona de Perigo</h2>
        <p className="text-sm text-slate-500 mt-1">
          Ações irreversíveis que afetam permanentemente este cliente
        </p>
      </div>

      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-5 w-5" />
            Excluir Cliente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm text-slate-700">
            <p className="font-medium">
              Esta ação NÃO pode ser desfeita. Será excluído permanentemente:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Todas as informações do cliente</li>
              <li>Tarefas associadas</li>
              <li>Mídias e arquivos</li>
              <li>Histórico financeiro</li>
              <li>Relatórios e documentos</li>
              <li>Reuniões agendadas</li>
            </ul>
          </div>

          <div className="pt-4 border-t border-red-200">
            <p className="text-sm text-slate-700 mb-3">
              Para confirmar, digite{" "}
              <strong className="font-mono bg-white px-2 py-1 rounded">
                EXCLUIR
              </strong>{" "}
              no campo abaixo:
            </p>
            <Input
              type="text"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value.toUpperCase())}
              placeholder="Digite EXCLUIR"
              className="mb-4 border-red-300 focus:ring-red-500"
            />

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleDelete}
                disabled={confirmation !== "EXCLUIR" || loading}
                className="bg-red-600 hover:bg-red-700 text-white gap-2"
              >
                <Trash2 className="h-4 w-4" />
                {loading ? "Excluindo..." : "Excluir Permanentemente"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-50 border-slate-200">
        <CardContent className="pt-6">
          <h3 className="font-medium text-slate-900 mb-2">
            Alternativas à exclusão:
          </h3>
          <ul className="text-sm text-slate-600 space-y-1">
            <li>
              • Alterar o status do cliente para &quot;Encerrado&quot; ou
              &quot;Pausado&quot;
            </li>
            <li>• Arquivar o cliente (funcionalidade futura)</li>
            <li>• Exportar dados antes de excluir</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
