# ANÁLISE: Tripla Contagem de Receitas no Sistema

## ⚠️ PROBLEMA CRÍTICO IDENTIFICADO

O sistema possui **3 caminhos independentes de cálculo** da receita mensal, cada um com lógica diferente, criando inconsistências graves.

---

## 📊 OS 3 CAMINHOS DE CÁLCULO

### CAMINHO 1: `/api/dashboard/route.ts` (Painel Principal)

**Arquivo:** `src/app/api/dashboard/route.ts` (linhas 320-450)

```typescript
// Busca receitas diretas
const monthFinancesIncome = await prisma.transaction.findMany({
  where: {
    orgId,
    type: 'INCOME',
    date: { gte: monthStart, lte: monthEnd },
  },
  select: { id: true, amount: true },
})

// Busca pagamentos de faturas
const payments = await prisma.transaction.findMany({
  where: {
    orgId,
    subtype: 'INVOICE_PAYMENT', // ← AQUI: pagamentos de faturas
    date: { gte: monthStart, lte: monthEnd },
  },
  select: { id: true, amount: true, invoiceId: true },
})

// Monta mapa de deduplicação
const revenueMap = new Map<string, number>()
for (const f of monthFinancesIncome) {
  const key = `txn:${f.id}`
  revenueMap.set(key, f.amount)
}
for (const p of payments) {
  const key = p.invoiceId ? `inv:${p.invoiceId}` : `pay:${p.id}`
  revenueMap.set(key, p.amount)
}

const receitas = Array.from(revenueMap.values()).reduce((sum, v) => sum + v, 0)
```

**Lógica:**

- Soma `INCOME` direto
- Soma `INVOICE_PAYMENT` (pagamentos de faturas)
- Tenta deduplica usando `invoiceId` como chave

**Problema:** Se uma fatura é paga, ela aparece tanto como INCOME quanto como INVOICE_PAYMENT

---

### CAMINHO 2: `ReportingService.getDashboard()` (Relatório Financeiro)

**Arquivo:** `src/domain/reports/ReportingService.ts` (linhas 12-140)

```typescript
static async getDashboard(orgId: string, dateFrom?: Date, dateTo?: Date) {
  const transactionSummary = await TransactionService.getSummary(
    orgId,
    dateFrom,
    dateTo
  )

  // ... calcula muitas coisas, mas RETORNA:
  return {
    financial: { ...transactionSummary, ... },
    // ...
  }
}
```

**Delega para:** `TransactionService.getSummary()` (linhas 325-410)

---

### CAMINHO 3: `TransactionService.getSummary()` (Serviço de Transação)

**Arquivo:** `src/services/financial/TransactionService.ts` (linhas 325-410)

```typescript
static async getSummary(orgId: string, dateFrom?: Date, dateTo?: Date) {
  // PASSO 1: Chama domínio que soma transações
  const txRepo = new TransactionPrismaRepository(prisma)
  const domainSvc = new DomainTransactionService(txRepo)
  const summary = await domainSvc.summary({
    orgId,
    startDate: startDate,
    endDate: endDate,
  })
  // summary.income = total de INCOME direto

  // PASSO 2: Conta transações (pra estatística)
  const incomesCount = await prisma.transaction.count({
    where: { ...where, type: TransactionType.INCOME },
  })

  // PASSO 3: Faturas pendentes (não pagas)
  const pendingInvoices = await prisma.invoice.aggregate({
    where: {
      orgId,
      status: { not: 'PAID' },
      // ...
    },
    _sum: { total: true },
  })

  const totalIncome = summary.income
  const pendingIncome = pendingInvoices._sum.total || 0

  return {
    totalIncome,          // ← Total INCOME direto
    pendingIncome,        // ← Faturas ainda não pagas
    // ...
  }
}
```

**Lógica:**

- `totalIncome` = total de transações tipo INCOME
- `pendingIncome` = total de faturas com status != PAID

**Problema:** Não conta pagamentos (INVOICE_PAYMENT), então perde receita!

---

## 🔍 EXEMPLOS DE INCONSISTÊNCIA

### Cenário: Fatura de R$ 1.000 paga em Janeiro

**Dados no banco:**

```
Invoice:
  id: inv_001
  total: 1.000
  status: 'PAID'

Transaction (Receita Direto):
  id: txn_001
  type: 'INCOME'
  subtype: 'INVOICE_PAYMENT'
  amount: 1.000
  invoiceId: inv_001
```

**Resultado em cada caminho:**

| Caminho                   | Calcula         | Valor | Status                   |
| ------------------------- | --------------- | ----- | ------------------------ |
| **Painel (Caminho 1)**    | `receitas`      | 1.000 | ✅ Correto               |
| **Relatório (Caminho 2)** | `totalIncome`   | 1.000 | ✅ Correto               |
| **Relatório (Caminho 2)** | `pendingIncome` | 0     | ✅ Correto (fatura paga) |

_Neste caso parece OK, mas..._

---

### Cenário Complexo: Receita mista com Invoice + Pagamento

**Dados no banco:**

```
Transaction 1 (Receita direta):
  id: txn_001
  type: 'INCOME'
  subtype: 'DIRECT'
  amount: 500
  invoiceId: null

Transaction 2 (Pagamento de fatura):
  id: txn_002
  type: 'INCOME'
  subtype: 'INVOICE_PAYMENT'
  amount: 1.000
  invoiceId: inv_001

Invoice 1 (Paga):
  id: inv_001
  total: 1.000
  status: 'PAID'

Invoice 2 (Pendente):
  id: inv_002
  total: 500
  status: 'OPEN'
```

**Resultado em cada caminho:**

| Caminho         | Calcula                   | Valor | Lógica                            |
| --------------- | ------------------------- | ----- | --------------------------------- |
| **Painel 1**    | `receitas`                | 1.500 | `txn_001 (500) + txn_002 (1.000)` |
| **Relatório 2** | `totalIncome`             | 1.500 | `txn_001 (500) + txn_002 (1.000)` |
| **Relatório 2** | `pendingIncome`           | 500   | `inv_002.total` (não paga)        |
| **Dashboard**   | `financial.totalIncome`   | 1.500 | = `totalIncome`                   |
| **Dashboard**   | `financial.pendingIncome` | 500   | = `pendingIncome`                 |

**Interpretação errada:** "Tenho R$ 1.500 de receita e R$ 500 pendente"

- **Realidade:** R$ 1.500 já recebido + R$ 500 ainda a receber = R$ 2.000 total esperado

**Erro:** `pendingIncome` conta faturas **ainda não pagas**, não é adicional à `totalIncome`!

---

## 🚨 O CONFLITO REAL

### Problema 1: Duas definições de "Receita"

**Caminho 1 (Painel Dashboard):**

- Receita = Tudo que chegou na conta (somas de INCOME + INVOICE_PAYMENT)

**Caminhos 2 & 3 (Relatório):**

- Receita = Apenas transações INCOME direto
- Pendente = Faturas não pagas

**Conflito:** São conceitos diferentes no mesmo sistema!

### Problema 2: INVOICE_PAYMENT como INCOME

As transações de pagamento estão com `type: 'INCOME'`, o que é conceitualmente errado:

```typescript
// Quando uma fatura é paga, o código faz:
await transaction.create({
  type: 'INCOME', // ← ERRADO! Não é renda nova
  subtype: 'INVOICE_PAYMENT', // ← É apenas recebimento de cliente
  amount: 1000,
  invoiceId: invoiceId,
})
```

**Deveria ser:**

```typescript
// Opção A: Criar Transaction separada
await transaction.create({
  type: 'RECEIPT', // Novo tipo
  subtype: 'INVOICE_PAYMENT',
  amount: 1000,
  invoiceId: invoiceId,
})

// Opção B: Atualizar Invoice diretamente
await invoice.update({
  status: 'PAID',
  paidAt: new Date(),
  // Sem criar nova Transaction
})
```

### Problema 3: Três implementações inconsistentes

| Aspecto            | Painel                   | Relatório        | Serviço            |
| ------------------ | ------------------------ | ---------------- | ------------------ |
| Query              | Raw Prisma               | ReportingService | TransactionService |
| Tipo de receita    | INCOME + INVOICE_PAYMENT | INCOME only      | INCOME only        |
| Inclui Faturas?    | Não                      | Sim (pending)    | Sim (pending)      |
| Inclui Pagamentos? | Sim                      | Não              | Não                |
| Deduplicação       | Manual (mapa)            | Nenhuma          | Nenhuma            |
| Zona horária       | Local                    | Sem filtro       | Sem filtro         |

---

## 📋 IMPACTO NOS NÚMEROS

### Exemplo Real: Dezembro com Dezembro 31º

```
1º Dec: Invoice de R$ 1.000 criada
10º Dec: Cliente paga a fatura
  → Transaction: type=INCOME, subtype=INVOICE_PAYMENT, amount=1.000

Queries no mês (01-31 de Dec):
- monthFinancesIncome: busca type='INCOME' → Encontra a transação de pagamento
- payments: busca subtype='INVOICE_PAYMENT' → Encontra a mesma transação
- revenueMap: deduplica por invoiceId → Conta 1.000 uma única vez ✅

Mas se houver receita DIRETA (não de fatura):
- 15º Dec: Invoice de R$ 500 criada e paga direto
- monthFinancesIncome: type='INCOME' → Encontra transação de R$ 500 ✅
- payments: subtype='INVOICE_PAYMENT' → Encontra transação de R$ 500
- revenueMap: deduplica → Conta 500 uma única vez ✅

Total em Painel: 1.500 ✅

Mas em ReportingService:
- totalIncome: 1.500 (ambas as transações INCOME) ✅
- pendingIncome: 0 (nenhuma fatura aberta) ✅

PARECE CORRETO... mas não é!
```

---

## 🔴 QUANDO QUEBRA

### Cenário: Receita com e sem Invoice

```
1º Jan: Receita direta (sem Invoice) de R$ 1.000
  → Transaction: type=INCOME, subtype=DIRECT, amount=1.000, invoiceId=null

10º Jan: Invoice de R$ 500 criada e paga
  → Invoice: status=PAID, total=500
  → Transaction: type=INCOME, subtype=INVOICE_PAYMENT, amount=500, invoiceId=inv_001

Painel Dashboard (/api/dashboard):
  monthFinancesIncome = 1.500 (ambas transações)
  payments = 500 (apenas INVOICE_PAYMENT)
  revenueMap = { txn:xyz→1.000, inv:001→500 }
  receitas = 1.500 ✅

ReportingService.getDashboard:
  totalIncome = 1.500 ✅
  pendingIncome = 0 ✅

TransactionService.getSummary (chamado por ReportingService):
  summary.income = 1.500 (domínio soma todas INCOME) ✅
  pendingInvoices = 0 (nenhuma aberta) ✅

Mas observe: não há deduplicação!
Se o mesmo pagamento fosse registrado 2x:
  → Painel: deduplica por invoiceId
  → Relatório: CONTA 2x !!! 🔴
```

---

## 💥 BUG REAL: Fatura Paga Aparece 2x

### Código problemático em `src/services/financial/TransactionService.ts`:

```typescript
// Linha ~358-392: Agregação MANUAL de pagamentos
const paymentAgg = await prisma.transaction.aggregate({
  where: {
    orgId,
    subtype: 'INVOICE_PAYMENT',
    status: TransactionStatus.CONFIRMED,
    date: { gte: dateFrom, lte: dateTo },
  },
  _sum: { amount: true },
})

// Depois combina com summary que JÁ INCLUIU esses pagamentos
const totalIncome = summary.income + (paymentAgg._sum.amount || 0) // DUPLICA!
```

Se o domínio (`DomainTransactionService.summary()`) já soma todos os `INCOME` (que inclui `INVOICE_PAYMENT`),
então agregar `INVOICE_PAYMENT` separado **duplica a receita**!

---

## 🎯 DIAGNÓSTICO FINAL

| Caminho              | Afetado?   | Problemas                                   |
| -------------------- | ---------- | ------------------------------------------- |
| Painel Dashboard     | ✅ CORRETO | Deduplicação manual funciona                |
| Relatório Financeiro | 🔴 ERRADO  | Não conta pagamentos em `totalIncome`       |
| Serviço Transação    | 🔴 ERRADO  | Pode duplicar se agregar INVOICE_PAYMENT 2x |

**Resultado:** Sistema mostra números diferentes dependendo de qual API o frontend chama!

---

## ✅ SOLUÇÃO: Opção A (Transaction Única)

### Passo 1: Eliminar duplicação

```typescript
// Em TransactionService.getSummary():
// REMOVER esta agregação manual de INVOICE_PAYMENT
const paymentAgg = await prisma.transaction.aggregate({...}) // DELETE

// Usar APENAS o summary do domínio
const totalIncome = summary.income  // Já inclui INVOICE_PAYMENT
```

### Passo 2: Normalizar conceptualmente

```typescript
// Transaction.type deve ser apenas:
enum TransactionType {
  INCOME = 'INCOME', // Qualquer entrada (receita + pagamento de fatura)
  EXPENSE = 'EXPENSE',
}

// Transaction.subtype para categorizar:
enum TransactionSubtype {
  DIRECT_INCOME = 'DIRECT_INCOME', // Venda/serviço direto
  INVOICE_PAYMENT = 'INVOICE_PAYMENT', // Pagamento de fatura de cliente
  REFUND = 'REFUND',
  // ...
}
```

### Passo 3: Unificar os cálculos

```typescript
// Todos os 3 caminhos usam ESTA ÚNICA DEFINIÇÃO:
const totalIncome = await TransactionService.getSummary(orgId, dateFrom, dateTo)
// Retorna:
{
  totalIncome: 1500,     // Tudo que entrou (receita + pagamentos)
  pendingIncome: 500,    // Faturas ainda não pagas
  totalExpense: 800,
  netProfit: 700,
}
```

### Passo 4: Remover redundância

```
ANTES:
  /api/dashboard/route.ts     → Query própria de receita
  ReportingService.getDashboard() → Chama TransactionService.getSummary()
  TransactionService.getSummary() → Chama domínio + agrega pagamentos manualmente

DEPOIS:
  /api/dashboard/route.ts     → Chama TransactionService.getSummary()
  ReportingService.getDashboard() → Chama TransactionService.getSummary()
  TransactionService.getSummary() → Chama domínio apenas (sem agregação extra)
```

---

## 📈 Impacto Esperado Pós-Correção

| Métrica                      | Antes            | Depois          |
| ---------------------------- | ---------------- | --------------- |
| Linhas de cálculo financeiro | 3 implementações | 1 implementação |
| Chance de divergência        | Alta             | Mínima          |
| Tempo debug                  | Horas            | Minutos         |
| Consistência                 | Frágil           | Sólida          |
| Mantenibilidade              | Baixa            | Alta            |
