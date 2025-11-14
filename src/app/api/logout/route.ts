import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * Remove o cookie de sessão ao fazer logout.
 */
export async function POST() {
  try {
    const cookieStore = await cookies();

    // Remove o cookie de autenticação com as mesmas opções de quando foi criado
    cookieStore.set("auth", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0, // Expira imediatamente
      path: "/",
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Erro ao fazer logout", err);
    return NextResponse.json({ error: "Logout failed" }, { status: 500 });
  }
}
