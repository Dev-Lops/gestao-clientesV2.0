import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getSessionProfile } from "@/services/auth/session";
import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, orgId, role } = await getSessionProfile();
    if (!user || !orgId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    if (!role || !can(role, "read", "strategy")) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const { id: clientId } = await params;

    const client = await prisma.client.findFirst({
      where: { id: clientId, orgId: orgId },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Cliente não encontrado" },
        { status: 404 },
      );
    }

    const strategies = await prisma.strategy.findMany({
      where: { clientId: clientId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(strategies);
  } catch (error) {
    console.error("Erro ao buscar estratégias:", error);
    return NextResponse.json(
      { error: "Erro ao buscar estratégias" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, orgId, role } = await getSessionProfile();
    if (!user || !orgId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    if (!role || !can(role, "create", "strategy")) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const { id: clientId } = await params;
    const body = await request.json();

    const client = await prisma.client.findFirst({
      where: { id: clientId, orgId: orgId },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Cliente não encontrado" },
        { status: 404 },
      );
    }

    const strategy = await prisma.strategy.create({
      data: {
        clientId: clientId,
        title: body.title,
        description: body.description,
        type: body.type,
        content: body.content,
      },
    });

    return NextResponse.json(strategy);
  } catch (error) {
    console.error("Erro ao criar estratégia:", error);
    return NextResponse.json(
      { error: "Erro ao criar estratégia" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user, orgId, role } = await getSessionProfile();
    if (!user || !orgId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    if (!role || !can(role, "delete", "strategy")) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const url = new URL(request.url);
    const strategyId = url.searchParams.get("strategyId");

    if (!strategyId) {
      return NextResponse.json({ error: "ID não fornecido" }, { status: 400 });
    }

    const strategy = await prisma.strategy.findUnique({
      where: { id: strategyId },
      include: { client: true },
    });

    if (!strategy || strategy.client.orgId !== orgId) {
      return NextResponse.json(
        { error: "Estratégia não encontrada" },
        { status: 404 },
      );
    }

    await prisma.strategy.delete({
      where: { id: strategyId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar estratégia:", error);
    return NextResponse.json(
      { error: "Erro ao deletar estratégia" },
      { status: 500 },
    );
  }
}
