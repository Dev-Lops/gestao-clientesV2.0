# 🚀 Guia Completo de Deploy no Netlify

Este guia detalha todos os passos necessários para fazer o deploy da aplicação de Gestão de Clientes no Netlify.

## 📋 Pré-requisitos

- [ ] Conta no [Netlify](https://app.netlify.com)
- [ ] Repositório GitHub com o código
- [ ] Todas as variáveis de ambiente configuradas
- [ ] PostgreSQL database (Supabase, Neon, Railway, etc.)
- [ ] Cloudflare R2 ou AWS S3 configurado
- [ ] Firebase project configurado
- [ ] Resend API key (para emails)

## 🎯 Passo 1: Preparar Repositório

### 1.1 Verificar arquivos necessários

```bash
# Deve existir na raiz do projeto:
netlify.toml                  # ✅ Configuração do Netlify
.env.production.example       # ✅ Template de variáveis
package.json                  # ✅ Scripts e dependências
prisma/schema.prisma          # ✅ Schema do banco
```

### 1.2 Commit e Push

```bash
# Adicionar alterações
git add .

# Commit
git commit -m "chore: prepare for netlify deploy"

# Push para master (branch de produção)
git push origin master
```

## 🌐 Passo 2: Configurar no Netlify

### 2.1 Criar novo site

1. Acesse [Netlify Dashboard](https://app.netlify.com)
2. Click em **"Add new site"** → **"Import an existing project"**
3. Escolha **"Deploy with GitHub"**
4. Autorize o Netlify a acessar seus repositórios
5. Selecione o repositório **gestao-clientesV2.0**

### 2.2 Configurações de Build

O Netlify detectará automaticamente as configurações do `netlify.toml`, mas verifique:

```
Build command: pnpm install --frozen-lockfile && pnpm prisma:generate && pnpm build
Publish directory: .next
```

**✅ Estas configurações já estão no `netlify.toml` e serão detectadas automaticamente!**

### 2.3 Node Version

```
Node version: 20
```

## 🔐 Passo 3: Configurar Variáveis de Ambiente

### 3.1 Acessar configurações

1. No dashboard do site, vá em **Site settings**
2. Click em **Environment variables** (menu lateral)
3. Click em **Add a variable**

### 3.2 Adicionar variáveis críticas

Copie as variáveis do `.env.production.example` e adicione com valores reais:

#### Database

```env
DATABASE_URL=postgresql://user:password@host:5432/database?schema=public&pgbouncer=true&connection_limit=1
```

#### Firebase Admin

```env
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@seu-projeto.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nSUA_CHAVE\n-----END PRIVATE KEY-----
```

#### Firebase Client (Públicas)

```env
NEXT_PUBLIC_FIREBASE_API_KEY=sua-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu-projeto-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=seu-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=seu-app-id
```

#### Storage (Cloudflare R2 / S3)

```env
USE_S3=true
STORAGE_REGION=auto
STORAGE_ACCESS_KEY_ID=sua-access-key
STORAGE_SECRET_ACCESS_KEY=sua-secret-key
STORAGE_BUCKET=seu-bucket-producao
STORAGE_ENDPOINT=https://seu-endpoint.r2.cloudflarestorage.com
```

#### Email (Resend)

```env
RESEND_API_KEY=re_sua_api_key_producao
EMAIL_FROM=Sistema <noreply@seu-dominio.com>
```

#### Instagram

```env
INSTAGRAM_APP_ID=seu-app-id-producao
INSTAGRAM_APP_SECRET=seu-app-secret-producao
INSTAGRAM_REDIRECT_URI=https://seu-dominio.netlify.app/api/instagram/callback
```

#### Cron Jobs

```env
CRON_SECRET=sua-secret-key-segura-gerada
```

**💡 Gerar CRON_SECRET:**

```bash
openssl rand -base64 32
```

#### Monitoramento

```env
SENTRY_DSN=https://your-dsn@sentry.io/project-id
SENTRY_ORG=sua-organizacao
SENTRY_PROJECT=seu-projeto
SENTRY_AUTH_TOKEN=seu-auth-token
```

#### Rate Limiting (Opcional - Upstash)

```env
UPSTASH_REDIS_REST_URL=https://seu-endpoint.upstash.io
UPSTASH_REDIS_REST_TOKEN=seu-token
```

#### Analytics (Opcional - PostHog)

```env
NEXT_PUBLIC_POSTHOG_KEY=phc_seu_key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

#### Next.js

```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://seu-dominio.netlify.app
```

### 3.3 Variáveis obrigatórias checklist

- [ ] DATABASE_URL
- [ ] FIREBASE_CLIENT_EMAIL
- [ ] FIREBASE_PRIVATE_KEY
- [ ] NEXT_PUBLIC_FIREBASE_API_KEY
- [ ] NEXT_PUBLIC_FIREBASE_PROJECT_ID
- [ ] STORAGE_ACCESS_KEY_ID
- [ ] STORAGE_SECRET_ACCESS_KEY
- [ ] STORAGE_BUCKET
- [ ] STORAGE_ENDPOINT
- [ ] RESEND_API_KEY
- [ ] EMAIL_FROM
- [ ] CRON_SECRET

## 🚀 Passo 4: Deploy Inicial

### 4.1 Trigger Deploy

Após configurar as variáveis:

1. Vá em **Deploys** (topo da página)
2. Click em **Trigger deploy** → **Deploy site**

Ou simplesmente faça um push para master:

```bash
git push origin master
```

### 4.2 Acompanhar Deploy

1. Acesse a aba **Deploys**
2. Click no deploy em andamento
3. Acompanhe os logs em tempo real

**Tempo estimado:** 3-5 minutos

### 4.3 Verificar Status

Após o deploy:

```bash
# Verificar health check
curl https://seu-dominio.netlify.app/api/health

# Deve retornar:
{
  "status": "healthy",
  "timestamp": "2024-11-23T...",
  "uptime": 123.45,
  "environment": "production"
}
```

## 🗄️ Passo 5: Migrar Banco de Dados

### 5.1 Via Netlify CLI (Recomendado)

```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Link ao site
netlify link

# Executar comando
netlify functions:invoke --name migrate-database
```

### 5.2 Manualmente

```bash
# Com DATABASE_URL de produção no .env
pnpm prisma:deploy
```

## ⏰ Passo 6: Configurar Cron Jobs

### 6.1 Crons no Netlify

O Netlify usa o arquivo `vercel.json` para crons (compatível):

```json
{
  "crons": [
    {
      "path": "/api/cron/process-monthly-payments",
      "schedule": "0 0 1 * *"
    },
    {
      "path": "/api/billing/cron/daily",
      "schedule": "0 6 * * *"
    }
  ]
}
```

### 6.2 Alternativa: Cron-job.org

Se o Netlify não suportar crons nativamente:

1. Acesse [cron-job.org](https://cron-job.org)
2. Crie uma conta
3. Adicione jobs:

**Job 1: Pagamentos Mensais**

- URL: `https://seu-dominio.netlify.app/api/cron/process-monthly-payments`
- Schedule: `0 0 1 * *` (1º dia do mês, meia-noite)
- Header: `Authorization: Bearer SEU_CRON_SECRET`

**Job 2: Verificação Diária**

- URL: `https://seu-dominio.netlify.app/api/billing/cron/daily`
- Schedule: `0 6 * * *` (Todo dia às 6h)
- Header: `Authorization: Bearer SEU_CRON_SECRET`

## 🔒 Passo 7: Segurança

### 7.1 Headers de Segurança

Já configurados no `netlify.toml`:

```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Strict-Transport-Security = "max-age=31536000"
```

### 7.2 Domínio Customizado + HTTPS

1. Vá em **Domain settings**
2. Click em **Add custom domain**
3. Adicione seu domínio (ex: `app.seudominio.com`)
4. Configure DNS conforme instruções
5. HTTPS será automaticamente provisionado via Let's Encrypt

### 7.3 Redirect URLs (Firebase/Instagram)

Atualize as redirect URLs nos consoles:

**Firebase Console:**

- `https://seu-dominio.netlify.app`

**Instagram/Facebook Developer:**

- `https://seu-dominio.netlify.app/api/instagram/callback`

## 🧪 Passo 8: Testar Aplicação

### 8.1 Testes Funcionais

- [ ] Acessar homepage
- [ ] Login com email/senha
- [ ] Login com Google
- [ ] Criar novo cliente
- [ ] Upload de mídia
- [ ] Visualizar dashboard
- [ ] Acessar configurações

### 8.2 Testar APIs

```bash
# Health check
curl https://seu-dominio.netlify.app/api/health

# Auth check (deve retornar 401)
curl https://seu-dominio.netlify.app/api/clients

# Cron (com secret)
curl -H "Authorization: Bearer SEU_CRON_SECRET" \
  https://seu-dominio.netlify.app/api/cron/process-monthly-payments
```

## 📊 Passo 9: Monitoramento

### 9.1 Netlify Analytics

1. Vá em **Analytics** no dashboard
2. Ative o Netlify Analytics (pago, mas vale a pena)

### 9.2 Sentry

1. Acesse [Sentry Dashboard](https://sentry.io)
2. Verifique se erros estão sendo reportados
3. Configure alertas

### 9.3 Logs

```bash
# Via Netlify CLI
netlify functions:logs

# Ou no dashboard: Functions → Logs
```

## 🔄 Passo 10: CI/CD (Deploy Automático)

### 10.1 Deploy Automático

Já configurado! Cada push para `master` faz deploy automático.

### 10.2 Branch Deploys

Para testar antes de produção:

```bash
# Criar branch de teste
git checkout -b staging

# Push
git push origin staging
```

No Netlify:

1. **Site settings** → **Build & deploy**
2. **Branch deploys**: Ative para `staging`
3. Cada push para `staging` criará uma preview URL

### 10.3 Deploy Contexts

Edite `netlify.toml` para contextos:

```toml
[context.production]
  environment = { NODE_ENV = "production" }

[context.staging]
  environment = { NODE_ENV = "staging" }
```

## ✅ Checklist Final

### Pré-Deploy

- [ ] Código commitado e pushed
- [ ] Variáveis de ambiente configuradas
- [ ] Banco de dados provisionado
- [ ] Storage (R2/S3) configurado
- [ ] Firebase configurado

### Deploy

- [ ] Site criado no Netlify
- [ ] Build bem sucedido
- [ ] Sem erros nos logs
- [ ] Health check respondendo

### Pós-Deploy

- [ ] Migrações executadas
- [ ] Cron jobs configurados
- [ ] Domínio customizado (se aplicável)
- [ ] HTTPS ativo
- [ ] Redirect URLs atualizadas
- [ ] Testes funcionais passando
- [ ] Monitoramento ativo

## 🆘 Troubleshooting

### Build Falha

**Erro: `No projects matched the filters`**

```bash
# Verificar netlify.toml
# Comando deve ser: pnpm run build
# Não: pnpm --filter gestao-clientes... run build
```

**Erro: `Prisma Client not found`**

```bash
# Adicionar ao build command:
pnpm prisma:generate && pnpm build
```

**Erro: `ENOENT: no such file or directory, open '.next'`**

```bash
# Verificar publish directory: .next
# Verificar se build está sendo executado
```

### Runtime Errors

**Erro: `Database connection failed`**

- Verificar `DATABASE_URL` nas env vars
- Verificar se database está acessível publicamente
- Verificar connection pooling (use `?pgbouncer=true`)

**Erro: `Firebase Admin initialization failed`**

- Verificar `FIREBASE_PRIVATE_KEY` (deve incluir `\n`)
- Verificar `FIREBASE_CLIENT_EMAIL`

**Erro: `Storage upload failed`**

- Verificar credenciais S3/R2
- Verificar CORS no bucket
- Verificar endpoint correto

### Cron Jobs

**Erro: `Unauthorized`**

- Verificar `CRON_SECRET` configurado
- Verificar header `Authorization: Bearer SECRET`

**Erro: `Function timeout`**

- Aumentar timeout no netlify.toml
- Otimizar queries do banco
- Usar background jobs se necessário

## 📚 Recursos

- [Netlify Docs](https://docs.netlify.com)
- [Next.js on Netlify](https://docs.netlify.com/frameworks/next-js/)
- [Prisma Deploy](https://www.prisma.io/docs/guides/deployment)
- [Sentry Setup](https://docs.sentry.io/platforms/javascript/guides/nextjs/)

## 🎉 Conclusão

Se todos os passos foram seguidos corretamente, sua aplicação está:

- ✅ Rodando em produção no Netlify
- ✅ Com HTTPS configurado
- ✅ Com banco de dados PostgreSQL
- ✅ Com storage S3/R2
- ✅ Com autenticação Firebase
- ✅ Com envio de emails
- ✅ Com monitoramento de erros
- ✅ Com cron jobs ativos
- ✅ Com deploy automático

**🚀 Parabéns! Seu sistema está em produção!**

---

**Dúvidas?** Abra uma issue ou consulte a [documentação completa](./docs/).
