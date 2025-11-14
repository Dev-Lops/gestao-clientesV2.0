import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getSessionProfile } from "@/services/auth/session";
import { NextResponse } from "next/server";

// GET /api/clients/[id]/media/folders - Lista pastas
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

    if (!can(role, "read", "media")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true, orgId: true },
    });

    if (!client || client.orgId !== orgId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const folders = await prisma.mediaFolder.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { media: true, children: true },
        },
      },
    });

    return NextResponse.json(folders);
  } catch (e) {
    console.error("Folders list error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// POST /api/clients/[id]/media/folders - Cria pasta
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: clientId } = await params;
    const { user, orgId, role } = await getSessionProfile();
    if (!user || !orgId || !role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!can(role, "create", "media")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true, orgId: true },
    });

    if (!client || client.orgId !== orgId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await req.json();
    const { name, description, parentId } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: "Name required" }, { status: 400 });
    }

    // Valida parent se especificado
    if (parentId) {
      const parent = await prisma.mediaFolder.findFirst({
        where: { id: parentId, clientId },
      });
      if (!parent) {
        return NextResponse.json(
          { error: "Parent folder not found" },
          { status: 404 },
        );
      }
    }

    const folder = await prisma.mediaFolder.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        parentId: parentId || null,
        clientId,
      },
    });

    return NextResponse.json(folder);
  } catch (e) {
    console.error("Folder create error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// PATCH /api/clients/[id]/media/folders?folderId=xxx - Atualiza pasta
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: clientId } = await params;
    const { user, orgId, role } = await getSessionProfile();
    if (!user || !orgId || !role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!can(role, "update", "media")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true, orgId: true },
    });

    if (!client || client.orgId !== orgId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const url = new URL(req.url);
    const folderId = url.searchParams.get("folderId");
    if (!folderId) {
      return NextResponse.json({ error: "folderId required" }, { status: 400 });
    }

    const folder = await prisma.mediaFolder.findFirst({
      where: { id: folderId, clientId },
    });

    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    const body = await req.json();
    const { name, description, parentId } = body;

    // Valida parent se mudando
    if (parentId && parentId !== folder.parentId) {
      const parent = await prisma.mediaFolder.findFirst({
        where: { id: parentId, clientId },
      });
      if (!parent) {
        return NextResponse.json(
          { error: "Parent folder not found" },
          { status: 404 },
        );
      }
      // Evita ciclo: parent não pode ser descendente
      if (parentId === folderId) {
        return NextResponse.json(
          { error: "Cannot set self as parent" },
          { status: 400 },
        );
      }
    }

    const updated = await prisma.mediaFolder.update({
      where: { id: folderId },
      data: {
        name: name?.trim() || folder.name,
        description: description?.trim() || folder.description,
        parentId: parentId !== undefined ? parentId || null : folder.parentId,
      },
    });

    return NextResponse.json(updated);
  } catch (e) {
    console.error("Folder update error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// DELETE /api/clients/[id]/media/folders?folderId=xxx - Deleta pasta (e mídias dentro por cascade)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: clientId } = await params;
    const { user, orgId, role } = await getSessionProfile();
    if (!user || !orgId || !role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!can(role, "delete", "media")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true, orgId: true },
    });

    if (!client || client.orgId !== orgId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const url = new URL(req.url);
    const folderId = url.searchParams.get("folderId");
    if (!folderId) {
      return NextResponse.json({ error: "folderId required" }, { status: 400 });
    }

    const folder = await prisma.mediaFolder.findFirst({
      where: { id: folderId, clientId },
    });

    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    // Deleta pasta (cascade deleta filhos e seta mídias para null)
    await prisma.mediaFolder.delete({ where: { id: folderId } });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Folder delete error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
