import { adminAuth } from "@/lib/firebaseAdmin";
import type { AppRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

interface SessionProfile {
  user: { id: string; email: string; name: string | null } | null;
  orgId: string | null;
  role: AppRole | null;
}

export async function getSessionProfile(): Promise<SessionProfile> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth")?.value;
  if (!token) return { user: null, orgId: null, role: null };

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const user = await prisma.user.findUnique({
      where: { firebaseUid: decoded.uid },
      include: { memberships: true },
    });
    if (!user) return { user: null, orgId: null, role: null };
    // Prefer an active membership
    const membership =
      user.memberships.find((m) => m.isActive !== false) || user.memberships[0];
    return {
      user: { id: user.id, email: user.email, name: user.name },
      orgId: membership?.orgId || null,
      role: (membership?.role as unknown as AppRole) || null,
    };
  } catch (e) {
    console.error("Erro ao obter sessão", e);
    return { user: null, orgId: null, role: null };
  }
}
