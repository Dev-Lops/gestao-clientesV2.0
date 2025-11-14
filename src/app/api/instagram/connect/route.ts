import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/instagram/connect?clientId=xxx
 * Retorna a URL de autorização do Instagram OAuth para o cliente conectar sua conta
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId");

    if (!clientId) {
      return NextResponse.json(
        { error: "clientId é obrigatório" },
        { status: 400 },
      );
    }

    const mode = (process.env.INSTAGRAM_OAUTH_MODE || "graph").toLowerCase();

    // Prefer FACEBOOK_* vars; fallback to INSTAGRAM_* for backward compatibility
    const appId =
      mode === "basic"
        ? process.env.INSTAGRAM_APP_ID
        : process.env.FACEBOOK_APP_ID || process.env.INSTAGRAM_APP_ID;
    const redirectUri =
      mode === "basic"
        ? process.env.INSTAGRAM_REDIRECT_URI
        : process.env.FACEBOOK_REDIRECT_URI ||
          process.env.INSTAGRAM_REDIRECT_URI;

    if (!appId || !redirectUri) {
      return NextResponse.json(
        {
          error:
            mode === "basic"
              ? "Instagram Basic Display não configurado. Configure INSTAGRAM_APP_ID e INSTAGRAM_REDIRECT_URI."
              : "Meta não configurado. Configure FACEBOOK_APP_ID e FACEBOOK_REDIRECT_URI (ou INSTAGRAM_* legados) no arquivo .env",
          details: {
            hasAppId: !!appId,
            hasRedirectUri: !!redirectUri,
            hint:
              mode === "basic"
                ? "Adicione o produto Instagram Basic Display no Meta Developers"
                : "Adicione os produtos Facebook Login e Instagram Graph API no Meta Developers",
          },
        },
        { status: 500 },
      );
    }

    // Validar formato do App ID (deve ser numérico)
    if (!/^\d+$/.test(appId)) {
      return NextResponse.json(
        {
          error: "FACEBOOK_APP_ID inválido. Deve ser um número sem aspas.",
          example: "FACEBOOK_APP_ID=123456789012345",
          hint: "Use o App ID do seu app no Meta Developers",
        },
        { status: 500 },
      );
    }

    let authUrl: URL;
    if (mode === "basic") {
      // Instagram Basic Display OAuth direto
      authUrl = new URL("https://api.instagram.com/oauth/authorize");
      authUrl.searchParams.set("client_id", appId);
      authUrl.searchParams.set("redirect_uri", redirectUri);
      authUrl.searchParams.set("scope", "user_profile,user_media");
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("state", clientId);
    } else {
      // Facebook Login + Instagram Graph API
      authUrl = new URL("https://www.facebook.com/v19.0/dialog/oauth");
      authUrl.searchParams.set("client_id", appId);
      authUrl.searchParams.set("redirect_uri", redirectUri);
      authUrl.searchParams.set(
        "scope",
        "pages_show_list,pages_read_engagement,instagram_basic",
      );
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("state", clientId);
    }

    console.log("[Instagram OAuth] Gerando URL de autorização:", {
      appId: appId.substring(0, 4) + "...",
      redirectUri,
      clientId,
      mode,
    });

    return NextResponse.json({ authUrl: authUrl.toString() });
  } catch (error) {
    console.error("Erro ao gerar URL de autorização (Facebook Login):", error);
    return NextResponse.json(
      { error: "Erro ao gerar URL de autorização" },
      { status: 500 },
    );
  }
}
