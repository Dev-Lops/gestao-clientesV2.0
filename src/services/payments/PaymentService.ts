/**
 * Payment Service - Centraliza toda lógica de negócio relacionada a pagamentos
 *
 * Este serviço gerencia:
 * - Pagamentos mensais recorrentes
 * - Parcelas de contratos parcelados
 * - Validações e regras de negócio
 * - Status e vencimentos
 */

import { prisma } from "@/lib/prisma";
import { Client, Installment, PaymentStatus } from "@prisma/client";

export type PaymentMode = "monthly" | "installment";

// Tipo para cliente com installments incluídos
type ClientWithInstallments = Client & {
  installments: Installment[];
};

export type MonthlyPaymentStatus = {
  mode: PaymentMode;
  amount: number;
  isPaid: boolean;
  isLate: boolean;
  dueDate: Date;
  paidAt: Date | null;
  details: {
    // For monthly: current month finance total
    // For installment: installments info
    monthlyIncome?: number;
    installments?: {
      total: number;
      paid: number;
      pending: number;
      nextPendingId?: string;
    };
  };
};

export type InstallmentInfo = {
  id: string;
  number: number;
  totalInstallments: number;
  amount: number;
  dueDate: Date;
  status: PaymentStatus;
  paidAt: Date | null;
};

export class PaymentService {
  /**
   * Obtém o status de pagamento do mês atual para um cliente
   */
  static async getMonthlyPaymentStatus(
    clientId: string,
    orgId: string,
  ): Promise<MonthlyPaymentStatus> {
    const client = await prisma.client.findFirst({
      where: { id: clientId, orgId },
      include: {
        installments: {
          orderBy: { number: "asc" },
        },
      },
    });

    if (!client) {
      throw new Error("Cliente não encontrado");
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
    );

    // Modo parcelas
    if (client.isInstallment) {
      return this.getInstallmentPaymentStatus(
        client,
        startOfMonth,
        endOfMonth,
        now,
      );
    }

    // Modo mensal recorrente
    return this.getRecurringPaymentStatus(
      client,
      startOfMonth,
      endOfMonth,
      now,
    );
  }

  /**
   * Status para pagamento parcelado
   */
  private static async getInstallmentPaymentStatus(
    client: ClientWithInstallments,
    startOfMonth: Date,
    endOfMonth: Date,
    now: Date,
  ): Promise<MonthlyPaymentStatus> {
    const monthInstallments = client.installments.filter(
      (i: Installment) => i.dueDate >= startOfMonth && i.dueDate <= endOfMonth,
    );

    if (monthInstallments.length === 0) {
      return {
        mode: "installment",
        amount: 0,
        isPaid: false,
        isLate: false,
        dueDate: startOfMonth,
        paidAt: null,
        details: {
          installments: {
            total: 0,
            paid: 0,
            pending: 0,
          },
        },
      };
    }

    const paidCount = monthInstallments.filter(
      (i: Installment) => i.status === "CONFIRMED",
    ).length;
    const isPaid = paidCount === monthInstallments.length;
    const totalAmount = monthInstallments.reduce(
      (sum: number, i: Installment) => sum + i.amount,
      0,
    );
    const latestDueDate = new Date(
      Math.max(
        ...monthInstallments.map((i: Installment) =>
          new Date(i.dueDate).getTime(),
        ),
      ),
    );
    const isLate = !isPaid && now > latestDueDate;
    const nextPending = monthInstallments.find(
      (i: Installment) => i.status !== "CONFIRMED",
    );

    return {
      mode: "installment",
      amount: totalAmount,
      isPaid,
      isLate,
      dueDate: latestDueDate,
      paidAt: isPaid
        ? new Date(
            Math.max(
              ...monthInstallments
                .filter((i: Installment) => i.paidAt !== null)
                .map((i: Installment) => new Date(i.paidAt as Date).getTime()),
            ),
          )
        : null,
      details: {
        installments: {
          total: monthInstallments.length,
          paid: paidCount,
          pending: monthInstallments.length - paidCount,
          nextPendingId: nextPending?.id,
        },
      },
    };
  }

  /**
   * Status para pagamento mensal recorrente
   */
  private static async getRecurringPaymentStatus(
    client: Client,
    startOfMonth: Date,
    endOfMonth: Date,
    now: Date,
  ): Promise<MonthlyPaymentStatus> {
    if (!client.contractValue) {
      throw new Error("Cliente não possui valor de contrato definido");
    }

    // Calcular vencimento
    const paymentDay = Math.min(Math.max(client.paymentDay || 5, 1), 28);
    const dueDate = new Date(now.getFullYear(), now.getMonth(), paymentDay);

    // Verificar pagamentos do mês
    const monthFinances = await prisma.finance.findMany({
      where: {
        clientId: client.id,
        type: "income",
        date: { gte: startOfMonth, lte: endOfMonth },
      },
    });

    const totalIncome = monthFinances.reduce((sum, f) => sum + f.amount, 0);
    const expectedAmount = client.contractValue;
    // Tolerância de 5% para considerar pago
    const isPaid = totalIncome >= expectedAmount * 0.95;
    const isLate = !isPaid && now > dueDate;

    return {
      mode: "monthly",
      amount: expectedAmount,
      isPaid,
      isLate,
      dueDate,
      paidAt:
        isPaid && monthFinances.length > 0
          ? new Date(
              Math.max(...monthFinances.map((f) => new Date(f.date).getTime())),
            )
          : null,
      details: {
        monthlyIncome: totalIncome,
      },
    };
  }

  /**
   * Registra pagamento mensal recorrente
   */
  static async confirmMonthlyPayment(
    clientId: string,
    orgId: string,
    paidAmount?: number,
  ): Promise<void> {
    const client = await prisma.client.findFirst({
      where: { id: clientId, orgId },
    });

    if (!client) {
      throw new Error("Cliente não encontrado");
    }

    if (client.isInstallment) {
      throw new Error(
        "Cliente está em modo parcelado. Use confirmInstallmentPayment.",
      );
    }

    if (!client.contractValue) {
      throw new Error("Cliente não possui valor de contrato definido");
    }

    const now = new Date();
    const amount = paidAmount || client.contractValue;

    // Verificar se já existe pagamento no mês
    const existing = await prisma.finance.findFirst({
      where: {
        clientId,
        type: "income",
        date: {
          gte: new Date(now.getFullYear(), now.getMonth(), 1),
          lt: new Date(now.getFullYear(), now.getMonth() + 1, 1),
        },
      },
    });

    if (existing) {
      throw new Error("Já existe um pagamento registrado para este mês");
    }

    await prisma.$transaction([
      prisma.finance.create({
        data: {
          orgId,
          clientId,
          type: "income",
          amount,
          description: `Mensalidade ${now.toLocaleDateString("pt-BR", {
            month: "long",
            year: "numeric",
          })} - ${client.name}`,
          category: "Mensalidade",
          date: now,
        },
      }),
      prisma.client.update({
        where: { id: clientId },
        data: { paymentStatus: "CONFIRMED" },
      }),
    ]);
  }

  /**
   * Confirma pagamento de uma parcela específica
   */
  static async confirmInstallmentPayment(
    installmentId: string,
    orgId: string,
  ): Promise<void> {
    const installment = await prisma.installment.findUnique({
      where: { id: installmentId },
      include: { client: true },
    });

    if (!installment || installment.client.orgId !== orgId) {
      throw new Error("Parcela não encontrada");
    }

    if (installment.status === "CONFIRMED") {
      throw new Error("Parcela já foi confirmada");
    }

    await prisma.$transaction([
      prisma.installment.update({
        where: { id: installmentId },
        data: {
          status: "CONFIRMED",
          paidAt: new Date(),
        },
      }),
      prisma.finance.create({
        data: {
          orgId,
          clientId: installment.clientId,
          type: "income",
          amount: installment.amount,
          description: `Parcela ${installment.number} - ${installment.client.name}`,
          category: "Parcelas",
          date: new Date(),
        },
      }),
    ]);
  }

  /**
   * Lista todas as parcelas de um cliente
   */
  static async getClientInstallments(
    clientId: string,
    orgId: string,
  ): Promise<InstallmentInfo[]> {
    const client = await prisma.client.findFirst({
      where: { id: clientId, orgId },
      include: {
        installments: {
          orderBy: { number: "asc" },
        },
      },
    });

    if (!client) {
      throw new Error("Cliente não encontrado");
    }

    const total = client.installmentCount || client.installments.length;

    return client.installments.map((i) => ({
      id: i.id,
      number: i.number,
      totalInstallments: total,
      amount: i.amount,
      dueDate: i.dueDate,
      status: i.status,
      paidAt: i.paidAt,
    }));
  }

  /**
   * Atualiza status de parcelas vencidas
   */
  static async updateLateInstallments(orgId: string): Promise<number> {
    const now = new Date();

    const result = await prisma.installment.updateMany({
      where: {
        client: { orgId },
        status: "PENDING",
        dueDate: { lt: now },
      },
      data: { status: "LATE" },
    });

    return result.count;
  }
}
