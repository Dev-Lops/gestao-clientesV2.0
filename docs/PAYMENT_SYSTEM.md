# Sistema de Pagamentos - Documentação

## Visão Geral

O sistema de pagamentos foi refatorado para ser mais profissional, intuitivo e fácil de manter. Agora centraliza toda a lógica de negócio em um serviço dedicado e oferece APIs claras e RESTful.

## Arquitetura

````bash
src/
├── services/
│   └── payments/
│       └── PaymentService.ts       # Lógica de negócio centralizada
├── app/api/clients/[id]/
│   ├── payment/route.ts            # API para pagamentos mensais
│   └── installments-v2/route.ts    # API para parcelas
└── features/payments/
    └── components/
        └── PaymentStatusCard.tsx   # Componente UI modernizado
```text

## Service Layer

### `PaymentService`

Centraliza toda a lógica relacionada a pagamentos:

- **Regras de negócio**: Validações, cálculos, status
- **Isolamento**: Não depende de HTTP/UI
- **Testável**: Pode ser testado unitariamente
- **Reutilizável**: Usado por APIs, cron jobs, etc.

#### Métodos Principais

```typescript
// Obter status do mês
PaymentService.getMonthlyPaymentStatus(clientId, orgId)

// Confirmar pagamento mensal
PaymentService.confirmMonthlyPayment(clientId, orgId, amount?)

// Confirmar parcela
PaymentService.confirmInstallmentPayment(installmentId, orgId)

// Listar parcelas
PaymentService.getClientInstallments(clientId, orgId)

// Atualizar parcelas vencidas
PaymentService.updateLateInstallments(orgId)
````

## APIs RESTful

### Pagamento Mensal

#### `GET /api/clients/[id]/payment`

Retorna o status de pagamento do mês atual

**Resposta:**

```json
{
  "mode": "monthly | installment",
  "amount": 1500.0,
  "isPaid": false,
  "isLate": false,
  "dueDate": "2025-11-05T00:00:00Z",
  "paidAt": null,
  "details": {
    "monthlyIncome": 0,
    // ou para installment:
    "installments": {
      "total": 3,
      "paid": 1,
      "pending": 2,
      "nextPendingId": "clxxx"
    }
  }
}
```

#### `POST /api/clients/[id]/payment/confirm`

Confirma o pagamento mensal

**Body (opcional):**

```json
{
  "amount": 1500.0 // Se omitido, usa contractValue
}
```

**Resposta:**

```json
{
  "success": true,
  "message": "Pagamento confirmado com sucesso",
  "status": {
    /* status atualizado */
  }
}
```

### Parcelas

#### `GET /api/clients/[id]/installments-v2`

Lista todas as parcelas do cliente

**Resposta:**

```json
[
  {
    "id": "clxxx",
    "number": 1,
    "totalInstallments": 12,
    "amount": 500.0,
    "dueDate": "2025-11-05T00:00:00Z",
    "status": "CONFIRMED",
    "paidAt": "2025-11-05T10:30:00Z"
  }
]
```

#### `POST /api/clients/[id]/installments-v2?installmentId=xxx`

Confirma pagamento de uma parcela

**Resposta:**

```json
{
  "success": true,
  "message": "Parcela confirmada com sucesso",
  "installments": [
    /* lista atualizada */
  ],
  "monthStatus": {
    /* status do mês atualizado */
  }
}
```

## Componente UI

### `PaymentStatusCard`

Componente React modernizado que substitui o antigo `MonthlyPaymentCard`.

**Melhorias:**

- Estados visuais claros (Pago, Pendente, Atrasado)
- Feedback visual imediato
- Suporte nativo para múltiplas parcelas no mesmo mês
- Lista expansível de todas as parcelas
- Loading states e error handling
- Design responsivo e acessível

**Props:**

```typescript
{
  clientId: string
  clientName: string
  canEdit?: boolean  // Permite confirmar pagamentos
}
```

**Uso:**

```tsx
import { PaymentStatusCard } from '@/features/payments/components/PaymentStatusCard'
;<PaymentStatusCard
  clientId={client.id}
  clientName={client.name}
  canEdit={canEditPayments}
/>
```

## Vantagens do Novo Sistema

### 1. **Separação de Responsabilidades**

- Service Layer: Lógica de negócio
- API: HTTP/autenticação/autorização
- UI: Apresentação/interação

### 2. **Testabilidade**

```typescript
// Fácil de testar isoladamente
const status = await PaymentService.getMonthlyPaymentStatus(clientId, orgId)
expect(status.isPaid).toBe(true)
```

### 3. **Reutilização**

O PaymentService pode ser usado por:

- APIs REST
- Cron jobs
- Background workers
- Testes
- CLI tools

### 4. **Manutenibilidade**

- Código centralizado
- Regras de negócio em um só lugar
- Fácil de entender e modificar

### 5. **APIs Intuitivas**

- RESTful e semânticas
- Responses consistentes
- Documentação clara

### 6. **UI/UX Melhorado**

- Estados claros (badges com cores)
- Feedback imediato
- Loading states
- Error handling
- Design profissional

## Migração

### Endpoints Antigos → Novos

| Antigo                                    | Novo                                                       | Status         |
| ----------------------------------------- | ---------------------------------------------------------- | -------------- |
| `POST /api/clients/[id]/payments/confirm` | `POST /api/clients/[id]/payment/confirm`                   | ✅ Substituído |
| `PATCH /api/installments?id=xxx`          | `POST /api/clients/[id]/installments-v2?installmentId=xxx` | ✅ Substituído |
| Sem endpoint                              | `GET /api/clients/[id]/payment`                            | 🆕 Novo        |

### Componentes Antigos → Novos

| Antigo               | Novo                | Status         |
| -------------------- | ------------------- | -------------- |
| `MonthlyPaymentCard` | `PaymentStatusCard` | ✅ Substituído |

## Roadmap Futuro

- [ ] Adicionar notificações de pagamento vencido
- [ ] Dashboard de inadimplência
- [ ] Relatórios de recebimentos
- [ ] Integração com gateways de pagamento
- [ ] Recibos automáticos por e-mail
- [ ] Histórico de pagamentos detalhado
- [ ] Exportação de dados financeiros

## Cancelar Fatura (Cobrança)

Agora é possível cancelar (anular) uma fatura enquanto ela não foi paga. O cancelamento muda o status para `VOID`.

### Regras

- Permitido somente se o status atual for `DRAFT`, `OPEN` ou `OVERDUE`.
- Não pode haver pagamentos associados à fatura.
- Faturas `PAID` ou já `VOID` não podem ser canceladas.
- Requer permissão `create finance` (mesma usada para marcar pago).

### Endpoint

`POST /api/billing/invoices/:invoiceId/cancel`

#### Respostas

Sucesso:

```json
{ "success": true, "invoice": { "id": "...", "status": "VOID" } }
```

Erro (exemplo):

```json
{ "error": "Fatura já paga; não pode cancelar" }
```

### UI

No detalhe da fatura aparece o botão "Cancelar fatura" quando elegível. Após cancelar, o badge de status fica em cinza.

### Motivação

Permite anular cobranças geradas por engano sem afetar histórico de pagamentos e sem apagar registros (auditoria simples pelo status).

### Notificação Interna

Uma notificação `billing_invoice_void` é registrada para rastreabilidade.

## Envio de Cobrança via WhatsApp

É possível enviar a fatura diretamente ao WhatsApp do cliente com mensagem padronizada incluindo itens, vencimento, total e chave PIX.

### Variáveis de Ambiente Necessárias

```
WHATSAPP_API_URL=https://gateway.exemplo/send
WHATSAPP_API_TOKEN=seu_token
PIX_KEY=chave_pix_aqui   # ou PIX_CHAVE
APP_URL=https://app.seudominio.com
```

### Endpoint Manual

`POST /api/billing/invoices/:invoiceId/notify-whatsapp`

Opcionalmente enviar JSON para sobrescrever o corpo:

```json
{ "body": "Mensagem personalizada" }
```

Resposta:

```json
{ "success": true, "details": { "ok": true, "status": 200 }, "usedBody": "..." }
```

### Formato Padrão da Mensagem

```
Olá NOME_DO_CLIENTE!

Segue sua cobrança referente aos serviços prestados em DD/MM/AAAA.

Fatura: INV-XXXX
Vencimento: DD/MM/AAAA
Status: OPEN

Itens:
• Mensalidade (1x) = R$ 1.500,00

Total: R$ 1.500,00

Chave PIX para pagamento: SUA_CHAVE_PIX
Razão Social: Minha Empresa LTDA
CNPJ: 00.000.000/0000-00
Link da fatura / portal: https://app.seudominio.com/clients/xxx/billing/invoices/yyy

Por favor, após realizar o pagamento, confirme pelo portal ou aguarde atualização automática.
Muito obrigado!
```

### Automação

O daily job já envia alertas de vencimento próximos e faturas que acabaram de ficar vencidas. Texto ajustado para sugerir uso de PIX e portal.

Para envio automático da mensagem completa da fatura em geração mensal ou quando ficar OVERDUE, pode-se estender `dailyJob` chamando `composeInvoiceWhatsAppMessage`.

### Flags / Variáveis de Controle

| Variável                       | Efeito                                                       |
| ------------------------------ | ------------------------------------------------------------ |
| `WHATSAPP_SEND_AUTOMATIC`      | Se `true`, envia mensagem completa em novas e overdue        |
| `sendWhatsAppFull` (parâmetro) | Passado para `dailyJob` sobrescreve comportamento automático |
| `WHATSAPP_API_URL`             | Endpoint do gateway                                          |
| `WHATSAPP_API_TOKEN`           | Token de autenticação                                        |
| `PIX_KEY` / `PIX_CHAVE`        | Chave PIX usada na mensagem                                  |
| `APP_URL`                      | Base para gerar URL do portal da fatura                      |

Retorno do `dailyJob` inclui agora:

```json
{
  "generatedCount": 3,
  "overdueMarked": 1,
  "dueSoon": 2,
  "overdueNotified": 1,
  "notificationsSent": true,
  "whatsappFullSentNew": 3,
  "whatsappFullSentOverdue": 1
}
```

### Boas Práticas

- Configurar PIX_KEY em variáveis e não fixar no código.
- Revisar número de telefone do cliente (campo `phone`).
- Usar mensagens curtas para lembretes e completas para primeira cobrança.
- Monitorar falhas retornadas pelo gateway (campo `details`).

## Exemplo Completo

```typescript
// Backend: Confirmar pagamento
import { PaymentService } from '@/services/payments/PaymentService'

// Em uma API route
const { orgId } = await getSessionProfile()
await PaymentService.confirmMonthlyPayment(clientId, orgId)

// Frontend: Exibir status
import { PaymentStatusCard } from '@/features/payments/components/PaymentStatusCard'

function ClientPage({ client }) {
  return (
    <PaymentStatusCard
      clientId={client.id}
      clientName={client.name}
      canEdit={userCanEdit}
    />
  )
}
```

## Suporte

Para dúvidas ou problemas, consulte o código-fonte ou abra uma issue.
