import { can, type AppRole } from "@/lib/permissions";
import { getSessionProfile } from "@/services/auth/session";
import { PaymentService } from "@/services/payments/PaymentService";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/clients/[id]/installments
 * Lista todas as parcelas do cliente
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { orgId, role } = await getSessionProfile();

    if (!orgId || !role) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    if (!can(role as AppRole, "read", "finance")) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const { id: clientId } = await params;

    const installments = await PaymentService.getClientInstallments(
      clientId,
      orgId,
    );

    return NextResponse.json(installments);
  } catch (error) {
    console.error("Error fetching installments:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erro ao buscar parcelas",
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/clients/[id]/installments/[installmentId]/confirm
 * Confirma pagamento de uma parcela específica
 *
 * Query param: installmentId
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { orgId, role } = await getSessionProfile();

    if (!orgId || !role) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    if (!can(role as AppRole, "create", "finance")) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const { id: clientId } = await params;
    const { searchParams } = new URL(req.url);
    const installmentId = searchParams.get("installmentId");

    if (!installmentId) {
      return NextResponse.json(
        { error: "installmentId é obrigatório" },
        { status: 400 },
      );
    }

    await PaymentService.confirmInstallmentPayment(installmentId, orgId);

    // Retornar lista atualizada e status do mês
    const [installments, monthStatus] = await Promise.all([
      PaymentService.getClientInstallments(clientId, orgId),
      PaymentService.getMonthlyPaymentStatus(clientId, orgId),
    ]);

    return NextResponse.json({
      success: true,
      message: "Parcela confirmada com sucesso",
      installments,
      monthStatus,
    });
  } catch (error) {
    console.error("Error confirming installment:", error);
    const message =
      error instanceof Error ? error.message : "Erro ao confirmar parcela";
    const statusCode = message.includes("não encontrado")
      ? 404
      : message.includes("já foi confirmada")
        ? 400
        : 500;

    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
