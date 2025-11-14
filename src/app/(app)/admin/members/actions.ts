"use server";

import { prisma } from "@/lib/prisma";
import { generateInviteToken } from "@/lib/tokens";
import { getSessionProfile } from "@/services/auth/session";
import { sendInviteEmail } from "@/services/email/resend";
import { revalidatePath } from "next/cache";

export async function updateMemberRoleAction(formData: FormData) {
  const { user, orgId, role } = await getSessionProfile();

  if (!user || !orgId || role !== "OWNER") {
    throw new Error(
      "Não autorizado. Apenas proprietários podem alterar papéis.",
    );
  }

  const memberId = formData.get("member_id") as string;
  const newRole = formData.get("role") as "OWNER" | "STAFF" | "CLIENT";

  if (!memberId || !newRole) {
    throw new Error("Dados inválidos");
  }

  // Verificar se o membro pertence à mesma organização
  const member = await prisma.member.findUnique({
    where: { id: memberId },
  });

  if (!member || member.orgId !== orgId) {
    throw new Error("Membro não encontrado ou não pertence à sua organização");
  }

  // Não permitir remover o último owner
  if (member.role === "OWNER" && newRole !== "OWNER") {
    const ownerCount = await prisma.member.count({
      where: { orgId, role: "OWNER" },
    });

    if (ownerCount <= 1) {
      throw new Error("Não é possível alterar o papel do último proprietário");
    }
  }

  await prisma.member.update({
    where: { id: memberId },
    data: { role: newRole },
  });

  revalidatePath("/admin/members");
}

export async function deleteMemberAction(formData: FormData) {
  const { user, orgId, role } = await getSessionProfile();

  if (!user || !orgId || role !== "OWNER") {
    throw new Error(
      "Não autorizado. Apenas proprietários podem remover membros.",
    );
  }

  const memberId = formData.get("member_id") as string;

  if (!memberId) {
    throw new Error("ID do membro não fornecido");
  }

  // Verificar se o membro pertence à mesma organização
  const member = await prisma.member.findUnique({
    where: { id: memberId },
  });

  if (!member || member.orgId !== orgId) {
    throw new Error("Membro não encontrado ou não pertence à sua organização");
  }

  // Não permitir remover owners
  if (member.role === "OWNER") {
    throw new Error("Não é possível remover um proprietário");
  }

  await prisma.member.delete({
    where: { id: memberId },
  });

  revalidatePath("/admin/members");
}

export async function inviteStaffAction(formData: FormData) {
  const { user, orgId, role } = await getSessionProfile();

  if (!user || !orgId || role !== "OWNER") {
    throw new Error(
      "Não autorizado. Apenas proprietários podem convidar membros.",
    );
  }

  const rawEmail = (formData.get("email") as string) || "";
  const email = rawEmail.toLowerCase().trim();
  // Nome opcional (pode ser usado futuramente)
  const fullNameRaw = formData.get("full_name") as string | null;
  // deliberately unused: retained for future customization; prefix to ignore
  void fullNameRaw;
  const inviteRole = formData.get("role") as "STAFF" | "CLIENT" | "OWNER";
  const clientId = formData.get("client_id") as string | null;
  const allowResendExisting =
    (formData.get("allow_resend_existing") as string | null)?.toLowerCase() ===
    "true";

  if (!email) {
    throw new Error("Email é obrigatório");
  }
  // Validação simples de e-mail no servidor
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
  if (!emailRegex.test(email)) {
    throw new Error("Email inválido");
  }
  // Evitar auto-convite
  if (user.email && email === user.email.toLowerCase()) {
    throw new Error("Você não pode enviar convite para o próprio e-mail");
  }
  if (!(inviteRole === "STAFF" || inviteRole === "CLIENT")) {
    throw new Error("Papel inválido para convite");
  }

  if (inviteRole === "CLIENT" && clientId) {
    // Verifica se client pertence à mesma org e se já está vinculado
    const existingClient = await prisma.client.findFirst({
      where: { id: clientId, orgId },
      select: { id: true, clientUserId: true },
    });
    if (!existingClient) {
      throw new Error("Cliente não encontrado na organização");
    }
    if (existingClient.clientUserId) {
      throw new Error("Este cliente já está vinculado a um usuário");
    }
  }

  // Já é membro?
  const existingMember = await prisma.member.findFirst({
    where: { orgId, user: { email } },
    include: { user: true },
  });
  if (existingMember) {
    throw new Error("Este e-mail já possui acesso à organização");
  }

  // Limite de taxa simples: até 10 convites nos últimos 5 minutos por organização
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
  const invitesRecent = await prisma.invite.count({
    where: { orgId, createdAt: { gte: fiveMinAgo } },
  });
  if (invitesRecent >= 10) {
    throw new Error(
      "Muitas solicitações: aguarde alguns minutos antes de enviar mais convites",
    );
  }

  // Convite pendente existente?
  const pendingInvite = await prisma.invite.findFirst({
    where: { orgId, email, status: "PENDING" },
  });
  if (pendingInvite) {
    if (allowResendExisting) {
      try {
        const org = await prisma.org.findUnique({
          where: { id: orgId },
          select: { name: true },
        });
        const client = pendingInvite.clientId
          ? await prisma.client.findUnique({
              where: { id: pendingInvite.clientId },
              select: { name: true },
            })
          : null;
        const result = await sendInviteEmail({
          to: email,
          token: pendingInvite.token,
          orgName: org?.name || "Organização",
          roleRequested: pendingInvite.roleRequested as "STAFF" | "CLIENT",
          clientName: client?.name || undefined,
        });
        const emailSent = !result.skipped;
        return { ok: true, reusedToken: true, emailSent };
      } catch (e) {
        console.error("Falha ao reenviar e-mail de convite (Resend):", e);
        return { ok: true, reusedToken: true, emailSent: false };
      }
    }
    throw new Error("Já existe um convite pendente para este e-mail");
  }

  const token = generateInviteToken(32);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 dias

  const createdInvite = await prisma.invite.create({
    data: {
      orgId,
      email,
      roleRequested: inviteRole,
      token,
      expiresAt,
      clientId: inviteRole === "CLIENT" ? clientId || undefined : undefined,
    },
  });

  try {
    const org = await prisma.org.findUnique({
      where: { id: orgId },
      select: { name: true },
    });
    const client = clientId
      ? await prisma.client.findUnique({
          where: { id: clientId },
          select: { name: true },
        })
      : null;
    const sendResult = await sendInviteEmail({
      to: email,
      token,
      orgName: org?.name || "Organização",
      roleRequested: inviteRole as "STAFF" | "CLIENT",
      clientName: client?.name || undefined,
    });
    const emailSent = !sendResult.skipped;
    return {
      ok: true,
      reusedToken: false,
      emailSent,
      inviteId: createdInvite.id,
    };
  } catch (e) {
    console.error("Falha ao enviar e-mail de convite (Resend):", e);
    return {
      ok: true,
      reusedToken: false,
      emailSent: false,
      inviteId: createdInvite.id,
    };
  }
  // no return path here because we already returned above
}

export async function cancelInviteAction(formData: FormData) {
  const { user, orgId, role } = await getSessionProfile();
  if (!user || !orgId || role !== "OWNER") {
    throw new Error("Não autorizado.");
  }
  const inviteId = formData.get("invite_id") as string;
  if (!inviteId) throw new Error("ID do convite não fornecido");

  const invite = await prisma.invite.findUnique({ where: { id: inviteId } });
  if (!invite || invite.orgId !== orgId) {
    throw new Error("Convite não encontrado");
  }
  if (invite.status !== "PENDING") {
    throw new Error("Somente convites pendentes podem ser cancelados");
  }
  await prisma.invite.update({
    where: { id: inviteId },
    data: { status: "CANCELED" },
  });
  revalidatePath("/admin/members");
}

export async function deleteInviteAction(formData: FormData) {
  const { user, orgId, role } = await getSessionProfile();
  if (!user || !orgId || role !== "OWNER") {
    throw new Error("Não autorizado.");
  }
  const inviteId = formData.get("invite_id") as string;
  if (!inviteId) throw new Error("ID do convite não fornecido");

  const invite = await prisma.invite.findUnique({ where: { id: inviteId } });
  if (!invite || invite.orgId !== orgId) {
    throw new Error("Convite não encontrado");
  }
  if (invite.status === "ACCEPTED") {
    throw new Error("Não é possível excluir convites já aceitos");
  }
  await prisma.invite.delete({ where: { id: inviteId } });
  revalidatePath("/admin/members");
}

export async function resendInviteAction(formData: FormData) {
  const { user, orgId, role } = await getSessionProfile();
  if (!user || !orgId || role !== "OWNER") {
    throw new Error("Não autorizado.");
  }
  const inviteId = formData.get("invite_id") as string;
  if (!inviteId) throw new Error("ID do convite não fornecido");

  const invite = await prisma.invite.findUnique({ where: { id: inviteId } });
  if (!invite || invite.orgId !== orgId) {
    throw new Error("Convite não encontrado");
  }
  if (invite.status !== "PENDING") {
    throw new Error("Apenas convites pendentes podem ser reenviados");
  }

  const org = await prisma.org.findUnique({
    where: { id: orgId },
    select: { name: true },
  });
  const client = invite.clientId
    ? await prisma.client.findUnique({
        where: { id: invite.clientId },
        select: { name: true },
      })
    : null;

  try {
    await sendInviteEmail({
      to: invite.email,
      token: invite.token,
      orgName: org?.name || "Organização",
      roleRequested: invite.roleRequested as "STAFF" | "CLIENT",
      clientName: client?.name || undefined,
    });
  } catch (e) {
    console.error("Falha ao reenviar e-mail de convite (Resend):", e);
    throw new Error("Falha ao reenviar e-mail");
  }

  revalidatePath("/admin/members");
}

export async function deactivateMemberAction(formData: FormData) {
  const { user, orgId, role } = await getSessionProfile();
  if (!user || !orgId || role !== "OWNER") {
    throw new Error("Não autorizado.");
  }
  const memberId = formData.get("member_id") as string;
  if (!memberId) throw new Error("ID do membro não fornecido");

  const member = await prisma.member.findUnique({ where: { id: memberId } });
  if (!member || member.orgId !== orgId)
    throw new Error("Membro não encontrado");
  if (member.role === "OWNER")
    throw new Error("Não é possível desativar um proprietário");

  await prisma.member.update({
    where: { id: memberId },
    data: { isActive: false },
  });
  revalidatePath("/admin/members");
}

export async function activateMemberAction(formData: FormData) {
  const { user, orgId, role } = await getSessionProfile();
  if (!user || !orgId || role !== "OWNER") {
    throw new Error("Não autorizado.");
  }
  const memberId = formData.get("member_id") as string;
  if (!memberId) throw new Error("ID do membro não fornecido");

  const member = await prisma.member.findUnique({ where: { id: memberId } });
  if (!member || member.orgId !== orgId)
    throw new Error("Membro não encontrado");

  await prisma.member.update({
    where: { id: memberId },
    data: { isActive: true },
  });
  revalidatePath("/admin/members");
}
