# Sistema de Pagamentos Parcelados e Automáticos

## Visão Geral

O sistema gerencia automaticamente os pagamentos dos clientes, suportando dois modos:

- **Pagamento Mensal Normal**: Valor fixo todo mês
- **Pagamento Parcelado**: Valor dividido em X parcelas

## Funcionalidades

### 1. Pagamento Parcelado

**Configuração:**

- Cliente marcado com `isInstallment = true`
- Define número de parcelas (`installmentCount`)
- Define valor de cada parcela (`installmentValue`)
- Sistema cria automaticamente todas as parcelas com vencimentos mensais

**Quando uma parcela é paga:**

1. Status alterado para `CONFIRMED`
2. Data de pagamento registrada
3. **Automaticamente cria entrada no financeiro da organização**
   - Tipo: `income` (receita)
   - Categoria: `Mensalidade`
   - Descrição: `Parcela X/Y paga - Nome do Cliente`

### 2. Processamento Automático Mensal

**Cron Job** executado todo dia 1º de cada mês:

- Localização: `/api/cron/process-monthly-payments`
- Schedule: `0 0 1 * *` (meia-noite do dia 1)

**O que o cron faz:**

1. **Para clientes com pagamento normal:**

   - Cria entrada financeira com o valor do contrato (`contractValue`)
   - Descrição: `Pagamento mensal - Nome do Cliente`
   - Data: Dia definido em `paymentDay` do cliente

2. **Para clientes parcelados:**

   - Busca a parcela do mês atual
   - Cria entrada financeira com o valor da parcela
   - Descrição: `Parcela X/Y - Nome do Cliente`
   - **Atualiza status para `LATE` se passou do vencimento**

3. **Não duplica entradas:**
   - Verifica se já existe entrada financeira no mês
   - Apenas cria se não houver

### 3. API Manual para Testes

**Endpoint:** `POST /api/admin/process-payments`

- Disponível apenas para OWNER
- Processa pagamentos do mês atual manualmente
- Útil para testar sem esperar o cron

**Resposta:**

```json
{
  "success": true,
  "message": "Pagamentos mensais processados",
  "results": {
    "processed": 10,
    "created": 8,
    "updated": 2,
    "errors": 0,
    "details": [
      {
        "client": "Cliente A",
        "amount": 500,
        "type": "installment",
        "installment": {
          "id": "...",
          "number": 3,
          "total": 12,
          "status": "PENDING"
        },
        "action": "created"
      }
    ]
  },
  "month": "11/2025",
  "timestamp": "2025-11-01T00:00:00.000Z"
}
```

## Configuração

### 1. Variável de Ambiente

Adicione no `.env`:

```env
CRON_SECRET="sua-secret-key-segura-aqui"
```

### 2. Vercel (Produção)

O arquivo `vercel.json` já está configurado:

```json
{
  "crons": [
    {
      "path": "/api/cron/process-monthly-payments",
      "schedule": "0 0 1 * *"
    }
  ]
}
```

**Atenção:** Cron jobs no Vercel requerem plano Pro ($20/mês)

### 3. Alternativas ao Vercel Cron

Se não tiver plano Pro, use um serviço externo:

#### Opção 1: Cron-job.org (Grátis)

1. Crie conta em https://cron-job.org
2. Adicione job:
   - URL: `https://seu-dominio.com/api/cron/process-monthly-payments`
   - Schedule: `0 0 1 * *`
   - Header: `Authorization: Bearer SEU_CRON_SECRET`

#### Opção 2: EasyCron (Grátis até 5 jobs)

1. Crie conta em https://www.easycron.com
2. Configure job similar ao acima

#### Opção 3: GitHub Actions (Grátis)

Crie `.github/workflows/monthly-payments.yml`:

```yaml
name: Process Monthly Payments

on:
  schedule:
    - cron: '0 0 1 * *' # Primeiro dia de cada mês

jobs:
  process:
    runs-on: ubuntu-latest
    steps:
      - name: Call API
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://seu-dominio.com/api/cron/process-monthly-payments
```

## Fluxo Completo

### Exemplo: Cliente com 12 Parcelas de R$ 500

**1. Criação (Mês 0):**

```typescript
// POST /api/clients/{id}/installments
{
  installmentCount: 12,
  installmentValue: 500,
  startDate: "2025-01-01"
}
```

- Cliente marcado como `isInstallment = true`
- 12 parcelas criadas (vencimento: 01/01, 01/02, 01/03, etc.)

**2. Todo dia 1º do mês:**

- Cron roda automaticamente
- Cria entrada financeira: "Parcela 1/12 - Cliente X" - R$ 500
- Se parcela já venceu, marca como `LATE`

**3. Cliente paga a parcela (Dia 05/01):**

```typescript
// PATCH /api/clients/{id}/installments?installmentId=xxx
{
  status: "CONFIRMED",
  paidAt: "2025-01-05",
  notes: "Pago via PIX"
}
```

- Status atualizado para `CONFIRMED`
- **Automaticamente cria entrada financeira**:
  - Tipo: `income`
  - Valor: R$ 500
  - Descrição: "Parcela 1/12 paga - Cliente X"
  - Data: 05/01/2025

**4. Financeiro da Org:**

- Receita de R$ 500 registrada
- Saldo atualizado automaticamente
- Aparece no dashboard de finanças

## Status das Parcelas

- **PENDING**: Aguardando pagamento
- **CONFIRMED**: Pago (gera entrada financeira automaticamente)
- **LATE**: Atrasado (atualizado automaticamente pelo cron)

## Casos de Uso

### Alternar entre Normal e Parcelado

**De Normal para Parcelado:**

```typescript
// POST /api/clients/{id}/installments
// Cria parcelas e marca isInstallment = true
```

**De Parcelado para Normal:**

```typescript
// DELETE /api/clients/{id}/installments
// Remove todas as parcelas e marca isInstallment = false
```

### Verificar Parcelas Pendentes

```typescript
// GET /api/clients/{id}/installments
// Retorna todas as parcelas ordenadas por número
```

### Relatório de Pagamentos do Mês

Use a API manual para simular o processamento:

```bash
curl -X POST \
  -H "Authorization: Bearer TOKEN" \
  https://seu-dominio.com/api/admin/process-payments
```

## Testes

### 1. Teste Local (Desenvolvimento)

```bash
# 1. Criar cliente com parcelas
# 2. Marcar parcela como paga via interface
# 3. Verificar se entrada financeira foi criada

# 4. Rodar processamento manual
curl -X POST http://localhost:3000/api/admin/process-payments \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json"
```

### 2. Teste de Cron (Vercel)

```bash
# Chamar o endpoint de cron manualmente
curl -X POST https://seu-dominio.vercel.app/api/cron/process-monthly-payments \
  -H "Authorization: Bearer SEU_CRON_SECRET"
```

## Monitoramento

Para verificar se o cron está rodando:

1. **Vercel Dashboard**: Logs > Cron Executions
2. **Entrada Financeira**: Verificar se entradas foram criadas no dia 1º
3. **Parcelas**: Verificar se status `LATE` foi atualizado automaticamente

## Troubleshooting

### Parcelas não sendo processadas

**Verificar:**

1. Cliente está com status `active` ou `onboarding`?
2. Parcela tem vencimento no mês atual?
3. `isInstallment = true` no cliente?
4. Cron secret está correto?

### Entrada financeira duplicada

**Causa:** Cron rodou múltiplas vezes
**Solução:** Sistema já tem proteção, verifica se entrada existe antes de criar

### Parcela paga mas sem entrada financeira

**Causa:** Status não foi marcado como `CONFIRMED`
**Solução:** Atualizar status da parcela via interface ou API

## Considerações de Performance

- Cron processa **todos os clientes ativos** de todas as orgs
- Para muitos clientes (>1000), considere:
  - Processar em batches
  - Adicionar índices no banco
  - Usar queue (Bull, BeeQueue)

## Segurança

- ✅ Endpoint de cron protegido por secret
- ✅ API manual apenas para OWNER
- ✅ Validação de orgId em todas as queries
- ✅ Não permite duplicação de entradas financeiras

## Próximas Melhorias

- [ ] Notificações por email quando parcela vence
- [ ] Notificações quando cron falha
- [ ] Dashboard com métricas de pagamentos
- [ ] Relatório mensal automatizado
- [ ] Webhook para sistemas externos
- [ ] Integração com gateways de pagamento
