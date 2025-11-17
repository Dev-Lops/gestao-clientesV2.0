# Guia de Configuração WhatsApp para Cobrança

Este guia detalha **passo a passo** como obter e configurar todas as variáveis necessárias para enviar cobranças automaticamente via WhatsApp.

## Índice

1. [Modo Rápido (5 Min)](#modo-rápido-5-min)
2. [Variáveis Necessárias](#variáveis-necessárias)
3. [Opção 1: Meta WhatsApp Cloud API (Recomendado - Oficial)](#opção-1-meta-whatsapp-cloud-api)
4. [Opção 2: Twilio WhatsApp](#opção-2-twilio-whatsapp)
5. [Opção 3: Gateways Brasileiros](#opção-3-gateways-brasileiros)
6. [Configurar Chave PIX](#configurar-chave-pix)
7. [Configurar APP_URL](#configurar-app_url)
8. [Criar Arquivo .env](#criar-arquivo-env)
9. [Testar Configuração](#testar-configuração)
10. [Deploy em Produção (Vercel)](#deploy-em-produção)
11. [Troubleshooting](#troubleshooting)

---

## Modo Rápido (5 Min)

Se você só quer colocar para funcionar com a **Meta Cloud API**:

```bash
WHATSAPP_PROVIDER=meta
WHATSAPP_PHONE_NUMBER_ID=123456789012345   # Copie do painel Meta
WHATSAPP_API_TOKEN=EAAxxxxxxxxxxxxxxxxxxx # Token temporário ou permanente
PIX_KEY=seu_pix_aqui
APP_URL=http://localhost:3000
WHATSAPP_SEND_AUTOMATIC=false
```

Testar:

```bash
TEST_PHONE=+5511999998888 pnpm whatsapp:test
```

Fake gateway (sem enviar real):

```bash
WHATSAPP_PROVIDER=generic
WHATSAPP_API_URL=http://localhost:3000/api/whatsapp/fake-gateway
WHATSAPP_API_TOKEN=fake
PIX_KEY=teste@exemplo.com.br
APP_URL=http://localhost:3000
WHATSAPP_SEND_AUTOMATIC=false
```

Depois vá para [Testar Configuração](#testar-configuração) ou continue lendo para detalhes completos.

---

## Variáveis Necessárias

Você precisará configurar 5 variáveis de ambiente:

| Variável                   | Descrição                      | Exemplo                                            |
| -------------------------- | ------------------------------ | -------------------------------------------------- |
| `WHATSAPP_PROVIDER`        | Tipo de integração             | `meta`, `twilio`, `generic`, `zapi`                |
| `WHATSAPP_PHONE_NUMBER_ID` | (Meta) ID do número aprovado   | `123456789012345`                                  |
| `WHATSAPP_API_URL`         | (Genérico) Endpoint do gateway | `https://graph.facebook.com/v19.0/123456/messages` |
| `WHATSAPP_API_TOKEN`       | Token de autenticação          | `EAAxxxxxxxxxxxxx`                                 |
| `PIX_KEY`                  | Chave PIX para recebimento     | `contato@empresa.com` ou EVP                       |
| `APP_URL`                  | URL pública da aplicação       | `https://gestao-clientes.vercel.app`               |
| `WHATSAPP_SEND_AUTOMATIC`  | Ativar envio automático        | `true` ou `false`                                  |

---

## Opção 1: Meta WhatsApp Cloud API (Recomendado - Oficial)

### Passo 1: Criar Conta Meta for Developers

1. Acesse: https://developers.facebook.com/
2. Clique em **"Get Started"** ou **"Começar"**
3. Faça login com sua conta Facebook/Meta
4. Complete o cadastro (nome, email, aceitar termos)

### Passo 2: Criar App

1. No painel, clique em **"My Apps"** → **"Create App"**
2. Escolha tipo: **"Business"**
3. Preencha:
   - **Display Name**: Nome da sua aplicação (ex: "Gestão Clientes")
   - **Contact Email**: Seu email
   - **Business Account**: Crie ou selecione
4. Clique em **"Create App"**

### Passo 3: Adicionar WhatsApp

1. Na tela do app, encontre **"WhatsApp"** na lista de produtos
2. Clique em **"Set up"**
3. Escolha ou crie um **Business Account**
4. Aguarde aprovação (geralmente instantâneo)

### Passo 4: Obter Credenciais de Teste

1. Vá em **WhatsApp** → **Getting Started**
2. Na seção **"Send and receive messages"**, você verá:
   - **Phone Number ID** (ex: `123456789012345`)
   - **WhatsApp Business Account ID**
3. Copie o **Temporary Access Token** (válido por 24h - use para testes)

**Construa sua WHATSAPP_API_URL:**

```
https://graph.facebook.com/v19.0/{PHONE_NUMBER_ID}/messages
```

Exemplo:

```
https://graph.facebook.com/v19.0/123456789012345/messages
```

**WHATSAPP_API_TOKEN = Temporary Access Token** (copie o token exibido)

### Passo 5: Adicionar Número de Teste

1. Na mesma tela, seção **"To"**
2. Clique em **"Add phone number"**
3. Digite seu número no formato internacional: `+5511999998888`
4. Você receberá um código no WhatsApp
5. Digite o código para verificar
6. Agora pode enviar mensagens para este número em teste

### Passo 6: Gerar Token Permanente (Produção)

⚠️ **Temporary token expira em 24h!** Para produção:

1. Vá em **WhatsApp** → **Configuration** → **System Users**
2. Clique em **"Create System User"**
3. Preencha:
   - **Name**: "WhatsApp Service"
   - **Role**: Admin
4. Clique no botão **"Generate New Token"**
5. Selecione:
   - **App**: Seu app criado
   - **Permissions**: `whatsapp_business_messaging`, `whatsapp_business_management`
   - **Token Duration**: 60 days (ou Never Expire se disponível)
6. Copie o token gerado (começa com `EAAxxxxx...`)
7. **Salve em local seguro** - não será exibido novamente

### Passo 7: Verificar Número de Produção (Opcional)

Para enviar para qualquer número (não só os de teste):

1. Vá em **WhatsApp** → **Phone Numbers**
2. Clique em **"Add Phone Number"**
3. Escolha entre:
   - **Usar número existente** (verificação via SMS)
   - **Solicitar novo número** (número Meta - pode ter custo)
4. Complete o processo de verificação
5. Configure verificação de domínio (Business Manager)
6. Aguarde revisão do Facebook (1-3 dias)

### Passo 8: Adaptar Código (Importante!)

A API Meta usa formato diferente. Crie adaptador:

**Criar: `src/services/notifications/MetaWhatsAppAdapter.ts`**

```typescript
export class MetaWhatsAppAdapter {
  static async send(
    to: string,
    body: string,
    token: string,
    phoneNumberId: string
  ) {
    const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`

    const payload = {
      messaging_product: 'whatsapp',
      to: to.replace(/\D/g, ''), // Remove não-dígitos
      type: 'text',
      text: { body },
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })

    return {
      ok: res.ok,
      status: res.status,
      data: await res.json().catch(() => null),
    }
  }
}
```

**Atualizar: `src/services/notifications/WhatsAppService.ts`**

```typescript
export class WhatsAppService {
  static isEnabled() {
    return !!process.env.WHATSAPP_API_TOKEN
  }

  static async send(msg: WhatsAppMessage) {
    const token = process.env.WHATSAPP_API_TOKEN
    if (!token) return { ok: false, error: 'WhatsApp token not configured' }

    // Detectar se é Meta Cloud API
    const url = process.env.WHATSAPP_API_URL || ''
    if (url.includes('graph.facebook.com')) {
      const phoneNumberId = url.match(/\/(\d+)\/messages/)?.[1]
      if (!phoneNumberId) return { ok: false, error: 'Invalid Meta API URL' }

      const { MetaWhatsAppAdapter } = await import('./MetaWhatsAppAdapter')
      return MetaWhatsAppAdapter.send(msg.to, msg.body, token, phoneNumberId)
    }

    // Formato genérico (outros gateways)
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(msg),
        cache: 'no-store',
      })
      return { ok: res.ok, status: res.status }
    } catch (e) {
      return { ok: false, error: (e as Error).message }
    }
  }
}
```

---

## Opção 2: Twilio WhatsApp

### Passo 1: Criar Conta Twilio

1. Acesse: https://www.twilio.com/try-twilio
2. Preencha cadastro (email, senha, país)
3. Verifique email
4. Complete verificação de telefone

### Passo 2: Ativar WhatsApp Sandbox

1. No Console Twilio, vá em **Messaging** → **Try it out** → **Send a WhatsApp message**
2. Você verá um código como: `join ABC-xyz`
3. Envie este código pelo WhatsApp para o número exibido (ex: +1 415 523 8886)
4. Aguarde confirmação

### Passo 3: Obter Credenciais

1. Vá em **Account** → **API keys & tokens**
2. Copie:
   - **Account SID** (ex: `ACxxxxxxxxxxxx`)
   - **Auth Token** (clique em "Show" para revelar)

### Passo 4: Configurar Variáveis

Para Twilio, você precisa usar o SDK ou criar endpoint adaptador.

**Opção A: Endpoint Adaptador** (Recomendado para nossa estrutura)

Crie: `src/app/api/whatsapp/twilio-proxy/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { to, body } = await req.json()

  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const fromNumber =
    process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`

  const formData = new URLSearchParams()
  formData.append('From', fromNumber)
  formData.append('To', `whatsapp:${to}`)
  formData.append('Body', body)

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization:
        'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  })

  return NextResponse.json({ ok: res.ok, status: res.status })
}
```

**Configurar `.env`:**

```
WHATSAPP_API_URL=http://localhost:3000/api/whatsapp/twilio-proxy
WHATSAPP_API_TOKEN=dummy
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

---

## Opção 3: Gateways Brasileiros

### Zenvia (Z-API)

1. Acesse: https://www.z-api.io/
2. Crie conta
3. Vincule número WhatsApp (via QR Code)
4. Copie **Instance ID** e **Token** no painel
5. Configure:

```
WHATSAPP_API_URL=https://api.z-api.io/instances/{INSTANCE_ID}/token/{TOKEN}/send-text
WHATSAPP_API_TOKEN=not_used
```

### Gupshup

1. Acesse: https://www.gupshup.io/
2. Crie conta Business
3. Ative WhatsApp Business API
4. Obtenha App Name e API Key
5. Configure:

```
WHATSAPP_API_URL=https://api.gupshup.io/sm/api/v1/msg
WHATSAPP_API_TOKEN=seu_api_key
```

### MessageBird (Oficial WhatsApp Partner)

1. Acesse: https://messagebird.com/
2. Crie conta
3. Ative WhatsApp
4. Obtenha API Key
5. Configure:

```
WHATSAPP_API_URL=https://conversations.messagebird.com/v1/send
WHATSAPP_API_TOKEN=seu_api_key
```

---

## Configurar Chave PIX

### Passo 1: Escolher Tipo de Chave

Recomendado para empresas: **Chave Aleatória (EVP)**

| Tipo                | Vantagem                         | Exemplo                                  |
| ------------------- | -------------------------------- | ---------------------------------------- |
| Email               | Fácil de lembrar                 | contato@empresa.com                      |
| Telefone            | Cliente reconhece                | +5511999998888                           |
| CPF/CNPJ            | Documento oficial                | 12.345.678/0001-90                       |
| **EVP (Aleatória)** | **Mais seguro, não expõe dados** | **0a12b3c4-d567-890e-f123-4567890abcde** |

### Passo 2: Registrar no Banco

**Banco do Brasil:**

1. Acesse app BB ou internet banking
2. Menu → **Pix** → **Minhas Chaves**
3. **Registrar nova chave** → Escolha tipo
4. Copie a chave gerada

**Nubank:**

1. App Nubank → Área Pix (ícone roxo)
2. **Registrar chave** → Escolha tipo
3. Se escolher aleatória, copie o código gerado

**Itaú, Bradesco, Santander (similar):**

1. App → Pix → Minhas chaves
2. Adicionar chave → Tipo → Confirmar
3. Copiar chave

**Mercado Pago, PicPay (fintech):**

1. App → Área Pix → Cadastrar chave
2. Copiar

### Passo 3: Configurar Variável

```
PIX_KEY=sua_chave_aqui
```

⚠️ **Nunca commite chave real no Git!**

---

## Configurar APP_URL

### Desenvolvimento Local

```
APP_URL=http://localhost:3000
```

### Produção Vercel

1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** → **Domains**
4. Copie o domínio (ex: `gestao-clientes.vercel.app`)
5. Configure:

```
APP_URL=https://gestao-clientes.vercel.app
```

Se tiver domínio custom:

```
APP_URL=https://www.seudominio.com.br
```

---

## Criar Arquivo .env

### Passo 1: Criar Arquivo

Na **raiz do projeto**, crie `.env.local`:

```bash
# WhatsApp Configuration
WHATSAPP_API_URL=https://graph.facebook.com/v19.0/123456789012345/messages
WHATSAPP_API_TOKEN=EAAxxxxxxxxxxxxxxxxxxxxx
WHATSAPP_SEND_AUTOMATIC=true

# PIX Configuration
PIX_KEY=0a12b3c4-d567-890e-f123-4567890abcde

# App Configuration
APP_URL=http://localhost:3000
```

### Passo 2: Adicionar ao .gitignore

Verifique que `.env.local` está em `.gitignore`:

```
# .gitignore
.env
.env.local
.env.*.local
```

### Passo 3: Reiniciar Servidor

```bash
# Pare o servidor (Ctrl+C)
pnpm dev
```

---

## Testar Configuração

### Teste 1: Verificar Variáveis

Crie script de teste: `scripts/test-whatsapp.ts`

```typescript
import { WhatsAppService } from '../src/services/notifications/WhatsAppService'

async function test() {
  console.log('🔍 Verificando configuração...\n')

  console.log(
    '✓ WHATSAPP_API_URL:',
    process.env.WHATSAPP_API_URL ? '✅ Configurado' : '❌ Ausente'
  )
  console.log(
    '✓ WHATSAPP_API_TOKEN:',
    process.env.WHATSAPP_API_TOKEN ? '✅ Configurado' : '❌ Ausente'
  )
  console.log(
    '✓ PIX_KEY:',
    process.env.PIX_KEY ? '✅ Configurado' : '❌ Ausente'
  )
  console.log(
    '✓ APP_URL:',
    process.env.APP_URL ? '✅ Configurado' : '❌ Ausente'
  )
  console.log(
    '✓ WhatsApp Enabled:',
    WhatsAppService.isEnabled() ? '✅ Sim' : '❌ Não'
  )

  if (WhatsAppService.isEnabled()) {
    console.log('\n📱 Enviando mensagem de teste...')
    const result = await WhatsAppService.send({
      to: '+5511999998888', // COLOQUE SEU NÚMERO VERIFICADO
      body: 'Teste de configuração WhatsApp! ✅',
    })
    console.log('Resultado:', result)
  }
}

test()
```

Execute:

```bash
pnpm exec tsx scripts/test-whatsapp.ts
```

### Teste 2: Envio Manual via API

1. Inicie servidor: `pnpm dev`
2. Abra Postman/Insomnia ou use curl
3. Faça requisição POST:

```bash
curl -X POST http://localhost:3000/api/billing/invoices/[ID_FATURA]/notify-whatsapp \
  -H "Cookie: sua_sessao" \
  -H "Content-Type: application/json"
```

Ou pela UI:

1. Acesse detalhes de uma fatura
2. Adicione botão de teste (temporário)

---

## Deploy em Produção (Vercel)

### Passo 1: Configurar Variáveis

1. Acesse: https://vercel.com/dashboard
2. Selecione projeto
3. **Settings** → **Environment Variables**
4. Adicione cada variável:
   - Name: `WHATSAPP_API_URL`
   - Value: `https://graph.facebook.com/v19.0/123456.../messages`
   - Environments: ✅ Production, ✅ Preview, ✅ Development
5. Repita para todas:
   - `WHATSAPP_API_TOKEN`
   - `PIX_KEY`
   - `APP_URL`
   - `WHATSAPP_SEND_AUTOMATIC`

### Passo 2: Redeploy

```bash
git add .
git commit -m "chore: configurar envio WhatsApp"
git push
```

Ou pelo painel Vercel: **Deployments** → **Redeploy**

### Passo 3: Verificar Logs

1. **Deployments** → última deploy → **Function Logs**
2. Procure por erros de WhatsApp
3. Teste manualmente via produção

---

## Troubleshooting

### Erro: "WhatsApp env not configured"

**Causa:** Variáveis não carregadas

**Solução:**

1. Verifique `.env.local` existe
2. Reinicie servidor dev
3. No Vercel, confirme variáveis salvas
4. Redeploy

### Erro: 401 Unauthorized (Meta)

**Causa:** Token expirado ou inválido

**Solução:**

1. Gere novo token permanente (Passo 6 da Opção 1)
2. Atualize `WHATSAPP_API_TOKEN`
3. Reinicie

### Erro: 403 Forbidden (Meta)

**Causa:** Número não verificado ou permissões insuficientes

**Solução:**

1. Adicione número em "Test numbers" (dev)
2. Ou complete verificação Business (prod)
3. Verifique permissões do System User

### Mensagem não chega

**Checklist:**

- [ ] Número está em formato E.164 (+5511999998888)
- [ ] Número verificado no painel (dev) ou número de prod verificado
- [ ] Cliente tem WhatsApp ativo neste número
- [ ] Não está em lista de bloqueio do WhatsApp
- [ ] Verifique logs do gateway

### Erro: Invalid phone format

**Solução:**
Formatar número corretamente:

```typescript
function formatPhoneE164(phone: string): string {
  // Remove tudo exceto dígitos
  const clean = phone.replace(/\D/g, '')

  // Se não tem código país, assume Brasil
  if (clean.length === 11) return `+55${clean}`
  if (clean.length === 10) return `+55${clean}`

  // Já tem código
  if (clean.startsWith('55')) return `+${clean}`

  return `+${clean}`
}
```

### Custo inesperado

**Meta Cloud API:**

- Primeiras 1000 conversas/mês: **GRÁTIS**
- Após 1000: ~US$ 0.005-0.10 por conversa (depende do país)
- Conversa = janela de 24h iniciada pelo business

**Twilio:**

- Sandbox: Grátis (limitado)
- Produção: ~US$ 0.005 por mensagem

**Gateways BR:**

- Variam: R$ 0.10 - R$ 0.50 por mensagem
- Planos mensais com franquia

---

## Checklist Final

Antes de colocar em produção:

- [ ] Token permanente configurado (não temporary)
- [ ] Número de produção verificado (não teste)
- [ ] Chave PIX testada (faça um pagamento teste)
- [ ] APP_URL aponta para domínio correto
- [ ] Variáveis no Vercel configuradas
- [ ] Teste completo enviando fatura real
- [ ] Logs monitorados (sem erros)
- [ ] Template da mensagem revisado (português correto)
- [ ] Cliente recebeu e conseguiu pagar
- [ ] Backup das credenciais em local seguro (1Password, Bitwarden, etc.)

---

## Recursos Adicionais

- [Meta WhatsApp Cloud API Docs](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [Twilio WhatsApp API](https://www.twilio.com/docs/whatsapp)
- [Formato PIX Copia e Cola](https://www.bcb.gov.br/estabilidadefinanceira/pix)
- [E.164 Phone Format](https://en.wikipedia.org/wiki/E.164)

---

## Suporte

Se encontrar problemas:

1. Verifique logs: `pnpm dev` (console) ou Vercel Function Logs
2. Teste com `scripts/test-whatsapp.ts`
3. Consulte documentação do gateway escolhido
4. Verifique issues no repositório

**Última atualização:** 16/11/2025
