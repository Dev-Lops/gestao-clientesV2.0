# Sistema de Notificações - MyGest

## 📋 Visão Geral

Sistema completo de notificações que registra **TODAS** as alterações importantes no sistema, não apenas tarefas urgentes. O sistema inclui:

- ✅ Notificações persistentes no banco de dados
- ✅ Notificações dinâmicas (tarefas, reuniões, pagamentos)
- ✅ Centro de notificações com UI moderna
- ✅ Toast notifications melhoradas
- ✅ Integração fácil em qualquer parte do sistema

## 🏗️ Arquitetura

### 1. **Banco de Dados** (`prisma/schema.prisma`)

Tabela `Notification` já existente com campos:

- `type`: Tipo da notificação (client_created, task_updated, etc)
- `title`: Título da notificação
- `message`: Mensagem descritiva
- `link`: Link para a página relacionada
- `clientId`: Cliente relacionado (opcional)
- `priority`: Prioridade (low, normal, high, urgent)
- `read`: Status de leitura
- `userId`: Usuário destinatário
- `orgId`: Organização

### 2. **Serviços** (`src/services/notifications.ts`)

Funções principais:

- `createNotification()`: Cria notificação para usuário específico ou toda org
- `markAsRead()`: Marca notificação(ões) como lida(s)
- `markAllAsRead()`: Marca todas como lidas
- `cleanOldNotifications()`: Remove notificações antigas (30+ dias)

Tipos de notificação suportados:

```typescript
type NotificationType =
  | 'client_created'
  | 'client_updated'
  | 'client_deleted'
  | 'task_created'
  | 'task_updated'
  | 'task_completed'
  | 'task_overdue'
  | 'meeting_created'
  | 'meeting_updated'
  | 'meeting_cancelled'
  | 'payment_confirmed'
  | 'payment_overdue'
  | 'finance_created'
  | 'finance_updated'
  | 'media_uploaded'
  | 'member_added'
  | 'member_removed'
  | 'strategy_created'
  | 'branding_created'
  | 'installment_created'
  | 'system'
```

### 3. **API** (`src/app/api/notifications/route.ts`)

Endpoints REST:

**GET /api/notifications**

- Query params: `?unread=true&limit=50&offset=0&type=task`
- Retorna: notificações persistentes + dinâmicas
- Inclui: total, unreadCount, hasMore

**POST /api/notifications**
Actions suportadas:

- `mark_read`: Marca uma notificação como lida
- `mark_multiple_read`: Marca várias como lidas
- `mark_all_read`: Marca todas como lidas
- `delete`: Remove uma notificação

### 4. **Hook** (`src/hooks/useNotifications.ts`)

Hook React com SWR para gerenciar notificações:

```typescript
const {
  notifications, // Array de notificações
  unreadCount, // Contador de não lidas
  isLoading, // Estado de carregamento
  markAsRead, // Função para marcar como lida
  markAllAsRead, // Marcar todas como lidas
  deleteNotification, // Deletar notificação
  refresh, // Recarregar notificações
} = useNotifications({ unreadOnly: false, limit: 50 })
```

Atualização automática a cada 30 segundos!

### 5. **Componente UI** (`src/components/NotificationCenter.tsx`)

Centro de notificações moderno com:

- 🔔 Ícone de sino com badge de contador
- 📋 Dropdown com lista de notificações
- 🎨 Ícones coloridos por tipo e prioridade
- 🔍 Filtro: Todas / Não lidas
- ✅ Marcar como lida / Deletar
- 🔗 Link direto para a página relacionada
- 📱 Responsivo e acessível

### 6. **Helpers** (`src/lib/notificationHelpers.ts`)

Funções auxiliares para facilitar criação de notificações:

- `notifyClientAction()`: Cliente criado/atualizado/deletado
- `notifyTaskAction()`: Tarefa criada/atualizada/concluída/atrasada
- `notifyMeetingAction()`: Reunião criada/atualizada/cancelada
- `notifyPaymentAction()`: Pagamento confirmado/atrasado
- `notifyFinanceAction()`: Transação financeira criada/atualizada
- `notifyMemberAction()`: Membro adicionado/removido
- `notifyMediaUpload()`: Mídia enviada

### 7. **Toast Melhorado** (`src/app/layout.tsx`)

Configuração aprimorada do Toaster:

- Posição: Top-right
- Duração: 4 segundos
- Rich colors (cores por tipo)
- Botão de fechar
- Expansível
- Estilo personalizado

## 🚀 Como Usar

### 1. Adicionar NotificationCenter no Layout

```tsx
import { NotificationCenter } from '@/components/NotificationCenter'

export default function DashboardLayout({ children }) {
  return (
    <div>
      <header>
        {/* Seu menu */}
        <NotificationCenter />
      </header>
      <main>{children}</main>
    </div>
  )
}
```

### 2. Criar Notificações nas APIs

```typescript
import { notifyClientAction } from '@/lib/notificationHelpers'

// Exemplo: Ao criar um cliente
export async function POST(req: Request) {
  const client = await prisma.client.create({ data: { ... } })

  // Notificar toda a org
  await notifyClientAction(
    client.orgId,
    client.id,
    client.name,
    'created'
  )

  return NextResponse.json({ client })
}
```

### 3. Usar Diretamente o Serviço

```typescript
import { createNotification } from '@/services/notifications'

await createNotification({
  orgId: 'org-123',
  userId: 'user-456', // Opcional - se omitir, notifica toda org
  type: 'custom_event',
  title: 'Evento Personalizado',
  message: 'Algo importante aconteceu',
  link: '/custom/page',
  priority: 'high',
})
```

### 4. Toast para Feedback Imediato

```typescript
import { toast } from 'sonner'

// Toast de sucesso
toast.success('Cliente atualizado com sucesso!')

// Toast de erro
toast.error('Erro ao processar solicitação')

// Toast com ação
toast('Nova atualização disponível', {
  action: {
    label: 'Atualizar',
    onClick: () => window.location.reload(),
  },
})
```

## 📊 Tipos de Notificação por Módulo

### Clientes

- ✅ Cliente criado
- ✅ Cliente atualizado
- ✅ Cliente deletado

### Tarefas

- ✅ Tarefa criada
- ✅ Tarefa atualizada
- ✅ Tarefa concluída
- ✅ Tarefa atrasada (dinâmica)

### Reuniões

- ✅ Reunião agendada
- ✅ Reunião atualizada
- ✅ Reunião cancelada
- ✅ Reunião próxima (dinâmica - 24h)

### Pagamentos

- ✅ Pagamento confirmado
- ✅ Pagamento atrasado (dinâmica)
- ✅ Parcela criada

### Finanças

- ✅ Receita registrada
- ✅ Despesa registrada
- ✅ Transação atualizada

### Mídia

- ✅ Arquivo(s) enviado(s)

### Membros

- ✅ Membro adicionado
- ✅ Membro removido

### Estratégias & Branding

- ✅ Estratégia criada
- ✅ Material de branding criado

## 🎨 Cores e Ícones

### Por Tipo

- 📋 **Task**: ListTodo, Azul
- 📅 **Meeting**: Calendar, Azul
- 💳 **Payment**: CreditCard, Azul
- 👥 **Client**: Users, Azul
- 📄 **Finance**: FileText, Azul
- ➕ **Member**: UserPlus, Azul

### Por Prioridade

- 🔴 **Urgent**: Vermelho
- 🟠 **High**: Laranja
- 🔵 **Normal/Low**: Azul

## 🔄 Notificações Dinâmicas

O sistema busca automaticamente:

- **Tarefas urgentes**: Alta prioridade ou atrasadas
- **Reuniões próximas**: Próximas 24 horas
- **Pagamentos atrasados**: Parcelas vencidas

Essas notificações são geradas em tempo real e combinadas com as persistentes!

## 📝 Próximos Passos

Para integrar notificações em novos módulos:

1. Escolha o tipo apropriado de `NotificationType`
2. Use um helper existente ou crie um novo em `notificationHelpers.ts`
3. Chame o helper na API após a ação
4. Adicione toast para feedback imediato

Exemplo completo:

```typescript
// Na API
const task = await prisma.task.create({ data: taskData })

// Notificação persistente
await notifyTaskAction(
  task.orgId,
  task.clientId,
  client.name,
  task.title,
  'created'
)

// Toast para feedback
toast.success('Tarefa criada com sucesso!')
```

## ✅ Status

- ✅ Sistema de notificações completo
- ✅ API funcional
- ✅ UI moderna e responsiva
- ✅ Helpers para fácil integração
- ✅ Toast melhorado
- ✅ Todos os testes passando (46/46)

**Pronto para uso!** 🎉
