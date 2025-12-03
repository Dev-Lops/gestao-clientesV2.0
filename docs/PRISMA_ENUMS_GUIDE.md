# Guia de Uso dos Enums do Prisma

Este documento explica como usar os valores de enums centralizados do schema Prisma em toda a aplicação.

## 📋 Visão Geral

Todos os valores de enums definidos no `prisma/schema.prisma` estão centralizados no arquivo `src/lib/prisma-enums.ts`. Isso garante:

- ✅ **Consistência**: Todos os componentes usam os mesmos valores
- ✅ **Type-safety**: TypeScript valida os valores automaticamente
- ✅ **Manutenção**: Alterar um enum no schema reflete em toda a aplicação
- ✅ **Labels traduzidos**: Exibição em português para o usuário final

## 🎯 Enums Disponíveis

### 1. Planos de Cliente (`ClientPlan`)

```typescript
import { CLIENT_PLANS, CLIENT_PLAN_LABELS } from '@/lib/prisma-enums'

// Valores disponíveis
CLIENT_PLANS = [
  'GESTAO',
  'ESTRUTURA',
  'FREELANCER',
  'PARCERIA',
  'CONSULTORIA',
  'OUTRO',
]

// Labels traduzidos
CLIENT_PLAN_LABELS = {
  GESTAO: 'Gestão',
  ESTRUTURA: 'Estrutura',
  FREELANCER: 'Freelancer',
  PARCERIA: 'Parceria',
  CONSULTORIA: 'Consultoria',
  OUTRO: 'Outro',
}
```

**Uso em Select:**

```tsx
import { CLIENT_PLANS, CLIENT_PLAN_LABELS } from '@/lib/prisma-enums'

;<Select>
  <SelectTrigger>
    <SelectValue placeholder='Selecione um plano' />
  </SelectTrigger>
  <SelectContent>
    {CLIENT_PLANS.map((plan) => (
      <SelectItem key={plan} value={plan}>
        {CLIENT_PLAN_LABELS[plan]}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

**Uso em exibição:**

```tsx
<p>{client.plan ? CLIENT_PLAN_LABELS[client.plan] : 'Não definido'}</p>
```

### 2. Canais Sociais (`SocialChannel`)

```typescript
import { SOCIAL_CHANNELS, SOCIAL_CHANNEL_LABELS } from '@/lib/prisma-enums'

SOCIAL_CHANNELS = [
  'INSTAGRAM',
  'FACEBOOK',
  'TIKTOK',
  'YOUTUBE',
  'LINKEDIN',
  'TWITTER',
  'OUTRO',
]

SOCIAL_CHANNEL_LABELS = {
  INSTAGRAM: 'Instagram',
  FACEBOOK: 'Facebook',
  TIKTOK: 'TikTok',
  YOUTUBE: 'YouTube',
  LINKEDIN: 'LinkedIn',
  TWITTER: 'Twitter',
  OUTRO: 'Outro',
}
```

### 3. Status de Pagamento (`PaymentStatus`)

```typescript
import { PAYMENT_STATUSES, PAYMENT_STATUS_LABELS } from '@/lib/prisma-enums'

PAYMENT_STATUSES = ['PENDING', 'CONFIRMED', 'LATE']

PAYMENT_STATUS_LABELS = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmado',
  LATE: 'Atrasado',
}
```

### 4. Status de Fatura (`InvoiceStatus`)

```typescript
import { INVOICE_STATUSES, INVOICE_STATUS_LABELS } from '@/lib/prisma-enums'

INVOICE_STATUSES = ['DRAFT', 'OPEN', 'PAID', 'VOID', 'OVERDUE', 'CANCELED']

INVOICE_STATUS_LABELS = {
  DRAFT: 'Rascunho',
  OPEN: 'Em Aberto',
  PAID: 'Pago',
  VOID: 'Cancelado',
  OVERDUE: 'Vencido',
  CANCELED: 'Cancelado',
}
```

### 5. Roles (`Role`)

```typescript
import { ROLES, ROLE_LABELS } from '@/lib/prisma-enums'

ROLES = ['OWNER', 'STAFF', 'CLIENT']

ROLE_LABELS = {
  OWNER: 'Proprietário',
  STAFF: 'Equipe',
  CLIENT: 'Cliente',
}
```

### 6. Categorias Financeiras

```typescript
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '@/lib/prisma-enums'

INCOME_CATEGORIES = [
  'Mensalidade',
  'Projeto',
  'Consultoria',
  'Freelancer',
  'Outro',
]

EXPENSE_CATEGORIES = [
  'Infraestrutura',
  'Marketing',
  'Ferramentas',
  'Pessoal',
  'Impostos',
  'Outro',
]
```

### 7. Status de Cliente (padronizado)

```typescript
import { CLIENT_STATUSES, CLIENT_STATUS_LABELS } from '@/lib/prisma-enums'

CLIENT_STATUSES = ['new', 'onboarding', 'active', 'paused', 'closed']

CLIENT_STATUS_LABELS = {
  new: 'Novo',
  onboarding: 'Em Onboarding',
  active: 'Ativo',
  paused: 'Pausado',
  closed: 'Encerrado',
}
```

## 🔧 Como Adicionar um Novo Enum

### Passo 1: Adicionar no schema Prisma

```prisma
// prisma/schema.prisma
enum NovoEnum {
  VALOR1
  VALOR2
  VALOR3
}

model MinhaTabela {
  campo NovoEnum
}
```

### Passo 2: Gerar cliente Prisma

```bash
npx prisma generate
```

### Passo 3: Adicionar em `prisma-enums.ts`

```typescript
// src/lib/prisma-enums.ts
import { NovoEnum } from '@prisma/client'

export const NOVOS_ENUMS = Object.values(NovoEnum)

export const NOVO_ENUM_LABELS: Record<NovoEnum, string> = {
  VALOR1: 'Valor 1',
  VALOR2: 'Valor 2',
  VALOR3: 'Valor 3',
}
```

### Passo 4: Usar nos componentes

```tsx
import { NOVOS_ENUMS, NOVO_ENUM_LABELS } from '@/lib/prisma-enums'

;<Select>
  <SelectContent>
    {NOVOS_ENUMS.map((valor) => (
      <SelectItem key={valor} value={valor}>
        {NOVO_ENUM_LABELS[valor]}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

## 📝 Boas Práticas

### ✅ FAZER:

```tsx
// ✅ Usar os enums centralizados
import { CLIENT_PLANS, CLIENT_PLAN_LABELS } from '@/lib/prisma-enums'

;<SelectItem value={plan}>{CLIENT_PLAN_LABELS[plan]}</SelectItem>
```

### ❌ NÃO FAZER:

```tsx
// ❌ Hardcoded values
const PLANS = ['Starter', 'Pro', 'Premium'] // ERRADO!

// ❌ Labels inline
;<SelectItem value='GESTAO'>Gestão</SelectItem> // Use CLIENT_PLAN_LABELS
```

## 🔄 Fluxo de Atualização

Quando precisar alterar um enum:

1. **Altere no Prisma Schema** (`prisma/schema.prisma`)
2. **Execute migration** (`npx prisma migrate dev`)
3. **Atualize labels** em `src/lib/prisma-enums.ts`
4. **Todos os componentes** serão atualizados automaticamente

## 📦 Componentes Atualizados

Os seguintes componentes já foram atualizados para usar os enums centralizados:

- ✅ `ClientInfoEditor` - Edição de informações do cliente
- ✅ `ClientInfoDisplay` - Exibição de informações do cliente
- ✅ `FinanceCreateModal` - Criação de lançamentos financeiros
- ✅ `FinanceEditModal` - Edição de lançamentos financeiros
- ✅ `clients/new/page` - Formulário de novo cliente
- ✅ `clients/page` - Listagem de clientes
- ✅ `clients/[id]/layout` - Layout de cliente

## 🎨 Exemplo Completo

```tsx
'use client'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CLIENT_PLANS, CLIENT_PLAN_LABELS } from '@/lib/prisma-enums'
import { useState } from 'react'

export function ExemploFormulario() {
  const [plano, setPlano] = useState<string>('GESTAO')

  return (
    <div>
      {/* Select com enum do Prisma */}
      <Select value={plano} onValueChange={setPlano}>
        <SelectTrigger>
          <SelectValue placeholder='Selecione um plano' />
        </SelectTrigger>
        <SelectContent>
          {CLIENT_PLANS.map((plan) => (
            <SelectItem key={plan} value={plan}>
              {CLIENT_PLAN_LABELS[plan]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Exibição com label traduzido */}
      <p>
        Plano selecionado:{' '}
        {CLIENT_PLAN_LABELS[plano as keyof typeof CLIENT_PLAN_LABELS]}
      </p>
    </div>
  )
}
```

## 🚀 Benefícios

1. **Type Safety**: TypeScript garante que apenas valores válidos sejam usados
2. **Sincronização**: Schema do banco → Código da aplicação
3. **Manutenibilidade**: Um único ponto de alteração
4. **Internacionalização**: Labels separados facilitam tradução
5. **Autocomplete**: IDE sugere valores válidos automaticamente

---

**Documentação atualizada em:** Dezembro 2024  
**Versão:** 2.0
