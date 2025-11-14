import { adminAuth } from "@/lib/firebaseAdmin";
import { prisma } from "@/lib/prisma";
import { getSessionProfile } from "@/services/auth/session";
import { NextResponse } from "next/server";

export async function GET() {
  const { user } = await getSessionProfile();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    id: dbUser.id,
    email: dbUser.email,
    name: dbUser.name,
    image: dbUser.image,
  });
}

export async function PATCH(req: Request) {
  const { user } = await getSessionProfile();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as {
    name?: string;
    image?: string;
  };
  const data: { name?: string | null; image?: string | null } = {};
  if (typeof body.name === "string") data.name = body.name.trim() || null;
  if (typeof body.image === "string") data.image = body.image.trim() || null;
  if (Object.keys(data).length === 0)
    return NextResponse.json({ error: "No changes" }, { status: 400 });
  // Atualiza no banco primeiro
  const updated = await prisma.user.update({ where: { id: user.id }, data });

  // Tenta manter o Firebase Auth em sincronia (displayName/photoURL)
  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { firebaseUid: true },
    });
    if (dbUser?.firebaseUid) {
      await adminAuth.updateUser(dbUser.firebaseUid, {
        displayName: updated.name ?? undefined,
        photoURL: updated.image ?? undefined,
      });
    }
  } catch (e) {
    // Não falha a requisição se a atualização no Firebase falhar
    console.warn("[api/profile] Falha ao atualizar displayName no Firebase", e);
  }
  return NextResponse.json({
    id: updated.id,
    email: updated.email,
    name: updated.name,
    image: updated.image,
  });
}
