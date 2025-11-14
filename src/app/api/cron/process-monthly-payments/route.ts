import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * Cron job para processar pagamentos mensais
 * Deve ser chamado todo dia 1º de cada mês (via Vercel Cron ou similar)
 *
 * Exemplo de configuração no vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/process-monthly-payments",
 *     "schedule": "0 0 1 * *"
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autorização (token de cron ou API key)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET || "your-secret-key-here";

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Buscar todas as organizações
    const orgs = await prisma.org.findMany({
      include: {
        clients: {
          where: {
            status: { in: ["active", "onboarding"] }, // Apenas clientes ativos
            OR: [
              { isInstallment: false }, // Clientes com pagamento normal
              {
                isInstallment: true,
                installments: {
                  some: {
                    dueDate: {
                      gte: new Date(currentYear, currentMonth, 1),
                      lt: new Date(currentYear, currentMonth + 1, 1),
                    },
                  },
                },
              }, // Clientes parcelados com parcelas no mês
            ],
          },
          include: {
            installments: {
              where: {
                dueDate: {
                  gte: new Date(currentYear, currentMonth, 1),
                  lt: new Date(currentYear, currentMonth + 1, 1),
                },
              },
            },
          },
        },
      },
    });

    type ProcessDetail = {
      client: string;
      amount: number;
      type: "installment" | "monthly";
    };
    const results = {
      processed: 0,
      created: 0,
      errors: 0,
      details: [] as ProcessDetail[],
    };

    for (const org of orgs) {
      for (const client of org.clients) {
        try {
          let amountToPay = 0;
          let description = "";

          if (client.isInstallment && client.installments.length > 0) {
            // Cliente com pagamento parcelado
            const installment = client.installments[0];
            amountToPay = installment.amount;
            description = `Parcela ${installment.number}/${client.installmentCount} - ${client.name}`;

            // Atualizar status da parcela se ainda está pendente
            if (installment.status === "PENDING") {
              const dueDate = new Date(installment.dueDate);
              if (today > dueDate) {
                await prisma.installment.update({
                  where: { id: installment.id },
                  data: { status: "LATE" },
                });
              }
            }
          } else if (client.contractValue) {
            // Cliente com pagamento mensal normal
            amountToPay = client.contractValue;
            description = `Pagamento mensal - ${client.name}`;
          } else {
            // Cliente sem valor de contrato definido
            continue;
          }

          // Criar entrada de receita esperada no financeiro
          // Apenas se ainda não existe uma entrada para este mês/cliente
          const existingEntry = await prisma.finance.findFirst({
            where: {
              clientId: client.id,
              type: "income",
              date: {
                gte: new Date(currentYear, currentMonth, 1),
                lt: new Date(currentYear, currentMonth + 1, 1),
              },
              description: {
                contains: client.isInstallment ? "Parcela" : "Pagamento mensal",
              },
            },
          });

          if (!existingEntry) {
            await prisma.finance.create({
              data: {
                orgId: org.id,
                clientId: client.id,
                type: "income",
                amount: amountToPay,
                description,
                category: "Mensalidade",
                date: new Date(
                  currentYear,
                  currentMonth,
                  client.paymentDay || 1,
                ),
              },
            });

            results.created++;
            results.details.push({
              client: client.name,
              amount: amountToPay,
              type: client.isInstallment ? "installment" : "monthly",
            });
          }

          results.processed++;
        } catch (error) {
          results.errors++;
          console.error(`Erro ao processar cliente ${client.name}:`, error);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Pagamentos mensais processados",
      results,
      timestamp: today.toISOString(),
    });
  } catch (error) {
    console.error("Erro ao processar pagamentos mensais:", error);
    return NextResponse.json(
      { error: "Erro ao processar pagamentos mensais" },
      { status: 500 },
    );
  }
}

// Permitir POST também (para testes manuais)
export async function POST(request: NextRequest) {
  return GET(request);
}
