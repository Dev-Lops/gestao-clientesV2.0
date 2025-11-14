// Keep this file isomorphic (usable on server and client) by avoiding
// dependencies on server-only packages like @prisma/client in runtime code.
export type AppRole = "OWNER" | "STAFF" | "CLIENT";

export type AppAction = "manage" | "create" | "read" | "update" | "delete";
export type AppResource =
  | "org"
  | "client"
  | "task"
  | "media"
  | "member"
  | "branding"
  | "strategy"
  | "finance";

const rules: Record<AppRole, Record<AppAction, AppResource[]>> = {
  OWNER: {
    manage: [
      "org",
      "client",
      "task",
      "media",
      "member",
      "branding",
      "strategy",
      "finance",
    ],
    create: ["client", "task", "media", "branding", "strategy", "finance"],
    read: [
      "org",
      "client",
      "task",
      "media",
      "member",
      "branding",
      "strategy",
      "finance",
    ],
    update: [
      "org",
      "client",
      "task",
      "media",
      "member",
      "branding",
      "strategy",
      "finance",
    ],
    delete: [
      "client",
      "task",
      "media",
      "member",
      "branding",
      "strategy",
      "finance",
    ],
  },
  STAFF: {
    manage: ["client", "task", "media", "branding", "strategy"],
    create: ["task", "media", "branding", "strategy"],
    read: ["org", "client", "task", "media", "branding", "strategy"],
    update: ["client", "task", "media", "branding", "strategy"],
    delete: ["task", "media", "branding", "strategy"],
  },
  CLIENT: {
    manage: [],
    create: [],
    read: ["client", "media", "task", "branding", "strategy"],
    update: [],
    delete: [],
  },
};

export function can(role: AppRole, action: AppAction, resource: AppResource) {
  const allowed = rules[role]?.[action];
  return allowed?.includes(resource) ?? false;
}
