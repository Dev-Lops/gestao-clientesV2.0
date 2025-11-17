# Guia de Migração - Aplicando as Melhorias

Este guia mostra como migrar código existente para usar os novos componentes e padrões.

---

## 🔄 Migração de Badges

### Antes (múltiplos componentes)

```tsx
import { StatusBadge, PriorityBadge } from '@/components/ui/status-badge';
import { UnifiedStatusBadge } from '@/components/ui/unified-status-badge';

<StatusBadge status="in-progress">Em Progresso</StatusBadge>
<PriorityBadge priority="high">Alta</PriorityBadge>
<UnifiedStatusBadge status="active" />
```

### Depois (Badge unificado)

```tsx
import { Badge } from '@/components/ui/badge';
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from '@/types/enums';

<Badge variant="in-progress">{TASK_STATUS_LABELS['in-progress']}</Badge>
<Badge variant="high">{TASK_PRIORITY_LABELS.high}</Badge>
<Badge variant="active">Ativo</Badge>
```

### Buscar e Substituir

```bash
# Encontrar todos os usos antigos
grep -r "StatusBadge\|PriorityBadge\|UnifiedStatusBadge" src/

# Substituir imports
# De: import { StatusBadge } from '@/components/ui/status-badge'
# Para: import { Badge } from '@/components/ui/badge'
```

---

## ⏳ Migração de Spinners

### Antes (múltiplos componentes)

```tsx
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Spinner } from '@/components/ui/spinner';

<LoadingSpinner size="md" />
<Spinner className="w-4 h-4" />
```

### Depois (Spinner unificado)

```tsx
import { Spinner, CircleSpinner, DotsSpinner } from '@/components/ui/spinner';

<Spinner size="md" variant="primary" />
<CircleSpinner size="md" />
<DotsSpinner />
```

### Script de Migração

```bash
# Encontrar componentes antigos
grep -r "LoadingSpinner\|loading-spinner" src/
```

---

## 🔘 Migração de Botões para Loading State

### Antes (loading manual)

```tsx
<Button disabled={isLoading}>
  {isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
  Salvar
</Button>
```

### Depois (prop isLoading)

```tsx
<Button isLoading={isLoading} loadingText='Salvando...'>
  Salvar
</Button>
```

### Exemplos Práticos

```tsx
// Submit de formulário
<Button
  type="submit"
  isLoading={isSubmitting}
  loadingText="Criando cliente..."
>
  Criar Cliente
</Button>

// Ação async
<Button
  onClick={handleDelete}
  isLoading={isDeleting}
  variant="destructive"
>
  Excluir
</Button>
```

---

## 📝 Migração de Formulários

### Antes (campos avulsos)

```tsx
<div className='space-y-2'>
  <Label htmlFor='name'>Nome *</Label>
  <Input id='name' {...register('name')} />
  {errors.name && <p className='text-sm text-red-500'>{errors.name.message}</p>}
</div>
```

### Depois (FormField composto)

```tsx
<FormField label='Nome' required error={errors.name?.message}>
  <Input {...register('name')} />
</FormField>
```

### Formulário Completo

```tsx
<form onSubmit={handleSubmit(onSubmit)}>
  <FormSection
    title='Informações Básicas'
    description='Preencha os dados do cliente'
  >
    <FormField label='Nome' required error={errors.name?.message}>
      <Input {...register('name')} />
    </FormField>

    <FormField
      label='Email'
      description='Email para contato'
      error={errors.email?.message}
    >
      <Input type='email' {...register('email')} />
    </FormField>

    <FormField label='Telefone' error={errors.phone?.message}>
      <Input {...register('phone')} />
    </FormField>
  </FormSection>

  <FormActions align='right'>
    <Button type='button' variant='outline' onClick={onCancel}>
      Cancelar
    </Button>
    <Button type='submit' isLoading={isSubmitting}>
      Salvar
    </Button>
  </FormActions>
</form>
```

---

## 🔢 Migração para Enums Tipados

### Antes (strings literais)

```tsx
// Status hardcoded
if (task.status === 'in-progress' || task.status === 'in_progress') {
  // ...
}

// Labels inline
const statusLabel =
  status === 'todo'
    ? 'A Fazer'
    : status === 'done'
      ? 'Concluído'
      : 'Em Progresso'
```

### Depois (enums tipados)

```tsx
import { TASK_STATUS, TASK_STATUS_LABELS } from '@/types/enums'

// Status tipado
if (task.status === TASK_STATUS.IN_PROGRESS) {
  // ...
}

// Labels centralizados
const statusLabel = TASK_STATUS_LABELS[task.status]

// Validação
import { isTaskStatus } from '@/types/enums'
if (isTaskStatus(value)) {
  // value é TaskStatus
}
```

### Componentes

```tsx
// Select de status
<Select>
  {Object.entries(TASK_STATUS_LABELS).map(([value, label]) => (
    <option key={value} value={value}>{label}</option>
  ))}
</Select>

// Badge com enum
<Badge variant={task.status}>
  {TASK_STATUS_LABELS[task.status]}
</Badge>
```

---

## ✅ Migração para Validação Zod

### Antes (validação manual)

```tsx
function validateTask(data: any) {
  const errors: any = {}

  if (!data.title || data.title.trim() === '') {
    errors.title = 'Título é obrigatório'
  }

  if (data.title && data.title.length > 200) {
    errors.title = 'Título muito longo'
  }

  if (data.dueDate && new Date(data.dueDate) < new Date()) {
    errors.dueDate = 'Data não pode ser no passado'
  }

  return { isValid: Object.keys(errors).length === 0, errors }
}
```

### Depois (Zod schema)

```tsx
import { createTaskSchema } from '@/lib/validations'

// Validação
const result = createTaskSchema.safeParse(data)
if (!result.success) {
  const errors = result.error.flatten().fieldErrors
  // errors.title = ['Título é obrigatório']
  return
}

const validData = result.data // Tipado automaticamente
```

### Em Route Handlers

```tsx
// app/api/tasks/route.ts
import { createTaskSchema } from '@/lib/validations'

export async function POST(req: Request) {
  const body = await req.json()

  // Valida e tipifica
  const validated = createTaskSchema.parse(body)

  // validated é CreateTaskInput tipado
  const task = await prisma.task.create({
    data: validated,
  })

  return Response.json(task)
}
```

### Com React Hook Form

```tsx
import { zodResolver } from '@hookform/resolvers/zod'
import { createTaskSchema } from '@/lib/validations'

const form = useForm({
  resolver: zodResolver(createTaskSchema),
  defaultValues: {
    title: '',
    status: 'todo',
    priority: 'medium',
  },
})
```

---

## 🏗️ Migração de Serviços com Lógica de Domínio

### Antes (lógica inline)

```tsx
// Cálculo de urgência inline
const urgent = tasks.map((t) => {
  let score = 0
  if (t.priority === 'high') score += 3
  // ... mais lógica
  return { ...t, score }
})
```

### Depois (helper de domínio)

```tsx
import {
  getUrgentTasks,
  computeUrgencyScore,
} from '@/core/domain/taskImportance'

// Uso direto
const urgentTasks = getUrgentTasks(tasks, 5, 20)

// Ou individual
const urgency = computeUrgencyScore(task)
```

### Cálculos de Tendências

```tsx
import {
  getTimeWindows,
  calculatePercentageChange,
  calculateFinanceNet,
} from '@/core/domain/analytics'

// Janelas de tempo
const windows = getTimeWindows(new Date(), 30)

// Variação percentual
const change = calculatePercentageChange(current, previous)

// Finance net
const { income, expense, net } = calculateFinanceNet(financeRows)
```

---

## 🎨 Migração para Design Tokens

### Antes (valores hardcoded)

```tsx
// Tailwind classes diretas
<div className="rounded-lg shadow-md p-6" />

// Cores inline
<div style={{ color: '#6157FF' }} />
```

### Depois (usando tokens)

```tsx
import { colors, shadows, spacing } from '@/styles/tokens'

// Em componentes styled
;<div
  style={{
    borderRadius: '0.75rem', // ou usar classe Tailwind
    boxShadow: shadows.md,
    padding: spacing.lg,
    color: colors.brand.DEFAULT,
  }}
/>

// Preferível: Atualizar Tailwind config para usar tokens
// tailwind.config.ts
import { colors, spacing, shadows } from './src/styles/tokens'

export default {
  theme: {
    extend: {
      colors,
      spacing,
      boxShadow: shadows,
    },
  },
}
```

---

## 🔔 Migração do useNotifications

### Antes

```tsx
const { notifications } = useNotifications()
```

### Depois (com opções)

```tsx
const { notifications, unreadCount, markAsRead, isLoading, refresh } =
  useNotifications({
    unreadOnly: true,
    limit: 20,
    refreshInterval: 15000, // 15s
  })

// Uso
;<Button onClick={() => markAsRead(notification.id)}>Marcar como lida</Button>
```

---

## 📋 Checklist de Migração

### Fase 1: Componentes UI

- [ ] Migrar todos `StatusBadge` → `Badge`
- [ ] Migrar todos `LoadingSpinner` → `Spinner`
- [ ] Adicionar `isLoading` aos botões de ação
- [ ] Substituir forms por `FormField`

### Fase 2: Type Safety

- [ ] Substituir strings literais por enums
- [ ] Adicionar validação Zod nas APIs
- [ ] Tipar responses com schemas

### Fase 3: Lógica de Domínio

- [ ] Extrair cálculos inline para helpers
- [ ] Usar `getUrgentTasks` nos dashboards
- [ ] Aplicar `calculateFinanceNet` nas finanças

### Fase 4: Design Tokens

- [ ] Atualizar Tailwind config
- [ ] Substituir valores hardcoded
- [ ] Gerar CSS custom properties

### Fase 5: Otimizações

- [ ] Aplicar `useNotifications` otimizado
- [ ] Refatorar serviços grandes
- [ ] Adicionar testes

---

## 🧪 Scripts de Teste

### Verificar imports antigos

```bash
# Badges antigos
grep -r "status-badge\|unified-status-badge" src/

# Spinners antigos
grep -r "loading-spinner" src/

# Strings literais de status
grep -r "'todo'\|'in-progress'\|'done'" src/ | grep -v enums.ts
```

### Buscar oportunidades de melhoria

```bash
# Formulários sem FormField
grep -r "<Label" src/ | grep -v form-field

# Botões sem isLoading
grep -r "disabled={.*loading" src/

# Validação manual
grep -r "if (!.*||.*trim" src/
```

---

## 🚀 Aplicação Gradual

Recomenda-se migrar em ordem:

1. **Semana 1:** Badges e Spinners (baixo risco)
2. **Semana 2:** Enums em arquivos novos
3. **Semana 3:** FormField em forms principais
4. **Semana 4:** Validação Zod nas APIs críticas
5. **Semana 5+:** Refatoração de serviços

---

**Última atualização:** 16/11/2025
