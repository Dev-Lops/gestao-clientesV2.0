# Sistema de Pagamentos - Documentação

## Visão Geral

O sistema de pagamentos foi refatorado para ser mais profissional, intuitivo e fácil de manter. Agora centraliza toda a lógica de negócio em um serviço dedicado e oferece APIs claras e RESTful.

## Arquitetura

```
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
```

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
```

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
