# 📚 Documentação - Índice Completo

## 🎯 Por Onde Começar

| Objetivo                  | Documento                                            | Descrição                         |
| ------------------------- | ---------------------------------------------------- | --------------------------------- |
| **Começar agora (5 min)** | [WHATSAPP_QUICKSTART.md](WHATSAPP_QUICKSTART.md)     | Teste local com fake gateway      |
| **Setup completo**        | [WHATSAPP_SETUP_GUIDE.md](WHATSAPP_SETUP_GUIDE.md)   | Meta API, Twilio, troubleshooting |
| **Entender o sistema**    | [WHATSAPP_FLOW_DIAGRAM.md](WHATSAPP_FLOW_DIAGRAM.md) | Fluxogramas e arquitetura         |
| **Sistema de pagamento**  | [PAYMENT_SYSTEM.md](PAYMENT_SYSTEM.md)               | Faturas, cobranças, automação     |

---

## 📱 WhatsApp - Cobrança

### Quick Start

**Arquivo:** [WHATSAPP_QUICKSTART.md](WHATSAPP_QUICKSTART.md)

**Conteúdo:**

- ⚡ Setup em 5 minutos com fake gateway
- 🚀 Produção com Meta WhatsApp Cloud API
- ☁️ Deploy no Vercel
- 🧪 Comandos de teste

**Quando usar:** Primeira vez configurando, quer testar rápido.

---

### Guia Completo de Setup

**Arquivo:** [WHATSAPP_SETUP_GUIDE.md](WHATSAPP_SETUP_GUIDE.md)

**Conteúdo:**

- 📋 Checklist de variáveis
- 🔑 Meta WhatsApp Cloud API (oficial)
  - Criar app
  - Obter credenciais
  - Números de teste e produção
  - Token permanente
  - Adaptador código
- 📞 Twilio WhatsApp
  - Sandbox e produção
  - Proxy interno
- 🇧🇷 Gateways brasileiros (Zenvia, Gupshup, MessageBird)
- 💳 Configurar chave PIX
  - Tipos de chave
  - Passo a passo por banco
- 🌐 Configurar APP_URL
- 📝 Criar arquivo .env
- ✅ Testar configuração
- 🚀 Deploy Vercel
- 🔧 Troubleshooting detalhado

**Quando usar:** Setup completo de produção, troubleshooting.

---

### Fluxogramas e Arquitetura

**Arquivo:** [WHATSAPP_FLOW_DIAGRAM.md](WHATSAPP_FLOW_DIAGRAM.md)

**Conteúdo:**

- 🔄 Visão geral do sistema
- 📊 Fluxo automático (dailyJob)
- 📲 Fluxo manual (API)
- 📝 Formato da mensagem
- 🗂 Estrutura de arquivos
- ✅ Checklist de implementação
- 🔮 Próximos passos

**Quando usar:** Entender como funciona, contribuir, debugar.

---

## 💰 Sistema de Pagamento

### Documentação Principal

**Arquivo:** [PAYMENT_SYSTEM.md](PAYMENT_SYSTEM.md)

**Conteúdo:**

- 🏗 Arquitetura (Service Layer, APIs, UI)
- 📡 APIs RESTful
  - Pagamento mensal
  - Parcelas
- 🎨 Componente PaymentStatusCard
- ✅ Vantagens do novo sistema
- 🔄 Migração (endpoints antigos → novos)
- 📋 Roadmap
- 🚫 Cancelar fatura
- 📱 Envio WhatsApp
  - Variáveis de controle
  - Flags e automação
  - Formato da mensagem

**Quando usar:** Trabalhar com sistema de cobrança, faturas, pagamentos.

---

## 🗂 Outros Documentos

| Arquivo                                                              | Descrição                   |
| -------------------------------------------------------------------- | --------------------------- |
| [ANALISE_DATAS.md](ANALISE_DATAS.md)                                 | Análise de datas no sistema |
| [BRANCH_STRATEGY.md](BRANCH_STRATEGY.md)                             | Estratégia de branches Git  |
| [CHANGELOG_GARGALOS_VERSICULOS.md](CHANGELOG_GARGALOS_VERSICULOS.md) | Changelog versículos        |
| [COMPARACAO_STORAGE.md](COMPARACAO_STORAGE.md)                       | Comparação storages         |
| [CONFIGURACAO_BIBLIA.md](CONFIGURACAO_BIBLIA.md)                     | Config API Bíblia           |
| [CONFIGURACAO_COMPLETA.md](CONFIGURACAO_COMPLETA.md)                 | Setup completo projeto      |
| [CONFIGURACAO_INSTAGRAM.md](CONFIGURACAO_INSTAGRAM.md)               | Instagram OAuth             |
| [CORRECOES_SISTEMA_MIDIAS.md](CORRECOES_SISTEMA_MIDIAS.md)           | Correções mídias            |
| [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)                                 | Design system shadcn        |
| [GUIA_PAGAMENTO_AUTOMATICO.md](GUIA_PAGAMENTO_AUTOMATICO.md)         | Pagamento automático        |
| [ICONES_GUIA.md](ICONES_GUIA.md)                                     | Guia de ícones              |
| [INSTAGRAM_TROUBLESHOOTING.md](INSTAGRAM_TROUBLESHOOTING.md)         | Troubleshoot Instagram      |
| [INSTALL_DEPS.md](INSTALL_DEPS.md)                                   | Instalação dependências     |
| [MELHORIAS_NAVEGACAO.md](MELHORIAS_NAVEGACAO.md)                     | Melhorias navegação         |
| [MELHORIAS_SISTEMA_MIDIAS.md](MELHORIAS_SISTEMA_MIDIAS.md)           | Melhorias mídias            |
| [MOBILE_LOGIN_FIX.md](MOBILE_LOGIN_FIX.md)                           | Fix login mobile            |
| [NOTIFICATIONS.md](NOTIFICATIONS.md)                                 | Sistema notificações        |
| [README_BRANCHES.md](README_BRANCHES.md)                             | README branches             |
| [RELATORIO_MELHORIAS.md](RELATORIO_MELHORIAS.md)                     | Relatório melhorias         |
| [SETUP_BRANCHES.md](SETUP_BRANCHES.md)                               | Setup branches              |
| [SHADCN_UI_GUIDE.md](SHADCN_UI_GUIDE.md)                             | Guia shadcn UI              |
| [SISTEMA_UPLOAD_MIDIAS.md](SISTEMA_UPLOAD_MIDIAS.md)                 | Upload mídias               |

---

## 🛠 Scripts Úteis

| Comando                 | Descrição                |
| ----------------------- | ------------------------ |
| `pnpm dev`              | Servidor desenvolvimento |
| `pnpm build`            | Build produção           |
| `pnpm whatsapp:test`    | Testar config WhatsApp   |
| `pnpm prisma:studio`    | Interface banco dados    |
| `pnpm prisma:migrate`   | Criar migração           |
| `pnpm billing:backfill` | Backfill faturas         |

---

## 📂 Estrutura do Projeto

```
docs/
├── 📋 INDEX.md                          ← VOCÊ ESTÁ AQUI
├── 📱 WhatsApp
│   ├── WHATSAPP_QUICKSTART.md           ← Começar em 5min
│   ├── WHATSAPP_SETUP_GUIDE.md          ← Setup completo
│   └── WHATSAPP_FLOW_DIAGRAM.md         ← Arquitetura
├── 💰 Pagamento
│   └── PAYMENT_SYSTEM.md                ← Sistema cobrança
└── 🗂 Outros...

src/
├── services/
│   ├── billing/BillingService.ts        ← Lógica cobrança
│   └── notifications/
│       ├── WhatsAppService.ts           ← Envio WhatsApp
│       └── MetaWhatsAppAdapter.ts       ← Adaptador Meta
├── app/api/
│   ├── billing/invoices/[id]/
│   │   ├── notify-whatsapp/route.ts     ← API envio
│   │   ├── cancel/route.ts              ← API cancelar
│   │   └── pay/route.ts                 ← API pagar
│   └── whatsapp/
│       ├── fake-gateway/route.ts        ← Fake (dev)
│       └── twilio-proxy/route.ts        ← Proxy Twilio

scripts/
├── test-whatsapp.ts                     ← Teste config
├── backfill-invoices-from-october.ts    ← Backfill
└── verify-november-payments.ts          ← Verificação
```

---

## 🎓 Tutoriais Rápidos

### 1. Primeira Vez - Testar Localmente

```bash
# 1. Copiar template
cp .env.local.template .env.local

# 2. Testar (fake gateway já configurado)
pnpm whatsapp:test

# 3. Ver mensagem no console
pnpm dev
```

### 2. Configurar Meta WhatsApp Cloud API

1. Leia: [WHATSAPP_SETUP_GUIDE.md - Opção 1](WHATSAPP_SETUP_GUIDE.md#opção-1-meta-whatsapp-cloud-api)
2. Configure `.env.local`:
   ```bash
   WHATSAPP_API_URL=https://graph.facebook.com/v19.0/{ID}/messages
   WHATSAPP_API_TOKEN=EAAxxxxx
   PIX_KEY=sua_chave
   APP_URL=http://localhost:3000
   ```
3. Teste: `TEST_PHONE=+5511999998888 pnpm whatsapp:test`

### 3. Deploy Produção Vercel

1. Leia: [WHATSAPP_QUICKSTART.md - Deploy Vercel](WHATSAPP_QUICKSTART.md#deploy-vercel)
2. Configure variáveis no painel Vercel
3. Ative automação: `WHATSAPP_SEND_AUTOMATIC=true`
4. Push: `git push`

---

## 🆘 Precisa de Ajuda?

| Problema              | Onde Procurar                                                                                             |
| --------------------- | --------------------------------------------------------------------------------------------------------- |
| Erro ao configurar    | [WHATSAPP_SETUP_GUIDE.md#troubleshooting](WHATSAPP_SETUP_GUIDE.md#troubleshooting)                        |
| Meta API erro 401/403 | [WHATSAPP_SETUP_GUIDE.md - Meta Passo 6](WHATSAPP_SETUP_GUIDE.md#passo-6-gerar-token-permanente-produção) |
| Mensagem não chega    | [WHATSAPP_SETUP_GUIDE.md - Número verificado](WHATSAPP_SETUP_GUIDE.md#passo-5-adicionar-número-de-teste)  |
| Entender código       | [WHATSAPP_FLOW_DIAGRAM.md](WHATSAPP_FLOW_DIAGRAM.md)                                                      |
| Configurar PIX        | [WHATSAPP_SETUP_GUIDE.md#configurar-chave-pix](WHATSAPP_SETUP_GUIDE.md#configurar-chave-pix)              |
| Cancelar fatura       | [PAYMENT_SYSTEM.md#cancelar-fatura](PAYMENT_SYSTEM.md#cancelar-fatura-cobrança)                           |

**Script de diagnóstico:**

```bash
pnpm whatsapp:test
```

---

## 🔗 Links Externos Úteis

- [Meta WhatsApp Cloud API Docs](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [Twilio WhatsApp API](https://www.twilio.com/docs/whatsapp)
- [Formato PIX Copia e Cola](https://www.bcb.gov.br/estabilidadefinanceira/pix)
- [E.164 Phone Format](https://en.wikipedia.org/wiki/E.164)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Prisma Docs](https://www.prisma.io/docs)

---

## 📝 Contribuindo

Encontrou erro na documentação? PRs são bem-vindos!

1. Fork o repositório
2. Crie branch: `git checkout -b docs/melhoria`
3. Commit: `git commit -m "docs: corrigir typo em WHATSAPP_SETUP_GUIDE"`
4. Push: `git push origin docs/melhoria`
5. Abra PR

---

**Última atualização:** 16/11/2025  
**Versão:** 1.0.0
