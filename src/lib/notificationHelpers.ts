import { createNotification, NotificationType } from "@/services/notifications";

// Helper para criar notificações de clientes
export async function notifyClientAction(
  orgId: string,
  clientId: string,
  clientName: string,
  action: "created" | "updated" | "deleted",
) {
  const typeMap: Record<typeof action, NotificationType> = {
    created: "client_created",
    updated: "client_updated",
    deleted: "client_deleted",
  };

  const titleMap = {
    created: "Novo Cliente Adicionado",
    updated: "Cliente Atualizado",
    deleted: "Cliente Removido",
  };

  const messageMap = {
    created: `${clientName} foi adicionado ao sistema`,
    updated: `As informações de ${clientName} foram atualizadas`,
    deleted: `${clientName} foi removido do sistema`,
  };

  await createNotification({
    orgId,
    type: typeMap[action],
    title: titleMap[action],
    message: messageMap[action],
    link: action === "deleted" ? "/clients" : `/clients/${clientId}`,
    clientId: action === "deleted" ? undefined : clientId,
    priority: action === "deleted" ? "high" : "normal",
  });
}

// Helper para criar notificações de tarefas
export async function notifyTaskAction(
  orgId: string,
  clientId: string,
  clientName: string,
  taskTitle: string,
  action: "created" | "updated" | "completed" | "overdue",
) {
  const typeMap: Record<typeof action, NotificationType> = {
    created: "task_created",
    updated: "task_updated",
    completed: "task_completed",
    overdue: "task_overdue",
  };

  const titleMap = {
    created: "Nova Tarefa Criada",
    updated: "Tarefa Atualizada",
    completed: "Tarefa Concluída",
    overdue: "Tarefa Atrasada",
  };

  const messageMap = {
    created: `${taskTitle} - ${clientName}`,
    updated: `${taskTitle} - ${clientName}`,
    completed: `${taskTitle} foi concluída - ${clientName}`,
    overdue: `${taskTitle} está atrasada - ${clientName}`,
  };

  const priorityMap = {
    created: "normal" as const,
    updated: "normal" as const,
    completed: "normal" as const,
    overdue: "high" as const,
  };

  await createNotification({
    orgId,
    type: typeMap[action],
    title: titleMap[action],
    message: messageMap[action],
    link: `/clients/${clientId}`,
    clientId,
    priority: priorityMap[action],
  });
}

// Helper para criar notificações de reuniões
export async function notifyMeetingAction(
  orgId: string,
  clientId: string,
  clientName: string,
  meetingTitle: string,
  action: "created" | "updated" | "cancelled",
) {
  const typeMap: Record<typeof action, NotificationType> = {
    created: "meeting_created",
    updated: "meeting_updated",
    cancelled: "meeting_cancelled",
  };

  const titleMap = {
    created: "Nova Reunião Agendada",
    updated: "Reunião Atualizada",
    cancelled: "Reunião Cancelada",
  };

  const messageMap = {
    created: `${meetingTitle} - ${clientName}`,
    updated: `${meetingTitle} - ${clientName}`,
    cancelled: `${meetingTitle} foi cancelada - ${clientName}`,
  };

  await createNotification({
    orgId,
    type: typeMap[action],
    title: titleMap[action],
    message: messageMap[action],
    link: `/clients/${clientId}`,
    clientId,
    priority: action === "cancelled" ? "high" : "normal",
  });
}

// Helper para criar notificações de pagamentos
export async function notifyPaymentAction(
  orgId: string,
  clientId: string,
  clientName: string,
  amount: number,
  action: "confirmed" | "overdue",
) {
  const typeMap: Record<typeof action, NotificationType> = {
    confirmed: "payment_confirmed",
    overdue: "payment_overdue",
  };

  const titleMap = {
    confirmed: "Pagamento Confirmado",
    overdue: "Pagamento Atrasado",
  };

  const messageMap = {
    confirmed: `R$ ${amount.toFixed(2)} recebido de ${clientName}`,
    overdue: `R$ ${amount.toFixed(2)} de ${clientName} está em atraso`,
  };

  await createNotification({
    orgId,
    type: typeMap[action],
    title: titleMap[action],
    message: messageMap[action],
    link: `/clients/${clientId}`,
    clientId,
    priority: action === "overdue" ? "urgent" : "normal",
  });
}

// Helper para criar notificações financeiras
export async function notifyFinanceAction(
  orgId: string,
  clientId: string | undefined,
  clientName: string | undefined,
  amount: number,
  type: "income" | "expense",
  description: string,
  action: "created" | "updated",
) {
  const notifType: NotificationType =
    action === "created" ? "finance_created" : "finance_updated";

  const title =
    action === "created"
      ? type === "income"
        ? "Nova Receita Registrada"
        : "Nova Despesa Registrada"
      : "Transação Atualizada";

  const message = clientName
    ? `R$ ${amount.toFixed(2)} - ${description} (${clientName})`
    : `R$ ${amount.toFixed(2)} - ${description}`;

  await createNotification({
    orgId,
    type: notifType,
    title,
    message,
    link: clientId ? `/clients/${clientId}` : "/finance",
    clientId,
    priority: "normal",
  });
}

// Helper para criar notificações de membros
export async function notifyMemberAction(
  orgId: string,
  memberName: string,
  memberEmail: string,
  action: "added" | "removed",
) {
  const typeMap: Record<typeof action, NotificationType> = {
    added: "member_added",
    removed: "member_removed",
  };

  const titleMap = {
    added: "Novo Membro Adicionado",
    removed: "Membro Removido",
  };

  const messageMap = {
    added: `${memberName} (${memberEmail}) entrou na equipe`,
    removed: `${memberName} (${memberEmail}) saiu da equipe`,
  };

  await createNotification({
    orgId,
    type: typeMap[action],
    title: titleMap[action],
    message: messageMap[action],
    link: "/admin/members",
    priority: "normal",
  });
}

// Helper para criar notificações de mídia
export async function notifyMediaUpload(
  orgId: string,
  clientId: string,
  clientName: string,
  fileName: string,
  fileCount: number = 1,
) {
  await createNotification({
    orgId,
    type: "media_uploaded",
    title: "Nova Mídia Adicionada",
    message:
      fileCount > 1
        ? `${fileCount} arquivos foram enviados para ${clientName}`
        : `${fileName} foi enviado para ${clientName}`,
    link: `/clients/${clientId}`,
    clientId,
    priority: "normal",
  });
}
