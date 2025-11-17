# 🎨 Auditoria Visual Completa - Design System MyGest

**Data**: 16 de Novembro de 2025  
**Páginas de Referência**: Login, Billing, Inadimplência  
**Objetivo**: Padronização visual total da aplicação

---

## 📐 PADRÃO VISUAL OFICIAL (Extraído das 3 Páginas de Referência)

### 1. **Identidade Visual Core**

#### 🎨 Paleta de Cores

```typescript
// Gradientes principais (OFICIAL)
const gradients = {
  primary: "from-blue-600 to-purple-600",        // Login, CTAs
  success: "from-emerald-600 via-teal-600 to-cyan-600", // Billing
  danger: "from-red-600 via-rose-600 to-orange-500",    // Inadimplência
  brand: "from-slate-900 to-slate-700",          // Textos destaque
}

// Cards e superfícies
background: {
  page: "bg-linear-to-br from-slate-50 via-blue-50/30 to-slate-100",
  pageDark: "dark:from-slate-950 dark:via-blue-950/20 dark:to-slate-900",
  card: "bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm",
  cardHeader: "bg-linear-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800",
}

// Status colors (KPI cards)
status: {
  danger: "from-red-500 to-pink-500",
  warning: "from-amber-500 to-orange-500",
  info: "from-blue-500 to-cyan-500",
  success: "from-emerald-500 to-green-500",
  neutral: "from-purple-500 to-fuchsia-500",
}
```

#### 📏 Espaçamentos Padrão

```typescript
const spacing = {
  page: "p-4 sm:p-6 lg:p-8",           // Padding de páginas
  section: "space-y-6",                 // Entre seções
  card: "p-6 sm:p-8",                   // Interno de cards
  cardHeader: "p-6 sm:p-8",            // Headers
  cardContent: "p-0" ou "p-6",         // Conteúdo
  grid: "gap-4 sm:gap-6",              // Entre items de grid
}
```

#### 🔲 Bordas e Cantos

```typescript
const radii = {
  page: "rounded-2xl",                 // Headers principais
  card: "rounded-2xl" ou "rounded-3xl", // Cards
  button: "rounded-lg" ou "rounded-xl", // Botões
  kpi: "rounded-lg" ou "rounded-xl",   // KPI cards
  iconWrapper: "rounded-xl",           // Wrappers de ícones
}

const borders = {
  card: "border-2",                    // Cards principais
  subtle: "border",                    // Bordas finas
  input: "border",                     // Inputs
}
```

#### ✨ Sombras e Efeitos

```typescript
const shadows = {
  page: 'shadow-2xl', // Headers principais
  card: 'shadow-lg hover:shadow-xl', // Cards interativos
  button: 'shadow-lg shadow-blue-500/30', // Botões primários
  kpi: 'hover:shadow-lg transition-all', // KPI cards
}

const effects = {
  backdrop: 'backdrop-blur-sm', // Glass effect
  glowEffect: {
    // Glow em cards importantes
    wrapper: 'relative',
    glow: 'absolute -inset-1 bg-linear-to-r from-blue-600 to-purple-600 rounded-3xl blur opacity-20',
    content: 'relative',
  },
  bgPattern: {
    // Padrão de fundo (grid.svg)
    pattern: "absolute inset-0 bg-[url('/grid.svg')] opacity-10",
    blob1:
      'absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2',
    blob2:
      'absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2',
  },
}
```

#### 🔤 Tipografia

```typescript
const typography = {
  pageTitle: 'text-3xl sm:text-4xl font-bold', // Headers principais
  cardTitle: 'text-lg font-semibold', // Títulos de cards
  kpiValue: 'text-2xl font-bold', // Valores grandes
  kpiLabel: 'text-sm font-medium text-muted-foreground',
  kpiDesc: 'text-xs text-muted-foreground',
  body: 'text-sm',
  bodySmall: 'text-xs',
}
```

---

## 🔍 ANÁLISE DAS PÁGINAS DE REFERÊNCIA

### **1. Login Page** ✅ PADRÃO EXCELENTE

**Características:**

- ✅ Gradiente animado de fundo (blobs)
- ✅ Layout split (brand esquerda, form direita)
- ✅ Card com glow effect
- ✅ Botão grande com gradiente + shadow
- ✅ Ícone com backdrop blur em wrapper
- ✅ Spacing consistente (gap-3, gap-4, space-y-6)
- ✅ Typography hierarquizada (3xl, 2xl, base, sm)
- ✅ Transitions suaves

**Padrões extraídos:**

```tsx
// Header com ícone
<div className="flex items-center gap-3">
  <div className="relative">
    <div className="absolute inset-0 bg-linear-to-tr from-blue-600 to-purple-600 rounded-2xl blur-lg opacity-50" />
    <div className="relative w-12 h-12 bg-linear-to-tr from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
      <Icon className="w-6 h-6 text-white" />
    </div>
  </div>
  <span className="text-3xl font-bold bg-linear-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
    MyGest
  </span>
</div>

// Card com glow
<div className="relative">
  <div className="absolute -inset-1 bg-linear-to-r from-blue-600 to-purple-600 rounded-3xl blur opacity-20" />
  <div className="relative bg-card rounded-2xl shadow-2xl border p-8 space-y-6">
    {/* Content */}
  </div>
</div>

// Button primário
<Button className="w-full h-14 text-base font-semibold bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/30 transition-all group">
  <span>Label</span>
  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
</Button>
```

---

### **2. Billing Page** ✅ PADRÃO EXCELENTE

**Características:**

- ✅ Header com gradiente emerald/teal/cyan
- ✅ Background pattern (grid.svg) + blobs
- ✅ KPI cards com gradientes temáticos
- ✅ Glow effect em cada KPI (blur-2xl no canto)
- ✅ Card headers com gradiente sutil
- ✅ Border-2 em cards principais
- ✅ Ícones em wrappers com gradiente
- ✅ Spacing consistente (space-y-6, gap-4)
- ✅ Typography padronizada

**Padrões extraídos:**

```tsx
// Header principal
<header className="relative overflow-hidden rounded-2xl bg-linear-to-br from-emerald-600 via-teal-600 to-cyan-600 p-6 sm:p-8 text-white shadow-2xl">
  <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
  <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
  <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
  <div className="relative flex items-center gap-3">
    <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
      <Icon className="h-6 w-6" />
    </div>
    <div>
      <h1 className="text-3xl sm:text-4xl font-bold">Cobrança</h1>
      <p className="text-sm sm:text-base text-emerald-100 mt-1">Descrição</p>
    </div>
  </div>
</header>

// KPI Card
<Card className="relative overflow-hidden border-2 hover:shadow-lg transition-all">
  <div className="absolute top-0 right-0 w-24 h-24 bg-linear-to-br from-red-500/10 to-pink-500/10 rounded-full blur-2xl" />
  <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
    <CardTitle className="text-sm font-medium text-muted-foreground">Label</CardTitle>
    <div className="h-8 w-8 rounded-lg bg-linear-to-br from-red-500 to-pink-500 flex items-center justify-center">
      <Icon className="h-4 w-4 text-white" />
    </div>
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold text-red-600">{value}</div>
    <p className="text-xs text-muted-foreground mt-1">Descrição</p>
  </CardContent>
</Card>

// Card com header gradiente
<Card className="border-2 shadow-lg hover:shadow-xl transition-shadow">
  <CardHeader className="bg-linear-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
    <div className="flex items-center gap-2">
      <div className="h-8 w-8 rounded-lg bg-linear-to-br from-blue-500 to-purple-500 flex items-center justify-center">
        <Icon className="h-4 w-4 text-white" />
      </div>
      <CardTitle className="text-lg font-semibold">Título</CardTitle>
    </div>
  </CardHeader>
  <CardContent>{/* Content */}</CardContent>
</Card>
```

---

### **3. Inadimplência Page** ✅ PADRÃO EXCELENTE

**Características:**

- ✅ Header com gradiente red/rose/orange
- ✅ Background pattern (grid.svg) + blobs
- ✅ KPI cards com gradientes temáticos (danger, warning, purple, neutral)
- ✅ Glow effect consistente
- ✅ Card header com gradiente red-50/pink-50
- ✅ Border-2 em cards principais
- ✅ Typography consistente
- ✅ Max-width (max-w-7xl mx-auto) para centralização

**Padrões extraídos:**

```tsx
// Header danger
<header className="relative overflow-hidden rounded-2xl bg-linear-to-br from-red-600 via-rose-600 to-orange-500 p-6 sm:p-8 text-white shadow-2xl">
  {/* Mesmo padrão de background do Billing */}
</header>

// Card header danger
<CardHeader className="bg-linear-to-r from-red-50 to-pink-50 dark:from-red-950 dark:to-pink-950">
  {/* Content */}
</CardHeader>
```

---

## ❌ PROBLEMAS ENCONTRADOS (Páginas Desalinhadas)

### **1. Dashboard (`/dashboard`)** ⚠️ PARCIALMENTE ALINHADO

**Problemas:**

- ❌ Header usa `bg-gradient-brand` (indefinido?) em vez do padrão gradiente
- ⚠️ StatCards têm estrutura similar mas falta glow effect no canto
- ❌ Sem background pattern (grid.svg + blobs)
- ⚠️ Cards usam `border-slate-200` em vez de `border-2`
- ⚠️ Falta padding page consistente (`p-4 sm:p-6 lg:p-8`)

**O que precisa:**

```tsx
// ATUAL (errado)
<header className="relative overflow-hidden rounded-2xl bg-gradient-brand p-6 sm:p-8 text-white shadow-2xl">

// DEVE SER (seguir Billing)
<header className="relative overflow-hidden rounded-2xl bg-linear-to-br from-blue-600 via-indigo-600 to-purple-600 p-6 sm:p-8 text-white shadow-2xl">
  <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
  <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
  <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
  {/* rest */}
</header>
```

**StatCard precisa:**

```tsx
<Card className='relative overflow-hidden rounded-xl border-2 hover:shadow-xl transition-all'>
  {/* Adicionar glow effect */}
  <div
    className={`absolute top-0 right-0 w-24 h-24 bg-linear-to-br ${iconColor}/10 rounded-full blur-2xl`}
  />
  {/* rest */}
</Card>
```

---

### **2. Clients (`/clients`)** ❌ MUITO DESALINHADO

**Problemas:**

- ❌ Usa PageHeader component (visual diferente dos headers de referência)
- ❌ Sem header com gradiente
- ❌ Filters inline sem card dedicado
- ❌ Grid cards usam `rounded-3xl` mas sem glow ou hover effects consistentes
- ❌ Badge genérico em vez de StatusBadge component
- ❌ Breadcrumbs não usado nas páginas de referência
- ❌ Layout muito diferente: usa PageContainer, PageLayout, PageHeader

**O que precisa:**

```tsx
// REMOVER
<PageContainer>
  <Breadcrumbs />
  <PageLayout>
    <PageHeader />
  </PageLayout>
</PageContainer>

// SUBSTITUIR POR
<div className="space-y-6 p-4 sm:p-6 lg:p-8">
  <header className="relative overflow-hidden rounded-2xl bg-linear-to-br from-blue-600 via-indigo-600 to-purple-600 p-6 sm:p-8 text-white shadow-2xl">
    {/* Padrão Billing/Inadimplência */}
  </header>

  {/* KPI cards se aplicável */}
  <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
    {/* KPI cards */}
  </div>

  {/* Content cards */}
  <Card className="border-2 shadow-lg">
    <CardHeader className="bg-linear-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Filters */}
    </CardHeader>
    <CardContent>{/* Content */}</CardContent>
  </Card>
</div>
```

---

### **3. Settings (`/settings`)** ❌ MUITO DESALINHADO

**Problemas:**

- ❌ Layout tab-based sem header gradiente
- ❌ Cards simples sem glow effects
- ❌ Typography inconsistente
- ❌ Sem KPIs se aplicável

**O que precisa:**

- Header gradiente (blue/purple)
- Cards com border-2 e shadow-lg
- Typography padronizada

---

### **4. Finance (`/finance`)** ❌ MUITO DESALINHADO

**Problemas:**

- ❌ Usa FinanceManagerGlobal component que tem visual próprio
- ❌ Precisa seguir padrão Billing (mesma área)

---

### **5. Profile (`/profile`)** ❌ MUITO DESALINHADO

**Problemas:**

- ❌ Sem header gradiente
- ❌ Cards simples
- ❌ Layout diferente

---

### **6. Admin (`/admin`)** ❌ MUITO DESALINHADO

**Problemas:**

- ❌ Sem header gradiente
- ❌ Tabela sem card wrapper padronizado

---

### **7. Client Detail Pages** (`/clients/[id]/*`) ⚠️ VARIA

**Problemas:**

- ❌ Cada sub-página tem visual próprio
- ❌ Alguns usam ClientInfoDisplay, outros managers específicos
- ⚠️ InstagramGrid tem visual diferenciado (ok para feature específica)
- ❌ BrandingManager, MediaManager, TasksManager têm modais pesados com visual próprio

---

## 📦 COMPONENTES QUE PRECISAM SER CRIADOS/REFATORADOS

### **1. PageHeader Component** ✅ CRIAR NOVO

```tsx
// src/components/layout/PageHeader.tsx
interface PageHeaderProps {
  title: string
  subtitle?: string
  icon: LucideIcon
  gradient: 'primary' | 'success' | 'danger' | 'brand'
  actions?: React.ReactNode
}

export function PageHeader({
  title,
  subtitle,
  icon: Icon,
  gradient,
  actions,
}: PageHeaderProps) {
  const gradients = {
    primary: 'from-blue-600 via-indigo-600 to-purple-600',
    success: 'from-emerald-600 via-teal-600 to-cyan-600',
    danger: 'from-red-600 via-rose-600 to-orange-500',
    brand: 'from-slate-900 via-slate-800 to-slate-700',
  }

  return (
    <header
      className={`relative overflow-hidden rounded-2xl bg-linear-to-br ${gradients[gradient]} p-6 sm:p-8 text-white shadow-2xl`}
    >
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
      <div className='absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2' />
      <div className='absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2' />

      <div className='relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
        <div className='flex items-center gap-3'>
          <div className='h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center'>
            <Icon className='h-6 w-6' />
          </div>
          <div>
            <h1 className='text-3xl sm:text-4xl font-bold'>{title}</h1>
            {subtitle && (
              <p className='text-sm sm:text-base text-white/80 mt-1'>
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {actions && <div className='flex items-center gap-2'>{actions}</div>}
      </div>
    </header>
  )
}
```

---

### **2. KPICard Component** ✅ CRIAR NOVO

```tsx
// src/components/common/KPICard.tsx
interface KPICardProps {
  label: string
  value: string | number
  description: string
  icon: LucideIcon
  variant: 'danger' | 'warning' | 'info' | 'success' | 'neutral' | 'dark'
  trend?: string
}

export function KPICard({
  label,
  value,
  description,
  icon: Icon,
  variant,
  trend,
}: KPICardProps) {
  const variants = {
    danger: {
      gradient: 'from-red-500 to-pink-500',
      glow: 'from-red-500/10 to-pink-500/10',
      textColor: 'text-red-600',
    },
    warning: {
      gradient: 'from-amber-500 to-orange-500',
      glow: 'from-amber-500/10 to-orange-500/10',
      textColor: 'text-amber-600',
    },
    info: {
      gradient: 'from-blue-500 to-cyan-500',
      glow: 'from-blue-500/10 to-cyan-500/10',
      textColor: 'text-blue-600',
    },
    success: {
      gradient: 'from-emerald-500 to-green-500',
      glow: 'from-emerald-500/10 to-green-500/10',
      textColor: 'text-emerald-600',
    },
    neutral: {
      gradient: 'from-purple-500 to-fuchsia-500',
      glow: 'from-purple-500/10 to-fuchsia-500/10',
      textColor: 'text-purple-600',
    },
    dark: {
      gradient: 'from-slate-600 to-slate-800',
      glow: 'from-slate-500/10 to-slate-700/10',
      textColor: 'text-slate-600',
    },
  }

  const v = variants[variant]

  return (
    <Card className='relative overflow-hidden border-2 hover:shadow-lg transition-all'>
      <div
        className={`absolute top-0 right-0 w-24 h-24 bg-linear-to-br ${v.glow} rounded-full blur-2xl`}
      />
      <CardHeader className='flex flex-row items-center justify-between pb-2 space-y-0'>
        <CardTitle className='text-sm font-medium text-muted-foreground'>
          {label}
        </CardTitle>
        <div
          className={`h-8 w-8 rounded-lg bg-linear-to-br ${v.gradient} flex items-center justify-center`}
        >
          <Icon className='h-4 w-4 text-white' />
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${v.textColor}`}>{value}</div>
        <p className='text-xs text-muted-foreground mt-1'>{description}</p>
      </CardContent>
    </Card>
  )
}
```

---

### **3. SectionCard Component** ✅ CRIAR NOVO

```tsx
// src/components/common/SectionCard.tsx
interface SectionCardProps {
  title: string
  icon?: LucideIcon
  iconGradient?: string
  headerGradient?: 'default' | 'success' | 'danger' | 'none'
  actions?: React.ReactNode
  children: React.ReactNode
}

export function SectionCard({
  title,
  icon: Icon,
  iconGradient = 'from-blue-500 to-purple-500',
  headerGradient = 'default',
  actions,
  children,
}: SectionCardProps) {
  const headerGradients = {
    default:
      'bg-linear-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800',
    success:
      'bg-linear-to-r from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950',
    danger:
      'bg-linear-to-r from-red-50 to-pink-50 dark:from-red-950 dark:to-pink-950',
    none: '',
  }

  return (
    <Card className='border-2 shadow-lg hover:shadow-xl transition-shadow'>
      <CardHeader className={headerGradients[headerGradient]}>
        <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
          <CardTitle className='text-lg font-semibold flex items-center gap-2'>
            {Icon && (
              <div
                className={`h-8 w-8 rounded-lg bg-linear-to-br ${iconGradient} flex items-center justify-center`}
              >
                <Icon className='h-4 w-4 text-white' />
              </div>
            )}
            {title}
          </CardTitle>
          {actions}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}
```

---

### **4. PageLayout Component** ✅ REFATORAR

```tsx
// src/components/layout/PageLayout.tsx
interface PageLayoutProps {
  children: React.ReactNode
  maxWidth?: 'default' | 'narrow' | 'wide' | 'full'
}

export function PageLayout({
  children,
  maxWidth = 'default',
}: PageLayoutProps) {
  const maxWidths = {
    narrow: 'max-w-5xl',
    default: 'max-w-7xl',
    wide: 'max-w-[1600px]',
    full: 'max-w-full',
  }

  return (
    <div
      className={`space-y-6 p-4 sm:p-6 lg:p-8 overflow-x-hidden ${maxWidths[maxWidth]} mx-auto`}
    >
      {children}
    </div>
  )
}
```

---

## 🎯 PLANO DE IMPLEMENTAÇÃO

### **Fase 1: Criar Componentes Padronizados** (2-3 horas)

1. ✅ Criar `src/components/layout/PageHeader.tsx`
2. ✅ Criar `src/components/common/KPICard.tsx`
3. ✅ Criar `src/components/common/SectionCard.tsx`
4. ✅ Refatorar `src/components/layout/PageLayout.tsx`
5. ✅ Adicionar `grid.svg` em `public/` (se não existir)

```svg
<!-- public/grid.svg -->
<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" stroke-width="0.5" opacity="0.1"/>
    </pattern>
  </defs>
  <rect width="100" height="100" fill="url(#grid)" />
</svg>
```

---

### **Fase 2: Refatorar Dashboard** (1-2 horas)

**Arquivo**: `src/app/(dashboard)/DashboardClient.tsx`

**Mudanças:**

1. ✅ Header: trocar `bg-gradient-brand` por gradiente blue/indigo/purple
2. ✅ Adicionar background pattern (grid.svg + blobs)
3. ✅ StatCards: adicionar glow effect
4. ✅ StatCards: usar border-2
5. ✅ Cards: ajustar para border-2 e shadow-lg

**Antes:**

```tsx
<header className="relative overflow-hidden rounded-2xl bg-gradient-brand p-6 sm:p-8 text-white shadow-2xl">
```

**Depois:**

```tsx
<header className='relative overflow-hidden rounded-2xl bg-linear-to-br from-blue-600 via-indigo-600 to-purple-600 p-6 sm:p-8 text-white shadow-2xl'>
  <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
  <div className='absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2' />
  <div className='absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2' />
  {/* rest */}
</header>
```

---

### **Fase 3: Refatorar Clients Page** (2-3 horas)

**Arquivo**: `src/app/(dashboard)/clients/page.tsx`

**Mudanças:**

1. ❌ REMOVER imports: PageContainer, PageHeader, PageLayout, Breadcrumbs
2. ✅ ADICIONAR: PageHeader component novo
3. ✅ Substituir estrutura por PageLayout padrão
4. ✅ Adicionar KPI cards (Total clientes, Ativos, Pausados, etc)
5. ✅ Filters: mover para dentro de SectionCard
6. ✅ Grid: usar padrão consistente

**Estrutura nova:**

```tsx
export default async function ClientsPage({ searchParams }: PageProps) {
  // ... lógica existente

  return (
    <PageLayout>
      <PageHeader
        title='Meus Clientes'
        subtitle='Visualize e gerencie todos os clientes da sua organização'
        icon={Users}
        gradient='primary'
        actions={canCreateClient && <Button>Novo Cliente</Button>}
      />

      {/* KPI Cards */}
      <div className='grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'>
        <KPICard
          label='Total'
          value={clients.length}
          icon={Users}
          variant='info'
          description='Clientes cadastrados'
        />
        {/* Outros KPIs */}
      </div>

      {/* Filters & List */}
      <SectionCard
        title='Lista de clientes'
        icon={Users}
        actions={<>Filters</>}
      >
        {/* Grid ou lista */}
      </SectionCard>
    </PageLayout>
  )
}
```

---

### **Fase 4: Refatorar Settings, Profile, Admin** (3-4 horas)

**Arquivos:**

- `src/app/(dashboard)/settings/page.tsx`
- `src/app/(dashboard)/profile/page.tsx`
- `src/app/(app)/admin/page.tsx`

**Mudanças:**

1. ✅ Adicionar PageHeader
2. ✅ Usar SectionCard para cada seção
3. ✅ Padronizar typography
4. ✅ Adicionar KPIs onde faz sentido

---

### **Fase 5: Refatorar Finance** (2-3 horas)

**Arquivo**: `src/app/(dashboard)/finance/page.tsx`

**Mudanças:**

1. ✅ FinanceManagerGlobal deve seguir padrão Billing
2. ✅ Header gradiente success (mesma área de Billing)
3. ✅ KPI cards
4. ✅ SectionCard para lançamentos

---

### **Fase 6: Refatorar Client Detail Pages** (4-6 horas)

**Arquivos**: `src/app/(dashboard)/clients/[id]/*`

**Mudanças:**

1. ✅ Cada página: PageHeader consistente
2. ✅ Tabs visuais padronizados
3. ✅ SectionCard para cada feature (info, tasks, media, etc)
4. ⚠️ Feature managers (Branding, Media, Tasks): manter modais mas ajustar cards principais

---

### **Fase 7: Criar Design System Doc** (1 hora)

**Arquivo**: `src/styles/DESIGN_SYSTEM.md`

Documentar:

- Gradientes oficiais
- Componentes padronizados
- Padrões de layout
- Exemplos de uso

---

## 📋 CHECKLIST DE CONSISTÊNCIA

### **Headers**

- [ ] Todas as páginas usam PageHeader component
- [ ] Gradientes consistentes: primary, success, danger, brand
- [ ] Background pattern (grid.svg + blobs)
- [ ] Ícone em wrapper com backdrop blur
- [ ] Typography: text-3xl sm:text-4xl font-bold
- [ ] Subtitle: text-sm sm:text-base
- [ ] Actions alinhados à direita

### **KPI Cards**

- [ ] Border-2
- [ ] Glow effect no canto (blur-2xl)
- [ ] Ícone em wrapper gradiente (8x8, rounded-lg)
- [ ] Value: text-2xl font-bold + color
- [ ] Label: text-sm font-medium text-muted-foreground
- [ ] Description: text-xs text-muted-foreground
- [ ] Hover: shadow-lg transition-all

### **Section Cards**

- [ ] Border-2
- [ ] Shadow-lg hover:shadow-xl
- [ ] Header com gradiente (default, success, danger, none)
- [ ] Título com ícone opcional
- [ ] Actions alinhados à direita
- [ ] Content padding consistente

### **Layout**

- [ ] Page padding: p-4 sm:p-6 lg:p-8
- [ ] Section spacing: space-y-6
- [ ] Grid gap: gap-4 sm:gap-6
- [ ] Max-width: max-w-7xl mx-auto (default)
- [ ] Overflow: overflow-x-hidden

### **Typography**

- [ ] Page title: text-3xl sm:text-4xl font-bold
- [ ] Card title: text-lg font-semibold
- [ ] KPI value: text-2xl font-bold
- [ ] Body: text-sm
- [ ] Small: text-xs
- [ ] Muted: text-muted-foreground

### **Buttons**

- [ ] Primary: gradiente + shadow + hover effect
- [ ] Secondary: bg-white/20 backdrop-blur
- [ ] Ghost/link: consistente
- [ ] Size: sm, md, lg consistente
- [ ] Icons: transition-transform group-hover

---

## 🚀 ORDEM DE PRIORIDADE

### **CRÍTICO** (Fazer primeiro)

1. ✅ Criar componentes padronizados (PageHeader, KPICard, SectionCard)
2. ✅ Refatorar Dashboard (alta visibilidade)
3. ✅ Refatorar Billing/Finance (mesma área, já parcial)
4. ✅ Refatorar Clients (alta frequência de uso)

### **ALTA PRIORIDADE**

5. ✅ Refatorar Settings/Profile (configurações importantes)
6. ✅ Refatorar Admin (acesso OWNER)

### **MÉDIA PRIORIDADE**

7. ✅ Client detail pages estrutura principal
8. ⚠️ Feature managers (ajustar cards, manter modais)

### **BAIXA PRIORIDADE**

9. ⚠️ Login/Billing/Overdue (já estão corretos)
10. ⚠️ Páginas menos usadas

---

## 📐 DESIGN SYSTEM TOKENS (Consolidado)

```typescript
// src/styles/design-system.ts
export const designSystem = {
  gradients: {
    primary: 'from-blue-600 via-indigo-600 to-purple-600',
    success: 'from-emerald-600 via-teal-600 to-cyan-600',
    danger: 'from-red-600 via-rose-600 to-orange-500',
    brand: 'from-slate-900 via-slate-800 to-slate-700',
  },

  kpiVariants: {
    danger: {
      gradient: 'from-red-500 to-pink-500',
      glow: 'from-red-500/10 to-pink-500/10',
      textColor: 'text-red-600',
    },
    warning: {
      gradient: 'from-amber-500 to-orange-500',
      glow: 'from-amber-500/10 to-orange-500/10',
      textColor: 'text-amber-600',
    },
    info: {
      gradient: 'from-blue-500 to-cyan-500',
      glow: 'from-blue-500/10 to-cyan-500/10',
      textColor: 'text-blue-600',
    },
    success: {
      gradient: 'from-emerald-500 to-green-500',
      glow: 'from-emerald-500/10 to-green-500/10',
      textColor: 'text-emerald-600',
    },
    neutral: {
      gradient: 'from-purple-500 to-fuchsia-500',
      glow: 'from-purple-500/10 to-fuchsia-500/10',
      textColor: 'text-purple-600',
    },
    dark: {
      gradient: 'from-slate-600 to-slate-800',
      glow: 'from-slate-500/10 to-slate-700/10',
      textColor: 'text-slate-600',
    },
  },

  headerGradients: {
    default: 'from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800',
    success:
      'from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950',
    danger: 'from-red-50 to-pink-50 dark:from-red-950 dark:to-pink-950',
  },

  spacing: {
    page: 'p-4 sm:p-6 lg:p-8',
    section: 'space-y-6',
    card: 'p-6 sm:p-8',
    grid: 'gap-4 sm:gap-6',
  },

  borders: {
    card: 'border-2',
    subtle: 'border',
  },

  shadows: {
    page: 'shadow-2xl',
    card: 'shadow-lg hover:shadow-xl',
    button: 'shadow-lg shadow-blue-500/30',
    kpi: 'hover:shadow-lg transition-all',
  },

  radii: {
    page: 'rounded-2xl',
    card: 'rounded-2xl',
    button: 'rounded-lg',
    icon: 'rounded-xl',
  },

  typography: {
    pageTitle: 'text-3xl sm:text-4xl font-bold',
    cardTitle: 'text-lg font-semibold',
    kpiValue: 'text-2xl font-bold',
    kpiLabel: 'text-sm font-medium text-muted-foreground',
    kpiDesc: 'text-xs text-muted-foreground',
    body: 'text-sm',
    small: 'text-xs',
  },
}
```

---

## ✅ RESUMO EXECUTIVO

**Total de páginas auditadas**: 10+  
**Páginas 100% corretas**: 3 (Login, Billing, Inadimplência)  
**Páginas que precisam refatoração**: 7+

**Estimativa de tempo total**: 15-20 horas  
**Impacto**: Consistência visual completa, manutenção facilitada, UX profissional

**Próximos passos**:

1. Criar componentes padronizados
2. Refatorar páginas críticas (Dashboard, Clients)
3. Documentar design system
4. Aplicar progressivamente nas demais páginas

---

**Gerado por**: GitHub Copilot  
**Data**: 16/11/2025
