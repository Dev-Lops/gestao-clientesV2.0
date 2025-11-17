# 🚀 Quick Start - WhatsApp para Cobrança

## Opção Rápida: Teste Local (Sem Gateway Real)

Para testar o sistema **sem configurar gateway** de WhatsApp:

### 1. Configure Fake Gateway

Crie `.env.local` na raiz:

```bash
# Gateway fake (apenas logs)
WHATSAPP_API_URL=http://localhost:3000/api/whatsapp/fake-gateway
WHATSAPP_API_TOKEN=fake_token

# Chave PIX de teste
PIX_KEY=teste@exemplo.com

# URL local
APP_URL=http://localhost:3000

# Desabilitar envio automático
WHATSAPP_SEND_AUTOMATIC=false
```

### 2. Teste

```bash
# Inicie o servidor
pnpm dev

# Em outro terminal, teste
pnpm exec tsx scripts/test-whatsapp.ts
```

Você verá o log da mensagem no console do servidor! ✅

---

## Produção: Meta WhatsApp Cloud API

### Passo a Passo Rápido

1. **Criar App Meta**
   - Acesse: https://developers.facebook.com/
   - Create App → Business → Adicionar WhatsApp

2. **Obter Credenciais**
   - WhatsApp → Getting Started
   - Copie **Phone Number ID** e **Temporary Token**

3. **Adicionar Número de Teste**
   - Na seção "To", clique "Add phone number"
   - Digite seu número: `+5511999998888`
   - Verifique código recebido

4. **Configurar**

```bash
# .env.local
WHATSAPP_API_URL=https://graph.facebook.com/v19.0/SEU_PHONE_NUMBER_ID/messages
WHATSAPP_API_TOKEN=SEU_TEMPORARY_TOKEN
PIX_KEY=sua_chave_pix_real
APP_URL=http://localhost:3000
WHATSAPP_SEND_AUTOMATIC=false
```

5. **Testar Envio Real**

```bash
TEST_PHONE=+5511999998888 pnpm exec tsx scripts/test-whatsapp.ts
```

Verifique seu WhatsApp! 🎉

---

## Deploy Vercel

1. **Settings → Environment Variables**

Adicione:

- `WHATSAPP_API_URL`
- `WHATSAPP_API_TOKEN`
- `PIX_KEY`
- `APP_URL` (https://seu-dominio.vercel.app)
- `WHATSAPP_SEND_AUTOMATIC` (true ou false)

2. **Redeploy**

```bash
git push
```

3. **Ativar Automação**

Para envio automático completo, mude:

```
WHATSAPP_SEND_AUTOMATIC=true
```

---

## Documentação Completa

📖 [Guia Completo](./WHATSAPP_SETUP_GUIDE.md) - Todas as opções de gateway, troubleshooting, produção

---

## Testando na UI

1. Acesse uma fatura: `/clients/[id]/billing/invoices/[invoiceId]`
2. Em breve haverá botão "Enviar WhatsApp" (ou use endpoint manual)

**Endpoint Manual:**

```bash
curl -X POST http://localhost:3000/api/billing/invoices/INVOICE_ID/notify-whatsapp \
  -H "Cookie: sua_sessao"
```

---

## Custos

- **Fake Gateway**: Grátis (apenas dev)
- **Meta Cloud API**: 1000 conversas/mês grátis
- **Twilio Sandbox**: Grátis (limitado)

---

## Ajuda

Problemas? Veja [Troubleshooting](./WHATSAPP_SETUP_GUIDE.md#troubleshooting)

Script de diagnóstico:

```bash
pnpm exec tsx scripts/test-whatsapp.ts
```
