import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Instagram Graph API (Business):
// GET https://graph.facebook.com/v19.0/{ig-user-id}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp
// Requer Page Access Token associado à Página vinculada à conta IG Profissional

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const clientId = url.searchParams.get("clientId");
    const limit = url.searchParams.get("limit") || "12";
    const mode = (process.env.INSTAGRAM_OAUTH_MODE || "graph").toLowerCase();

    if (!clientId) {
      return NextResponse.json(
        { error: "clientId é obrigatório" },
        { status: 400 },
      );
    }

    // Buscar o cliente e seu token de acesso do Instagram
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: {
        instagramAccessToken: true,
        instagramUserId: true,
        instagramTokenExpiresAt: true,
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Cliente não encontrado" },
        { status: 404 },
      );
    }

    if (!client.instagramAccessToken || !client.instagramUserId) {
      return NextResponse.json(
        {
          error:
            'Instagram não conectado para este cliente. Use o botão "Conectar Instagram" na página do cliente.',
        },
        { status: 401 },
      );
    }

    // Verificar se o token expirou
    if (
      client.instagramTokenExpiresAt &&
      new Date(client.instagramTokenExpiresAt) < new Date()
    ) {
      return NextResponse.json(
        {
          error: "Token do Instagram expirado. Reconecte a conta do Instagram.",
        },
        { status: 401 },
      );
    }

    const igUrl =
      mode === "basic"
        ? `https://graph.instagram.com/${encodeURIComponent(
            client.instagramUserId,
          )}/media?fields=id,media_url,permalink,thumbnail_url,media_type&limit=${encodeURIComponent(
            limit,
          )}&access_token=${encodeURIComponent(client.instagramAccessToken)}`
        : `https://graph.facebook.com/v19.0/${encodeURIComponent(
            client.instagramUserId,
          )}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&limit=${encodeURIComponent(
            limit,
          )}&access_token=${encodeURIComponent(client.instagramAccessToken)}`;

    const res = await fetch(igUrl, { cache: "no-store" });
    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data?.error?.message || "Falha ao consultar Instagram" },
        { status: res.status },
      );
    }

    const items = Array.isArray(data.data) ? data.data : [];
    return NextResponse.json({ items });
  } catch (e) {
    console.error("Erro ao consultar feed do Instagram:", e);
    return NextResponse.json(
      { error: "Erro interno ao consultar Instagram" },
      { status: 500 },
    );
  }
}
