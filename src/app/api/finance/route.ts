import { can, type AppRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getSessionProfile } from "@/services/auth/session";
import { NextRequest, NextResponse } from "next/server";

// GET /api/finance - List all finance records for the organization
export async function GET() {
  try {
    const { orgId, role } = await getSessionProfile();

    if (!orgId || !role) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    if (!can(role as unknown as AppRole, "read", "finance")) {
      return NextResponse.json({ error: "Proibido" }, { status: 403 });
    }

    const finances = await prisma.finance.findMany({
      where: {
        orgId,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(finances);
  } catch (error) {
    console.error("Error fetching finances:", error);
    return NextResponse.json(
      { error: "Erro ao buscar finanças" },
      { status: 500 },
    );
  }
}

// POST /api/finance - Create finance record
export async function POST(req: NextRequest) {
  try {
    const { orgId, role } = await getSessionProfile();

    if (!orgId || !role) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    if (!can(role as unknown as AppRole, "create", "finance")) {
      return NextResponse.json({ error: "Proibido" }, { status: 403 });
    }

    const body = await req.json();
    const { type, amount, description, category, date, clientId } = body;

    if (!type || !amount) {
      return NextResponse.json(
        { error: "Campos obrigatórios faltando" },
        { status: 400 },
      );
    }

    // If clientId is provided, verify it belongs to the org
    if (clientId) {
      const client = await prisma.client.findUnique({
        where: { id: clientId },
        select: { orgId: true },
      });

      if (!client || client.orgId !== orgId) {
        return NextResponse.json(
          { error: "Cliente não encontrado" },
          { status: 404 },
        );
      }
    }

    const finance = await prisma.finance.create({
      data: {
        orgId,
        clientId: clientId ?? null,
        type,
        amount: typeof amount === "string" ? parseFloat(amount) : amount,
        description,
        category,
        date: date ? new Date(date) : new Date(),
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(finance, { status: 201 });
  } catch (error) {
    console.error("Error creating finance:", error);
    return NextResponse.json(
      { error: "Erro ao criar finanças" },
      { status: 500 },
    );
  }
}

// PATCH /api/finance?id=<financeId> - Update finance record
export async function PATCH(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const financeId = searchParams.get("id");

    if (!financeId) {
      return NextResponse.json(
        { error: "ID da transação não fornecido" },
        { status: 400 },
      );
    }

    const { orgId, role } = await getSessionProfile();

    if (!orgId || !role) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    if (!can(role as unknown as AppRole, "update", "finance")) {
      return NextResponse.json({ error: "Proibido" }, { status: 403 });
    }

    // Verify finance belongs to org (support legacy by also checking client.orgId)
    const existingFinance = await prisma.finance.findUnique({
      where: { id: financeId },
      include: { client: { select: { orgId: true } } },
    });

    const belongsToOrg =
      !!existingFinance &&
      (existingFinance.orgId === orgId ||
        existingFinance.client?.orgId === orgId);

    if (!belongsToOrg) {
      return NextResponse.json(
        { error: "Transação não encontrada" },
        { status: 404 },
      );
    }

    const body = await req.json();
    const { type, amount, description, category, date, clientId } = body;

    // If clientId is provided, verify it belongs to the org
    if (clientId) {
      const client = await prisma.client.findUnique({
        where: { id: clientId },
        select: { orgId: true },
      });

      if (!client || client.orgId !== orgId) {
        return NextResponse.json(
          { error: "Cliente não encontrado" },
          { status: 404 },
        );
      }
    }

    const finance = await prisma.finance.update({
      where: { id: financeId },
      data: {
        ...(type !== undefined && { type }),
        ...(amount !== undefined && {
          amount: typeof amount === "string" ? parseFloat(amount) : amount,
        }),
        ...(description !== undefined && { description }),
        ...(category !== undefined && { category }),
        ...(date !== undefined && { date: new Date(date) }),
        ...(clientId !== undefined && { clientId: clientId || null }),
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(finance);
  } catch (error) {
    console.error("Error updating finance:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar finanças" },
      { status: 500 },
    );
  }
}

// DELETE /api/finance?id=<financeId> - Delete finance record
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const financeId = searchParams.get("id");

    if (!financeId) {
      return NextResponse.json(
        { error: "ID da transação não fornecido" },
        { status: 400 },
      );
    }

    const { orgId, role } = await getSessionProfile();

    if (!orgId || !role) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    if (!can(role as unknown as AppRole, "delete", "finance")) {
      return NextResponse.json({ error: "Proibido" }, { status: 403 });
    }

    // Verify finance belongs to org (support legacy by also checking client.orgId)
    const existingFinance = await prisma.finance.findUnique({
      where: { id: financeId },
      include: { client: { select: { orgId: true } } },
    });

    const belongsToOrg =
      !!existingFinance &&
      (existingFinance.orgId === orgId ||
        existingFinance.client?.orgId === orgId);

    if (!belongsToOrg) {
      return NextResponse.json(
        { error: "Transação não encontrada" },
        { status: 404 },
      );
    }

    await prisma.finance.delete({
      where: { id: financeId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting finance:", error);
    return NextResponse.json(
      { error: "Erro ao deletar finanças" },
      { status: 500 },
    );
  }
}
