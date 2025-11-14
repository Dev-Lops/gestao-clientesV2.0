import { prisma } from "@/lib/prisma";

export type NotificationType =
  | "client_created"
  | "client_updated"
  | "client_deleted"
  | "task_created"
  | "task_updated"
  | "task_completed"
  | "task_overdue"
  | "meeting_created"
  | "meeting_updated"
  | "meeting_cancelled"
  | "payment_confirmed"
  | "payment_overdue"
  | "finance_created"
  | "finance_updated"
  | "media_uploaded"
  | "member_added"
  | "member_removed"
  | "strategy_created"
  | "branding_created"
  | "installment_created"
  | "system";

interface CreateNotificationParams {
  orgId: string;
  userId?: string; // Se específico para um usuário
  type: NotificationType;
  title: string;
  message?: string;
  link?: string;
  clientId?: string;
  priority?: "low" | "normal" | "high" | "urgent";
}

/**
 * Cria uma notificação no sistema
 * Se userId não for fornecido, notifica todos os membros da org
 */
export async function createNotification(params: CreateNotificationParams) {
  try {
    const {
      orgId,
      userId,
      type,
      title,
      message,
      link,
      clientId,
      priority = "normal",
    } = params;

    // Se userId específico, criar uma notificação
    if (userId) {
      await prisma.notification.create({
        data: {
          orgId,
          userId,
          type,
          title,
          message,
          link,
          clientId,
          priority,
          read: false,
        },
      });
      return;
    }

    // Caso contrário, notificar todos os membros ativos da org
    const members = await prisma.member.findMany({
      where: {
        orgId,
        isActive: true,
      },
      select: {
        userId: true,
      },
    });

    // Criar notificação para cada membro
    await prisma.notification.createMany({
      data: members.map((member) => ({
        orgId,
        userId: member.userId,
        type,
        title,
        message,
        link,
        clientId,
        priority,
        read: false,
      })),
    });
  } catch (error) {
    console.error("Erro ao criar notificação:", error);
    // Não lançar erro para não quebrar o fluxo principal
  }
}

/**
 * Marca notificação(ões) como lida(s)
 */
export async function markAsRead(notificationIds: string | string[]) {
  const ids = Array.isArray(notificationIds)
    ? notificationIds
    : [notificationIds];

  await prisma.notification.updateMany({
    where: {
      id: { in: ids },
    },
    data: {
      read: true,
    },
  });
}

/**
 * Marca todas as notificações do usuário como lidas
 */
export async function markAllAsRead(userId: string, orgId?: string) {
  const whereCondition: {
    userId: string;
    read: boolean;
    orgId?: string;
  } = {
    userId,
    read: false,
  };

  if (orgId) {
    whereCondition.orgId = orgId;
  }

  await prisma.notification.updateMany({
    where: whereCondition,
    data: {
      read: true,
    },
  });
} /**
 * Deleta notificações antigas (mais de 30 dias e já lidas)
 */
export async function cleanOldNotifications() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  await prisma.notification.deleteMany({
    where: {
      read: true,
      createdAt: {
        lt: thirtyDaysAgo,
      },
    },
  });
}
