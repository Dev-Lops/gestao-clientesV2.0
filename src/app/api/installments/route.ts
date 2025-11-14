import { prisma } from "@/lib/prisma";
import { getSessionProfile } from "@/services/auth/session";
import { NextRequest, NextResponse } from "next/server";

// GET /api/installments - List installments due this month for the organization
export async function GET() {
  try {
    const { orgId, role } = await getSessionProfile();
    if (!orgId || !role) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    const rows = await prisma.installment.findMany({
      where: {
        client: { orgId },
        dueDate: { gte: startOfMonth, lte: endOfMonth },
        NOT: { status: "CONFIRMED" },
      },
      orderBy: { dueDate: "asc" },
      include: {
        client: { select: { id: true, name: true } },
      },
    });

    const data = rows.map((r) => ({
      id: r.id,
      number: r.number,
      amount: r.amount,
      dueDate: r.dueDate.toISOString(),
      status: r.status,
      clientId: r.clientId,
      client: r.client,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error fetching installments:", error);
    return NextResponse.json(
      { error: "Erro ao buscar parcelas" },
      { status: 500 },
    );
  }
}

// PATCH /api/installments?id=<installmentId> - Confirm payment and create a finance income
export async function PATCH(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const installmentId = searchParams.get("id");
    if (!installmentId) {
      return NextResponse.json(
        { error: "ID da parcela não fornecido" },
        { status: 400 },
      );
    }

    const { orgId, role } = await getSessionProfile();
    if (!orgId || !role) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const inst = await prisma.installment.findUnique({
      where: { id: installmentId },
      include: { client: true },
    });
    if (!inst || inst.client.orgId !== orgId) {
      return NextResponse.json(
        { error: "Parcela não encontrada" },
        { status: 404 },
      );
    }

    // Already confirmed
    if (inst.status === "CONFIRMED") {
      return NextResponse.json({ ok: true });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.installment.update({
        where: { id: inst.id },
        data: { status: "CONFIRMED", paidAt: new Date() },
      });

      await tx.finance.create({
        data: {
          orgId,
          clientId: inst.clientId,
          type: "income",
          amount: inst.amount,
          description: `Parcela ${inst.number} - ${inst.client.name}`,
          category: "Parcelas",
          date: new Date(),
        },
      });

      return u;
    });

    return NextResponse.json({ id: updated.id });
  } catch (error) {
    console.error("Error confirming installment:", error);
    return NextResponse.json(
      { error: "Erro ao confirmar parcela" },
      { status: 500 },
    );
  }
}
