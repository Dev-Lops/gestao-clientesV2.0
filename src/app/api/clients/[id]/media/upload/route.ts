import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import {
  generateFileKey,
  getMediaTypeFromMime,
  isAllowedMimeType,
  uploadFile,
} from "@/lib/storage";
import { getSessionProfile } from "@/services/auth/session";
import { NextResponse } from "next/server";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

// POST /api/clients/[id]/media/upload
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

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const title = (formData.get("title") as string) || "";
    const description = (formData.get("description") as string) || "";
    const folderId = (formData.get("folderId") as string) || null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large (max ${MAX_FILE_SIZE / 1024 / 1024}MB)` },
        { status: 400 },
      );
    }

    if (!isAllowedMimeType(file.type)) {
      return NextResponse.json(
        { error: "File type not allowed" },
        { status: 400 },
      );
    }

    // Valida pasta se especificada
    if (folderId) {
      const folder = await prisma.mediaFolder.findFirst({
        where: { id: folderId, clientId },
      });
      if (!folder) {
        return NextResponse.json(
          { error: "Folder not found" },
          { status: 404 },
        );
      }
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileKey = generateFileKey(clientId, file.name);
    const uploadResult = await uploadFile(fileKey, buffer, file.type);

    if (!uploadResult.success) {
      return NextResponse.json({ error: uploadResult.error }, { status: 500 });
    }

    const media = await prisma.media.create({
      data: {
        title: title || file.name,
        description: description || null,
        fileKey,
        mimeType: file.type,
        fileSize: file.size,
        url: uploadResult.url || null,
        type: getMediaTypeFromMime(file.type),
        folderId: folderId || null,
        clientId,
        orgId,
      },
    });

    return NextResponse.json(media);
  } catch (e) {
    console.error("Upload error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
