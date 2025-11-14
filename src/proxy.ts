import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function proxy(req: NextRequest) {
  const token = req.cookies.get("auth")?.value;

  const pathname = req.nextUrl.pathname;
  const isLoginRoute = pathname.startsWith("/login");
  const isAuthCallback = pathname.startsWith("/auth/callback");
  const isInviteValidation =
    pathname.startsWith("/api/invites/accept") && req.method === "GET";

  // Permite rota de callback passar sem verificação (ela mesma valida o token)
  if (isAuthCallback) {
    return NextResponse.next();
  }

  if (!token) {
    // Permite validar convite sem autenticação (GET /api/invites/accept)
    if (isInviteValidation) return NextResponse.next();

    if (isLoginRoute) return NextResponse.next();

    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isLoginRoute) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/clients/:path*",
    "/client/:path*",
    "/admin/:path*",
    "/dashboard/:path*",
    "/api/invites/:path*",
    "/onboarding/:path*",
    "/login/:path*",
    "/auth/:path*",
  ],
};
