# 🚀 Sistema de Gestão de Clientes - Produção

Sistema completo de gestão de clientes com recursos avançados de mídia, pagamentos automáticos, e integração com redes sociais.

## 📋 Índice

- [Recursos](#recursos)
- [Tecnologias](#tecnologias)
- [Deploy Rápido](#deploy-rápido)
- [Documentação](#documentação)
- [Configuração](#configuração)
- [Suporte](#suporte)

## ✨ Recursos

### 🎯 Core

- ✅ Autenticação Firebase (Email/Password, Google)
- ✅ Gestão completa de clientes
- ✅ Dashboard com métricas em tempo real
- ✅ Sistema de permissões (Owner/Editor/Viewer)

### 💳 Pagamentos

- ✅ Cobrança automática mensal via cron jobs
- ✅ Histórico de faturas e pagamentos
- ✅ Notificações por email (Resend)
- ✅ Dashboard de faturamento

### 📱 Redes Sociais

- ✅ Integração com Instagram
- ✅ Postagem automática
- ✅ Agendamento de posts
- ✅ Gerenciamento de mídia

### 🖼️ Mídia

- ✅ Upload de imagens/vídeos (até 1.5GB)
- ✅ Storage em S3/Cloudflare R2
- ✅ Galeria de mídia
- ✅ Otimização automática de imagens

### 📊 Monitoramento

- ✅ Sentry para tracking de erros
- ✅ PostHog para analytics
- ✅ Logs estruturados
- ✅ Health checks

## 🛠️ Tecnologias

### Frontend

- **Next.js 16** - Framework React com App Router
- **React 19** - Biblioteca UI
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **shadcn/ui** - Componentes UI
- **Framer Motion** - Animações

### Backend

- **Next.js API Routes** - API serverless
- **Prisma** - ORM para banco de dados
- **PostgreSQL** - Banco de dados
- **Firebase Admin** - Autenticação

### Infraestrutura

- **Netlify** - Hosting e CI/CD
- **Cloudflare R2** - Object storage
- **Docker** - Containerização
- **Nginx** - Reverse proxy

### Monitoramento

- **Sentry** - Error tracking
- **PostHog** - Product analytics
- **Upstash Redis** - Rate limiting

## 🚀 Deploy Rápido

### Opção 1: Netlify (Recomendado)

1. **Fork/Clone o repositório**

   ```bash
   git clone https://github.com/seu-usuario/gestao-clientes.git
   cd gestao-clientes
   ```

2. **Conectar ao Netlify**
   - Acesse [Netlify](https://app.netlify.com)
   - Import from Git
   - Selecione o repositório
   - As configurações serão detectadas automaticamente via `netlify.toml`

3. **Configurar variáveis de ambiente**
   - Vá em Site settings → Environment variables
   - Copie as variáveis de `.env.production.example`
   - Preencha com valores reais

4. **Deploy**
   - Push para `master` branch
   - Deploy automático será executado

### Opção 2: Docker

```bash
# 1. Clonar repositório
git clone https://github.com/seu-usuario/gestao-clientes.git
cd gestao-clientes

# 2. Configurar ambiente
cp .env.production.example .env.production
nano .env.production

# 3. Build e start
pnpm docker:build
pnpm docker:up

# 4. Verificar logs
pnpm docker:logs
```

### Opção 3: VPS/Servidor

```bash
# 1. Clonar e instalar
git clone https://github.com/seu-usuario/gestao-clientes.git
cd gestao-clientes
pnpm install --frozen-lockfile

# 2. Configurar
cp .env.production.example .env.production
nano .env.production

# 3. Migrar banco
pnpm prisma:deploy

# 4. Build
pnpm build

# 5. Start com PM2
pm2 start pnpm --name "gestao-clientes" -- start
pm2 save
```

## 📚 Documentação

- **[Guia de Deploy](./docs/PRODUCTION_DEPLOY.md)** - Guia completo de deploy
- **[Checklist de Segurança](./docs/SECURITY_CHECKLIST.md)** - Validações de segurança
- **[Configuração Completa](./docs/CONFIGURACAO_COMPLETA.md)** - Setup detalhado
- **[Sistema de Pagamentos](./docs/PAYMENT_SYSTEM.md)** - Pagamentos automáticos
- **[Instagram Setup](./docs/WHATSAPP_QUICKSTART.md)** - Integração Instagram

## ⚙️ Configuração

### Variáveis de Ambiente Críticas

```bash
# Banco de Dados
DATABASE_URL="postgresql://..."

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY="..."
FIREBASE_CLIENT_EMAIL="..."
FIREBASE_PRIVATE_KEY="..."

# Storage (S3/R2)
USE_S3="true"
STORAGE_BUCKET="..."
STORAGE_ACCESS_KEY_ID="..."
STORAGE_SECRET_ACCESS_KEY="..."

# Email
RESEND_API_KEY="..."

# Monitoramento
SENTRY_DSN="..."

# Cron
CRON_SECRET="..."
```

### Cron Jobs (Netlify)

Configurados em `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/process-monthly-payments",
      "schedule": "0 0 1 * *" // 1º dia do mês
    },
    {
      "path": "/api/billing/cron/daily",
      "schedule": "0 6 * * *" // Diariamente às 6h
    }
  ]
}
```

## 🧪 Testes

```bash
# Unit tests
pnpm test

# Type checking
pnpm type-check

# Lint
pnpm lint

# Security audit
pnpm security:audit
```

## 🔧 Scripts Úteis

```bash
# Docker
pnpm docker:build      # Build imagem Docker
pnpm docker:up         # Start containers
pnpm docker:down       # Stop containers
pnpm docker:logs       # Ver logs

# Database
pnpm prisma:generate   # Gerar Prisma Client
pnpm prisma:migrate    # Criar migração
pnpm prisma:deploy     # Deploy migrações
pnpm prisma:studio     # Abrir Prisma Studio

# Deploy
pnpm deploy:prod       # Deploy automático
pnpm health            # Health check
```

## 📊 Monitoramento

### Health Check

```bash
curl https://seu-dominio.com/api/health
```

### Logs

- **Netlify**: Dashboard → Functions → Logs
- **Docker**: `pnpm docker:logs`
- **Sentry**: Dashboard de erros em tempo real

### Métricas

- **Performance**: Lighthouse
- **Errors**: Sentry
- **Analytics**: PostHog
- **Uptime**: Pingdom/UptimeRobot

## 🔒 Segurança

### Implementado

- ✅ HTTPS obrigatório
- ✅ Security headers (HSTS, CSP, etc)
- ✅ Rate limiting (Upstash Redis)
- ✅ CORS configurado
- ✅ Input validation (Zod)
- ✅ SQL injection protection (Prisma)
- ✅ XSS protection
- ✅ CSRF protection

### Checklist

Consulte [SECURITY_CHECKLIST.md](./docs/SECURITY_CHECKLIST.md)

## 🆘 Troubleshooting

### Build Falha

```bash
rm -rf .next node_modules
pnpm install
pnpm build
```

### Prisma Client não encontrado

```bash
pnpm prisma:generate
```

### Porta em uso

```bash
lsof -i :3000
kill -9 PID
```

### Erros de memória

```bash
NODE_OPTIONS="--max-old-space-size=4096" pnpm build
```

## 📦 Estrutura do Projeto

```
gestao-clientes/
├── src/
│   ├── app/              # App Router (Next.js 16)
│   ├── components/       # Componentes React
│   ├── lib/              # Utilitários
│   ├── services/         # Serviços (API, DB)
│   └── types/            # TypeScript types
├── prisma/
│   ├── schema.prisma     # Schema do banco
│   └── migrations/       # Migrações
├── public/               # Assets estáticos
├── scripts/              # Scripts utilitários
├── docs/                 # Documentação
├── tests/                # Testes
└── docker-compose.prod.yml
```

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto é privado e proprietário.

## 👥 Suporte

- **Email**: suporte@seudominio.com
- **Docs**: `/docs`
- **Issues**: GitHub Issues

---

**⚡ Feito com Next.js 16, React 19 e TypeScript**
