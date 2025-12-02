# 🔍 Análise Completa do Sistema Financeiro

**Data:** 02/12/2025  
**Status:** Análise e Refatoração

---

## 📊 **ESTRUTURA DO BANCO DE DADOS**

### Tabelas Financeiras Principais:

#### 1. **Finance** (Lançamentos Manuais)

```prisma
- id, orgId, clientId, type (income/expense)
- amount, description, category
- date (data do lançamento)
- createdAt, updatedAt
```

**Uso:** Lançamentos manuais de receitas e despesas

#### 2. **Invoice** (Faturas)

```prisma
- id, orgId, clientId, subscriptionId
- number, status (DRAFT/OPEN/PAID/VOID/OVERDUE)
- issueDate, dueDate
- subtotal, discount, tax, total
- notes, externalId
```

**Uso:** Faturas geradas automaticamente ou manualmente

#### 3. **Payment** (Pagamentos)

```prisma
- id, orgId, clientId, invoiceId
- amount, method, status
- paidAt, provider, providerPaymentId
```

**Uso:** Registro de pagamentos vinculados a faturas

#### 4. **Installment** (Parcelas)

```prisma
- id, clientId, number
- amount, dueDate, status (PENDING/CONFIRMED/LATE)
- paidAt, notes
```

**Uso:** Parcelas de contratos parcelados

#### 5. **Client** (Configuração de Cobrança)

```prisma
- contractValue, paymentDay, paymentStatus
- isInstallment, installmentCount, installmentValue
- installmentPaymentDays[]
```

---

## 🔄 **FLUXOS IDENTIFICADOS**

### **Fluxo 1: Pagamento Mensal Recorrente**

```
Cliente tem contractValue + paymentDay
↓
BillingService.generateMonthlyInvoice() cria Invoice (OPEN)
↓
Usuário confirma pagamento
↓
BillingService.markInvoicePaid() →
  - Atualiza Invoice para PAID
  - Cria Payment
  - Cria Finance (income)
  - Atualiza Client.paymentStatus = CONFIRMED
```

### **Fluxo 2: Pagamento Parcelado**

```
Cliente tem isInstallment=true + installmentCount
↓
API cria múltiplas Installments (PENDING)
↓
Usuário confirma parcela específica
↓
PaymentService.confirmInstallmentPayment() →
  - Atualiza Installment para CONFIRMED
  - Cria Invoice (PAID) com externalId=installmentId
  - Cria Payment vinculado
  - Cria Finance (income)
```

### **Fluxo 3: Lançamento Manual**

```
Usuário abre modal "Novo lançamento"
↓
POST /api/billing/finance com {type, amount, description, category, date, clientId}
↓
Cria Finance diretamente
↓
NÃO cria Invoice/Payment automaticamente
```

---

## ⚠️ **PROBLEMAS IDENTIFICADOS**

### **CRÍTICO 1: Duplicação de Finance**

**Problema:** Pagamentos mensais E parcelados criam Finance, MAS lançamentos manuais TAMBÉM criam Finance.

- Se usuário faz lançamento manual + confirma fatura → **DUPLICA receita**
- Finance pode ter `clientId=null` (despesas gerais) mas invoice sempre tem clientId

**Impacto:** Saldo mensal INCORRETO se houver duplicação

---

### **CRÍTICO 2: Falta de Sincronização Invoice ↔ Finance**

**Problema:** Finance NÃO tem campo `invoiceId`

- Não há como rastrear se um Finance veio de uma Invoice
- Impossível evitar duplicação ao confirmar pagamento
- Relatórios de Finance podem divergir de Invoice

**Impacto:**

- Saldo do mês pode não bater com faturas pagas
- Finance manual não vincula a nenhuma cobrança oficial

---

### **CRÍTICO 3: Installment → Invoice sem Validação**

**Problema:** `PaymentService.confirmInstallmentPayment()` verifica duplicação de Finance por descrição:

```typescript
const existingFinance = await prisma.finance.findFirst({
  where: {
    description: { contains: `Parcela ${updated.number}` },
  },
})
```

**Falha:** Se descrição for editada ou não exata → DUPLICA

---

### **CRÍTICO 4: Cliente.paymentStatus Não Atualizado Corretamente**

**Problema:**

- `markInvoicePaid()` atualiza para CONFIRMED
- MAS `confirmInstallmentPayment()` NÃO atualiza
- Se cliente tem múltiplas parcelas no mês → status não reflete realidade

**Impacto:** Dashboard mostra "Pagamentos do mês" baseado em `Payment.paidAt` mas não valida status do cliente

---

### **MÉDIO 1: Saldo do Mês Usa Apenas Finance.date**

**Problema:** Cálculo atual:

```typescript
const financeRows = await prisma.finance.findMany({
  where: { orgId, date: { gte: startMonth, lte: endMonth } },
})
```

**Mas:**

- Finance pode ter `date` diferente de quando foi criado
- Se usuário lançar manualmente com data anterior → não conta no mês atual
- Se confirmar pagamento atrasado → date é NOW mas deveria ser dueDate

**Impacto:** Saldo não reflete realidade financeira do mês

---

### **MÉDIO 2: BillingService.dailyJob Não Integrado**

**Problema:**

- Existe `dailyJob` que gera faturas automaticamente
- MAS não cria Finance automaticamente
- Precisa confirmar pagamento manual

**Impacto:** Sistema não é totalmente automatizado

---

### **BAIXO 1: Invoice.externalId Usado Para Installment**

**Problema:** Campo genérico usado para linkar parcela

- Não tem FK constraint
- Se deletar Installment → Invoice fica órfã

---

### **BAIXO 2: PaymentService.getRecurringPaymentStatus Usa Tolerância**

```typescript
const isPaid = totalIncome >= expectedAmount * 0.95 // 5% tolerância
```

**Problema:** Se cliente pagar R$ 950 de R$ 1000 → sistema considera pago

---

## 🎯 **PLANO DE REFATORAÇÃO**

### **Fase 1: Correção Estrutural (Schema)**

#### **1.1 Adicionar invoiceId em Finance**

```prisma
model Finance {
  invoiceId String?
  invoice   Invoice? @relation(fields: [invoiceId], references: [id])
}
```

**Benefício:** Rastreabilidade total

#### **1.2 Adicionar installmentId em Invoice**

```prisma
model Invoice {
  installmentId String? @unique
  installment   Installment? @relation(fields: [installmentId], references: [id])
}
```

**Benefício:** FK constraint + unique garantem 1:1

---

### **Fase 2: Unificação de Fluxos**

#### **2.1 Criar PaymentOrchestrator Service**

**Responsabilidade:** Centralizar TODA criação de Finance/Payment/Invoice

```typescript
class PaymentOrchestrator {
  // Registra pagamento (manual, automático, PIX, boleto)
  static async recordPayment({
    orgId, clientId, amount, method,
    source: 'invoice' | 'installment' | 'manual',
    sourceId?: string, // invoiceId ou installmentId
    category?: string,
    description?: string,
    date?: Date
  }) {
    // Valida se já existe
    // Cria Finance + Payment + atualiza Invoice/Installment
    // Atualiza Client.paymentStatus
    // Retorna tudo em transação
  }
}
```

#### **2.2 Refatorar BillingService.markInvoicePaid**

```typescript
// ANTES: Criava Finance + Payment inline
// DEPOIS: Chama PaymentOrchestrator.recordPayment
```

#### **2.3 Refatorar PaymentService.confirmInstallmentPayment**

```typescript
// ANTES: Criava Finance manualmente com validação fraca
// DEPOIS: Chama PaymentOrchestrator.recordPayment
```

---

### **Fase 3: Cálculo de Saldo Inteligente**

#### **3.1 Corrigir Saldo Mensal em /billing**

**Opção A - Usar Payment.paidAt (RECOMENDADO):**

```typescript
const payments = await prisma.payment.findMany({
  where: {
    orgId,
    paidAt: { gte: startMonth, lte: endMonth },
  },
})
const incomeMonth = payments.reduce((s, p) => s + p.amount, 0)
```

**Vantagem:** Payment SEMPRE tem paidAt preciso

**Opção B - Usar Finance.createdAt:**

```typescript
const financeRows = await prisma.finance.findMany({
  where: {
    orgId,
    type: 'income',
    createdAt: { gte: startMonth, lte: endMonth },
  },
})
```

#### **3.2 Adicionar Filtros Avançados**

- Separar receitas de Invoices vs Manuais
- Mostrar detalhamento: "Receitas de Faturas" vs "Outras Receitas"

---

### **Fase 4: Automação Completa**

#### **4.1 Melhorar dailyJob**

```typescript
// Gerar fatura
// SE cliente tem cobrança automática → marcar como PAID automaticamente
// Criar notificação se vencendo
```

#### **4.2 Cron de Atualização de Status**

```typescript
// Atualizar Invoice.status OPEN → OVERDUE se vencida
// Atualizar Installment PENDING → LATE
// Atualizar Client.paymentStatus CONFIRMED → LATE
```

---

### **Fase 5: Interface e UX**

#### **5.1 Modal de Confirmação Unificado**

- Único botão "Confirmar Pagamento"
- Detecta automaticamente se é mensal ou parcela
- Mostra resumo antes de confirmar

#### **5.2 Dashboard de Reconciliação**

- Lista Finance sem Invoice/Payment
- Lista Invoice sem Finance
- Botão "Reconciliar" para corrigir inconsistências

---

## 🚀 **PRIORIDADES DE IMPLEMENTAÇÃO**

### **Sprint 1 (Imediato):**

1. ✅ Corrigir cálculo de saldo mensal (usar Payment.paidAt)
2. ✅ Adicionar validação anti-duplicação em confirmInstallmentPayment
3. ✅ Atualizar Client.paymentStatus em TODOS os fluxos

### **Sprint 2 (Curto Prazo):**

4. Adicionar invoiceId em Finance (migration)
5. Criar PaymentOrchestrator
6. Refatorar markInvoicePaid e confirmInstallmentPayment

### **Sprint 3 (Médio Prazo):**

7. Adicionar installmentId FK em Invoice
8. Implementar reconciliação automática
9. Melhorar dailyJob

### **Sprint 4 (Longo Prazo):**

10. Dashboard de reconciliação
11. Relatórios avançados
12. Automação completa de cobrança

---

## 📝 **REGRAS DE NEGÓCIO DEFINIDAS**

1. **Finance SEMPRE deve estar vinculado a Invoice/Payment** (exceto despesas gerais)
2. **Payment é fonte da verdade para "quando foi pago"**
3. **Invoice é fonte da verdade para "quanto deve ser cobrado"**
4. **Finance é para relatórios contábeis gerais**
5. **Installment deve SEMPRE criar Invoice ao ser confirmado**
6. **Client.paymentStatus deve refletir status do MÊS ATUAL**
7. **Saldo mensal = Payments do mês (não Finance.date)**

---

**Status:** Documento criado, aguardando implementação das correções.
