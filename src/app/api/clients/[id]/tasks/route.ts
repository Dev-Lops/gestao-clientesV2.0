import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { parseISOToLocal } from "@/lib/utils";
import { getSessionProfile } from "@/services/auth/session";
import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { user, orgId, role } = await getSessionProfile();
    if (!user || !orgId)
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    if (!role || !can(role, "read", "task"))
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

    const { id: clientId } = await params;

    // Verifica se o cliente pertence à org
    const client = await prisma.client.findFirst({
      where: { id: clientId, orgId },
    });
    if (!client)
      return NextResponse.json(
        { error: "Cliente não encontrado" },
        { status: 404 },
      );

    const tasks = await prisma.task.findMany({
      where: { clientId, orgId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Erro ao buscar tarefas:", error);
    return NextResponse.json(
      { error: "Erro ao buscar tarefas" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, orgId, role } = await getSessionProfile();
    if (!user || !orgId)
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    if (!role || !can(role, "create", "task"))
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

    const { id: clientId } = await params;
    const body = await request.json();

    const client = await prisma.client.findFirst({
      where: { id: clientId, orgId },
    });
    if (!client)
      return NextResponse.json(
        { error: "Cliente não encontrado" },
        { status: 404 },
      );

    const task = await prisma.task.create({
      data: {
        clientId,
        orgId,
        title: body.title,
        description: body.description ?? null,
        status: body.status ?? "todo",
        priority: body.priority ?? "medium",
        assignee: body.assignee ?? null,
        dueDate: body.dueDate ? parseISOToLocal(body.dueDate) : null,
      },
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error("Erro ao criar tarefa:", error);
    return NextResponse.json(
      { error: "Erro ao criar tarefa" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { user, orgId, role } = await getSessionProfile();
    if (!user || !orgId)
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    if (!role || !can(role, "update", "task"))
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

    const url = new URL(request.url);
    const taskId = url.searchParams.get("taskId");
    if (!taskId)
      return NextResponse.json({ error: "ID não fornecido" }, { status: 400 });

    const body = await request.json();

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task || task.orgId !== orgId)
      return NextResponse.json(
        { error: "Tarefa não encontrada" },
        { status: 404 },
      );

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        title: body.title ?? undefined,
        description: body.description ?? undefined,
        status: body.status ?? undefined,
        priority: body.priority ?? undefined,
        assignee: body.assignee ?? undefined,
        dueDate:
          body.dueDate !== undefined
            ? body.dueDate
              ? parseISOToLocal(body.dueDate)
              : null
            : undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erro ao atualizar tarefa:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar tarefa" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user, orgId, role } = await getSessionProfile();
    if (!user || !orgId)
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    if (!role || !can(role, "delete", "task"))
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

    const url = new URL(request.url);
    const taskId = url.searchParams.get("taskId");
    if (!taskId)
      return NextResponse.json({ error: "ID não fornecido" }, { status: 400 });

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task || task.orgId !== orgId)
      return NextResponse.json(
        { error: "Tarefa não encontrada" },
        { status: 404 },
      );

    await prisma.task.delete({ where: { id: taskId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar tarefa:", error);
    return NextResponse.json(
      { error: "Erro ao deletar tarefa" },
      { status: 500 },
    );
  }
}
