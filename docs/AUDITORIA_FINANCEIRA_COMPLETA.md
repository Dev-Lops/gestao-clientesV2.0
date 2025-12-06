# 🔴 AUDITORIA COMPLETA - GESTÃO FINANCEIRA

**Data:** 5 de Dezembro de 2025  
**Status:** ❌ CRÍTICO - Múltiplos problemas encontrados  
**Prioridade:** MÁXIMA

---

## 1. PROBLEMAS CRÍTICOS ENCONTRADOS

### 🔴 PROBLEMA 1: Dupla Contagem de Receitas (Payment + Transaction)

**Arquivo:** `src/services/financial/TransactionService.ts:325-411`

O sistema está contando receitas **2 VEZES**:

```typescript
// 1ª contagem: Transactions tipo INCOME
const transactionSummary = await TransactionService.getSummary(...)

// 2ª contagem: Payments confirmadas NOVAMENTE (duplicação!)
const payments = await prisma.payment.findMany({
  where: { paidAt: { gte: monthStart, lt: monthEnd } }
})

// Resultado: Income relatado = transactionSummary.totalIncome + payments.amount (ERRADO!)
```

**Impacto:** Receitas aparecem 2x maiores do que realmente são.

**Solução:** Você tem 2 arquiteturas diferentes conflitando:

- ✅ **Nova (clean):** Transaction → INCOME/EXPENSE separados
- ❌ **Antiga (suja):** Payment → Ligado a Invoice

**Decisão de negócio necessária:** Escolher UMA única fonte da verdade.

---

### 🔴 PROBLEMA 2: Payment Repository Mapeando Para Transaction

**Arquivo:** `src/infrastructure/database/repositories/prisma-payment.repository.ts`

```typescript
// Payment está sendo salva como Transaction!
private mapToTransaction(payment: Payment) {
  return {
    type: TransactionType.INCOME,
    subtype: TransactionSubtype.INVOICE_PAYMENT,
    category: 'payment',  // Marcação estranha
    // ...
  }
}
```

**O Problema:**

- Payment deveria ser uma entidade separada
- Está sendo "forçada" dentro de Transaction
- Cria confusão de responsabilidades

**Impacto:** Impossível distinguir receitas legítimas de pagamentos de invoices.

---

### 🔴 PROBLEMA 3: Falta de Modelo Payment no Prisma

**Schema Prisma:** Não há `model Payment`

Mas existe:

- `Transaction` (INCOME/EXPENSE)
- `Invoice` (com `paidAt`)
- `Installment` (com status PENDING/...)
- `RecurringExpense`

**Não há clareza sobre:**

- Onde os pagamentos de invoices são registrados?
- É Transaction com `subtype: INVOICE_PAYMENT`?
- É a data `Invoice.paidAt`?
- É um status do `Installment`?

---

### 🔴 PROBLEMA 4: Duas Formas de Calcular Receita Não Se Sincronizam

**Caminho A (Errado):** `getDashboard` usa `TransactionService.getSummary`

```typescript
// src/domain/reports/ReportingService.ts:22
const transactionSummary = await TransactionService.getSummary(
  orgId,
  dateFrom,
  dateTo
)
```

**Caminho B (Errado):** `getDashboard` depois soma `payments` NOVAMENTE

```typescript
// src/app/api/dashboard/route.ts:432
const receitas = Array.from(revenueMap.values()).reduce((s, v) => s + v, 0)
// revenueMap contém TRANSAÇÕES + PAYMENTS → DUPLA CONTAGEM
```

**Resultado:** 2 endpoints (dashboard vs reports) retornam números diferentes!

---

### 🔴 PROBLEMA 5: TransactionPrismaRepository vs TransactionService

Existem **2 implementações diferentes** do mesmo conceito:

| Localização                                                                 | Função                             | Problema                  |
| --------------------------------------------------------------------------- | ---------------------------------- | ------------------------- |
| `src/infrastructure/prisma/TransactionPrismaRepository.ts`                  | Domain layer - simple create/read  | Não filtra status         |
| `src/services/financial/TransactionService.ts`                              | Application layer - listar/resumir | Lógica complexa duplicada |
| `src/infrastructure/database/repositories/prisma-transaction.repository.ts` | Outra implementação domain!        | Código duplicado          |

**3 implementações de quase a mesma coisa!**

---

### 🔴 PROBLEMA 6: Status de Transaction Não Sendo Usado Corretamente

```prisma
model Transaction {
  status      TransactionStatus  @default(CONFIRMED)  // ← Sempre CONFIRMED?
  // ...
}
```

**Valores possíveis:** CONFIRMED, PENDING, CANCELLED

Mas o código só busca CONFIRMED:

```typescript
where: {
  status: TransactionStatus.CONFIRMED
}
```

**Perguntas:**

- Como uma transação fica PENDING?
- Quando é criada? Após quanto tempo?
- Quem a confirma?
- Há lógica de movimentação de caixa demorada?

---

### 🔴 PROBLEMA 7: Despesas Recorrentes Nunca São Materializadas Automaticamente

```typescript
// src/app/api/recurring-expenses/[id]/materialize/route.ts
// Manual endpoint para materializar UMA despesa
// Nunca é chamado automaticamente!
```

**Expectativa:** Primeiro dia do mês, criar transações automáticas  
**Realidade:** Alguém tem que clicar no botão

**Impacto:** Relatório de despesas de mês novo fica incompleto.

---

### 🔴 PROBLEMA 8: Invoice.paidAt vs Transaction.date Dessincronizados

```typescript
// Quando aprova pagamento de invoice:
async approvePayment(...) {
  invoice.paidAt = new Date()  // ← Invoice marcada como paga

  // Mas quando cria a Transaction?
  // E com qual data?
}
```

**Cenário problemático:**

- Invoice vencida em 01/12
- Pagamento confirmado em 15/12
- Transaction criada com data 15/12?
- Então falta de 01/12 até 14/12?

---

## 2. PROBLEMAS DE ARQUITETURA

### ⚠️ Falta de Reconciliação Automática

Não há processo que:

1. Compare `Invoice.total` = soma de `InvoiceItem`
2. Compare `Invoice.paidAt` = `Transaction` com `subtype: INVOICE_PAYMENT`
3. Valide que toda receita tem origem documentada
4. Detecte transações órfãs

### ⚠️ Sem Auditoria de Mudanças

Campos como:

- `createdBy`, `updatedBy`, `deletedBy`, `deletedAt`

Existem no schema, mas não há:

- Criação automática (quem realmente fez?)
- Validação de permissões
- Histórico de alterações (audit log)

### ⚠️ Cálculos de Caixa (Cash) Confusos

```typescript
// Qual é "caixa"?
cashOnHand = incomeToDate - expenseToDate // Desde quando?
cashOnHandMonthly = incomePeriod - expensePeriod // Qual período?
```

**Deveria ser:**

- **Caixa Acumulado:** Desde origem até hoje
- **Caixa do Mês:** Apenas período selecionado
- **Projeção:** baseado em frequências de receitas/despesas

---

## 3. RECOMENDAÇÕES IMEDIATAS

### ✅ PASSO 1: Escolher Arquitetura Única

**Opção A (Recomendada):** Usar apenas Transaction

```
Invoice (pedido/contrato)
  ↓
InvoiceItem (itens cobrados)
  ↓
Transaction INCOME quando paga
  (com invoiceId linkado)
```

**Opção B:** Manter Payment separado

```
Invoice
  ↓
Payment (quando pago)
  ↓
Transaction INCOME (mirror do Payment)
```

**Opção C (NÃO):** Continuar com ambas → vai continuar errado

---

### ✅ PASSO 2: Criar View/Query Consolidada

```sql
-- Receita Verdadeira de um Período
SELECT
  SUM(amount) as totalIncome
FROM Transaction
WHERE orgId = ?
  AND type = 'INCOME'
  AND date BETWEEN ? AND ?
  AND status = 'CONFIRMED'
  AND deletedAt IS NULL
```

**Usar EM TODOS os relatórios** (não duplicar cálculo).

---

### ✅ PASSO 3: Automatizar Materialização de Despesas

```typescript
// Scheduler (via cron ou edge function)
// 1º dia de cada mês
async function materializeRecurringExpenses(orgId: string) {
  const recurring = await prisma.recurringExpense.findMany({
    where: { orgId, active: true, cycle: 'MONTHLY' },
  })

  for (const exp of recurring) {
    await createExpenseTransaction({
      orgId,
      type: 'EXPENSE',
      subtype: 'FIXED_EXPENSE',
      amount: exp.amount,
      date: new Date(), // 1º do mês
      description: exp.name,
    })
  }
}
```

---

### ✅ PASSO 4: Validar Invoice = Soma de Items

```typescript
// Sempre que salva Invoice
const sumItems = invoice.items.reduce((s, i) => s + i.total, 0)
const expectedTotal = sumItems - invoice.discount + invoice.tax

if (expectedTotal !== invoice.total) {
  throw new Error('Total da fatura não bate com itens')
}
```

---

## 4. BUGS CONHECIDOS (Encontrados)

| #   | Bug                                     | Arquivo                             | Status       |
| --- | --------------------------------------- | ----------------------------------- | ------------ |
| 1   | `lt` em vez de `lte` na query de range  | `TransactionPrismaRepository.ts:40` | ✅ CORRIGIDO |
| 2   | Dupla contagem de receitas              | `TransactionService.ts:325+`        | 🔴 ABERTO    |
| 3   | Payment forçado em Transaction          | `PrismaPaymentRepository.ts`        | 🔴 ABERTO    |
| 4   | Sem modelo Payment no Prisma            | `schema.prisma`                     | 🔴 ABERTO    |
| 5   | Status de Transaction não usado         | `TransactionService.ts`             | 🔴 ABERTO    |
| 6   | Despesas recorrentes não materializadas | `RecurringExpenseService.ts`        | 🔴 ABERTO    |

---

## 5. PLANO DE CORREÇÃO (Sequência)

### Fase 1: Auditoria Completa (Hoje)

- [ ] Exportar todos os dados de Transaction
- [ ] Exportar todos os dados de Payment
- [ ] Exportar todos os dados de Invoice.paidAt
- [ ] Comparar se há duplicações
- [ ] Gerar relatório de discrepâncias

### Fase 2: Decisão de Arquitetura (2-3 dias)

- [ ] Stakeholder decide: Payment ou apenas Transaction?
- [ ] Documentar fluxo decidido
- [ ] Validar com exemplos reais

### Fase 3: Refactoring (1 semana)

- [ ] Eliminar uma das implementações conflitantes
- [ ] Unificar cálculos de receita/despesa
- [ ] Adicionar testes de reconciliação
- [ ] Migrar dados históricos se necessário

### Fase 4: Automação (1 semana)

- [ ] Setup de scheduler para despesas recorrentes
- [ ] Criar audit trail
- [ ] Validações de integridade

### Fase 5: Testes (3 dias)

- [ ] E2E dos fluxos de receita/despesa
- [ ] Validação de reconciliação
- [ ] Performance com dados históricos

---

## 6. QUESTÕES PARA STAKEHOLDER

1. **Conceitual:** Qual é a diferença entre receita de invoice paga e receita geral?
2. **Operacional:** Como a empresa recebe dinheiro? (via invoice, depósito direto, outro?)
3. **Financeiro:** Precisa de relatório de contas a receber (receivable)?
4. **Legal:** Há requisitos de auditoria/NF? (nota fiscal vinculada?)
5. **Prático:** Despesas recorrentes são sempre no mesmo dia/valor?

---

## 7. CONCLUSÃO

**Status:** ❌ **Sistema financeiro precisa de refactoring urgente**

- Não há confiança nos números
- Múltiplas verdades conflitantes
- Riscos de auditoria/compliance
- Impossível escalar

**Próximo passo:** Escolher caminho (Opção A, B, ou C) e começar Fase 1 (Auditoria).
