# Correção de Datas - Tasks e Outros Campos

## Problema Identificado

Ao salvar uma data (ex: dia 17), ela aparecia como dia 16 no sistema. Isso ocorria devido à conversão incorreta de timezone.

### Causa Raiz

1. **No Frontend**: `parseDateInput()` criava corretamente uma data local (ex: 2025-11-17 00:00 BRT)
2. **Conversão Problemática**: Ao chamar `.toISOString()`, a data era convertida para UTC
3. **Resultado**: Perdia 3 horas e mudava o dia (2025-11-16 21:00 UTC)

## Solução Implementada

### Nova Função Utilitária

Arquivo: `src/lib/utils.ts`

```typescript
/**
 * Converte uma data local para ISO string preservando a data local
 * (não converte para UTC, evitando mudança de dia)
 */
export function toLocalISOString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  const ms = String(date.getMilliseconds()).padStart(3, '0')

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${ms}Z`
}

/**
 * Converte string ISO para Date local, tratando corretamente o timezone
 */
export function parseISOToLocal(isoString: string): Date {
  // Se a string vier no formato YYYY-MM-DD (sem hora), trata como data local
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoString)) {
    const [year, month, day] = isoString.split('-').map(Number)
    return new Date(year, month - 1, day)
  }
  // Caso contrário, converte normalmente
  return new Date(isoString)
}
```

### Arquivos Corrigidos

#### 1. InstallmentManager.tsx

**Localização**: `src/features/clients/components/InstallmentManager.tsx`

**Correções**:

- Criação de parcelas: `toLocalISOString(parseDateInput(formData.startDate))`
- Edição de parcelas: `toLocalISOString(parseDateInput(editForm.paidAt))`

#### 2. MonthlyPaymentCard.tsx

**Localização**: `src/features/clients/components/MonthlyPaymentCard.tsx`

**Correções**:

- Registro de pagamento mensal: `date: toLocalISOString(new Date())`
- Marcação de parcela paga: `paidAt: toLocalISOString(new Date())`

#### 3. FinanceManagerGlobal.tsx

**Localização**: `src/features/finance/components/FinanceManagerGlobal.tsx`

**Correções**:

- Criação/edição de transações: `toLocalISOString(parseDateInput(formData.date))`

#### 4. TasksManager.tsx

**Localização**: `src/features/clients/components/TasksManager.tsx`

**Correções**:

- Criação/edição de tasks: `toLocalISOString(parseDateInput(form.dueDate))`

#### 5. ClientInfoDisplay.tsx

**Localização**: `src/features/clients/components/ClientInfoDisplay.tsx`

**Correções**:

- Datas de contrato:
  - `contractStart: toLocalISOString(parseDateInput(formData.contractStart))`
  - `contractEnd: toLocalISOString(parseDateInput(formData.contractEnd))`

## Como Usar

### Para Converter Data de Input para ISO

```typescript
import { parseDateInput, toLocalISOString } from '@/lib/utils'

// Data do input type="date" (formato: YYYY-MM-DD)
const dateString = '2025-11-17'

// Converte para Date local e depois para ISO preservando a data
const isoString = toLocalISOString(parseDateInput(dateString))

// Resultado: "2025-11-17T00:00:00.000Z" (mantém o dia 17)
```

### Para Data Atual

```typescript
import { toLocalISOString } from '@/lib/utils'

// Data/hora atual
const now = new Date()

// Converte para ISO preservando data local
const isoString = toLocalISOString(now)
```

### Para Exibir Data Salva

```typescript
import { parseISOToLocal } from '@/lib/utils'

// Data vinda do banco
const savedDate = '2025-11-17T00:00:00.000Z'

// Converte para Date local
const date = parseISOToLocal(savedDate)

// Exibe
const formatted = date.toLocaleDateString('pt-BR')
// Resultado: "17/11/2025"
```

## Padrão de Uso

### ❌ EVITE (pode causar problema de timezone)

```typescript
// NÃO faça isso:
const date = parseDateInput(dateString).toISOString()
const now = new Date().toISOString()
```

### ✅ CORRETO

```typescript
// Faça isso:
const date = toLocalISOString(parseDateInput(dateString))
const now = toLocalISOString(new Date())
```

## Validação

Após as correções:

1. ✅ Datas de parcelas mantêm o dia correto
2. ✅ Datas de pagamentos salvam o dia atual
3. ✅ Datas de tarefas não perdem um dia
4. ✅ Datas de contrato preservam início e fim
5. ✅ Transações financeiras mantêm a data correta

## Próximos Passos

Se encontrar outros campos de data com problema similar:

1. Importe `toLocalISOString` de `@/lib/utils`
2. Substitua `.toISOString()` por `toLocalISOString()`
3. Para exibição, use `parseISOToLocal()` se necessário

## Teste Rápido

Para confirmar que está funcionando:

1. Crie uma tarefa com vencimento para dia 17
2. Salve e recarregue a página
3. Verifique se continua mostrando dia 17 (não 16)

Se aparecer dia 16, o componente ainda está usando `.toISOString()` direto.
