# 📊 Monitoring & Analytics Setup

Este guia cobre a configuração completa de **Error Tracking**, **Analytics** e **Performance Monitoring** no sistema.

## 📦 Instalação

Todos os pacotes já estão instalados:

```bash
pnpm add @sentry/nextjs posthog-js
```

## 🔥 1. Sentry - Error Tracking (✅ Configurado)

### O que já está implementado:

- ✅ Sentry SDK instalado e configurado
- ✅ Error tracking automático (server + client + edge)
- ✅ Performance monitoring (tracesSampleRate: 1)
- ✅ Session replay para debugging visual
- ✅ Vercel Cron Monitors automáticos
- ✅ Source maps upload automático
- ✅ Request error tracking via `onRequestError`

### Arquivos configurados:

- `sentry.server.config.ts` - Server-side tracking
- `sentry.edge.config.ts` - Edge runtime tracking
- `src/instrumentation-client.ts` - Client-side tracking
- `src/instrumentation.ts` - Runtime initialization
- `next.config.ts` - Sentry webpack plugin

### Dashboard:

**Organization:** devlops  
**Project:** javascript-nextjs  
**URL:** https://sentry.io/organizations/devlops/projects/javascript-nextjs/

### Recursos disponíveis:

- 🔍 **Error tracking:** Rastreamento automático de erros
- 📈 **Performance:** Monitora slow queries, API latency
- 🎥 **Session Replay:** Reproduz sessão do usuário antes do erro
- 📊 **Release tracking:** Vincula erros a deploys
- 🔔 **Alerts:** Notificações de erros críticos

---

## 📈 2. PostHog - User Analytics (✅ Configurado)

### O que foi implementado:

- ✅ PostHog SDK instalado
- ✅ Inicialização automática no client
- ✅ Page view tracking automático
- ✅ Event tracking utilities
- ✅ User identification helpers
- ✅ Autocapture habilitado

### Arquivos criados:

- `src/lib/analytics/posthog.ts` - Utilities e init
- `src/components/providers/PostHogProvider.tsx` - Auto pageview tracking
- `src/app/layout.tsx` - Provider wired in

### Configuração:

Adicione as chaves ao `.env.local`:

```env
NEXT_PUBLIC_POSTHOG_KEY="phc_..."
NEXT_PUBLIC_POSTHOG_HOST="https://us.i.posthog.com"
```

**Obter chaves:**

1. Acesse: https://app.posthog.com/project/settings
2. Copie o "Project API Key"
3. Cole em `NEXT_PUBLIC_POSTHOG_KEY`

### Como usar:

#### Track eventos customizados:

```typescript
import { trackEvent } from '@/lib/analytics/posthog'

// Exemplo: Cliente criado
trackEvent('client_created', {
  clientId: client.id,
  plan: client.plan,
})

// Exemplo: Invoice enviada
trackEvent('invoice_sent', {
  invoiceId: invoice.id,
  amount: invoice.amount,
  clientId: invoice.clientId,
})

// Exemplo: Feature usage
trackEvent('feature_used', {
  feature: 'whatsapp_integration',
  action: 'send_message',
})
```

#### Identificar usuário:

```typescript
import { identifyUser } from '@/lib/analytics/posthog'

// No login/signup:
identifyUser(user.id, {
  email: user.email,
  name: user.name,
  plan: user.plan,
  createdAt: user.createdAt,
})
```

#### Funnels & Conversões:

No dashboard PostHog, crie funnels para rastrear:

- **Signup → Onboarding → First Client Created**
- **Client Created → First Invoice Sent → Payment Received**
- **Login → Feature Discovery → Feature Adoption**

### Recursos disponíveis:

- 📊 **Page views:** Automático via `PostHogProvider`
- 🎯 **Event tracking:** Custom events com properties
- 👤 **User profiles:** Identificação e propriedades do usuário
- 🔀 **Funnels:** Análise de conversão por etapas
- 🧪 **A/B Tests:** Feature flags e experiments
- 📉 **Retention:** Análise de retenção de usuários
- 🔥 **Heatmaps:** Mapas de calor de interação

---

## ⚡ 3. Performance Monitoring (✅ Configurado)

### O que foi implementado:

#### Next.js Built-in:

- ✅ `instrumentationHook: true` em `next.config.ts`
- ✅ `runtime: "nodejs"` e `preferredRegion: "auto"` no `layout.tsx`
- ✅ Custom instrumentation em `src/instrumentation.ts`

#### Sentry Performance:

- ✅ `tracesSampleRate: 1` (100% de traces em dev)
- ✅ Automatic instrumentation de:
  - API routes
  - Server components
  - Database queries (via Prisma)
  - External API calls

### Monitoramento customizado:

#### Rastrear slow queries no Prisma:

```typescript
// src/lib/prisma.ts (exemplo)
import { PrismaClient } from '@prisma/client'
import * as Sentry from '@sentry/nextjs'

const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
  ],
})

prisma.$on('query' as never, (e: any) => {
  if (e.duration > 1000) {
    // > 1s = slow query
    Sentry.captureMessage('Slow database query detected', {
      level: 'warning',
      extra: {
        query: e.query,
        duration: e.duration,
        params: e.params,
      },
    })
  }
})

export default prisma
```

#### Rastrear API response times:

```typescript
// src/middleware.ts ou API route
import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'

export async function GET(req: Request) {
  const start = Date.now()

  // ... lógica da API

  const duration = Date.now() - start

  if (duration > 3000) {
    // > 3s = slow API
    Sentry.captureMessage('Slow API response', {
      level: 'warning',
      extra: {
        path: req.url,
        duration,
      },
    })
  }

  return NextResponse.json(data)
}
```

### Métricas disponíveis:

- **LCP (Largest Contentful Paint):** Tempo para carregar conteúdo principal
- **FID (First Input Delay):** Tempo até primeira interação
- **CLS (Cumulative Layout Shift):** Estabilidade visual
- **TTFB (Time To First Byte):** Tempo de resposta do servidor
- **Database query performance:** Via Prisma logging
- **API latency:** Via Sentry transactions

---

## 🎯 Eventos Recomendados para Tracking

### User Journey:

```typescript
// Signup
trackEvent('user_signup', { method: 'google' })

// Onboarding
trackEvent('onboarding_step', { step: 1 })
trackEvent('onboarding_completed')

// Login
trackEvent('user_login', { method: 'email' })
```

### Core Actions:

```typescript
// Clients
trackEvent('client_created', { plan: 'premium' })
trackEvent('client_updated', { field: 'status' })
trackEvent('client_deleted')

// Invoices
trackEvent('invoice_created', { amount: 1500, currency: 'BRL' })
trackEvent('invoice_sent', { method: 'whatsapp' })
trackEvent('invoice_paid', { paymentMethod: 'pix' })

// Tasks
trackEvent('task_created', { priority: 'high' })
trackEvent('task_completed')

// Media
trackEvent('media_uploaded', { type: 'image', size: '2MB' })
trackEvent('media_deleted')
```

### Feature Adoption:

```typescript
// WhatsApp
trackEvent('whatsapp_connected')
trackEvent('whatsapp_message_sent')

// Instagram
trackEvent('instagram_connected')
trackEvent('instagram_post_created')

// Payments
trackEvent('payment_system_enabled')
trackEvent('automatic_payment_triggered')
```

---

## 🚀 Próximos Passos

### 1. Ajustar sample rates para produção:

```typescript
// sentry.server.config.ts
tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
replaysSessionSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0.5,
```

### 2. Configurar Alerts no Sentry:

- Erros críticos → Slack/Email
- Performance degradation → Notificação
- High error rate → PagerDuty

### 3. Criar Dashboards no PostHog:

- **Overview:** MAU, DAU, retention
- **Feature Adoption:** Usage por feature
- **Conversion Funnel:** Signup → Paid
- **Performance:** Slow pages, errors

### 4. Implementar Feature Flags (PostHog):

```typescript
import { getPostHog } from '@/lib/analytics/posthog'

const isFeatureEnabled = getPostHog().isFeatureEnabled('new-dashboard')
```

---

## 📚 Recursos Adicionais

- **Sentry Docs:** https://docs.sentry.io/platforms/javascript/guides/nextjs/
- **PostHog Docs:** https://posthog.com/docs
- **Next.js Instrumentation:** https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
- **Web Vitals:** https://web.dev/vitals/

---

**Status:** ✅ Configuração completa - pronta para uso!
