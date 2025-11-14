import { prisma } from "@/lib/prisma";
import { getSessionProfile } from "@/services/auth/session";
import { NextRequest, NextResponse } from "next/server";

type Params = {
  params: Promise<{ id: string }>;
};

// GET - Listar parcelas do cliente
export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const profile = await getSessionProfile();
    if (!profile) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (!profile.orgId) {
      return NextResponse.json(
        { error: "Organização não encontrada" },
        { status: 400 },
      );
    }

    const { id } = await params;

    // Verificar se o cliente pertence à org do usuário
    const client = await prisma.client.findFirst({
      where: {
        id,
        orgId: profile.orgId,
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Cliente não encontrado" },
        { status: 404 },
      );
    }

    const installments = await prisma.installment.findMany({
      where: { clientId: id },
      orderBy: { number: "asc" },
    });

    return NextResponse.json(installments);
  } catch (error) {
    console.error("Erro ao buscar parcelas:", error);
    return NextResponse.json(
      { error: "Erro ao buscar parcelas" },
      { status: 500 },
    );
  }
}

// POST - Criar parcelas para o cliente
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const profile = await getSessionProfile();
    if (!profile || profile.role !== "OWNER") {
      return NextResponse.json(
        { error: "Apenas OWNER pode criar parcelas" },
        { status: 403 },
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { installmentCount, startDate } = body;

    if (!installmentCount || !startDate) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    if (!profile.orgId) {
      return NextResponse.json(
        { error: "Organização não encontrada" },
        { status: 400 },
      );
    }

    // Verificar se o cliente pertence à org do usuário
    const client = await prisma.client.findFirst({
      where: {
        id,
        orgId: profile.orgId,
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Cliente não encontrado" },
        { status: 404 },
      );
    }

    // Verificar se cliente tem contractValue definido
    if (!client.contractValue) {
      return NextResponse.json(
        { error: "Cliente não possui valor de contrato definido" },
        { status: 400 },
      );
    }

    // Calcular valor de cada parcela baseado no contractValue
    const installmentValue = client.contractValue / installmentCount;

    // Atualizar cliente para modo parcelado
    await prisma.client.update({
      where: { id },
      data: {
        isInstallment: true,
        installmentCount,
        installmentValue,
      },
    });

    // Criar as parcelas
    const installments = [];
    const start = new Date(startDate);

    for (let i = 1; i <= installmentCount; i++) {
      const dueDate = new Date(start);
      dueDate.setMonth(start.getMonth() + (i - 1));

      installments.push({
        clientId: id,
        number: i,
        amount: installmentValue,
        dueDate,
        status: "PENDING" as const,
      });
    }

    const created = await prisma.installment.createMany({
      data: installments,
    });

    return NextResponse.json({
      message: `${created.count} parcelas criadas com sucesso`,
      count: created.count,
    });
  } catch (error) {
    console.error("Erro ao criar parcelas:", error);
    return NextResponse.json(
      { error: "Erro ao criar parcelas" },
      { status: 500 },
    );
  }
}

// PATCH - Atualizar status de uma parcela
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const profile = await getSessionProfile();
    if (!profile || profile.role !== "OWNER") {
      return NextResponse.json(
        { error: "Apenas OWNER pode atualizar parcelas" },
        { status: 403 },
      );
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const installmentId = searchParams.get("installmentId");

    if (!installmentId) {
      return NextResponse.json(
        { error: "ID da parcela não fornecido" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { status, paidAt, notes } = body;

    if (!profile.orgId) {
      return NextResponse.json(
        { error: "Organização não encontrada" },
        { status: 400 },
      );
    }

    // Verificar se a parcela pertence ao cliente da org
    const installment = await prisma.installment.findFirst({
      where: {
        id: installmentId,
        clientId: id,
        client: {
          orgId: profile.orgId,
        },
      },
      include: {
        client: true,
      },
    });

    if (!installment) {
      return NextResponse.json(
        { error: "Parcela não encontrada" },
        { status: 404 },
      );
    }

    // Atualizar a parcela
    const updated = await prisma.installment.update({
      where: { id: installmentId },
      data: {
        status,
        paidAt: paidAt ? new Date(paidAt) : null,
        notes,
      },
    });

    // Se a parcela foi marcada como CONFIRMED (paga), criar entrada no financeiro
    if (status === "CONFIRMED" && installment.status !== "CONFIRMED") {
      const paymentDate = paidAt ? new Date(paidAt) : new Date();

      // Verificar se já existe uma entrada financeira para esta parcela
      const existingFinance = await prisma.finance.findFirst({
        where: {
          clientId: id,
          type: "income",
          amount: installment.amount,
          description: {
            contains: `Parcela ${installment.number}`,
          },
        },
      });

      // Criar entrada financeira apenas se não existir
      if (!existingFinance) {
        await prisma.finance.create({
          data: {
            orgId: profile.orgId!,
            clientId: id,
            type: "income",
            amount: installment.amount,
            description: `Parcela ${installment.number}/${
              installment.client.installmentCount || 0
            } paga - ${installment.client.name}`,
            category: "Mensalidade",
            date: paymentDate,
          },
        });
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erro ao atualizar parcela:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar parcela" },
      { status: 500 },
    );
  }
}

// DELETE - Deletar todas as parcelas do cliente
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const profile = await getSessionProfile();
    if (!profile || profile.role !== "OWNER") {
      return NextResponse.json(
        { error: "Apenas OWNER pode deletar parcelas" },
        { status: 403 },
      );
    }

    const { id } = await params;

    if (!profile.orgId) {
      return NextResponse.json(
        { error: "Organização não encontrada" },
        { status: 400 },
      );
    }

    // Verificar se o cliente pertence à org do usuário
    const client = await prisma.client.findFirst({
      where: {
        id,
        orgId: profile.orgId,
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Cliente não encontrado" },
        { status: 404 },
      );
    }

    // Deletar todas as parcelas
    await prisma.installment.deleteMany({
      where: { clientId: id },
    });

    // Atualizar cliente para modo não parcelado
    await prisma.client.update({
      where: { id },
      data: {
        isInstallment: false,
        installmentCount: null,
        installmentValue: null,
      },
    });

    return NextResponse.json({ message: "Parcelas removidas com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar parcelas:", error);
    return NextResponse.json(
      { error: "Erro ao deletar parcelas" },
      { status: 500 },
    );
  }
}
