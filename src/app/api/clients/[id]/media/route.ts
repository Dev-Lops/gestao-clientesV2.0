import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { deleteFile } from "@/lib/storage";
import { getSessionProfile } from "@/services/auth/session";
import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { user, orgId, role } = await getSessionProfile();
    if (!user || !orgId)
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    if (!role || !can(role, "read", "media"))
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    const { id: clientId } = await params;
    const client = await prisma.client.findFirst({
      where: { id: clientId, orgId },
    });
    if (!client)
      return NextResponse.json(
        { error: "Cliente não encontrado" },
        { status: 404 },
      );

    // Suporte a filtrar por pasta via query ?folderId=xxx
    const url = new URL(req.url);
    const folderIdParam = url.searchParams.get("folderId");

    // Se folderId é string vazia, busca apenas arquivos sem pasta (na raiz)
    const folderFilter =
      folderIdParam === "" || folderIdParam === null
        ? { folderId: null } // Apenas arquivos na raiz
        : { folderId: folderIdParam }; // Arquivos da pasta específica

    const media = await prisma.media.findMany({
      where: {
        clientId,
        orgId,
        ...folderFilter,
      },
      orderBy: { createdAt: "desc" },
      include: {
        folder: { select: { id: true, name: true } },
      },
    });
    return NextResponse.json(media);
  } catch (e) {
    console.error("Erro GET media", e);
    return NextResponse.json(
      { error: "Erro ao buscar mídias" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { user, orgId, role } = await getSessionProfile();
    if (!user || !orgId)
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    if (!role || !can(role, "create", "media"))
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
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

    // POST legado: cria mídia com URL (para compatibilidade)
    // Novos uploads devem usar /upload
    const created = await prisma.media.create({
      data: {
        clientId,
        orgId,
        title: body.title,
        description: body.description ?? null,
        url: body.url ?? null,
        type: body.type,
        folderId: body.folderId ?? null,
      },
    });
    return NextResponse.json(created);
  } catch (e) {
    console.error("Erro POST media", e);
    return NextResponse.json({ error: "Erro ao criar mídia" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { user, orgId, role } = await getSessionProfile();
    if (!user || !orgId)
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    if (!role || !can(role, "update", "media"))
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    const url = new URL(req.url);
    const mediaId = url.searchParams.get("mediaId");
    if (!mediaId)
      return NextResponse.json({ error: "ID não fornecido" }, { status: 400 });
    const body = await req.json();
    const found = await prisma.media.findUnique({ where: { id: mediaId } });
    if (!found || found.orgId !== orgId)
      return NextResponse.json(
        { error: "Mídia não encontrada" },
        { status: 404 },
      );
    const updated = await prisma.media.update({
      where: { id: mediaId },
      data: {
        title: body.title ?? undefined,
        description: body.description ?? undefined,
        folderId:
          body.folderId !== undefined ? body.folderId || null : undefined,
      },
    });
    return NextResponse.json(updated);
  } catch (e) {
    console.error("Erro PATCH media", e);
    return NextResponse.json(
      { error: "Erro ao atualizar mídia" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { user, orgId, role } = await getSessionProfile();
    if (!user || !orgId)
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    if (!role || !can(role, "delete", "media"))
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    const url = new URL(req.url);
    const mediaId = url.searchParams.get("mediaId");
    if (!mediaId)
      return NextResponse.json({ error: "ID não fornecido" }, { status: 400 });
    const found = await prisma.media.findUnique({ where: { id: mediaId } });
    if (!found || found.orgId !== orgId)
      return NextResponse.json(
        { error: "Mídia não encontrada" },
        { status: 404 },
      );

    // Deleta arquivo físico se existir
    if (found.fileKey) {
      await deleteFile(found.fileKey).catch((err) =>
        console.error("Erro ao deletar arquivo:", err),
      );
    }

    await prisma.media.delete({ where: { id: mediaId } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Erro DELETE media", e);
    return NextResponse.json(
      { error: "Erro ao deletar mídia" },
      { status: 500 },
    );
  }
}
