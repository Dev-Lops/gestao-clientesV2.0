# 🎯 Atribuição Automática de Tasks

## 📋 Visão Geral

A partir de agora, quando uma **Task** é criada, ela é **automaticamente atribuída ao owner ou staff** da organização, sem necessidade de fazer isso manualmente.

### Comportamento Padrão

- **Task criada SEM assignee** → Automaticamente atribuído ao **owner da org**
- **Se não houver owner** → Procura um **staff ativo**
- **Se não houver owner ou staff** → Task fica **sem assignee** (null)
- **Task criada COM assignee** → Mantém a atribuição manual ✅

---

## 🔧 Como Usar

### 1. Criar Task com Atribuição Automática (Padrão)

```typescript
// POST /api/tasks/v2
const response = await fetch('/api/tasks/v2', {
  method: 'POST',
  body: JSON.stringify({
    title: 'Revisar contrato',
    orgId: 'org-123',
    priority: 'HIGH',
    clientId: 'client-456',
    dueDate: '2025-12-10',
    // autoAssign NÃO PRECISA SER ENVIADO - padrão é true
  }),
})
```

**Resultado:**

```json
{
  "taskId": "task-789",
  "assignee": "user-owner-id" // ← Atribuído automaticamente!
}
```

---

### 2. Criar Task SEM Atribuição Automática

```typescript
// POST /api/tasks/v2
const response = await fetch('/api/tasks/v2', {
  method: 'POST',
  body: JSON.stringify({
    title: 'Revisar contrato',
    orgId: 'org-123',
    priority: 'HIGH',
    clientId: 'client-456',
    dueDate: '2025-12-10',
    autoAssign: false, // Desativa atribuição automática
  }),
})
```

**Resultado:**

```json
{
  "taskId": "task-789",
  "assignee": null // ← Sem assignee
}
```

---

### 3. Criar Task com Assignee Específico

```typescript
// POST /api/tasks/v2
const response = await fetch('/api/tasks/v2', {
  method: 'POST',
  body: JSON.stringify({
    title: 'Revisar contrato',
    orgId: 'org-123',
    priority: 'HIGH',
    clientId: 'client-456',
    assignee: 'user-specific-id', // Atribuição manual
    dueDate: '2025-12-10',
  }),
})
```

**Resultado:**

```json
{
  "taskId": "task-789",
  "assignee": "user-specific-id" // ← Mantém atribuição manual
}
```

---

## 📊 Fluxo de Atribuição

```
Task criada
    ↓
assignee foi enviado?
    ├─ SIM → Usa assignee enviado ✅
    └─ NÃO
        ↓
    autoAssign === false?
        ├─ SIM → Task sem assignee ❌
        └─ NÃO (padrão)
            ↓
        Procura Owner da Org
            ├─ ENCONTRADO → Atribui ao Owner ✅
            └─ NÃO ENCONTRADO
                ↓
            Procura Staff Ativo (primeiro cadastrado)
                ├─ ENCONTRADO → Atribui ao Staff ✅
                └─ NÃO ENCONTRADO → Task sem assignee ⚠️
```

---

## 🛠️ Implementação Técnica

### Serviço de Atribuição: `TaskAssignmentService`

**Localização:** `src/core/domain/task/services/task-assignment.service.ts`

**Responsabilidades:**

1. Buscar o responsável (owner ou staff)
2. Listar todos os usuários atribuíveis
3. Distribuir tasks de forma equilibrada

**Métodos:**

```typescript
// Obtém o usuário responsável (prioritário: owner > staff > null)
async getResponsibleUser(orgId: string): Promise<string | null>

// Obtém todos os usuários atribuíveis
async getAssignableUsers(orgId: string): Promise<string[]>

// Distribui tasks de forma equilibrada (menos sobrecarregado)
async getBalancedAssignee(orgId: string): Promise<string | null>
```

---

### Use Case Modificado: `CreateTaskUseCase`

**Localização:** `src/core/use-cases/task/create-task.use-case.ts`

**Mudanças:**

- ✅ Recebe `TaskAssignmentService` via injeção de dependência
- ✅ Se não houver `assignee` e `autoAssign === true`, busca responsável
- ✅ Retorna também o `assignee` atribuído

```typescript
export interface CreateTaskOutput {
  taskId: string
  assignee: string | null // ← Novo: retorna quem foi atribuído
}

export const CreateTaskInputSchema = z.object({
  // ... campos anteriores
  autoAssign: z.boolean().optional().default(true), // ← Novo
})
```

---

### Controller Atualizado: `TaskController`

**Localização:** `src/infrastructure/http/controllers/task.controller.ts`

**Mudanças:**

- ✅ Recebe `PrismaClient` no construtor
- ✅ Passa `PrismaClient` para `CreateTaskUseCase`
- ✅ Ativa `TaskAssignmentService` automaticamente

---

## 🧪 Exemplos de Teste

### Teste 1: Atribuição ao Owner

```javascript
// Setup: Org com owner
const response = await fetch('/api/tasks/v2', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Test Task',
    orgId: 'org-with-owner',
    priority: 'MEDIUM',
  }),
})

const result = await response.json()
console.log(result.assignee) // → 'owner-user-id'
```

### Teste 2: Atribuição ao Staff (quando não há owner)

```javascript
// Setup: Org sem owner, mas com staff
const response = await fetch('/api/tasks/v2', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Test Task',
    orgId: 'org-no-owner-with-staff',
    priority: 'MEDIUM',
  }),
})

const result = await response.json()
console.log(result.assignee) // → 'staff-user-id'
```

### Teste 3: Sem Atribuição Automática

```javascript
const response = await fetch('/api/tasks/v2', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Test Task',
    orgId: 'org-123',
    priority: 'MEDIUM',
    autoAssign: false,
  }),
})

const result = await response.json()
console.log(result.assignee) // → null
```

---

## 🎯 Funcionalidades Futuras

### ✨ Distribuição Equilibrada

Opcionalmente, pode usar `getBalancedAssignee()` para distribuir tasks entre owner/staff com base na carga atual:

```typescript
// Usa: TaskAssignmentService.getBalancedAssignee(orgId)
// Retorna o usuário com MENOS tasks ativas
```

### 📈 Analytics

Adicionar dashboard mostrando:

- Tasks atribuídas por usuário
- Taxa de distribuição
- Carga de trabalho

---

## ❌ Troubleshooting

### Problem: Task sem assignee mesmo com owner presente

**Causa:** `autoAssign: false` foi enviado

**Solução:** Remova `autoAssign: false` ou envie `autoAssign: true`

### Problem: Task atribuída ao staff quando há owner

**Causa:** Owner não foi encontrado corretamente

**Verificação:**

```sql
SELECT id, ownerId FROM org WHERE id = 'org-id';
SELECT id, name, firebaseUid FROM user WHERE id = 'owner-id';
```

### Problem: TypeScript error ao usar nova feature

**Causa:** Versão desatualizada da types

**Solução:**

```bash
pnpm tsc --noEmit # Verifica erros
pnpm install # Atualiza dependências
```

---

## 📝 Changelog

### v1.0 - Atribuição Automática (2025-12-05)

- ✅ `TaskAssignmentService` - Gerencia atribuição automática
- ✅ Prioridade: Owner > Staff > null
- ✅ Parâmetro `autoAssign` para controlar comportamento
- ✅ Retorna `assignee` na resposta de criação
- ✅ Type-safe com Zod

---

## 🚀 Como Integrar na Frontend

### React Hook para Criar Task

```typescript
const createTask = async (taskData) => {
  const response = await fetch('/api/tasks/v2', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...taskData,
      // autoAssign padrão é true - não precisa enviar
    }),
  })

  const { taskId, assignee } = await response.json()

  // Mostrar feedback ao usuário
  toast.success(`Task criada e atribuída a ${assignee ? 'usuário' : 'ninguém'}`)

  return { taskId, assignee }
}
```

---

## 📞 Suporte

Para dúvidas ou melhorias, verifique:

1. `TaskAssignmentService` - Lógica de atribuição
2. `CreateTaskUseCase` - Fluxo de criação
3. `/api/tasks/v2` - Endpoint HTTP
