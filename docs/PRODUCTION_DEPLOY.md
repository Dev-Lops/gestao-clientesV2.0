# =============================================================================

# Guia de Deploy para Produção

# =============================================================================

## 📋 Pré-requisitos

1. **Node.js 20+** instalado
2. **pnpm** instalado
3. **Docker** e **Docker Compose** (para deploy containerizado)
4. **PostgreSQL** configurado (ou usar serviço gerenciado)
5. Contas configuradas:
   - Firebase (autenticação e storage)
   - Sentry (monitoramento de erros)
   - Resend (emails)
   - Cloudflare R2 ou S3 (storage de arquivos)

## 🔧 Configuração Inicial

### 1. Variáveis de Ambiente

```bash
# Copiar template de produção
cp .env.production.example .env.production

# Editar com valores reais
nano .env.production
```

**Variáveis críticas que DEVEM ser configuradas:**

- `DATABASE_URL` - Connection string do PostgreSQL
- `CRON_SECRET` - Secret para proteger cron jobs
- `FIREBASE_*` - Credenciais do Firebase Admin
- `NEXT_PUBLIC_FIREBASE_*` - Config pública do Firebase
- `STORAGE_*` - Credenciais do S3/R2
- `RESEND_API_KEY` - API key do Resend
- `SENTRY_*` - Configuração do Sentry

### 2. Banco de Dados

```bash
# Executar migrações
pnpm prisma:deploy

# Verificar status
pnpm prisma migrate status
```

## 🚀 Deploy

### Opção 1: Deploy com Netlify (Recomendado)

O projeto já está configurado com `netlify.toml`. Basta:

1. Conectar o repositório ao Netlify
2. Configurar as variáveis de ambiente no dashboard
3. Deploy automático ocorrerá em cada push para `master`

**Cron Jobs no Netlify:**

- Pagamentos mensais: 1º dia do mês às 00:00
- Verificações diárias: Todos os dias às 06:00

### Opção 2: Deploy com Docker

```bash
# Dar permissão de execução ao script
chmod +x scripts/deploy.sh

# Executar deploy
./scripts/deploy.sh
```

O script irá:

1. ✅ Verificar branch master
2. ✅ Verificar mudanças não commitadas
3. ✅ Instalar dependências
4. ✅ Gerar Prisma Client
5. ✅ Executar migrações (opcional)
6. ✅ Executar testes
7. ✅ Build da aplicação
8. ✅ Deploy via Docker (opcional)

**Manual Docker:**

```bash
# Build
docker-compose -f docker-compose.prod.yml build

# Start
docker-compose -f docker-compose.prod.yml up -d

# Ver logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop
docker-compose -f docker-compose.prod.yml down
```

### Opção 3: Deploy Manual (VPS/Servidor)

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/gestao-clientes.git
cd gestao-clientes

# 2. Instalar dependências
pnpm install --frozen-lockfile

# 3. Configurar .env.production
cp .env.production.example .env.production
nano .env.production

# 4. Gerar Prisma Client
pnpm prisma:generate

# 5. Executar migrações
pnpm prisma:deploy

# 6. Build
pnpm build

# 7. Start
pnpm start
```

**Usar PM2 para gerenciar o processo:**

```bash
# Instalar PM2
npm install -g pm2

# Start com PM2
pm2 start pnpm --name "gestao-clientes" -- start

# Configurar auto-start
pm2 startup
pm2 save

# Monitorar
pm2 monit
```

## 🔒 Segurança

### Headers de Segurança

Configure no seu proxy reverso (nginx):

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
```

### SSL/TLS

Use Let's Encrypt com Certbot:

```bash
# Instalar certbot
sudo apt install certbot python3-certbot-nginx

# Obter certificado
sudo certbot --nginx -d seu-dominio.com
```

## 📊 Monitoramento

### Health Check

```bash
curl http://localhost:3000/api/health
```

Resposta esperada:

```json
{
  "status": "healthy",
  "timestamp": "2024-11-23T...",
  "uptime": 123.45,
  "environment": "production"
}
```

### Logs

**Docker:**

```bash
docker-compose -f docker-compose.prod.yml logs -f
```

**PM2:**

```bash
pm2 logs gestao-clientes
```

**Sentry:**

- Acesse o dashboard do Sentry para erros em tempo real
- Configure alertas para erros críticos

## 🔄 Atualizações

```bash
# 1. Pull do repositório
git pull origin master

# 2. Instalar novas dependências
pnpm install --frozen-lockfile

# 3. Executar migrações
pnpm prisma:deploy

# 4. Rebuild
pnpm build

# 5. Restart
# Docker:
docker-compose -f docker-compose.prod.yml restart

# PM2:
pm2 restart gestao-clientes
```

## 🐛 Troubleshooting

### Build falha

```bash
# Limpar cache
rm -rf .next node_modules
pnpm install
pnpm build
```

### Prisma Client não encontrado

```bash
pnpm prisma:generate
```

### Porta 3000 em uso

```bash
# Encontrar processo
lsof -i :3000

# Matar processo
kill -9 PID
```

### Erros de memória

Aumentar limite de memória do Node:

```bash
NODE_OPTIONS="--max-old-space-size=4096" pnpm build
```

## 📈 Performance

### Otimizações Aplicadas

- ✅ Output standalone no Next.js
- ✅ Compressão de assets
- ✅ Otimização de imagens
- ✅ Cache agressivo de static assets
- ✅ Lazy loading de componentes
- ✅ React Compiler ativado

### Cache

Configure cache no nginx:

```nginx
location /_next/static/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## 🔐 Backup

### Banco de Dados

```bash
# Backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup-20241123.sql
```

### Arquivos (S3/R2)

Configure backup automático no Cloudflare R2 ou S3.

## 📞 Suporte

Em caso de problemas:

1. Verifique os logs
2. Consulte a documentação no `/docs`
3. Verifique o Sentry para erros
4. Abra uma issue no GitHub

## 🎯 Checklist de Deploy

- [ ] Variáveis de ambiente configuradas
- [ ] Banco de dados configurado e migrado
- [ ] Firebase configurado
- [ ] Storage (S3/R2) configurado
- [ ] Resend configurado para emails
- [ ] Sentry configurado para monitoramento
- [ ] SSL/TLS configurado
- [ ] Cron jobs configurados
- [ ] Backup automatizado configurado
- [ ] Monitoramento ativo
- [ ] Health checks funcionando
- [ ] Testes passando
- [ ] Build bem-sucedido
