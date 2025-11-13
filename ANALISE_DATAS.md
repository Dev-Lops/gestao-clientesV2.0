# Análise Completa do Problema de Datas

## 📋 Resumo do Problema

As datas estão sendo exibidas com **1 dia a menos** do que foram salvas/selecionadas. Por exemplo:

- Usuário seleciona: **15/11/2025**
- Sistema exibe: **14/11/2025**

## 🔍 Causa Raiz

O problema ocorre devido à conversão de timezone usando `toISOString()` diretamente em objetos `Date` que foram criados a partir de strings UTC.

### Fluxo Problemático

```typescript
// 1. Usuário seleciona no input date: "2025-11-15"
// 2. Backend salva no PostgreSQL: "2025-11-15T00:00:00.000Z" (UTC)

// 3. Frontend recebe e converte para Date:
const date = new Date('2025-11-15T00:00:00.000Z')
// Em timezone UTC-3 (Brasília), isso vira: 2025-11-14 21:00:00

// 4. Ao popular o input, converte para string:
date.toISOString().split('T')[0]
// Resultado: "2025-11-14" ❌ (1 dia a menos!)
```

### Por que acontece?

- `new Date("2025-11-15T00:00:00.000Z")` cria um Date em UTC (meia-noite do dia 15 em UTC)
- Quando acessamos `date.getDate()` ou convertemos para string local, o JavaScript aplica o timezone do navegador
- Em UTC-3 (Brasil), meia-noite UTC vira 21:00 do dia anterior
- `toISOString()` converte de volta para UTC, mas agora com o horário alterado pelo timezone local

## 📍 Locais Afetados

### 1. **FinanceManagerGlobal.tsx** (CRÍTICO)

```typescript
// Linha 220 - handleEdit
const date = new Date(item.date)
setFormData({
  // ...
  date: date.toISOString().split('T')[0], // ❌ PROBLEMA
})
```

### 2. **FinanceManagerV2.tsx** (CRÍTICO)

```typescript
// Linha 60, 83 - Inicialização
date: new Date().toISOString().split('T')[0], // ❌ PROBLEMA

// Linha 157 - handleEdit
date: date.toISOString().split('T')[0], // ❌ PROBLEMA
```

### 3. **FinanceManager.tsx** (CRÍTICO)

```typescript
// Linha 38, 47 - Inicialização
date: new Date().toISOString().split('T')[0], // ❌ PROBLEMA

// Linha 100 - handleEdit
date: item.date.toISOString().split('T')[0], // ❌ PROBLEMA
```

### 4. **MeetingsManager.tsx** (CRÍTICO)

```typescript
// Linha 124 - Ao editar reunião
startDate: item.startTime.toISOString().split('T')[0], // ❌ PROBLEMA
```

### 5. **InstallmentManager.tsx** (CRÍTICO)

```typescript
// Linha 326 - Exibir data de pagamento
paidAt: installment.paidAt ? new Date(installment.paidAt).toISOString().split('T')[0] : '', // ❌ PROBLEMA
```

### 6. **MonthlyCalendar.tsx** (Baixa prioridade - seleção visual)

```typescript
// Linha 107
const selectedKey = selectedDate
  ? selectedDate.toISOString().split('T')[0]
  : null
```

### 7. **ActivitiesCalendar.tsx** (Baixa prioridade - seleção visual)

```typescript
// Linha 68, 170
const dateKey = activityDate.toISOString().split('T')[0]
```

## ✅ Solução Já Implementada

A função `formatDateInput()` em `src/lib/utils.ts` JÁ resolve esse problema:

```typescript
export function formatDateInput(
  date: Date | string | null | undefined
): string {
  if (!date) return ''

  const d = typeof date === 'string' ? new Date(date) : date
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}
```

**Como funciona:**

- Não usa `toISOString()` (que converte para UTC)
- Usa `getFullYear()`, `getMonth()`, `getDate()` que respeitam o timezone local
- Retorna string no formato correto para `<input type="date">`

## 🔧 Correções Necessárias

Substituir todas as ocorrências de:

```typescript
date.toISOString().split('T')[0]
```

Por:

```typescript
formatDateInput(date)
```

### Arquivos a Corrigir (em ordem de prioridade)

1. ✅ **src/features/finance/components/FinanceManagerGlobal.tsx**
   - Linha 220 (handleEdit)

2. ✅ **src/features/clients/components/FinanceManagerV2.tsx**
   - Linha 60 (initialFormData)
   - Linha 83 (resetForm)
   - Linha 157 (handleEdit)

3. ✅ **src/features/clients/components/FinanceManager.tsx**
   - Linha 38 (initialFormState)
   - Linha 47 (resetForm)
   - Linha 100 (handleEdit)

4. ✅ **src/features/clients/components/MeetingsManager.tsx**
   - Linha 124 (handleEdit - startDate)

5. ✅ **src/features/clients/components/InstallmentManager.tsx**
   - Linha 326 (exibição de paidAt)

6. ⏸️ **src/features/dashboard/components/MonthlyCalendar.tsx**
   - Linha 107 (selectedKey) - Baixa prioridade, apenas comparação visual

7. ⏸️ **src/features/dashboard/components/ActivitiesCalendar.tsx**
   - Linha 68, 170 (dateKey) - Baixa prioridade, apenas comparação visual

## 📊 Impacto

### Alto Impacto (Dados persistidos incorretos)

- ✅ Transações financeiras (Finance)
- ✅ Reuniões (Meetings)
- ✅ Parcelas (Installments)

### Baixo Impacto (Apenas exibição)

- ⏸️ Calendários e seleções visuais

## 🧪 Como Testar

1. **Criar uma transação financeira:**
   - Selecionar data: 15/11/2025
   - Salvar
   - Editar novamente
   - ✅ Verificar se exibe 15/11/2025 (não 14/11/2025)

2. **Criar uma reunião:**
   - Selecionar data: 20/11/2025
   - Salvar
   - Editar novamente
   - ✅ Verificar se exibe 20/11/2025

3. **Criar parcelas:**
   - Primeira parcela: 01/12/2025
   - Confirmar pagamento
   - ✅ Verificar se exibe 01/12/2025 como data de pagamento

## 📝 Notas Técnicas

### Por que `formatDateInput()` funciona?

```typescript
const d = new Date('2025-11-15T00:00:00.000Z')
// Timezone local (UTC-3): 2025-11-14 21:00:00

// ❌ Errado:
d.toISOString().split('T')[0] // "2025-11-14"

// ✅ Correto:
d.getFullYear() // 2025
d.getMonth() + 1 // 11
d.getDate() // 14 (ajustado pelo timezone!)

// PROBLEMA: getDate() retorna 14, não 15!
```

**Solução adicional necessária:** Quando a data vem do backend com 'Z' (UTC), precisamos usar `parseISOToLocal()` antes:

```typescript
// Em src/lib/utils.ts
export function parseISOToLocal(isoString: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoString)) {
    const [year, month, day] = isoString.split('-').map(Number)
    return new Date(year, month - 1, day)
  }
  return new Date(isoString)
}
```

Usar assim:

```typescript
const date = parseISOToLocal(item.date)
setFormData({
  date: formatDateInput(date),
})
```

## 🎯 Plano de Ação

1. ✅ Corrigir FinanceManagerGlobal.tsx
2. ✅ Corrigir FinanceManagerV2.tsx
3. ✅ Corrigir FinanceManager.tsx
4. ✅ Corrigir MeetingsManager.tsx
5. ✅ Corrigir InstallmentManager.tsx
6. ✅ Executar testes
7. ✅ Validar em produção
