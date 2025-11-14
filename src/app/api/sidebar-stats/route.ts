import { adminAuth } from "@/lib/firebaseAdmin";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await adminAuth.verifyIdToken(token);
    const userId = decoded.uid;

    // Busca o usuário e sua org
    const user = await prisma.user.findUnique({
      where: { firebaseUid: userId },
      include: { memberships: { include: { org: true } } },
    });

    if (!user || user.memberships.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const orgId = user.memberships[0].orgId;
    const role = user.memberships[0].role;

    // Buscar contadores para o sidebar
    const [
      totalClients,
      activeClients,
      clientsWithBottlenecks,
      totalTasks,
      pendingTasks,
      overdueTasks,
      totalRevenue,
      totalExpenses,
      overdueInstallments,
      upcomingMeetings,
    ] = await Promise.all([
      // Total de clientes
      prisma.client.count({ where: { orgId } }),

      // Clientes ativos (com tarefas não concluídas)
      prisma.client.count({
        where: {
          orgId,
          tasks: {
            some: {
              status: { notIn: ["done", "completed"] },
            },
          },
        },
      }),

      // Clientes com gargalos (tasks atrasadas)
      prisma.client.count({
        where: {
          orgId,
          tasks: {
            some: {
              dueDate: { lt: new Date() },
              status: { notIn: ["done", "completed"] },
            },
          },
        },
      }),

      // Total de tarefas
      prisma.task.count({ where: { orgId } }),

      // Tarefas pendentes
      prisma.task.count({
        where: {
          orgId,
          status: { in: ["pending", "todo"] },
        },
      }),

      // Tarefas atrasadas
      prisma.task.count({
        where: {
          orgId,
          dueDate: { lt: new Date() },
          status: { notIn: ["done", "completed"] },
        },
      }),

      // Receitas totais
      prisma.finance.aggregate({
        where: {
          client: { orgId },
          type: "income",
        },
        _sum: { amount: true },
      }),

      // Despesas totais
      prisma.finance.aggregate({
        where: {
          client: { orgId },
          type: "expense",
        },
        _sum: { amount: true },
      }),

      // Parcelas atrasadas
      prisma.installment.count({
        where: {
          client: { orgId },
          dueDate: { lt: new Date() },
          paidAt: null,
        },
      }),

      // Reuniões próximas (próximas 7 dias)
      prisma.meeting.count({
        where: {
          client: { orgId },
          startTime: {
            gte: new Date(),
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    const revenue = totalRevenue._sum.amount || 0;
    const expenses = totalExpenses._sum.amount || 0;
    const balance = revenue - expenses;

    return NextResponse.json({
      role,
      counters: {
        clients: {
          total: totalClients,
          active: activeClients,
          withBottlenecks: clientsWithBottlenecks,
        },
        tasks: {
          total: totalTasks,
          pending: pendingTasks,
          overdue: overdueTasks,
        },
        finance: {
          revenue,
          expenses,
          balance,
          overdueInstallments,
        },
        meetings: {
          upcoming: upcomingMeetings,
        },
      },
    });
  } catch (error) {
    console.error("Erro ao buscar contadores do sidebar:", error);
    return NextResponse.json(
      { error: "Failed to fetch sidebar stats" },
      { status: 500 },
    );
  }
}
