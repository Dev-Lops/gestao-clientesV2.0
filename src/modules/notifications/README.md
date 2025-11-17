# Notifications Module

Estrutura destinada ao domínio de notificações.

## Objetivos
- Centralizar schema (Zod) das notificações
- Fornecer server actions para CRUD leve (mark read, delete, mark all, mark multiple)
- UI composta por componentes server + islands client para melhor performance
- Facilitar testes unitários de normalização

## Estrutura Proposta
```
modules/notifications/
  domain/
    schema.ts          # Zod schemas (próxima tarefa)
    types.ts           # Tipos derivados se necessário
  actions/
    markAsRead.ts      # 'use server' (tarefa futura)
    markMultiple.ts
    markAllRead.ts
    deleteNotification.ts
  ui/
    NotificationCenter.server.tsx  # Wrapper server
    NotificationCenter.client.tsx  # Componente interativo
    NotificationItem.tsx           # Item isolado (tarefa futura)
```

## Próximos Passos
1. Adicionar Zod schema notifications
2. Implementar server actions
3. Componentizar NotificationItem
4. Adicionar focus trap & acessibilidade
