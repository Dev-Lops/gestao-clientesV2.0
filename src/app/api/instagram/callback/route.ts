import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/instagram/callback?code=xxx&state=clientId
 * Suporta dois modos controlados por INSTAGRAM_OAUTH_MODE: 'basic' (Instagram Basic Display)
 * e 'graph' (Facebook Login + Instagram Graph API).
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const clientId = searchParams.get("state");
    const error = searchParams.get("error");
    const errorReason = searchParams.get("error_reason");
    const errorDescription = searchParams.get("error_description");

    if (error) {
      console.error(
        "Instagram OAuth error:",
        error,
        errorReason,
        errorDescription,
      );
      return NextResponse.redirect(
        new URL(
          `/clients/${clientId}/info?instagram_error=${
            errorDescription || "Autorização negada"
          }`,
          req.url,
        ),
      );
    }

    if (!code || !clientId) {
      return NextResponse.json(
        { error: "Código de autorização ou clientId não fornecido" },
        { status: 400 },
      );
    }

    const mode = (process.env.INSTAGRAM_OAUTH_MODE || "graph").toLowerCase();
    const appId =
      mode === "basic"
        ? process.env.INSTAGRAM_APP_ID
        : process.env.FACEBOOK_APP_ID || process.env.INSTAGRAM_APP_ID;
    const appSecret =
      mode === "basic"
        ? process.env.INSTAGRAM_APP_SECRET
        : process.env.FACEBOOK_APP_SECRET || process.env.INSTAGRAM_APP_SECRET;
    const redirectUri =
      mode === "basic"
        ? process.env.INSTAGRAM_REDIRECT_URI
        : process.env.FACEBOOK_REDIRECT_URI ||
          process.env.INSTAGRAM_REDIRECT_URI;

    if (!appId || !appSecret || !redirectUri) {
      return NextResponse.json(
        { error: "Facebook/Instagram não configurado no servidor" },
        { status: 500 },
      );
    }

    if (mode === "basic") {
      // Instagram Basic Display: trocar code por short-lived token
      const tokenResponse = await fetch(
        "https://api.instagram.com/oauth/access_token",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: appId,
            client_secret: appSecret,
            grant_type: "authorization_code",
            redirect_uri: redirectUri,
            code,
          }),
        },
      );
      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json().catch(() => ({}));
        console.error("Instagram token exchange error:", errorData);
        return NextResponse.redirect(
          new URL(
            `/clients/${clientId}/info?instagram_error=Erro ao obter token do Instagram`,
            req.url,
          ),
        );
      }
      const tokenData = await tokenResponse.json();
      const shortLivedToken: string = tokenData.access_token;
      const instagramUserId: string = tokenData.user_id;

      // Trocar por long-lived token
      const longLivedResponse = await fetch(
        `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${encodeURIComponent(
          appSecret,
        )}&access_token=${encodeURIComponent(shortLivedToken)}`,
      );
      let accessToken = shortLivedToken;
      let expiresIn = 3600;
      if (longLivedResponse.ok) {
        const longLivedData = await longLivedResponse.json();
        accessToken = longLivedData.access_token;
        expiresIn = longLivedData.expires_in;
      }

      // Buscar username
      let instagramUsername: string | null = null;
      const profileResponse = await fetch(
        `https://graph.instagram.com/${encodeURIComponent(
          instagramUserId,
        )}?fields=id,username&access_token=${encodeURIComponent(accessToken)}`,
      );
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        instagramUsername = profileData?.username || null;
      }

      await updateClientInstagramData(
        clientId,
        accessToken,
        instagramUserId,
        expiresIn,
        instagramUsername,
      );

      return NextResponse.redirect(
        new URL(`/clients/${clientId}/info?instagram_success=true`, req.url),
      );
    }

    // Modo 'graph': Facebook Login + IG Graph API
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${encodeURIComponent(
        appId,
      )}&redirect_uri=${encodeURIComponent(
        redirectUri,
      )}&client_secret=${encodeURIComponent(
        appSecret,
      )}&code=${encodeURIComponent(code)}`,
    );
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}));
      console.error("Facebook token exchange error:", errorData);
      return NextResponse.redirect(
        new URL(
          `/clients/${clientId}/info?instagram_error=Erro ao obter token do Facebook Login`,
          req.url,
        ),
      );
    }
    const tokenData = await tokenResponse.json();
    const shortLivedUserToken: string = tokenData.access_token;

    // Trocar por long-lived user token
    const longLivedResponse = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${encodeURIComponent(
        appId,
      )}&client_secret=${encodeURIComponent(
        appSecret,
      )}&fb_exchange_token=${encodeURIComponent(shortLivedUserToken)}`,
    );
    const longLivedData = await longLivedResponse.json().catch(() => null);
    const longLivedUserToken: string =
      longLivedData?.access_token || shortLivedUserToken;
    const longLivedUserExpiresIn: number = longLivedData?.expires_in || 3600;

    // Listar Páginas e encontrar IG Business account
    const pagesRes = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,access_token&access_token=${encodeURIComponent(
        longLivedUserToken,
      )}`,
    );
    if (!pagesRes.ok) {
      const err = await pagesRes.json().catch(() => ({}));
      console.error("Erro ao listar páginas:", err);
      return NextResponse.redirect(
        new URL(
          `/clients/${clientId}/info?instagram_error=Não foi possível listar Páginas do Facebook do usuário`,
          req.url,
        ),
      );
    }
    const pagesData = await pagesRes.json();
    const pages: Array<{ id: string; name: string; access_token: string }> =
      pagesData?.data || [];

    let chosenPageToken: string | null = null;
    let instagramBusinessUserId: string | null = null;

    for (const page of pages) {
      const pageInfoRes = await fetch(
        `https://graph.facebook.com/v19.0/${encodeURIComponent(
          page.id,
        )}?fields=instagram_business_account&access_token=${encodeURIComponent(
          page.access_token,
        )}`,
      );
      if (!pageInfoRes.ok) continue;
      const pageInfo = await pageInfoRes.json();
      const igBiz = pageInfo?.instagram_business_account?.id;
      if (igBiz) {
        chosenPageToken = page.access_token;
        instagramBusinessUserId = igBiz;
        break;
      }
    }

    if (!instagramBusinessUserId || !chosenPageToken) {
      return NextResponse.redirect(
        new URL(
          `/clients/${clientId}/info?instagram_error=Não encontramos uma conta Instagram Profissional vinculada a uma Página do Facebook deste usuário`,
          req.url,
        ),
      );
    }

    // Buscar username IG
    let instagramUsername: string | null = null;
    const profileResponse = await fetch(
      `https://graph.facebook.com/v19.0/${encodeURIComponent(
        instagramBusinessUserId,
      )}?fields=username&access_token=${encodeURIComponent(chosenPageToken)}`,
    );
    if (profileResponse.ok) {
      const profileData = await profileResponse.json();
      instagramUsername = profileData?.username || null;
    }

    await updateClientInstagramData(
      clientId,
      chosenPageToken,
      instagramBusinessUserId,
      longLivedUserExpiresIn || 5184000,
      instagramUsername,
    );

    return NextResponse.redirect(
      new URL(`/clients/${clientId}/info?instagram_success=true`, req.url),
    );
  } catch (error) {
    console.error("Erro no callback do Instagram:", error);
    return NextResponse.json(
      { error: "Erro ao processar callback do Instagram" },
      { status: 500 },
    );
  }
}

/**
 * Atualiza os dados do Instagram do cliente no banco de dados
 */
async function updateClientInstagramData(
  clientId: string,
  accessToken: string,
  instagramUserId: string,
  expiresIn: number,
  instagramUsername?: string | null,
) {
  const expiresAt = new Date(Date.now() + expiresIn * 1000);

  await prisma.client.update({
    where: { id: clientId },
    data: {
      instagramAccessToken: accessToken,
      instagramUserId,
      instagramTokenExpiresAt: expiresAt,
      ...(instagramUsername && { instagramUsername }),
    },
  });
}
