import { can, type AppRole } from "@/lib/permissions";
import { getSessionProfile } from "@/services/auth/session";
import { PaymentService } from "@/services/payments/PaymentService";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/clients/[id]/payment/status
 * Retorna o status de pagamento do mês atual para o cliente
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

    const status = await PaymentService.getMonthlyPaymentStatus(
      clientId,
      orgId,
    );

    return NextResponse.json(status);
  } catch (error) {
    console.error("Error fetching payment status:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Erro ao buscar status",
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/clients/[id]/payment/confirm
 * Confirma o pagamento mensal do cliente
 *
 * Body opcional:
 * - amount?: number - Valor pago (default: contractValue)
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
    const body = await req.json().catch(() => ({}));
    const { amount } = body;

    await PaymentService.confirmMonthlyPayment(clientId, orgId, amount);

    // Retornar status atualizado
    const status = await PaymentService.getMonthlyPaymentStatus(
      clientId,
      orgId,
    );

    return NextResponse.json({
      success: true,
      message: "Pagamento confirmado com sucesso",
      status,
    });
  } catch (error) {
    console.error("Error confirming payment:", error);
    const message =
      error instanceof Error ? error.message : "Erro ao confirmar pagamento";
    const statusCode = message.includes("não encontrado")
      ? 404
      : message.includes("já existe")
        ? 400
        : 500;

    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
