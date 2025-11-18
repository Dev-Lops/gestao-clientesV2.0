# 🎨 Guia de Refatoração Visual - MyGest

## 📋 Sumário Executivo

Este guia documenta a refatoração completa do sistema visual da aplicação MyGest, baseando-se no design sofisticado da **página de info do cliente** como referência padrão. O objetivo é garantir consistência visual, responsividade mobile-first e uma experiência deslumbrante em todo o fluxo da aplicação.

---

## 🎯 Objetivos

- ✅ Padronizar toda a aplicação com base no design da página de info do cliente
- ✅ Implementar design system centralizado e reutilizável
- ✅ Garantir responsividade mobile-first em 100% das páginas
- ✅ Aplicar gradientes, sombras e animações sofisticadas
- ✅ Criar experiência visual consistente do login até o fim do fluxo

---

## 🏗️ Arquitetura do Design System

### Estrutura de Arquivos

```
src/
├── styles/
│   ├── design-system.ts          ✅ NOVO - Sistema completo
│   ├── tokens.ts                 ⚠️  MANTER (compatibilidade)
│   └── globals.css
├── components/
│   └── ui/
│       ├── kpi-card.tsx          ✅ NOVO - Cards KPI sofisticados
│       ├── card.tsx              ✅ REFATORADO
│       ├── button.tsx            ✅ REFATORADO
│       ├── input.tsx             🔄 A REFATORAR
│       ├── badge.tsx             🔄 A REFATORAR
│       └── ...
```

### Design System Criado

O arquivo `design-system.ts` contém:

1. **Spacing**: Sistema de espaçamento baseado em múltiplos de 4px
2. **Colors**: Paleta completa com gradientes e dark mode
3. **Radius**: Bordas arredondadas consistentes
4. **Shadows**: Sistema de elevação com suporte dark mode
5. **Typography**: Tipografia responsiva
6. **Animations**: Keyframes e transições
7. **Components**: Estilos pré-definidos para componentes
8. **Layouts**: Containers e grids responsivos
9. **Utilities**: Classes CSS utilitárias

---

## 🎨 Padrões de Design

### 1. Background de Páginas

**Padrão Aplicado:**

```tsx
<div className='page-background'>
  {/* ou */}
  <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950'>
    {/* Conteúdo */}
  </div>
</div>
```

**Onde Aplicar:**

- ✅ Página de info do cliente (referência)
- 🔄 Login page
- 🔄 Dashboard
- 🔄 Todas as páginas de clientes
- 🔄 Páginas de configurações

### 2. Containers Responsivos

**Padrão Aplicado:**

```tsx
<div className='max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6'>
  {/* Conteúdo */}
</div>
```

**Breakpoints:**

- Mobile: `px-4` (16px)
- Tablet: `sm:px-6` (24px)
- Desktop: `lg:px-8` (32px)

### 3. Cards KPI (Métricas)

**Componente Criado:** `<KpiCard />`

**Exemplo de Uso:**

```tsx
import { KpiCard, KpiGrid } from '@/components/ui/kpi-card'
import { CheckCircle2, FolderKanban } from 'lucide-react'

;<KpiGrid columns={4}>
  <KpiCard
    variant='emerald'
    icon={CheckCircle2}
    value='85%'
    label='Taxa de Conclusão'
    description='14 concluídas'
    progress={85}
  />
  <KpiCard
    variant='blue'
    icon={FolderKanban}
    value='12'
    label='Tarefas Ativas'
    description='3 em progresso'
  />
</KpiGrid>
```

**Variantes Disponíveis:**

- `emerald` - Verde (sucesso, conclusão)
- `blue` - Azul (tarefas, ações)
- `purple` - Roxo (mídia, criativo)
- `amber` - Âmbar (reuniões, alertas)
- `red` - Vermelho (urgente, problemas)
- `indigo` - Índigo (insights)
- `pink` - Rosa (especial)

### 4. Cards Padrão

**Refatoração Aplicada:**

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

;<Card variant='default' hover>
  <CardHeader>
    <div className='flex items-center gap-2'>
      <div className='p-2 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg'>
        <Icon className='h-5 w-5 text-blue-600 dark:text-blue-400' />
      </div>
      <CardTitle>Título do Card</CardTitle>
    </div>
  </CardHeader>
  <CardContent>{/* Conteúdo */}</CardContent>
</Card>
```

**Variantes:**

- `default` - Estilo padrão
- `elevated` - Com mais elevação
- `interactive` - Clicável com animações
- `bordered` - Borda destacada

### 5. Botões

**Refatoração Aplicada:**

```tsx
import { Button } from '@/components/ui/button'

{
  /* Botão primário com gradiente */
}
;<Button variant='default' size='lg'>
  <Icon className='h-4 w-4' />
  Criar Tarefa
</Button>

{
  /* Botão de sucesso */
}
;<Button variant='success'>
  <DollarSign className='h-4 w-4' />
  Processar Pagamento
</Button>

{
  /* Botão outline */
}
;<Button variant='outline'>Cancelar</Button>
```

**Variantes Atualizadas:**

- `default` - Gradiente azul/índigo
- `success` - Gradiente verde/esmeralda
- `destructive` - Gradiente vermelho/rosa
- `warning` - Gradiente âmbar/laranja
- `outline` - Borda com hover suave
- `secondary` - Cinza sólido
- `ghost` - Transparente
- `link` - Texto sublinhado

**Tamanhos:**

- `sm` - 36px altura
- `default` - 40px altura
- `lg` - 48px altura
- `xl` - 56px altura

### 6. Títulos e Gradientes de Texto

**Padrão para Títulos Principais:**

```tsx
;<h1 className='text-3xl font-bold text-gradient-primary mb-2'>
  {client.name}
</h1>

{
  /* ou */
}
;<h1 className='text-3xl font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-purple-800 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent'>
  {client.name}
</h1>
```

**Classes Utilitárias:**

- `.text-gradient-primary` - Gradiente escuro/claro responsivo
- `.text-gradient-brand` - Gradiente azul/roxo
- `.text-gradient-emerald` - Gradiente verde

### 7. Ícones com Containers

**Padrão de Ícone em Card Header:**

```tsx
<div className='p-2 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg'>
  <Icon className='h-5 w-5 text-blue-600 dark:text-blue-400' />
</div>
```

**Padrão de Ícone em KPI:**

```tsx
<div className='p-2.5 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl group-hover:scale-110 transition-transform'>
  <CheckCircle2 className='h-5 w-5 text-emerald-600 dark:text-emerald-400' />
</div>
```

### 8. Badges

**Padrão Atualizado:**

```tsx
<Badge variant="default" className="capitalize">
  {client.status}
</Badge>

<Badge
  variant="outline"
  className="capitalize flex items-center gap-1"
>
  <Clock className="h-3 w-3" />
  {client.plan}
</Badge>
```

**Cores Semânticas:**

- Verde: `.bg-emerald-100 .text-emerald-700 .dark:bg-emerald-900/30`
- Azul: `.bg-blue-100 .text-blue-700 .dark:bg-blue-900/30`
- Roxo: `.bg-purple-100 .text-purple-700 .dark:bg-purple-900/30`
- Âmbar: `.bg-amber-100 .text-amber-700 .dark:bg-amber-900/30`
- Vermelho: `.bg-red-100 .text-red-700 .dark:bg-red-900/30`

### 9. Grids Responsivos

**Grid de KPIs (4 colunas):**

```tsx
<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
  {/* KPI Cards */}
</div>
```

**Grid Principal (2/3 - 1/3):**

```tsx
<div className='grid grid-cols-1 xl:grid-cols-3 gap-6'>
  <div className='xl:col-span-2 space-y-6'>{/* Conteúdo principal */}</div>
  <div className='space-y-6'>{/* Sidebar */}</div>
</div>
```

**Grid 3 Colunas:**

```tsx
<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
  {/* Cards */}
</div>
```

### 10. Animações e Transições

**Hover em Cards:**

```tsx
<Card className='hover:shadow-xl transition-all hover:scale-105'>
  {/* Conteúdo */}
</Card>
```

**Hover em Botões:**

```tsx
<Button className='hover:shadow-xl hover:scale-105 active:scale-95'>
  Clique aqui
</Button>
```

**Animações de Entrada:**

```tsx
<div className="animate-fade-in">
  {/* Conteúdo que aparece com fade */}
</div>

<div className="animate-slide-up">
  {/* Conteúdo que desliza para cima */}
</div>
```

---

## 📄 Checklist de Refatoração por Página

### ✅ Página de Info do Cliente

**Status:** ✅ COMPLETA (Referência)

**Características:**

- Background com gradiente suave
- KPI cards com gradientes e animações
- Grid responsivo 2/3 - 1/3
- Cards com bordas e sombras sutis
- Ícones com containers coloridos
- Badges semânticos
- Hover effects suaves

---

### 🔄 Página de Login

**Status:** 🔄 A REFATORAR

**Arquivo:** `src/app/login/page.tsx`

**Mudanças Necessárias:**

1. **Manter o design atual (já está bom)** mas garantir consistência:
   - ✅ Background com blobs animados
   - ✅ Card central com glow effect
   - ✅ Botão gradiente
   - ✅ Divisão responsiva 50/50

2. **Ajustes finos:**

```tsx
// Atualizar botão para usar nova variante
<Button
  onClick={handleLogin}
  disabled={isLogging || loading}
  size='lg'
  className='w-full h-14 text-base font-semibold'
>
  {/* conteúdo */}
</Button>
```

**Prioridade:** 🟡 MÉDIA (Já está bom, apenas pequenos ajustes)

---

### 🔄 Dashboard Principal

**Status:** 🔄 A REFATORAR

**Arquivo:** `src/app/(dashboard)/page.tsx` e `DashboardClient.tsx`

**Mudanças Necessárias:**

1. **Background:**

```tsx
<div className="page-background">
  <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
```

2. **Substituir cards de métricas por KpiCard:**

```tsx
import { KpiCard, KpiGrid } from '@/components/ui/kpi-card'

;<KpiGrid columns={4}>
  <KpiCard
    variant='emerald'
    icon={DollarSign}
    value={formatCurrency(financial.income)}
    label='Receitas'
    description='Este mês'
  />
  <KpiCard
    variant='blue'
    icon={Users}
    value={counts.clients.active}
    label='Clientes Ativos'
    description={`${counts.clients.total} no total`}
  />
  {/* ... mais KPIs */}
</KpiGrid>
```

3. **Refatorar cards de conteúdo:**

```tsx
<Card variant='default' hover>
  <CardHeader>
    <div className='flex items-center gap-2'>
      <div className='p-2 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg'>
        <TrendingUp className='h-5 w-5 text-blue-600 dark:text-blue-400' />
      </div>
      <CardTitle>Resumo Financeiro</CardTitle>
    </div>
  </CardHeader>
  <CardContent>{/* conteúdo */}</CardContent>
</Card>
```

4. **Grid responsivo:**

```tsx
<div className='grid grid-cols-1 xl:grid-cols-3 gap-6'>
  <div className='xl:col-span-2 space-y-6'>{/* Conteúdo principal */}</div>
  <div className='space-y-6'>{/* Sidebar */}</div>
</div>
```

**Prioridade:** 🔴 ALTA

---

### 🔄 Páginas de Cliente

**Status:** 🔄 A REFATORAR

**Arquivos:**

- `src/app/(dashboard)/clients/[id]/tasks/page.tsx`
- `src/app/(dashboard)/clients/[id]/meetings/page.tsx`
- `src/app/(dashboard)/clients/[id]/media/page.tsx`
- `src/app/(dashboard)/clients/[id]/billing/page.tsx`
- `src/app/(dashboard)/clients/[id]/finance/page.tsx`
- `src/app/(dashboard)/clients/[id]/settings/page.tsx`

**Padrão Unificado:**

```tsx
export default async function ClientPageName({ params }: Props) {
  const { id } = await params
  // ... lógica de autenticação e dados

  return (
    <ProtectedRoute>
      <div className='page-background'>
        <div className='max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6'>
          {/* Header */}
          <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
            <div>
              <h1 className='text-3xl font-bold text-gradient-primary mb-2'>
                {pageTitle}
              </h1>
              <div className='flex flex-wrap items-center gap-2'>
                <Badge variant='default'>{client.status}</Badge>
                {/* Mais badges */}
              </div>
            </div>
            <div className='flex flex-wrap gap-2'>{/* Botões de ação */}</div>
          </div>

          {/* Conteúdo principal */}
          <div className='grid grid-cols-1 xl:grid-cols-3 gap-6'>
            {/* ... */}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
```

**Prioridade:** 🔴 ALTA

---

### 🔄 Lista de Clientes

**Status:** 🔄 A REFATORAR

**Arquivo:** `src/app/(dashboard)/clients/page.tsx`

**Mudanças:**

1. **Background e container:**

```tsx
<div className="page-background">
  <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
```

2. **Header com estatísticas:**

```tsx
<KpiGrid columns={4}>
  <KpiCard
    variant='blue'
    icon={Users}
    value={totalClients}
    label='Total de Clientes'
  />
  <KpiCard
    variant='emerald'
    icon={CheckCircle2}
    value={activeClients}
    label='Clientes Ativos'
  />
  {/* ... */}
</KpiGrid>
```

3. **Cards de clientes:**

```tsx
<Card variant='interactive'>{/* Informações do cliente */}</Card>
```

**Prioridade:** 🔴 ALTA

---

### 🔄 Configurações e Administração

**Status:** 🔄 A REFATORAR

**Arquivos:**

- Páginas de configurações
- Páginas de admin
- Páginas de perfil

**Padrão:** Seguir mesmo layout das páginas de cliente

**Prioridade:** 🟡 MÉDIA

---

## 🎨 Componentes a Refatorar

### 🔄 Input

**Arquivo:** `src/components/ui/input.tsx`

**Refatoração:**

```tsx
const inputVariants = cva(
  'w-full rounded-lg border-2 transition-all duration-200 px-4 py-2.5',
  {
    variants: {
      variant: {
        default:
          'border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20',
        error:
          'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20',
      },
      size: {
        sm: 'h-9 text-sm',
        default: 'h-10 text-base',
        lg: 'h-12 text-lg',
      },
    },
  }
)
```

### 🔄 Badge

**Arquivo:** `src/components/ui/badge.tsx`

**Adicionar variantes semânticas:**

```tsx
const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default:
          'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100',
        success:
          'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
        warning:
          'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
        danger: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
        info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
        purple:
          'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
        outline: 'border-2 border-slate-300 dark:border-slate-700',
      },
    },
  }
)
```

### 🔄 Progress

**Arquivo:** `src/components/ui/progress.tsx` ou `progress-bar.tsx`

**Adicionar variantes de cor:**

```tsx
<Progress value={75} variant='emerald' className='h-2' />
```

---

## 📱 Responsividade Mobile-First

### Checklist de Responsividade

**Breakpoints:**

- Mobile: `< 640px` (base)
- Tablet: `640px - 1024px` (sm, md)
- Desktop: `> 1024px` (lg, xl, 2xl)

**Classes Essenciais:**

```tsx
// Padding responsivo
className = 'px-4 sm:px-6 lg:px-8'

// Grid responsivo
className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'

// Flex responsivo
className = 'flex flex-col sm:flex-row items-start sm:items-center gap-4'

// Texto responsivo
className = 'text-2xl sm:text-3xl lg:text-4xl'

// Espaçamento responsivo
className = 'p-4 sm:p-6'
```

**Teste em Todas as Páginas:**

- [ ] Mobile 375px (iPhone SE)
- [ ] Mobile 390px (iPhone 12/13)
- [ ] Tablet 768px (iPad)
- [ ] Desktop 1024px
- [ ] Desktop large 1440px
- [ ] Desktop XL 1920px

---

## 🌗 Dark Mode

### Padrões Dark Mode

**Backgrounds:**

```tsx
// Light: Gradiente suave de cinza/azul/roxo
// Dark: Gradiente de cinza muito escuro
className =
  'bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950'
```

**Cards:**

```tsx
className = 'bg-white dark:bg-slate-900'
```

**Texto:**

```tsx
// Texto principal
className = 'text-slate-900 dark:text-white'

// Texto secundário
className = 'text-slate-600 dark:text-slate-400'

// Texto terciário
className = 'text-slate-500 dark:text-slate-500'
```

**Bordas:**

```tsx
className = 'border-slate-200 dark:border-slate-800'
```

**Ícones com Background:**

```tsx
className = 'bg-blue-100 dark:bg-blue-900/50'
className = 'text-blue-600 dark:text-blue-400'
```

---

## ⚡ Animações

### Animações Aplicadas

**Hover em Cards:**

```tsx
className = 'transition-all duration-200 hover:shadow-xl hover:scale-105'
```

**Hover em Ícones:**

```tsx
className = 'transition-transform group-hover:scale-110'
```

**Hover em Botões:**

```tsx
className =
  'transition-all duration-200 hover:shadow-xl hover:scale-105 active:scale-95'
```

**Status Dots (pulsante):**

```tsx
<div className='h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse' />
```

**Blob Animation (Background):**

```tsx
<div className="absolute ... animate-blob" />
<div className="absolute ... animate-blob animation-delay-2000" />
<div className="absolute ... animate-blob animation-delay-4000" />
```

**CSS para delays:**

```css
.animation-delay-2000 {
  animation-delay: 2s;
}
.animation-delay-4000 {
  animation-delay: 4s;
}
```

---

## 🎯 Prioridades de Implementação

### Fase 1: Base (CONCLUÍDA ✅)

1. ✅ Design System completo
2. ✅ Refatorar componentes base (Card, Button)
3. ✅ Criar componente KpiCard
4. ✅ Atualizar Tailwind config

### Fase 2: Páginas Principais (A FAZER 🔄)

1. 🔴 Dashboard principal
2. 🔴 Lista de clientes
3. 🔴 Páginas de detalhes de clientes (tasks, meetings, etc)
4. 🟡 Página de login (ajustes finos)

### Fase 3: Componentes Secundários (A FAZER 🔄)

1. 🟡 Input
2. 🟡 Badge
3. 🟡 Progress
4. 🟡 Dialog/Modal
5. 🟡 Dropdown

### Fase 4: Páginas Secundárias (A FAZER 🔄)

1. 🟢 Configurações
2. 🟢 Administração
3. 🟢 Perfil
4. 🟢 Outras páginas

### Fase 5: Validação Final (A FAZER 🔄)

1. 🔵 Teste de responsividade em todos os breakpoints
2. 🔵 Teste de dark mode em todas as páginas
3. 🔵 Teste de acessibilidade
4. 🔵 Otimização de performance
5. 🔵 Documentação final

---

## 📝 Exemplos de Código

### Exemplo Completo: Página de Dashboard Refatorada

```tsx
import { KpiCard, KpiGrid } from '@/components/ui/kpi-card'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DollarSign,
  Users,
  FolderKanban,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react'

export default function DashboardPage() {
  return (
    <div className='page-background'>
      <div className='max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6'>
        {/* Header */}
        <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
          <div>
            <h1 className='text-3xl font-bold text-gradient-primary mb-2'>
              Dashboard
            </h1>
            <p className='text-slate-600 dark:text-slate-400'>
              Visão geral do seu negócio
            </p>
          </div>
          <Button size='lg'>
            <Plus className='h-4 w-4' />
            Novo Cliente
          </Button>
        </div>

        {/* KPIs */}
        <KpiGrid columns={4}>
          <KpiCard
            variant='emerald'
            icon={DollarSign}
            value='R$ 45.280'
            label='Receita do Mês'
            description='↑ 12% vs mês anterior'
          />
          <KpiCard
            variant='blue'
            icon={Users}
            value='24'
            label='Clientes Ativos'
            description='32 no total'
          />
          <KpiCard
            variant='purple'
            icon={FolderKanban}
            value='18'
            label='Tarefas Abertas'
            description='5 urgentes'
          />
          <KpiCard
            variant='amber'
            icon={CheckCircle2}
            value='87%'
            label='Taxa de Conclusão'
            progress={87}
          />
        </KpiGrid>

        {/* Grid Principal */}
        <div className='grid grid-cols-1 xl:grid-cols-3 gap-6'>
          {/* Coluna Principal (2/3) */}
          <div className='xl:col-span-2 space-y-6'>
            {/* Card de Resumo Financeiro */}
            <Card variant='default' hover>
              <CardHeader>
                <div className='flex items-center gap-2'>
                  <div className='p-2 bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30 rounded-lg'>
                    <TrendingUp className='h-5 w-5 text-emerald-600 dark:text-emerald-400' />
                  </div>
                  <CardTitle>Resumo Financeiro</CardTitle>
                </div>
              </CardHeader>
              <CardContent>{/* Gráfico ou tabela */}</CardContent>
            </Card>
          </div>

          {/* Sidebar (1/3) */}
          <div className='space-y-6'>
            {/* Alertas */}
            <Card variant='default' hover>
              <CardHeader>
                <CardTitle className='text-base'>Alertas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-2'>
                  <div className='p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border-2 border-red-200 dark:border-red-800'>
                    <p className='text-sm font-medium text-red-700 dark:text-red-300'>
                      3 tarefas atrasadas
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
```

---

## 🚀 Como Implementar

### Passo a Passo

1. **Instale as dependências** (se necessário):

```bash
pnpm install
```

2. **Atualize os imports** nas páginas:

```tsx
// Antigo
import { Card } from '@/components/ui/card'

// Novo (com variantes)
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { KpiCard, KpiGrid } from '@/components/ui/kpi-card'
```

3. **Substitua componentes antigos** pelos novos:

```tsx
// Antigo
<div className="bg-white rounded-lg p-6 shadow">
  {/* conteúdo */}
</div>

// Novo
<Card variant="default" hover>
  <CardContent>
    {/* conteúdo */}
  </CardContent>
</Card>
```

4. **Aplique o background padrão** em cada página:

```tsx
<div className='page-background'>
  <div className='max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6'>
    {/* conteúdo */}
  </div>
</div>
```

5. **Teste responsividade** em diferentes tamanhos:

```bash
# Abre DevTools e teste:
- Mobile: 375px, 390px
- Tablet: 768px, 1024px
- Desktop: 1280px, 1440px, 1920px
```

---

## 📚 Referências

- **Página de Referência:** `src/app/(dashboard)/clients/[id]/info/page.tsx`
- **Design System:** `src/styles/design-system.ts`
- **Tailwind Config:** `tailwind.config.ts`
- **Componentes UI:** `src/components/ui/`

---

## ✅ Checklist Final

### Componentes Base

- [x] Design System criado
- [x] Tailwind config atualizado
- [x] Card refatorado
- [x] Button refatorado
- [x] KpiCard criado
- [ ] Input refatorado
- [ ] Badge refatorado
- [ ] Progress refatorado

### Páginas

- [x] Info do cliente (referência)
- [ ] Dashboard principal
- [ ] Lista de clientes
- [ ] Tarefas do cliente
- [ ] Reuniões do cliente
- [ ] Mídia do cliente
- [ ] Cobrança do cliente
- [ ] Finanças do cliente
- [ ] Configurações do cliente
- [ ] Login (ajustes finos)

### Responsividade

- [ ] Mobile 375px testado
- [ ] Mobile 390px testado
- [ ] Tablet 768px testado
- [ ] Desktop 1024px testado
- [ ] Desktop 1440px testado
- [ ] Desktop 1920px testado

### Dark Mode

- [ ] Todas as páginas testadas
- [ ] Todos os componentes testados
- [ ] Contrastes adequados

### Performance

- [ ] Sem re-renders desnecessários
- [ ] Imagens otimizadas
- [ ] Animações suaves (60fps)

---

## 🎉 Conclusão

Este guia fornece todos os padrões, componentes e exemplos necessários para refatorar toda a aplicação MyGest com um design consistente, sofisticado e responsivo. Siga as prioridades e utilize os exemplos de código para garantir uma implementação perfeita.

**Próximos Passos:**

1. Refatorar Dashboard principal
2. Refatorar páginas de clientes
3. Refatorar componentes secundários
4. Validar responsividade e dark mode

**Boa implementação! 🚀**
