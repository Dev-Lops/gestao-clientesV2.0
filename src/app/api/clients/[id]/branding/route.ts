import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getSessionProfile } from "@/services/auth/session";
import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const { user, orgId, role } = await getSessionProfile();
    if (!user || !orgId)
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    if (!role || !can(role, "read", "branding")) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }
    const { id: clientId } = await params;
    const client = await prisma.client.findFirst({
      where: { id: clientId, orgId },
    });
    if (!client)
      return NextResponse.json(
        { error: "Cliente não encontrado" },
        { status: 404 },
      );
    const brandings = await prisma.branding.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(brandings);
  } catch (e) {
    console.error("Erro GET branding", e);
    return NextResponse.json(
      { error: "Erro ao buscar branding" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { user, orgId, role } = await getSessionProfile();
    if (!user || !orgId)
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    if (!role || !can(role, "create", "branding")) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }
    const { id: clientId } = await params;
    const body = await req.json();
    const client = await prisma.client.findFirst({
      where: { id: clientId, orgId },
    });
    if (!client)
      return NextResponse.json(
        { error: "Cliente não encontrado" },
        { status: 404 },
      );
    const created = await prisma.branding.create({
      data: {
        clientId,
        title: body.title,
        type: body.type,
        description: body.description ?? null,
        fileUrl: body.fileUrl ?? null,
        content: body.content ?? null,
      },
    });
    return NextResponse.json(created);
  } catch (e) {
    console.error("Erro POST branding", e);
    return NextResponse.json(
      { error: "Erro ao criar item de branding" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { user, orgId, role } = await getSessionProfile();
    if (!user || !orgId)
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    if (!role || !can(role, "update", "branding")) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }
    const url = new URL(req.url);
    const brandingId = url.searchParams.get("brandingId");
    if (!brandingId)
      return NextResponse.json({ error: "ID não fornecido" }, { status: 400 });
    const body = await req.json();
    const found = await prisma.branding.findUnique({
      where: { id: brandingId },
      include: { client: true },
    });
    if (!found || found.client.orgId !== orgId)
      return NextResponse.json(
        { error: "Item não encontrado" },
        { status: 404 },
      );
    const updated = await prisma.branding.update({
      where: { id: brandingId },
      data: {
        title: body.title ?? undefined,
        type: body.type ?? undefined,
        description: body.description ?? undefined,
        fileUrl: body.fileUrl ?? undefined,
        content: body.content ?? undefined,
      },
    });
    return NextResponse.json(updated);
  } catch (e) {
    console.error("Erro PATCH branding", e);
    return NextResponse.json(
      { error: "Erro ao atualizar item de branding" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { user, orgId, role } = await getSessionProfile();
    if (!user || !orgId)
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    if (!role || !can(role, "delete", "branding")) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }
    const url = new URL(req.url);
    const brandingId = url.searchParams.get("brandingId");
    if (!brandingId)
      return NextResponse.json({ error: "ID não fornecido" }, { status: 400 });
    const found = await prisma.branding.findUnique({
      where: { id: brandingId },
      include: { client: true },
    });
    if (!found || found.client.orgId !== orgId)
      return NextResponse.json(
        { error: "Item não encontrado" },
        { status: 404 },
      );
    await prisma.branding.delete({ where: { id: brandingId } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Erro DELETE branding", e);
    return NextResponse.json(
      { error: "Erro ao deletar item de branding" },
      { status: 500 },
    );
  }
}
