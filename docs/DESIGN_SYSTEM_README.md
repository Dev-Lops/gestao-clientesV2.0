# 🎨 Design System & Melhorias - Gestão Clientes

Sistema de componentes, tokens e padrões para o projeto Gestão Clientes.

---

## 📚 Documentação

- **[Melhorias Implementadas](./MELHORIAS_IMPLEMENTADAS.md)** - Relatório completo de todas as melhorias aplicadas
- **[Guia de Migração](./GUIA_MIGRACAO.md)** - Como migrar código existente para os novos padrões
- **[Design Tokens](./DESIGN_TOKENS.md)** - Guia de cores, espaçamentos, sombras e tipografia
- **[Guia de UI Components](./UI_COMPONENTS_GUIDE.md)** - Catálogo de componentes reutilizáveis

---

## 🚀 Quick Start

### 1. Usar Badge Unificado

```tsx
import { Badge } from '@/components/ui/badge';

<Badge variant="success">Ativo</Badge>
<Badge variant="in-progress">Em Progresso</Badge>
<Badge variant="high">Alta Prioridade</Badge>
```

### 2. Button com Loading

```tsx
import { Button } from '@/components/ui/button'

;<Button isLoading={isSubmitting} loadingText='Salvando...'>
  Salvar
</Button>
```

### 3. FormField Composto

```tsx
import { FormField, FormActions } from '@/components/ui/form-field';

<FormField label="Nome" required error={errors.name?.message}>
  <Input {...register('name')} />
</FormField>

<FormActions>
  <Button type="submit" isLoading={isSubmitting}>Salvar</Button>
</FormActions>
```

### 4. Enums Tipados

```tsx
import { TASK_STATUS, TASK_STATUS_LABELS } from '@/types/enums'

const status = TASK_STATUS.IN_PROGRESS
const label = TASK_STATUS_LABELS[status] // "Em Progresso"
```

### 5. Validação com Zod

```tsx
import { createTaskSchema } from '@/lib/validations'

const result = createTaskSchema.safeParse(data)
if (!result.success) {
  // Erros tipados
  console.error(result.error.flatten())
}
```

### 6. Helpers de Domínio

```tsx
import { getUrgentTasks } from '@/core/domain/taskImportance'
import { calculateFinanceNet } from '@/core/domain/analytics'

const urgentTasks = getUrgentTasks(tasks, 5, 20)
const { income, expense, net } = calculateFinanceNet(financeRows)
```

---

## 🎨 Design Tokens

### Cores

```ts
import { colors } from '@/styles/tokens'

colors.brand.DEFAULT // '#6157FF'
colors.status.success // '#16A34A'
colors.status.warning // '#F59E0B'
colors.status.danger // '#DC2626'
```

### Espaçamento

```ts
import { spacing } from '@/styles/tokens'

spacing.xs // 0.5rem (8px)
spacing.sm // 0.75rem (12px)
spacing.md // 1rem (16px)
spacing.lg // 1.5rem (24px)
spacing.xl // 2rem (32px)
```

### Sombras

```ts
import { shadows } from '@/styles/tokens'

shadows.sm // Sombra leve
shadows.md // Sombra média
shadows.lg // Sombra forte
shadows.focus // Sombra de foco (acessibilidade)
```

---

## 🧩 Componentes Principais

### UI Primitives

- `Badge` - Tags e status com variantes semânticas
- `Button` - Botão com loading state e acessibilidade
- `Input` - Campo de texto com validação visual
- `Spinner` - Loading indicators variados
- `Card` - Container para conteúdo

### Compostos

- `FormField` - Campo completo (label + input + erro)
- `FormSection` - Seção de formulário com título
- `FormActions` - Container para botões de ação

### Feedback

- `Spinner`, `CircleSpinner`, `DotsSpinner`, `PulseSpinner`
- `Toaster` (via Sonner)
- Badges de status

---

## 📦 Estrutura de Arquivos

```
src/
├── styles/
│   └── tokens.ts              # Design tokens centralizados
├── types/
│   └── enums.ts               # Enums e constantes tipadas
├── core/
│   └── domain/
│       ├── taskImportance.ts  # Lógica de urgência
│       └── analytics.ts       # Cálculos e tendências
├── lib/
│   ├── validations.ts         # Schemas Zod
│   └── utils.ts               # Utilidades
├── components/
│   └── ui/
│       ├── badge.tsx
│       ├── button.tsx
│       ├── spinner.tsx
│       ├── input.tsx
│       ├── form-field.tsx
│       └── ...
├── hooks/
│   └── useNotifications.ts
└── services/
    └── clients/
        └── getClientDashboard.ts
```

---

## ✅ Padrões de Código

### Nomenclatura

- Componentes: `PascalCase` (ex: `FormField`)
- Arquivos: `kebab-case.tsx` (ex: `form-field.tsx`)
- Enums: `UPPER_SNAKE_CASE` (ex: `TASK_STATUS`)
- Funções: `camelCase` (ex: `getUrgentTasks`)

### Type Safety

- Use enums ao invés de strings literais
- Valide com Zod em APIs
- Exporte types de schemas Zod
- Evite `any`, prefira `unknown`

### Acessibilidade

- Sempre adicione `aria-label` em ícones
- Use `aria-invalid` em campos com erro
- Adicione `role="status"` em spinners
- Use `aria-busy` em estados de loading

### Performance

- Memoize callbacks com `useCallback`
- Use AbortController em fetches
- Paralelizar queries quando possível
- Evite cálculos complexos inline

---

## 🧪 Testes

### Unit Tests (Vitest)

```bash
npm test
```

### Linting

```bash
npm run lint
```

### Type Check

```bash
npm run type-check
```

---

## 📊 Métricas

### Componentes

- ✅ 10+ componentes UI padronizados
- ✅ 100% type-safe
- ✅ Acessibilidade WCAG 2.1 AA

### Código

- ✅ 50+ enums/constantes tipadas
- ✅ 15+ schemas Zod
- ✅ 250+ linhas reduzidas via refatoração

### Design

- ✅ Tokens centralizados
- ✅ Dark mode suportado
- ✅ Escalas consistentes

---

## 🛠️ Ferramentas

- **Next.js 16** - Framework React
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **shadcn/ui** - Base de componentes
- **Radix UI** - Primitives acessíveis
- **Zod** - Validação de schemas
- **SWR** - Data fetching
- **Prisma** - ORM

---

## 🤝 Contribuindo

### Antes de criar componentes

1. Verifique se já existe similar
2. Use design tokens
3. Adicione acessibilidade
4. Documente props
5. Adicione exemplos

### Antes de criar services

1. Separe lógica de domínio
2. Use helpers reutilizáveis
3. Valide com Zod
4. Paralelizar quando possível
5. Adicione testes

---

## 📖 Recursos

- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Radix UI Docs](https://www.radix-ui.com/primitives/docs/overview/introduction)
- [Zod Docs](https://zod.dev/)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Última atualização:** 16/11/2025  
**Versão:** 1.0.0
