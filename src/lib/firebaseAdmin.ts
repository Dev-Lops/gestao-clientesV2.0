import { getServerEnv } from "@/lib/env";
import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

// Helper to build a clearer error message listing missing envs.
function assertServerEnv() {
  const raw = {
    NEXT_PUBLIC_FIREBASE_PROJECT_ID:
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
  };
  const missing = Object.entries(raw)
    .filter(([, v]) => !v)
    .map(([k]) => k);
  return { raw, missing };
}

if (!getApps().length) {
  const senv = getServerEnv();
  if (!senv) {
    const { missing } = assertServerEnv();
    // Provide actionable guidance without cryptic TypeError.
    throw new Error(
      `Firebase Admin não inicializado. Variáveis faltando: ${
        missing.join(", ") || "desconhecidas"
      }\n` +
        "Defina-as em .env.local (nunca prefixe segredos com NEXT_PUBLIC_) e reinicie o servidor.",
    );
  }

  const privateKey = senv.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n");
  if (!privateKey.includes("BEGIN PRIVATE KEY")) {
    console.warn(
      "⚠️ FIREBASE_PRIVATE_KEY parece inválida (não contém BEGIN PRIVATE KEY). Verifique se as quebras de linha estão escapadas como \\n.",
    );
  }

  initializeApp({
    credential: cert({
      projectId: senv.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: senv.FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
  });

  // Log informativo apenas em desenvolvimento para facilitar diagnóstico de mismatch
  if (process.env.NODE_ENV !== "production") {
    console.log(
      "[FirebaseAdmin] Inicializado com projectId:",
      senv.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    );
    console.log(
      "[FirebaseAdmin] Client email (domínio):",
      senv.FIREBASE_CLIENT_EMAIL?.split("@")[1],
    );
  }
}

export const adminAuth = getAuth(getApp());
