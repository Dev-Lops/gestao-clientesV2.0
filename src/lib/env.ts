import { z } from "zod";

// Variables exposed to the browser must be prefixed with NEXT_PUBLIC_
const clientSchema = z.object({
  NEXT_PUBLIC_FIREBASE_API_KEY: z
    .string()
    .min(1, "Missing NEXT_PUBLIC_FIREBASE_API_KEY"),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z
    .string()
    .min(1, "Missing NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z
    .string()
    .min(1, "Missing NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z
    .string()
    .min(1, "Missing NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z
    .string()
    .min(1, "Missing NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"),
  NEXT_PUBLIC_FIREBASE_APP_ID: z
    .string()
    .min(1, "Missing NEXT_PUBLIC_FIREBASE_APP_ID"),
  // Optional AI/feature flags
  NEXT_PUBLIC_AI_PROVIDER: z.string().optional(),
  NEXT_PUBLIC_AI_MODEL: z.string().optional(),
  NEXT_PUBLIC_AI_GLOBAL_ENABLED: z.string().optional(),
});

const serverSchema = z.object({
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1),
  FIREBASE_CLIENT_EMAIL: z.string().email("Invalid FIREBASE_CLIENT_EMAIL"),
  FIREBASE_PRIVATE_KEY: z.string().min(1, "Missing FIREBASE_PRIVATE_KEY"),
  DATABASE_URL: z.string().optional(),
  BIBLE_API_BASE: z.string().optional(),
  BIBLE_API_TOKEN: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  APP_BASE_URL: z.string().url().optional(),
  // Optional AI/feature flags for server context
  AI_PROVIDER: z.string().optional(),
  AI_MODEL: z.string().optional(),
  AI_GLOBAL_ENABLED: z.string().optional(),
});

export type ClientEnv = z.infer<typeof clientSchema>;
export type ServerEnv = z.infer<typeof serverSchema>;

export function getClientEnv(): Partial<ClientEnv> {
  // On the client, process.env contains only NEXT_PUBLIC_* values at build time
  // We avoid throwing to prevent hard crashes in local dev; consumers can warn.
  return {
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID:
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    NEXT_PUBLIC_AI_PROVIDER: process.env.NEXT_PUBLIC_AI_PROVIDER,
    NEXT_PUBLIC_AI_MODEL: process.env.NEXT_PUBLIC_AI_MODEL,
    NEXT_PUBLIC_AI_GLOBAL_ENABLED: process.env.NEXT_PUBLIC_AI_GLOBAL_ENABLED,
  };
}

export function validateClientEnv(env: Partial<ClientEnv>): {
  ok: boolean;
  missing: (keyof ClientEnv)[];
} {
  const result = clientSchema.safeParse(env);
  if (result.success) return { ok: true, missing: [] };
  const missing = result.error.issues.map((i) => i.path[0] as keyof ClientEnv);
  return { ok: false, missing };
}

export function getServerEnv(): ServerEnv | null {
  const raw = {
    NEXT_PUBLIC_FIREBASE_PROJECT_ID:
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
    BIBLE_API_BASE: process.env.BIBLE_API_BASE,
    BIBLE_API_TOKEN: process.env.BIBLE_API_TOKEN,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
    APP_BASE_URL: process.env.APP_BASE_URL,
    AI_PROVIDER: process.env.AI_PROVIDER,
    AI_MODEL: process.env.AI_MODEL,
    AI_GLOBAL_ENABLED: process.env.AI_GLOBAL_ENABLED,
  };
  const parsed = serverSchema.safeParse(raw);
  if (parsed.success) return parsed.data;
  return null;
}
