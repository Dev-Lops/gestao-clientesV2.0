import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getSessionProfile } from "@/services/auth/session";
import { NextResponse } from "next/server";

// GET /api/clients/[id]/dashboard
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: clientId } = await params;
    const { user, orgId, role } = await getSessionProfile();
    if (!user || !orgId || !role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verifica se pode ler o cliente
    if (!can(role, "read", "client")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        name: true,
        status: true,
        plan: true,
        mainChannel: true,
        orgId: true,
      },
    });

    if (!client || client.orgId !== orgId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Carrega dados associados
    const [tasks, brandingCount, mediaCount, strategyCount, meetings, finance] =
      await Promise.all([
        prisma.task.findMany({
          where: { clientId },
          orderBy: { createdAt: "desc" },
          take: 300,
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
            description: true,
            createdAt: true,
          },
        }),
        prisma.branding.count({ where: { clientId } }),
        prisma.media.count({ where: { clientId } }),
        prisma.strategy.count({ where: { clientId } }),
        prisma.meeting.findMany({
          where: {
            clientId,
            status: "scheduled",
            startTime: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
          orderBy: { startTime: "asc" },
          take: 50,
          select: {
            id: true,
            title: true,
            startTime: true,
            endTime: true,
            status: true,
          },
        }),
        prisma.finance.findMany({
          where: { clientId },
          select: { id: true, type: true, amount: true },
        }),
      ]);

    const taskStats = {
      total: tasks.length,
      todo: tasks.filter((t) => t.status === "todo").length,
      inProgress: tasks.filter(
        (t) => t.status === "in-progress" || t.status === "in_progress",
      ).length,
      done: tasks.filter((t) => t.status === "done").length,
      overdue: tasks.filter(
        (t) => t.dueDate && t.dueDate < new Date() && t.status !== "done",
      ).length,
    };

    // Urgência
    interface UrgentTask {
      id: string;
      title: string;
      status: string;
      priority: string;
      dueDate: Date | null;
      urgencyScore: number;
      createdAt: Date;
      description: string | null;
    }
    const urgent: UrgentTask[] = [];
    for (const t of tasks) {
      if (t.status === "done") continue;
      let score = 0;
      if (t.priority === "high") score += 3;
      else if (t.priority === "medium") score += 2;
      else score += 1;
      if (t.dueDate) {
        const diffDays =
          (t.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        if (diffDays <= 0) score += 4;
        else if (diffDays <= 1) score += 3;
        else if (diffDays <= 3) score += 2;
        else if (diffDays <= 7) score += 1;
      }
      if (score >= 5) {
        urgent.push({
          id: t.id,
          title: t.title,
          status: t.status,
          priority: t.priority,
          dueDate: t.dueDate,
          urgencyScore: score,
          createdAt: t.createdAt,
          description: t.description,
        });
      }
    }
    urgent.sort((a, b) => b.urgencyScore - a.urgencyScore);

    const income = finance
      .filter((f) => f.type === "income")
      .reduce((acc, f) => acc + f.amount, 0);
    const expense = finance
      .filter((f) => f.type === "expense")
      .reduce((acc, f) => acc + f.amount, 0);

    return NextResponse.json({
      client: {
        id: client.id,
        name: client.name,
        status: client.status,
        plan: client.plan,
        mainChannel: client.mainChannel,
      },
      counts: {
        tasks: taskStats,
        brandings: brandingCount,
        media: mediaCount,
        strategies: strategyCount,
        meetings: {
          upcoming: meetings.filter((m) => m.startTime > new Date()).length,
          scheduledToday: meetings.filter((m) => {
            const now = new Date();
            return (
              m.startTime.getDate() === now.getDate() &&
              m.startTime.getMonth() === now.getMonth() &&
              m.startTime.getFullYear() === now.getFullYear()
            );
          }).length,
        },
        finance: {
          income,
          expense,
          net: income - expense,
        },
      },
      urgentTasks: urgent.slice(0, 20),
      meetings: meetings,
    });
  } catch (e) {
    console.error("Erro dashboard cliente:", e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
