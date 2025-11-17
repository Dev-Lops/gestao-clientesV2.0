// Keep this file isomorphic (usable on server and client) by avoiding
// dependencies on server-only packages like @prisma/client in runtime code.
export type AppRole = 'OWNER' | 'STAFF' | 'CLIENT'

export type AppAction = 'manage' | 'create' | 'read' | 'update' | 'delete'
export type AppResource =
  | 'org'
  | 'client'
  | 'task'
  | 'media'
  | 'member'
  | 'branding'
  | 'strategy'
  | 'finance'
  | 'meeting'
  | 'invite'

const rules: Record<AppRole, Record<AppAction, AppResource[]>> = {
  OWNER: {
    manage: [
      'org',
      'client',
      'task',
      'media',
      'member',
      'branding',
      'strategy',
      'finance',
      'meeting',
      'invite',
    ],
    create: [
      'client',
      'task',
      'media',
      'branding',
      'strategy',
      'finance',
      'meeting',
      'invite',
    ],
    read: [
      'org',
      'client',
      'task',
      'media',
      'member',
      'branding',
      'strategy',
      'finance',
      'meeting',
      'invite',
    ],
    update: [
      'org',
      'client',
      'task',
      'media',
      'member',
      'branding',
      'strategy',
      'finance',
      'meeting',
    ],
    delete: [
      'client',
      'task',
      'media',
      'member',
      'branding',
      'strategy',
      'finance',
      'meeting',
    ],
  },
  STAFF: {
    // STAFF pode gerenciar alguns recursos operacionais e clientes (sem deletar cliente)
    manage: ['client', 'task', 'media', 'branding', 'strategy', 'meeting'],
    create: ['task', 'media', 'branding', 'strategy', 'meeting'],
    read: ['org', 'client', 'task', 'media', 'branding', 'strategy', 'meeting'],
    update: ['client', 'task', 'media', 'branding', 'strategy', 'meeting'],
    delete: ['task', 'media', 'branding', 'strategy', 'meeting'],
  },
  CLIENT: {
    manage: [],
    create: [],
    read: ['client', 'media', 'task', 'branding', 'strategy', 'meeting'],
    update: [],
    delete: [],
  },
}

export function can(role: AppRole, action: AppAction, resource: AppResource) {
  const allowed = rules[role]?.[action]
  return allowed?.includes(resource) ?? false
}
