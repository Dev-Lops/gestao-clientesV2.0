import { prisma } from "@/lib/prisma";
import { getSessionProfile } from "@/services/auth/session";
import { NextResponse } from "next/server";

// Retorna convites pendentes (não expirados) para o e-mail do usuário logado
export async function GET() {
  const { user } = await getSessionProfile();
  if (!user)
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const now = new Date();
  const invites = await prisma.invite.findMany({
    where: {
      email: user.email,
      status: "PENDING",
      expiresAt: { gte: now },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: invites });
}
