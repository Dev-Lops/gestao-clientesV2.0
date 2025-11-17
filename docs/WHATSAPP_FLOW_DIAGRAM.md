# 🔄 Fluxo do Sistema WhatsApp - Cobrança

## Visão Geral

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Sistema de Cobrança WhatsApp                    │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────┐
│   dailyJob   │  ← Executa diariamente (cron)
└──────┬───────┘
       │
       ├─► Gera faturas mensais (novas)
       ├─► Marca faturas vencidas (OPEN → OVERDUE)
       ├─► Envia notificações internas
       │
       └─► Se WHATSAPP_SEND_AUTOMATIC=true:
           │
           ├─► Novas faturas → Mensagem completa
           └─► Ficou OVERDUE → Mensagem completa


┌──────────────┐
│ Envio Manual │  ← Via API ou botão UI
└──────┬───────┘
       │
       └─► POST /api/billing/invoices/:id/notify-whatsapp
```

---

## Fluxo Detalhado: Envio Automático

```
┌─────────────────────────────────────────────────────────────────────┐
│                          1. dailyJob()                              │
└────────────┬────────────────────────────────────────────────────────┘
             │
             ├─► Para cada cliente com contractValue:
             │   └─► generateMonthlyInvoice()
             │       └─► Cria fatura OPEN se não existe para o mês
             │
             ├─► Busca faturas OPEN com dueDate < hoje
             │   └─► Atualiza status → OVERDUE
             │
             └─► Se sendNotifications ou WHATSAPP_SEND_AUTOMATIC:
                 │
                 ├─► Para cada nova fatura gerada:
                 │   ├─► composeInvoiceWhatsAppMessage()
                 │   │   └─► Monta texto com itens, PIX, link
                 │   │
                 │   └─► WhatsAppService.send()
                 │       └─► Detecta Meta API → MetaWhatsAppAdapter
                 │           └─► POST graph.facebook.com
                 │
                 └─► Para cada fatura que ficou OVERDUE:
                     └─► (mesmo fluxo acima)
```

---

## Fluxo Detalhado: Envio Manual

```
┌─────────────────────────────────────────────────────────────────────┐
│  Usuário clica "Enviar WhatsApp" na tela da fatura                 │
└────────────┬────────────────────────────────────────────────────────┘
             │
             ├─► POST /api/billing/invoices/:id/notify-whatsapp
             │
             ├─► Verifica autenticação e permissões
             │
             ├─► composeInvoiceWhatsAppMessage(invoiceId, orgId)
             │   │
             │   ├─► Busca invoice + items + client
             │   ├─► Busca org (para CNPJ/razão social)
             │   ├─► Lê PIX_KEY do env
             │   ├─► Constrói APP_URL/clients/.../invoices/...
             │   │
             │   └─► Retorna texto formatado
             │
             ├─► Busca telefone do cliente (client.phone)
             │
             └─► WhatsAppService.send({ to: phone, body: message })
                 │
                 ├─► Se URL contém "graph.facebook.com":
                 │   └─► MetaWhatsAppAdapter.send()
                 │       ├─► Limpa número (só dígitos)
                 │       ├─► Monta payload Meta:
                 │       │   {
                 │       │     messaging_product: "whatsapp",
                 │       │     to: "5511999998888",
                 │       │     type: "text",
                 │       │     text: { body: "..." }
                 │       │   }
                 │       └─► POST com Bearer token
                 │
                 └─► Caso contrário (Twilio, Z-API, etc.):
                     └─► POST genérico com { to, body }
```

---

## Formato da Mensagem Gerada

```
┌─────────────────────────────────────────────────────────────────────┐
│ composeInvoiceWhatsAppMessage()                                     │
└────────────┬────────────────────────────────────────────────────────┘
             │
             └─► Texto final:

Olá {CLIENTE_NOME}!

Segue sua cobrança referente aos serviços prestados em {DATA_EMISSAO}.

Fatura: {NUMERO}
Vencimento: {DATA_VENCIMENTO}
Status: {STATUS}

Itens:
• Mensalidade (1x) = R$ 1.500,00
• Outro item (2x) = R$ 300,00

Total: R$ 1.800,00

Chave PIX para pagamento: {PIX_KEY}
Razão Social: {ORG_NAME}
CNPJ: {ORG_CNPJ}
Link da fatura / portal: {APP_URL}/clients/.../invoices/...

Por favor, após realizar o pagamento, confirme pelo portal ou aguarde
atualização automática.
Muito obrigado!
```

---

## Variáveis de Ambiente: Onde Usar

```
┌────────────────────────────┬──────────────────────────────────────┐
│ Variável                   │ Usado em                             │
├────────────────────────────┼──────────────────────────────────────┤
│ WHATSAPP_API_URL           │ WhatsAppService.send()              │
│                            │ → Detecta se é Meta ou genérico      │
├────────────────────────────┼──────────────────────────────────────┤
│ WHATSAPP_API_TOKEN         │ WhatsAppService.send()              │
│                            │ → Authorization: Bearer {token}      │
├────────────────────────────┼──────────────────────────────────────┤
│ PIX_KEY                    │ composeInvoiceWhatsAppMessage()     │
│                            │ → Incluso no corpo da mensagem       │
├────────────────────────────┼──────────────────────────────────────┤
│ APP_URL                    │ composeInvoiceWhatsAppMessage()     │
│                            │ → Gera link do portal                │
├────────────────────────────┼──────────────────────────────────────┤
│ WHATSAPP_SEND_AUTOMATIC    │ BillingService.dailyJob()           │
│                            │ → Se true, envia mensagens completas │
└────────────────────────────┴──────────────────────────────────────┘
```

---

## Decisão: Qual Gateway?

```
┌────────────────────────────────────────────────────────────────────┐
│ WhatsAppService.send()                                             │
└────────────┬───────────────────────────────────────────────────────┘
             │
             ├─► URL contém "graph.facebook.com"?
             │   │
             │   └─► SIM: MetaWhatsAppAdapter
             │       ├─► Extrai phoneNumberId do URL
             │       ├─► Limpa número (só dígitos)
             │       ├─► Monta payload oficial Meta
             │       └─► POST com Bearer token
             │
             └─► NÃO: Gateway genérico
                 └─► POST direto com { to, body }
                     ├─► Twilio Proxy
                     ├─► Z-API
                     ├─► Gupshup
                     ├─► Fake Gateway (dev)
                     └─► Qualquer outro
```

---

## Retorno do dailyJob

```json
{
  "generatedCount": 3, // Faturas novas geradas
  "overdueMarked": 1, // Faturas que viraram OVERDUE
  "dueSoon": 2, // Faturas vencendo em 3 dias
  "overdueNotified": 1, // Notificações criadas
  "notificationsSent": true, // Se sendNotifications=true
  "whatsappFullSentNew": 3, // WhatsApp enviados (novas)
  "whatsappFullSentOverdue": 1 // WhatsApp enviados (overdue)
}
```

---

## Estrutura de Arquivos

```
src/
├── services/
│   ├── billing/
│   │   └── BillingService.ts
│   │       ├── generateMonthlyInvoice()
│   │       ├── composeInvoiceWhatsAppMessage() ← NOVO
│   │       └── dailyJob()                       ← ATUALIZADO
│   │
│   └── notifications/
│       ├── WhatsAppService.ts                   ← ATUALIZADO
│       └── MetaWhatsAppAdapter.ts               ← NOVO
│
├── app/
│   └── api/
│       ├── billing/invoices/[id]/
│       │   └── notify-whatsapp/route.ts         ← NOVO
│       │
│       └── whatsapp/
│           ├── fake-gateway/route.ts            ← NOVO (dev)
│           └── twilio-proxy/route.ts            ← NOVO (opcional)
│
scripts/
└── test-whatsapp.ts                             ← NOVO

docs/
├── WHATSAPP_SETUP_GUIDE.md                      ← NOVO
├── WHATSAPP_QUICKSTART.md                       ← NOVO
└── PAYMENT_SYSTEM.md                            ← ATUALIZADO
```

---

## Checklist de Implementação

- [x] Criar `composeInvoiceWhatsAppMessage()`
- [x] Criar `MetaWhatsAppAdapter`
- [x] Atualizar `WhatsAppService` (detecção auto Meta)
- [x] Criar rota `/api/billing/invoices/[id]/notify-whatsapp`
- [x] Integrar envio automático em `dailyJob()`
- [x] Adicionar flags `WHATSAPP_SEND_AUTOMATIC`
- [x] Criar fake gateway para testes
- [x] Criar proxy Twilio
- [x] Criar script `test-whatsapp.ts`
- [x] Documentar tudo (3 arquivos .md)
- [x] Atualizar README principal
- [x] Criar template .env.local

---

## Próximos Passos (Opcionais)

- [ ] Adicionar botão "Enviar WhatsApp" na UI da fatura
- [ ] Log persistente (tabela WhatsAppLog)
- [ ] Retry automático em caso de falha
- [ ] Validação e formatação de telefone (E.164)
- [ ] Templates multilíngua
- [ ] QR Code PIX na mensagem (Payload Pix Copia e Cola)
- [ ] Webhook para receber status de entrega (Meta)
- [ ] Dashboard de envios (taxa de entrega, erros)
- [ ] Rate limiting (evitar bloqueio por spam)
- [ ] Suporte múltiplos números por cliente

---

## Teste Rápido

```bash
# 1. Configure fake gateway
cp .env.local.template .env.local
# (já vem configurado)

# 2. Inicie servidor
pnpm dev

# 3. Teste em outro terminal
pnpm whatsapp:test

# 4. Veja mensagem no console do servidor!
```

---

## Troubleshooting Rápido

| Problema                      | Solução                                   |
| ----------------------------- | ----------------------------------------- |
| "WhatsApp env not configured" | Verifique `.env.local`, reinicie servidor |
| Erro 401 Meta                 | Token expirado, gere permanente           |
| Erro 403 Meta                 | Número não verificado ou sem permissão    |
| Mensagem não chega            | Número em E.164, verificado no painel     |
| Formato inválido              | Use MetaWhatsAppAdapter (auto-detectado)  |

**Diagnóstico completo:**

```bash
pnpm whatsapp:test
```
