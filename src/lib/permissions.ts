import { Role } from '@/generated/prisma/enums'

type AppAction = 'manage' | 'create' | 'read' | 'update' | 'delete'
type AppResource = 'org' | 'client' | 'task' | 'media' | 'member'

const rules: Record<Role, Record<AppAction, AppResource[]>> = {
  OWNER: {
    manage: ['org', 'client', 'task', 'media', 'member'],
    create: ['client', 'task', 'media'],
    read: ['org', 'client', 'task', 'media', 'member'],
    update: ['org', 'client', 'task', 'media', 'member'],
    delete: ['client', 'task', 'media', 'member'],
  },
  STAFF: {
    manage: ['client', 'task', 'media'],
    create: ['task', 'media'],
    read: ['org', 'client', 'task', 'media'],
    update: ['client', 'task', 'media'],
    delete: ['task', 'media'],
  },
  CLIENT: {
    manage: [],
    create: [],
    read: ['client', 'media', 'task'],
    update: [],
    delete: [],
  },
}

export function can(role: Role, action: AppAction, resource: AppResource) {
  const allowed = rules[role]?.[action]
  return allowed?.includes(resource) ?? false
}
