# Gestão de Clientes

![CI - Development](https://github.com/devlopes006/gestao-clientesV2.0/actions/workflows/ci-dev.yml/badge.svg?branch=develop)
![CI/CD - Production](https://github.com/devlopes006/gestao-clientesV2.0/actions/workflows/ci-prod.yml/badge.svg?branch=master)

Aplicação Next.js para gestão de clientes, tarefas e mídia com autenticação Firebase e persistência híbrida (Firestore + Prisma/PostgreSQL planejado).

## ✨ Stack

- Next.js 16 (App Router)
- React 19
- TypeScript 5
- TailwindCSS 4
- Firebase Auth + Firestore (runtime atual)
- Firebase Admin (onboarding server-side)
- Prisma + PostgreSQL (schema definido, integração futura)
- Zod (validações futuras)

## 🚀 Executando localmente

Pré-requisitos:

- Node 20+
- PNPM (recomendado) ou Yarn/NPM
- Banco PostgreSQL se for usar Prisma (opcional por enquanto)

1. Clone o repositório e instale dependências:

```bash
pnpm install
```

1. Configure variáveis de ambiente no arquivo `.env.local` (ou copie `.env.example` para `.env`):

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=xxxxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxxxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxxxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=xxxxx.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxxxxx
NEXT_PUBLIC_FIREBASE_APP_ID=1:xxxx:web:xxxxx
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@xxxxx.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
DATABASE_URL=postgresql://user:pass@localhost:5432/gestao
```

1. Inicie o servidor de desenvolvimento:

```bash
pnpm dev
```

1. Abra <http://localhost:3000>

## 🗂 Estrutura

```text
src/
  app/              # Rotas App Router
  components/       # Componentes reutilizáveis
  context/          # Providers (UserContext)
  lib/              # Integrações (firebase, prisma, permissions)
  services/         # Lógica de domínio (onboarding)
  types/            # Tipos globais
```

## ✅ Refactors Recentes

- Corrigido lookup de organização em `ProtectedRoute` (antes assumia orgId = uid).
- Centralizado uso do Firebase em `lib/firebase` (removido init duplicado em onboarding).
- Corrigido nome do arquivo `tailwind.config.ts` (antes `taliwind.config.ts`).
- Adicionado tema base de cores brand e limpeza do README.
- Script robusto de `prisma-generate` pós instalação.

## 🧪 Próximos Passos Recomendados

- [ ] Implementar persistência principal em PostgreSQL usando Prisma (espelhar dados críticos de Firestore).
- [ ] Adicionar rota API segura para ações server-side com verificação de permissões.
- [ ] Criar hook `usePermissions(role)` para simplificar checks no frontend.
- [ ] Criar testes unitários (Vitest) para `permissions.ts` e `handleUserOnboarding`.
- [ ] Ajustar fluxo de login para setar cookie `auth` (middleware depende dele).
- [ ] Adicionar Sentry ou Logtail para observabilidade.

## 📱 WhatsApp - Cobrança Automática

Sistema de envio automático de cobranças via WhatsApp com chave PIX.

**Quick Start (Teste Local):**

```bash
# Copiar template
cp .env.local.template .env.local

# Configurar fake gateway (sem envios reais)
# Já vem pré-configurado no template!

# Testar
pnpm whatsapp:test
```

**Documentação:**

- 🚀 [Quick Start](docs/WHATSAPP_QUICKSTART.md) - Começar em 5 minutos
- 📖 [Guia Completo](docs/WHATSAPP_SETUP_GUIDE.md) - Meta API, Twilio, troubleshooting
- 💰 [Sistema de Pagamento](docs/PAYMENT_SYSTEM.md) - Faturas, cobranças, automação

**Recursos:**

- ✅ Mensagem profissional com itens, vencimento, chave PIX
- ✅ Suporte Meta WhatsApp Cloud API (oficial)
- ✅ Suporte Twilio, gateways brasileiros
- ✅ Fake gateway para desenvolvimento
- ✅ Envio manual ou automático (dailyJob)
- ✅ Script de teste e diagnóstico

**Configuração Mínima:**

```bash
WHATSAPP_PROVIDER=meta
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_API_TOKEN=seu_token_permanente
PIX_KEY=sua_chave_pix
APP_URL=https://seu-dominio.com
WHATSAPP_SEND_AUTOMATIC=false
```

Ou para teste local rápido (sem envio real):

```bash
WHATSAPP_PROVIDER=generic
WHATSAPP_API_URL=http://localhost:3000/api/whatsapp/fake-gateway
WHATSAPP_API_TOKEN=fake
PIX_KEY=teste@exemplo.com.br
APP_URL=http://localhost:3000
WHATSAPP_SEND_AUTOMATIC=false
```

Regra definida em `lib/permissions.ts`. Exemplo de uso:

```ts
import { can } from '@/lib/permissions'
if (!can(role, 'update', 'client')) throw new Error('Acesso negado')
```

## ⚠ Notas sobre Segurança

- Nunca commitar `FIREBASE_PRIVATE_KEY` sem aspas e com \n escapado.
- Ativar regras do Firestore restringindo leitura/escrita por `auth.uid` e `orgId` (ver `firestore.rules`).
- Considerar trocar cookie `auth` para `HttpOnly` + `Secure`.

## 🗄 PostgreSQL & Prisma

## 🔒 Regras Firestore (Resumo)

Trecho principal das regras em `firestore.rules`:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() { return request.auth != null; }
    function userId() { return request.auth.uid; }
    match /users/{uid} {
      allow read, update: if isSignedIn() && uid == userId();
      allow create, delete: if false; // Apenas via Admin SDK
    }
    match /orgs/{orgId} {
      allow read: if isSignedIn() && (userId() in resource.data.members);
      allow create: if isSignedIn();
      allow update, delete: if isSignedIn() && resource.data.ownerId == userId();
    }
  }
}
```

Use o console do Firebase para publicar essas regras. Ajuste conforme novas coleções aninhadas (tasks, clients, media) mantiverem o mesmo padrão de membros.

O schema em `prisma/schema.prisma` já modela Users/Orgs/Clients/Tasks/Media. Migrar gradualmente dados criados no Firestore ou manter Firestore para eventos em tempo real e Postgres para consultas transacionais.

Gerar cliente:

```bash
pnpm prisma generate
```

Criar migração:

```bash
pnpm prisma migrate dev --name init
```

## 📜 Licença

MIT

---

> Mantido por Dev-Lops.

## 🚢 Deploy para Produção (Rápido)

Passos resumidos para rodar em produção (ex.: servidor VPS ou CI/CD):

1. Configure variáveis de ambiente no host ou provedor usando `.env` (veja `.env.example`).

2. Gere o Prisma Client (no build ou via CI):

```bash
pnpm prisma generate
```

1. Aplique migrações no banco de dados de produção (execute com cuidado):

```bash
pnpm prisma migrate deploy
```

1. Construa a aplicação e rode em modo `production` (ou use o Dockerfile incluído):

```bash
pnpm build
pnpm start
```

Ou usando Docker Compose:

```bash
docker build -t gestao-clientes:latest .
docker-compose -f docker-compose.prod.yml up -d
```

1. Recomendações: configurar um reverse proxy (Nginx), TLS (Let's Encrypt), e variáveis de ambiente seguras.

Se desejar, posso também adicionar um workflow do GitHub Actions para build/test/deploy.
