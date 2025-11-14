// Lightweight feature flags for AI usage across the app
// Client-safe: uses NEXT_PUBLIC_* when present

export type AIConfig = {
  provider: string;
  model: string;
  enabled: boolean;
};

const readBool = (v: string | undefined | null, def = false) => {
  if (v === undefined || v === null) return def;
  return ["1", "true", "yes", "on"].includes(String(v).toLowerCase());
};

export function getAIConfig(): AIConfig {
  // Prefer client-exposed flags if available
  const enabled = readBool(process.env.NEXT_PUBLIC_AI_GLOBAL_ENABLED, true);
  const provider =
    process.env.NEXT_PUBLIC_AI_PROVIDER ||
    process.env.AI_PROVIDER ||
    "anthropic";
  const model =
    process.env.NEXT_PUBLIC_AI_MODEL ||
    process.env.AI_MODEL ||
    "claude-sonnet-4";
  return { provider, model, enabled };
}

export function isAIEnabled(): boolean {
  return getAIConfig().enabled;
}

export function aiModelLabel(): string {
  const a = getAIConfig();
  return `${a.provider}:${a.model}`;
}
