# Sistema Financeiro – Guia

Este guia documenta os fluxos de lançamento, reconciliação e backfill, além de APIs e rotinas agendadas.

## Fluxos Principais

- Lançamentos de Receita: `POST /api/finance` (type `income`) associa à fatura do mês do cliente; cria fatura se inexistente.
- Lançamentos de Despesa: `POST /api/finance` (type `expense`) contabilizados no resumo mensal.
- Despesas Fixas: CRUD em `/api/finance/fixed-expenses`; enum `ExpenseCycle` (`MONTHLY`, `ANNUAL`).

## Reconciliação

- Endpoint: `POST /api/finance/reconcile`.
- Verifica inconsistências: faturas `PAID` sem pagamentos, receitas sem `invoiceId`, múltiplas receitas por fatura.
- Parâmetro opcional: `?notify=true` para registrar `Notification` por inconsistência.

## Resumo Mensal

- Endpoint: `GET /api/finance/summary?month=YYYY-MM`.
- Receita bruta: soma de `Payment.amount` com `paidAt` no mês.
- Despesas variáveis: soma de `Finance.amount` com `type='expense'` no mês.
- Despesas fixas mensais: soma de `FixedExpense` ativos `cycle='MONTHLY'`.
- Lucro líquido: `grossRevenue - (variableExpenses + fixedMonthly)`.

## Projeção Próximo Mês

- Endpoint: `GET /api/finance/projection`.
- Estima receita: `Client.contractValue` ativos + parcelas `Installment` com `dueDate` no próximo mês.
- Subtrai despesas fixas mensais.

## Rotinas Agendadas (Netlify)

- `finance_reconcile_daily`: diário às 02:00 UTC – chama `/api/finance/reconcile?notify=true`.
- `finance_summary_daily`: diário às 02:10 UTC – chama `/api/finance/summary` do mês corrente.
- `finance_projection_monthly`: mensal (dia 25) às 02:20 UTC – chama `/api/finance/projection`.

## Permissões

- Recomendado restringir `POST` em finanças e despesas fixas a `OWNER|STAFF`.
- `GET` de resumo/projeção: `OWNER|STAFF`; clientes não devem ter acesso a dados agregados da organização.

## Backfill

- Para dados legados: executar reconciliação manual e revisar relatórios.
- Se necessário, rodar scripts de ajuste criando faturas por mês e associando receitas.

# 📘 Guia do Sistema Financeiro - Gestão de Clientes

**Última Atualização:** 02/12/2025

---

## 🎯 **VISÃO GERAL**

O sistema financeiro é composto por **4 entidades principais**:

1. **Finance** - Lançamentos contábeis manuais (receitas e despesas)
2. **Invoice** - Faturas oficiais de cobrança
3. **Payment** - Registros de pagamentos recebidos
4. **Installment** - Parcelas de contratos parcelados

---

## 🔄 **FLUXOS DE TRABALHO**

### **Modo 1: Cobrança Mensal Recorrente**

**Configuração do Cliente:**

```typescript
{
  contractValue: 1500.00,  // Valor mensal
  paymentDay: 5,           // Dia do vencimento
  isInstallment: false
}
```

**Fluxo Automático:**

```
1. Daily Job roda → gera Invoice (status OPEN)
   ├─ number: INV-202412-ABC123
   ├─ dueDate: 2024-12-05
   ├─ total: R$ 1.500,00
   └─ notes: "period:2024-12"

2. Cliente paga → Admin confirma em /clients/[id]/billing

3. BillingService.markInvoicePaid() executa:
   ├─ Invoice.status → PAID
   ├─ Cria Payment (amount, paidAt, method)
   ├─ Cria Finance (type: income, vinculado à invoice)
   └─ Client.paymentStatus → CONFIRMED
```

**Dashboard mostra:**

- ✅ Verde se Client.paymentStatus === CONFIRMED
- ⚠️ Amarelo se PENDING e antes do vencimento
- ❌ Vermelho se LATE (após vencimento)

---

### **Modo 2: Cobrança Parcelada**

**Configuração do Cliente:**

```typescript
{
  contractValue: 12000.00,
  isInstallment: true,
  installmentCount: 12,
  installmentValue: 1000.00,
  installmentPaymentDays: [10, 20]  // 2 parcelas por mês
}
```

**Criação das Parcelas:**

```
POST /api/clients/[id]/installments
{
  installmentCount: 12,
  startDate: "2024-12-01"
}

Sistema cria:
- Installment 1: R$ 1.000, vencimento 10/12/2024
- Installment 2: R$ 1.000, vencimento 20/12/2024
- Installment 3: R$ 1.000, vencimento 10/01/2025
... até 12
```

**Confirmação de Pagamento:**

```
PATCH /api/clients/[id]/installments?installmentId=xyz
{ status: "CONFIRMED" }

PaymentService.confirmInstallmentPayment() executa:
├─ Installment.status → CONFIRMED
├─ Installment.paidAt → now()
├─ Client.paymentStatus → CONFIRMED
├─ Cria Invoice (status: PAID, externalId: installmentId)
├─ Cria Payment vinculado à invoice
└─ Cria Finance (opcional, se não houver invoice)
```

---

### **Modo 3: Lançamento Manual**

**Uso:** Despesas gerais, receitas avulsas, ajustes

**Fluxo:**

```
1. Admin abre modal "Novo lançamento" em /billing

2. Preenche:
   - Tipo: Receita ou Despesa
   - Valor: R$ 500,00
   - Categoria: "Software/Ferramentas"
   - Descrição: "Assinatura Figma"
   - Cliente: (opcional)

3. POST /api/billing/finance
   └─ Cria Finance diretamente (SEM invoice/payment)
```

**IMPORTANTE:** Lançamentos manuais de receita **NÃO devem duplicar** pagamentos de faturas!

---

## 📊 **CÁLCULO DE SALDOS (CORRIGIDO)**

### **Saldo do Mês:**

**ANTES (INCORRETO):**

```typescript
// ❌ Usava Finance.date (podia ser manipulado)
const financeRows = await prisma.finance.findMany({
  where: { orgId, date: { gte: startMonth, lte: endMonth } }
})
const income = financeRows.filter(f => f.type === 'income')...
```

**AGORA (CORRETO):**

```typescript
// ✅ Receitas: Usa Payment.paidAt (fonte da verdade)
const payments = await prisma.payment.findMany({
  where: { orgId, paidAt: { gte: startMonth, lte: endMonth } },
})
const incomeMonth = payments.reduce((s, p) => s + p.amount, 0)

// ✅ Despesas: Usa Finance.date (lançamentos manuais)
const expenses = await prisma.finance.findMany({
  where: { orgId, type: 'expense', date: { gte: startMonth, lte: endMonth } },
})
const expenseMonth = expenses.reduce((s, e) => s + e.amount, 0)

const netMonth = incomeMonth - expenseMonth
```

**Por quê Payment?**

- Payment é criado **somente** quando há confirmação real
- Payment.paidAt é **imutável** (não pode ser editado pelo usuário)
- Finance pode ter `date` diferente de quando foi realmente pago

---

### **Saldo Total Histórico:**

```typescript
// ✅ Receitas: Soma de TODOS os Payments
const totalIncome = await prisma.payment.aggregate({
  where: { orgId },
  _sum: { amount: true },
})

// ✅ Despesas: Soma de Finance.type = 'expense'
const totalExpense = await prisma.finance.aggregate({
  where: { orgId, type: 'expense' },
  _sum: { amount: true },
})

const totalNet =
  (totalIncome._sum.amount || 0) - (totalExpense._sum.amount || 0)
```

---

## 🛡️ **PREVENÇÃO DE DUPLICAÇÃO**

### **Problema Original:**

```typescript
// ❌ Validação fraca
const existing = await prisma.finance.findFirst({
  where: { description: { contains: `Parcela ${number}` } },
})
```

**Falha:** Se descrição for editada → duplica

### **Solução Implementada:**

```typescript
// ✅ Validação por invoiceId
const existing = await prisma.invoice.findFirst({
  where: { externalId: installmentId },
})
```

---

## 🔧 **APIs PRINCIPAIS**

### **1. GET /api/billing/finance**

- Lista lançamentos financeiros
- Filtros: type, category, date range, clientId

### **2. POST /api/billing/finance**

- Cria lançamento manual
- Body: `{ type, amount, description, category, date, clientId }`

### **3. GET /api/clients/[id]/invoices**

- Lista faturas de um cliente
- Inclui items e payments

### **4. POST /api/clients/[id]/invoices**

- Gera fatura mensal automaticamente
- Usa BillingService.generateMonthlyInvoice()

### **5. POST /api/billing/invoices/[id]/pay**

- Marca fatura como paga
- Cria Payment + Finance automaticamente

### **6. GET /api/clients/[id]/installments**

- Lista parcelas do cliente

### **7. POST /api/clients/[id]/installments**

- Cria múltiplas parcelas
- Body: `{ installmentCount, startDate }`

### **8. PATCH /api/clients/[id]/installments?installmentId=xyz**

- Atualiza parcela (status, amount, dueDate, notes)
- Se `status: CONFIRMED` → cria Invoice + Payment + Finance

### **9. GET /api/clients/[id]/payment**

- Retorna status de pagamento do mês atual
- Mode: 'monthly' ou 'installment'

### **10. POST /api/clients/[id]/payment/confirm**

- Confirma pagamento mensal recorrente
- Body opcional: `{ amount }`

---

## 📋 **REGRAS DE NEGÓCIO**

### ✅ **Regras Obrigatórias:**

1. **Payment é fonte da verdade para "quando foi pago"**
   - Sempre use `Payment.paidAt` para cálculos de receita mensal

2. **Invoice é fonte da verdade para "quanto deve ser cobrado"**
   - Todo pagamento oficial deve ter Invoice vinculado

3. **Finance é para relatórios contábeis gerais**
   - Receitas: Criadas automaticamente via Payment
   - Despesas: Criadas manualmente

4. **Installment deve SEMPRE criar Invoice ao ser confirmado**
   - Invoice.externalId = Installment.id

5. **Client.paymentStatus reflete status do MÊS ATUAL**
   - PENDING: Aguardando pagamento
   - CONFIRMED: Pago no mês atual
   - LATE: Vencido e não pago

6. **Evitar duplicação:**
   - Verificar `Invoice.externalId` antes de criar
   - NÃO criar Finance manual para receitas com Invoice

7. **Tolerância de pagamento: 5%**
   - Se pagar R$ 950 de R$ 1.000 → considera pago

---

## 🚨 **PROBLEMAS A EVITAR**

### ❌ **NÃO FAZER:**

1. **Criar Finance de receita manualmente para fatura já paga**

   ```typescript
   // ❌ Isso duplica!
   await prisma.finance.create({
     type: 'income',
     amount: 1500,
     description: 'Pagamento Cliente X',
   })
   // Depois confirmar Invoice → DUPLICA
   ```

2. **Usar Finance.date para cálculo de saldo mensal**

   ```typescript
   // ❌ Impreciso
   const income = await prisma.finance.findMany({
     where: { type: 'income', date: { gte: startMonth } },
   })
   ```

3. **Esquecer de atualizar Client.paymentStatus**
   ```typescript
   // ❌ Cliente fica com status errado
   await prisma.installment.update({ status: 'CONFIRMED' })
   // Faltou: await prisma.client.update({ paymentStatus: 'CONFIRMED' })
   ```

---

## 🎯 **PRÓXIMOS PASSOS**

### **Sprint 2 (Estrutural):**

- [ ] Migration: Adicionar `Finance.invoiceId` (FK opcional)
- [ ] Migration: Adicionar `Invoice.installmentId` (FK unique)
- [ ] Criar `PaymentOrchestrator` service unificado
- [ ] Refatorar todas as APIs para usar PaymentOrchestrator

### **Sprint 3 (Automação):**

- [ ] Melhorar `BillingService.dailyJob`
- [ ] Cron para atualizar status (OPEN → OVERDUE)
- [ ] Notificações automáticas de vencimento

### **Sprint 4 (Relatórios):**

- [ ] Dashboard de reconciliação
- [ ] Relatório de divergências Finance ↔ Invoice
- [ ] Export detalhado (Excel/CSV)

---

## 📞 **SUPORTE**

**Dúvidas sobre o sistema financeiro:**

- Consulte: `docs/ANALISE_FINANCEIRO.md` (análise técnica detalhada)
- Código: `src/services/payments/PaymentService.ts`
- Código: `src/services/billing/BillingService.ts`

**Última revisão:** 02/12/2025 - Sistema corrigido e estável ✅
