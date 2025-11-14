import { prisma } from "@/lib/prisma";
import { getSessionProfile } from "@/services/auth/session";
import { createClient } from "@/services/repositories/clients";
import { ClientStatus } from "@/types/client";
import type { ClientPlan, SocialChannel } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { user, orgId } = await getSessionProfile();

    if (!user || !orgId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      email,
      phone,
      status,
      plan,
      mainChannel,
      contractStart,
      contractEnd,
      paymentDay,
      contractValue,
    } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Nome é obrigatório" },
        { status: 400 },
      );
    }

    const client = await createClient({
      name: name.trim(),
      email: email?.trim(),
      phone: phone?.trim(),
      status: status as ClientStatus,
      plan: plan ? (plan as ClientPlan) : undefined,
      mainChannel: mainChannel ? (mainChannel as SocialChannel) : undefined,
      orgId,
      contractStart: contractStart ? new Date(contractStart) : undefined,
      contractEnd: contractEnd ? new Date(contractEnd) : undefined,
      paymentDay: paymentDay ? parseInt(paymentDay) : undefined,
      contractValue: contractValue ? parseFloat(contractValue) : undefined,
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar cliente:", error);
    return NextResponse.json(
      { error: "Erro ao criar cliente" },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { user, orgId, role } = await getSessionProfile();
    if (!user || !orgId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // CLIENT só vê seu próprio registro (derivado de clientUserId)
    if (role === "CLIENT") {
      // Busca o Client vinculado
      const client = await prisma.client.findFirst({
        where: { orgId, clientUserId: user.id },
      });
      if (!client) return NextResponse.json({ data: [] });
      return NextResponse.json({
        data: [
          {
            id: client.id,
            name: client.name,
            email: client.email,
          },
        ],
      });
    }

    // OWNER / STAFF: retorno reduzido quando ?lite=1, completo caso contrário
    const lite = req.nextUrl.searchParams.get("lite") === "1";
    const clients = await prisma.client.findMany({
      where: { orgId },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    if (lite) {
      return NextResponse.json({
        data: clients.map((c) => ({ id: c.id, name: c.name })),
      });
    }
    return NextResponse.json({ data: clients });
  } catch (e) {
    console.error("Erro ao listar clientes", e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
