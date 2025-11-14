"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { use, useEffect, useMemo, useState } from "react";

interface InvitePayload {
  id: string;
  email: string;
  roleRequested: string;
  status: "PENDING" | "ACCEPTED" | "CANCELED" | "EXPIRED" | string;
  expiresAt: string;
  createdAt: string;
}

function StatusBadge({ status }: { status: InvitePayload["status"] }) {
  const styles =
    status === "PENDING"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : status === "ACCEPTED"
        ? "bg-blue-50 text-blue-700 border-blue-200"
        : status === "CANCELED"
          ? "bg-amber-50 text-amber-700 border-amber-200"
          : "bg-rose-50 text-rose-700 border-rose-200";
  const label =
    status === "PENDING"
      ? "Pendente"
      : status === "ACCEPTED"
        ? "Aceito"
        : status === "CANCELED"
          ? "Cancelado"
          : status === "EXPIRED"
            ? "Expirado"
            : status;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${styles}`}
    >
      {label}
    </span>
  );
}

export default function AcceptInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();
  const [invite, setInvite] = useState<InvitePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/invites/accept?token=${token}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Convite inválido");
        setInvite(json.data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao validar convite");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [token]);

  const expiresLabel = useMemo(() => {
    if (!invite?.expiresAt) return null;
    try {
      return new Date(invite.expiresAt).toLocaleString("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      });
    } catch {
      return null;
    }
  }, [invite]);

  const canAccept = invite?.status === "PENDING";

  return (
    <div className="min-h-screen w-full bg-linear-to-b from-indigo-50 via-white to-white">
      <div className="mx-auto max-w-2xl px-6 py-10">
        <div className="mb-8 flex items-center justify-center">
          <div className="flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-indigo-700">
            <div className="h-2 w-2 rounded-full bg-indigo-600" />
            <span className="text-xs font-medium tracking-wide">
              Gestão de Clientes
            </span>
          </div>
        </div>

        <Card className="shadow-xl border-slate-200">
          <CardHeader className="text-center border-b bg-slate-50">
            <CardTitle className="text-xl">Aceitar convite</CardTitle>
            <CardDescription className="mt-1">
              Revise os detalhes e continue para criar/entrar na sua conta.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 p-6">
            {loading && (
              <div className="flex items-center justify-center gap-3 text-slate-600">
                <div className="h-5 w-5 rounded-full border-2 border-t-transparent border-slate-400 animate-spin" />
                <p className="text-sm">Validando convite...</p>
              </div>
            )}

            {!loading && error && (
              <div className="rounded-md border border-rose-200 bg-rose-50 p-4 text-rose-700">
                <p className="text-sm font-medium">{error}</p>
                <p className="mt-1 text-xs text-rose-600">
                  Verifique com o administrador se o convite ainda está válido.
                </p>
              </div>
            )}

            {!loading && invite && (
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 text-sm">
                    <p className="text-slate-500">Convite para</p>
                    <p className="font-medium text-slate-900">{invite.email}</p>
                    <p className="text-slate-500">
                      Papel:{" "}
                      <span className="font-medium">
                        {invite.roleRequested}
                      </span>
                    </p>
                    {expiresLabel && (
                      <p className="text-slate-500">
                        Expira em:{" "}
                        <span className="font-medium">{expiresLabel}</span>
                      </p>
                    )}
                  </div>
                  <StatusBadge status={invite.status} />
                </div>

                {invite.status === "ACCEPTED" && (
                  <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-xs text-blue-700">
                    <p className="font-medium mb-1">✓ Convite já aceito</p>
                    <p>Entre com sua conta para acessar a organização.</p>
                  </div>
                )}
                {invite.status === "CANCELED" && (
                  <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
                    Este convite foi cancelado pelo administrador.
                  </div>
                )}
                {invite.status === "EXPIRED" && (
                  <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                    Este convite expirou. Solicite um novo convite ao
                    administrador.
                  </div>
                )}

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <Button
                    variant="outline"
                    onClick={() => router.push("/login")}
                  >
                    Entrar
                  </Button>
                  <Button
                    disabled={!canAccept}
                    onClick={() => router.push(`/login?invite=${token}`)}
                    className="px-6"
                  >
                    Aceitar convite e entrar
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-xs text-slate-500">
          Ao continuar, você concorda com os termos de uso da plataforma.
        </div>
      </div>
    </div>
  );
}
