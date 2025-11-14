import { prisma } from "@/lib/prisma";
import { getSessionProfile } from "@/services/auth/session";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const { user } = await getSessionProfile();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[activity/heartbeat] failed", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
