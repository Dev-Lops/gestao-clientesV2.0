import { prisma } from "@/lib/prisma";
import { getSessionProfile } from "@/services/auth/session";
import { NextResponse } from "next/server";

export async function GET() {
  const { user, orgId, role } = await getSessionProfile();
  if (!user || !orgId || role !== "OWNER") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }
  const invites = await prisma.invite.findMany({
    where: { orgId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ data: invites });
}
