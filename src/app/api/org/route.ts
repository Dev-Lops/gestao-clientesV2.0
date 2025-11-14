import { prisma } from "@/lib/prisma";
import { getSessionProfile } from "@/services/auth/session";
import { NextResponse } from "next/server";

type OrgProfile = {
  id: string;
  name: string;
  description: string | null;
  cnpj: string | null;
  phone: string | null;
  website: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
};

export async function GET() {
  const { orgId } = await getSessionProfile();
  if (!orgId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const org = await prisma.org.findUnique({ where: { id: orgId } });
  if (!org) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const o = org as unknown as OrgProfile;
  return NextResponse.json({
    id: o.id,
    name: o.name,
    description: o.description,
    cnpj: o.cnpj,
    phone: o.phone,
    website: o.website,
    addressLine1: o.addressLine1,
    addressLine2: o.addressLine2,
    city: o.city,
    state: o.state,
    postalCode: o.postalCode,
    country: o.country,
  });
}

export async function PATCH(req: Request) {
  const { orgId, role } = await getSessionProfile();
  if (!orgId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as {
    name?: string;
    description?: string;
    cnpj?: string;
    phone?: string;
    website?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };

  type OrgUpdate = Partial<Omit<OrgProfile, "id">>;
  const data: OrgUpdate = {};
  const keys: (keyof OrgUpdate)[] = [
    "name",
    "description",
    "cnpj",
    "phone",
    "website",
    "addressLine1",
    "addressLine2",
    "city",
    "state",
    "postalCode",
    "country",
  ];
  keys.forEach((k) => {
    const v = (body as Record<string, unknown>)[k as string];
    if (typeof v === "string") {
      (data as Record<string, string | null>)[k as string] =
        (v as string).trim() || null;
    }
  });

  // Server-side validation (CNPJ/CEP)
  const onlyDigits = (s: string | null | undefined) =>
    (s || "").replace(/\D/g, "");
  const cnpjDigits = onlyDigits(data.cnpj as string);
  if (cnpjDigits && cnpjDigits.length !== 14) {
    return NextResponse.json({ error: "CNPJ inválido" }, { status: 400 });
  }
  const cepDigits = onlyDigits(data.postalCode as string);
  if (cepDigits && cepDigits.length !== 8) {
    return NextResponse.json({ error: "CEP inválido" }, { status: 400 });
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No changes" }, { status: 400 });
  }

  const updated = await prisma.org.update({ where: { id: orgId }, data });
  return NextResponse.json({ id: updated.id });
}
