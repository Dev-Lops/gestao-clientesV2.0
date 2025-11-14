import { prisma } from "@/lib/prisma";
import { parseISOToLocal } from "@/lib/utils";
import { getSessionProfile } from "@/services/auth/session";
import { ClientStatus } from "@/types/client";
import type { ClientPlan, SocialChannel } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user, orgId, role } = await getSessionProfile();

    if (!user || !orgId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Only OWNER and STAFF can update clients
    if (role === "CLIENT") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const { id: clientId } = await params;

    // Verify client belongs to org
    const existingClient = await prisma.client.findFirst({
      where: { id: clientId, orgId },
    });

    if (!existingClient) {
      return NextResponse.json(
        { error: "Cliente não encontrado" },
        { status: 404 },
      );
    }

    const body = await req.json();
    const {
      name,
      email,
      phone,
      status,
      plan,
      mainChannel,
      contractStart,
      contractEnd,
      paymentDay,
      contractValue,
      instagramUserId,
      instagramUsername,
    } = body;

    // Update client
    const updatedClient = await prisma.client.update({
      where: { id: clientId },
      data: {
        name: name?.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        status: status as ClientStatus,
        plan: plan ? (plan as ClientPlan) : null,
        mainChannel: mainChannel ? (mainChannel as SocialChannel) : null,
        contractStart: contractStart ? parseISOToLocal(contractStart) : null,
        contractEnd: contractEnd ? parseISOToLocal(contractEnd) : null,
        paymentDay: paymentDay ? parseInt(paymentDay) : null,
        contractValue: contractValue ? parseFloat(contractValue) : null,
        instagramUserId: instagramUserId?.trim() || null,
        instagramUsername: instagramUsername?.trim() || null,
      },
    });

    return NextResponse.json(updatedClient);
  } catch (error) {
    console.error("Erro ao atualizar cliente:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar cliente" },
      { status: 500 },
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user, orgId } = await getSessionProfile();

    if (!user || !orgId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id: clientId } = await params;

    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        orgId,
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Cliente não encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error("Erro ao buscar cliente:", error);
    return NextResponse.json(
      { error: "Erro ao buscar cliente" },
      { status: 500 },
    );
  }
}
