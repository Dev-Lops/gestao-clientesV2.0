import { adminAuth } from "@/lib/firebaseAdmin";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await adminAuth.verifyIdToken(token);
    const firebaseUid = decoded.uid;

    // Busca o usuário e sua org
    const user = await prisma.user.findUnique({
      where: { firebaseUid },
      include: { memberships: { include: { org: true } } },
    });

    if (!user || user.memberships.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const orgId = user.memberships[0].orgId;
    const appUserId = user.id;

    // Buscar query params
    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get("unread") === "true";
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const type = searchParams.get("type"); // Filtrar por tipo

    // Construir where condition
    const whereCondition: {
      userId: string;
      orgId: string;
      read?: boolean;
      type?: string;
    } = {
      userId: appUserId,
      orgId,
    };

    if (unreadOnly) {
      whereCondition.read = false;
    }

    if (type) {
      whereCondition.type = type;
    }

    // Buscar notificações persistentes
    const [persistedNotifications, persistedTotal] = await Promise.all([
      prisma.notification.findMany({
        where: whereCondition,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
        include: {
          org: { select: { name: true } },
        },
      }),
      prisma.notification.count({ where: whereCondition }),
    ]);

    // Buscar notificações dinâmicas (tarefas, reuniões, pagamentos)
    const dynamicNotifications = await getDynamicNotifications(
      orgId,
      appUserId,
    );

    // Combinar notificações
    const allNotifications = [
      ...persistedNotifications.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message || "",
        time: getTimeAgo(n.createdAt),
        unread: !n.read,
        link: n.link || "",
        priority: n.priority || "normal",
        clientId: n.clientId || "",
        createdAt: n.createdAt,
      })),
      ...dynamicNotifications,
    ];

    // Ordenar por data
    allNotifications.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const unreadCount =
      (await prisma.notification.count({
        where: {
          userId: appUserId,
          orgId,
          read: false,
        },
      })) + dynamicNotifications.filter((n) => n.unread).length;

    return NextResponse.json({
      notifications: allNotifications.slice(0, limit),
      total: persistedTotal + dynamicNotifications.length,
      unreadCount,
      hasMore: offset + limit < persistedTotal + dynamicNotifications.length,
    });
  } catch (error) {
    console.error("Erro ao buscar notificações:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 },
    );
  }
}

async function getDynamicNotifications(orgId: string, userId: string) {
  const [urgentTasks, upcomingMeetings, overdueInstallments] =
    await Promise.all([
      // Tasks urgentes (alta prioridade ou atrasadas)
      prisma.task.findMany({
        where: {
          orgId,
          OR: [
            { priority: "high", status: { notIn: ["done", "completed"] } },
            {
              dueDate: { lt: new Date() },
              status: { notIn: ["done", "completed"] },
            },
          ],
        },
        take: 5,
        orderBy: { dueDate: "asc" },
        include: {
          client: { select: { id: true, name: true } },
        },
      }),

      // Reuniões nas próximas 24 horas
      prisma.meeting.findMany({
        where: {
          client: { orgId },
          startTime: {
            gte: new Date(),
            lte: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        },
        take: 5,
        orderBy: { startTime: "asc" },
        include: {
          client: { select: { id: true, name: true } },
        },
      }),

      // Parcelas atrasadas
      prisma.installment.findMany({
        where: {
          client: { orgId },
          dueDate: { lt: new Date() },
          paidAt: null,
        },
        take: 5,
        orderBy: { dueDate: "asc" },
        include: {
          client: { select: { id: true, name: true } },
        },
      }),
    ]);

  const notifications: Array<{
    id: string;
    type: string;
    title: string;
    message: string;
    time: string;
    unread: boolean;
    link: string;
    priority?: string;
    clientId: string;
    createdAt: Date;
  }> = [];

  // Adicionar tasks urgentes
  urgentTasks.forEach((task) => {
    const isOverdue = task.dueDate && task.dueDate < new Date();
    notifications.push({
      id: `task-${task.id}`,
      type: "task",
      title: isOverdue ? "Tarefa Atrasada" : "Tarefa Urgente",
      message: `${task.title} - ${task.client.name}`,
      time: getTimeAgo(task.dueDate || task.createdAt),
      unread: true,
      link: `/clients/${task.clientId}`,
      priority: task.priority,
      clientId: task.clientId,
      createdAt: task.createdAt,
    });
  });

  // Adicionar reuniões próximas
  upcomingMeetings.forEach((meeting) => {
    notifications.push({
      id: `meeting-${meeting.id}`,
      type: "meeting",
      title: "Reunião Próxima",
      message: `${meeting.title} - ${meeting.client.name}`,
      time: getTimeAgo(meeting.startTime),
      unread: true,
      link: `/clients/${meeting.clientId}`,
      clientId: meeting.clientId,
      createdAt: meeting.createdAt,
    });
  });

  // Adicionar parcelas atrasadas
  overdueInstallments.forEach((installment) => {
    const daysOverdue = Math.floor(
      (Date.now() - installment.dueDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    notifications.push({
      id: `installment-${installment.id}`,
      type: "payment",
      title: "Pagamento Atrasado",
      message: `R$ ${installment.amount.toFixed(2)} - ${
        installment.client.name
      } (${daysOverdue}d)`,
      time: getTimeAgo(installment.dueDate),
      unread: true,
      link: `/clients/${installment.clientId}`,
      clientId: installment.clientId,
      createdAt: installment.createdAt,
    });
  });

  return notifications;
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 0) {
    const futureSeconds = Math.abs(seconds);
    if (futureSeconds < 60) return "agora";
    if (futureSeconds < 3600) return `em ${Math.floor(futureSeconds / 60)}min`;
    if (futureSeconds < 86400) return `em ${Math.floor(futureSeconds / 3600)}h`;
    return `em ${Math.floor(futureSeconds / 86400)}d`;
  }

  if (seconds < 60) return "agora";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}min atrás`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h atrás`;
  return `${Math.floor(seconds / 86400)}d atrás`;
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await adminAuth.verifyIdToken(token);
    const firebaseUid = decoded.uid;

    const user = await prisma.user.findUnique({
      where: { firebaseUid },
      include: { memberships: true },
    });
    if (!user || user.memberships.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const orgId = user.memberships[0].orgId;

    const body = await req.json();
    const { action, id, ids } = body || {};

    if (!action) {
      return NextResponse.json({ error: "Missing action" }, { status: 400 });
    }

    // Marcar como lida
    if (action === "mark_read") {
      if (!id) {
        return NextResponse.json({ error: "Missing id" }, { status: 400 });
      }

      await prisma.notification.upsert({
        where: { id },
        update: { read: true },
        create: {
          id,
          read: true,
          userId: user.id,
          orgId,
          type: "system",
          title: "read-marker",
        },
      });

      return NextResponse.json({ ok: true });
    }

    // Marcar várias como lidas
    if (action === "mark_multiple_read") {
      if (!ids || !Array.isArray(ids)) {
        return NextResponse.json(
          { error: "Missing ids array" },
          { status: 400 },
        );
      }

      await prisma.notification.updateMany({
        where: {
          id: { in: ids },
          userId: user.id,
        },
        data: {
          read: true,
        },
      });

      return NextResponse.json({ ok: true });
    }

    // Marcar todas como lidas
    if (action === "mark_all_read") {
      await prisma.notification.updateMany({
        where: {
          userId: user.id,
          orgId,
          read: false,
        },
        data: {
          read: true,
        },
      });

      return NextResponse.json({ ok: true });
    }

    // Deletar notificação
    if (action === "delete") {
      if (!id) {
        return NextResponse.json({ error: "Missing id" }, { status: 400 });
      }

      await prisma.notification.delete({
        where: {
          id,
          userId: user.id,
        },
      });

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Erro ao processar notificação:", error);
    return NextResponse.json({ error: "Failed to process" }, { status: 500 });
  }
}
