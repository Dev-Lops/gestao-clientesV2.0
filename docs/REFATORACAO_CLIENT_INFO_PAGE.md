# 🔧 REFATORAÇÃO COMPLETA - Client Info Page + Resolução Endpoint #4

**Data:** Dezembro 2025  
**Fase:** Resolução de Problema #4 + Refatoração UI/UX  
**Escopo:** Consolidar endpoints inconsistentes usando ReportingService unificado

---

## 📋 Contexto do Problema #4

### Inconsistência Atual

```
/api/dashboard
├─ Query própria para clientes
├─ Query própria para tarefas
├─ Query própria para finanças
└─ Cálculos manuais duplicados ❌

/api/reports/dashboard
├─ Usa ReportingService.getDashboard()
├─ Cálculos unificados
├─ Sem duplicação
└─ Source of truth ✅

/clients/[id]/info (ClientInfoPage)
├─ Chama getClientDashboard() (próprio serviço)
├─ Query duplicada do /api/dashboard
├─ Cálculos por conta
└─ Inconsistente com reports ❌
```

**Resultado:** 3 fontes de dados diferentes para mesmas métricas → números divergem

---

## 🎯 Objetivo da Refatoração

Consolidar TODOS os endpoints para usar **ReportingService** como source of truth:

```
ANTES:
  /api/dashboard → Query própria
  /api/reports/dashboard → ReportingService
  /clients/[id]/info → getClientDashboard próprio
  ❌ Números divergem

DEPOIS:
  /api/dashboard → ReportingService.getDashboard()
  /api/reports/dashboard → ReportingService.getDashboard()
  /clients/[id]/info → ReportingService.getClientDashboard()
  ✅ UMA FONTE DE VERDADE
```

---

## 📊 Análise Atual

### ClientInfoPage (`src/app/(dashboard)/clients/[id]/info/page.tsx`)

**Tamanho:** 869 linhas  
**Complexidade:** ALTA  
**Problemas:**

1. ❌ Server component monolítico
2. ❌ Muita lógica de cálculo inline
3. ❌ Usa `getClientDashboard()` (query própria)
4. ❌ Não mobile-first responsive
5. ❌ Sem separação de concerns
6. ❌ Difícil de testar
7. ❌ Duplica lógica de `/api/dashboard`

### getClientDashboard Service

**Arquivo:** `src/services/clients/getClientDashboard.ts`

**Problema:** Query própria, não usa ReportingService

---

## 🏗️ Arquitetura Proposta

### Estrutura Nova

```
src/app/(dashboard)/clients/[id]/info/
├── page.tsx (página server, 150 linhas)
│   ├─ Busca data via ReportingService
│   ├─ Passes props para ClientInfoPage
│   └─ Responsável por layout principal
│
├── ClientInfoPageClient.tsx (client component, 450 linhas)
│   ├─ Renderiza todos os cards
│   ├─ Estado de interação (editar, etc)
│   └─ Sem lógica de cálculo
│
└── components/
    ├── KpiSection.tsx (KPIs do cliente)
    ├── FinancialOverview.tsx (Resumo executivo)
    ├── TaskPerformance.tsx (Desempenho de tarefas)
    ├── AlertsCard.tsx (Alertas inteligentes)
    ├── TrendsCard.tsx (Tendências 30 dias)
    ├── UrgentTasksCard.tsx (Tarefas urgentes)
    ├── NextMeetingCard.tsx (Próxima reunião)
    ├── DuePaymentCard.tsx (Próximo vencimento)
    ├── MediaLibrary.tsx (Biblioteca de mídia)
    └── MeetingHistory.tsx (Histórico de reuniões)
```

### Dados Vindo de ReportingService

```typescript
const data = await ReportingService.getClientDashboard(orgId, clientId)

// Retorna:
{
  client: { ...AppClient },
  financial: { totalIncome, totalExpense, netProfit, ... },
  invoices: { open, overdue, ... },
  tasks: { total, completed, inProgress, pending, urgent, ... },
  meetings: { total, upcoming, past, ... },
  media: { total, byType: { images, videos, docs } },
  trends: { tasksCreated30d, meetings30d, media30d, financeNet30d, ... },
  alerts: [ { type, label, href }, ... ],
  urgentTasks: [ { id, title, priority, dueDate }, ... ],
  upcomingMeeting: { id, title, startTime } | null,
  nextDueDate: Date | null,
}
```

---

## ✅ PASSO 1: Consolidar Endpoints

### 1.1 Estender ReportingService

**Arquivo:** `src/domain/reports/ReportingService.ts`

```typescript
// ADICIONAR método novo
static async getClientDashboard(
  orgId: string,
  clientId: string,
  now: Date = new Date()
) {
  // Busca dados do cliente específico
  // Calcula métricas relacionadas
  // Retorna formato único e confiável
}
```

**Benefícios:**

- ✅ Source of truth centralizado
- ✅ Reutilizável em múltiplos endpoints
- ✅ Testável
- ✅ Sem duplicação

### 1.2 Atualizar `/api/dashboard`

**Arquivo:** `src/app/api/dashboard/route.ts`

**De:** Query próprias duplicadas  
**Para:** Usar `ReportingService.getDashboard()`

```typescript
// ANTES
const monthIncome = await prisma.transaction.findMany(...)
const monthExpenses = await prisma.transaction.findMany(...)

// DEPOIS
const reportData = await ReportingService.getDashboard(orgId, dateFrom, dateTo)
const monthIncome = reportData.financial.totalIncome
const monthExpenses = reportData.financial.totalExpense
```

**Resultado:**

- ✅ Uma query path
- ✅ Mesmos números que `/api/reports/dashboard`
- ✅ Performance otimizada (cache se usar)

### 1.3 Atualizar `/clients/[id]/info`

**Arquivo:** `src/app/(dashboard)/clients/[id]/info/page.tsx`

**De:** `getClientDashboard()` query própria  
**Para:** `ReportingService.getClientDashboard()`

```typescript
// ANTES
const dash = await getClientDashboard(orgId, id)

// DEPOIS
const dash = await ReportingService.getClientDashboard(orgId, id)
```

**Resultado:**

- ✅ Mesmos números que `/api/dashboard`
- ✅ Mesmos números que `/api/reports/dashboard`
- ✅ UMA FONTE DE VERDADE

---

## ✅ PASSO 2: Refatorar ClientInfoPage

### 2.1 Dividir em Componentes

**Arquivo:** `src/app/(dashboard)/clients/[id]/info/page.tsx` (869 linhas)

**Refatoração:**

```
page.tsx (150 linhas)
├─ Server component
├─ Busca dados via ReportingService
├─ Passa props para ClientInfoPageClient
└─ Layout grid principal

ClientInfoPageClient.tsx (400 linhas)
├─ Client component ("use client")
├─ Renderiza todos os cards
├─ Gerencia estado local (editar, etc)
└─ Sem cálculos, apenas layout

components/
├─ KpiSection.tsx (80 linhas)
├─ FinancialOverview.tsx (120 linhas)
├─ TaskPerformance.tsx (100 linhas)
├─ AlertsCard.tsx (80 linhas)
├─ TrendsCard.tsx (100 linhas)
├─ UrgentTasksCard.tsx (100 linhas)
├─ NextMeetingCard.tsx (100 linhas)
├─ DuePaymentCard.tsx (80 linhas)
├─ MediaLibrary.tsx (100 linhas)
└─ MeetingHistory.tsx (100 linhas)
```

### 2.2 Mobile-First Responsiveness

**Aplicar padrão do TasksPanel:**

```tsx
// Espaçamento
className = 'px-3 sm:px-4 md:px-6 lg:px-8'

// Grid responsivo
className = 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'

// Tamanho de texto
className = 'text-sm sm:text-base md:text-lg'

// Cards
className = 'p-3 sm:p-4 md:p-6'
```

### 2.3 Testes e Type Safety

**Criar testes para:**

- ✅ Cálculo de métricas
- ✅ Filtro de alertas
- ✅ Parsing de datas
- ✅ Responsiveness

---

## ✅ PASSO 3: Implementação

### 3.1 ReportingService.getClientDashboard()

```typescript
// src/domain/reports/ReportingService.ts

static async getClientDashboard(orgId: string, clientId: string, now?: Date) {
  const dateNow = now || new Date()

  // 1. Buscar cliente
  const client = await prisma.client.findUnique({
    where: { id: clientId, orgId },
  })

  // 2. Buscar tarefas do cliente
  const tasks = await prisma.task.findMany({
    where: { clientId, deletedAt: null },
  })

  // 3. Buscar reuniões
  const meetings = await prisma.meeting.findMany({
    where: { clientId },
  })

  // 4. Buscar transações financeiras
  const transactions = await prisma.transaction.findMany({
    where: { clientId, deletedAt: null },
  })

  // 5. Buscar faturas
  const invoices = await prisma.invoice.findMany({
    where: { clientId },
  })

  // 6. Calcular agregações
  const stats = {
    tasks: {
      total: tasks.length,
      completed: tasks.filter(t => isDone(t.status)).length,
      inProgress: tasks.filter(t => isInProgress(t.status)).length,
      pending: tasks.filter(t => isPending(t.status)).length,
      urgent: tasks.filter(t => isUrgent(t)).length,
      overdue: tasks.filter(t => isOverdue(t)).length,
    },
    meetings: {
      total: meetings.length,
      upcoming: meetings.filter(m => m.startTime > dateNow).length,
      past: meetings.filter(m => m.startTime <= dateNow).length,
    },
    financial: {
      income: transactions.filter(t => t.type === 'INCOME').sum('amount'),
      expense: transactions.filter(t => t.type === 'EXPENSE').sum('amount'),
      net: income - expense,
    },
    media: {
      total: await prisma.media.count({ where: { clientId } }),
      byType: { images: ..., videos: ..., documents: ... },
    },
  }

  // 7. Calcular alertas
  const alerts = []
  if (stats.tasks.overdue > 0) alerts.push(...)

  // 8. Calcular tendências 30d
  const trends = {
    tasksCreated30dPct: ...,
    meetings30dPct: ...,
  }

  return {
    client,
    tasks,
    meetings,
    transactions,
    invoices,
    stats,
    alerts,
    trends,
    // ... mais dados
  }
}
```

### 3.2 Atualizar `/api/dashboard`

```typescript
// src/app/api/dashboard/route.ts

export async function GET(req: NextRequest) {
  // ... auth ...

  // Usar ReportingService em vez de queries próprias
  const reportData = await ReportingService.getDashboard(
    orgId,
    rangeStart,
    rangeEnd
  )

  // Mapear para formato esperado pelo frontend
  return NextResponse.json({
    clients: await prisma.client.findMany(...),
    tasks: reportData.financial.recentTasks,
    metrics: {
      totals: { ... },
      mostPendingClient: ...,
    },
    financialData: await this.getFinancialData(...),
  })
}
```

### 3.3 Refatorar page.tsx

```typescript
// src/app/(dashboard)/clients/[id]/info/page.tsx

import { ClientInfoPageClient } from './ClientInfoPageClient'

export default async function ClientInfoPage({ params }: Props) {
  const { id } = await params
  const { orgId } = await getSessionProfile()

  // 1. Buscar dados via ReportingService (uma única fonte)
  const dashData = await ReportingService.getClientDashboard(orgId, id)

  // 2. Buscar permissões
  const { role } = await getSessionProfile()

  // 3. Passar para cliente component
  return (
    <ProtectedRoute>
      <div className="min-h-screen...">
        <div className="max-w-[1600px] mx-auto...">
          <ClientInfoPageClient
            dashData={dashData}
            role={role}
          />
        </div>
      </div>
    </ProtectedRoute>
  )
}
```

### 3.4 Criar ClientInfoPageClient

```typescript
// src/app/(dashboard)/clients/[id]/info/ClientInfoPageClient.tsx

'use client'

import { KpiSection } from './components/KpiSection'
import { FinancialOverview } from './components/FinancialOverview'
// ... importar todos componentes

export function ClientInfoPageClient({ dashData, role }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <Header client={dashData.client} />

      {/* KPIs */}
      <KpiSection tasks={dashData.stats.tasks} />

      {/* Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <FinancialOverview financial={dashData.stats.financial} />
          <TaskPerformance tasks={dashData.tasks} />
        </div>

        <div className="space-y-6">
          <AlertsCard alerts={dashData.alerts} />
          <TrendsCard trends={dashData.trends} />
        </div>
      </div>
    </div>
  )
}
```

---

## 📋 Checklist de Implementação

### PASSO 1: ReportingService

- [ ] Criar `ReportingService.getClientDashboard()`
- [ ] Testar método com dados reais
- [ ] Verificar performance

### PASSO 2: Atualizar `/api/dashboard`

- [ ] Substituir queries próprias
- [ ] Usar ReportingService
- [ ] Testar consistência de dados

### PASSO 3: Refatorar ClientInfoPage

- [ ] Dividir em componentes menores
- [ ] Criar ClientInfoPageClient.tsx
- [ ] Criar pasta components/ com 10 componentes

### PASSO 4: Mobile-First

- [ ] Aplicar responsive design
- [ ] Testar em mobile/tablet
- [ ] Validar acessibilidade

### PASSO 5: Testes

- [ ] Unit tests para cálculos
- [ ] E2E test para página
- [ ] TypeScript compilation
- [ ] Git commit

---

## 🎯 Benefícios Esperados

### Antes (Atual)

```
Problema #4 Endpoints Inconsistentes
- /api/dashboard: seus números
- /api/reports: seus números
- /clients/[id]/info: seus números
❌ Impossível confiar em métricas
❌ Difícil de debugar
❌ Código duplicado em 3 lugares
```

### Depois (Proposto)

```
UMA FONTE DE VERDADE
- ReportingService → all endpoints
- Todos usam mesma lógica
- Números sempre consistentes
✅ Confiável
✅ Fácil de debugar
✅ Sem duplicação
```

---

## ⏱️ Timeline

| Fase      | Tarefa                      | Tempo    | Status |
| --------- | --------------------------- | -------- | ------ |
| 1         | Estender ReportingService   | 1h       | ⏳     |
| 2         | Atualizar /api/dashboard    | 30m      | ⏳     |
| 3         | Refatorar ClientInfoPage    | 2h       | ⏳     |
| 4         | Mobile-first responsiveness | 1h       | ⏳     |
| 5         | Testes + git                | 1h       | ⏳     |
| **Total** |                             | **5.5h** |        |

---

## 📝 Documentação de Tipos

```typescript
// Tipo de dados retornado por ReportingService.getClientDashboard()
type ClientDashboardData = {
  client: AppClient
  tasks: {
    total: number
    completed: number
    inProgress: number
    pending: number
    urgent: number
    overdue: number
  }
  meetings: {
    total: number
    upcoming: number
    past: number
  }
  financial: {
    income: number
    expense: number
    net: number
  }
  media: {
    total: number
    byType: {
      images: number
      videos: number
      documents: number
    }
  }
  trends: {
    tasksCreated30dPct: number
    meetings30dPct: number
    media30dPct: number
    financeNet30dPct: number
  }
  alerts: Array<{
    type: 'danger' | 'warning' | 'info'
    label: string
    href: string
  }>
  urgentTasks: Task[]
  upcomingMeeting: Meeting | null
  nextDueDate: Date | null
}
```

---

## 🚀 Próximos Passos

1. ✅ **Hoje:** Documentação de refatoração (este arquivo)
2. ⏳ **Próximo:** Implementar ReportingService.getClientDashboard()
3. ⏳ **Depois:** Refatorar ClientInfoPage em componentes
4. ⏳ **Final:** Testes e validação

Ao final: **Zero endpoints inconsistentes**, **100% confiabilidade de dados** ✅
