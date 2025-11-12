# 🚀 Guia Rápido - Sistema de Pagamento Automático

## ✅ Status da Configuração

### O que já está pronto:

- ✅ Variável `CRON_SECRET` configurada no `.env`
- ✅ Endpoint do cron criado: `/api/cron/process-monthly-payments`
- ✅ API de teste manual criada: `/api/admin/process-payments`
- ✅ `vercel.json` configurado para rodar todo dia 1º do mês
- ✅ Sistema de parcelas funcionando
- ✅ Integração com financeiro automática

---

## 🧪 TESTE AGORA (Desenvolvimento Local)

### 1. Testar Processamento Manual (Recomendado)

Enquanto o servidor estiver rodando (`pnpm dev`), teste o sistema:

```bash
# Windows PowerShell
$headers = @{
    "Content-Type" = "application/json"
}

Invoke-WebRequest -Uri "http://localhost:3000/api/admin/process-payments" -Method POST -Headers $headers
```

**O que este teste faz:**

- ✅ Busca todos os clientes ativos da sua organização
- ✅ Para clientes parcelados: cria entrada financeira da parcela do mês atual
- ✅ Para clientes mensais: cria entrada financeira com o valor do contrato
- ✅ Marca parcelas atrasadas como `LATE`
- ✅ Não duplica entradas (verifica antes de criar)

**Resposta esperada:**

```json
{
  "success": true,
  "message": "Pagamentos mensais processados",
  "results": {
    "processed": 5,
    "created": 3,
    "updated": 1,
    "errors": 0,
    "details": [
      {
        "client": "Cliente A",
        "amount": 500,
        "type": "installment",
        "installment": {
          "id": "...",
          "number": 2,
          "total": 12,
          "status": "PENDING"
        },
        "action": "created"
      }
    ]
  },
  "month": "11/2025",
  "timestamp": "2025-11-12T..."
}
```

---

### 2. Testar Endpoint do Cron (Simulação)

```bash
# Windows PowerShell
$headers = @{
    "Authorization" = "Bearer gc-2024-cron-secret-pay-auto-q8w9e7r6t5y4u3i2o1p0"
}

Invoke-WebRequest -Uri "http://localhost:3000/api/cron/process-monthly-payments" -Method GET -Headers $headers
```

**Diferença do teste manual:**

- Processa TODAS as organizações do sistema
- Requer token de autorização (Bearer)
- Simula o que o cron fará em produção

---

## 📋 Cenários de Teste

### Cenário 1: Cliente com Pagamento Parcelado

**Passo a passo:**

1. **Criar cliente parcelado:**

   - Vá em "Clientes" → Selecione um cliente → Aba "Info"
   - Role até "Gerenciar Parcelas"
   - Clique em "Criar Parcelas"
   - Preencha:
     - Número de parcelas: `12`
     - Valor por parcela: `R$ 500,00`
     - Data de início: `01/11/2025`
   - Clique em "Criar"

2. **Rodar processamento:**

   ```bash
   # Execute o comando do teste manual acima
   ```

3. **Verificar resultado:**

   - Entre em "Financeiro"
   - Deve aparecer uma entrada:
     - Tipo: Receita
     - Valor: R$ 500,00
     - Descrição: "Parcela 1/12 - Nome do Cliente"
     - Categoria: Mensalidade
     - Data: 01/11/2025

4. **Marcar parcela como paga:**

   - Volte nas parcelas do cliente
   - Clique em "Editar" na parcela 1
   - Status: "Confirmado"
   - Data de pagamento: Escolha a data
   - Clique em "Salvar"

5. **Verificar integração financeira:**
   - A entrada financeira será criada/atualizada automaticamente
   - Descrição: "Parcela 1/12 paga - Nome do Cliente"

---

### Cenário 2: Cliente com Pagamento Mensal Normal

**Passo a passo:**

1. **Configurar cliente:**

   - Vá em "Clientes" → Editar cliente
   - Certifique-se que:
     - Status: "Ativo"
     - Valor do contrato: R$ 1000,00
     - Dia de pagamento: 5 (dia 5 do mês)
     - NÃO está em modo parcelado

2. **Rodar processamento:**

   ```bash
   # Execute o comando do teste manual
   ```

3. **Verificar resultado:**
   - Entre em "Financeiro"
   - Deve aparecer:
     - Tipo: Receita
     - Valor: R$ 1000,00
     - Descrição: "Pagamento mensal - Nome do Cliente"
     - Categoria: Mensalidade
     - Data: 05/11/2025

---

## 🚀 Produção (Vercel/Outro Host)

### 1. Configurar Variável de Ambiente

**No Vercel:**

1. Acesse o projeto no painel Vercel
2. Settings → Environment Variables
3. Adicione:
   - Nome: `CRON_SECRET`
   - Valor: `gc-2024-cron-secret-pay-auto-q8w9e7r6t5y4u3i2o1p0`
   - Ambiente: Production, Preview, Development

### 2. Deploy

```bash
git add .
git commit -m "feat: sistema de pagamento automático configurado"
git push origin main
```

### 3. Verificar Cron no Vercel

Após deploy:

1. Acesse o projeto no Vercel
2. Settings → Cron Jobs
3. Deve aparecer:
   - Path: `/api/cron/process-monthly-payments`
   - Schedule: `0 0 1 * *`
   - Status: Active

### 4. Monitorar Execução

**Primeira execução:** Dia 1º de dezembro de 2025 às 00:00 UTC

**Ver logs:**

1. Vercel Dashboard → Logs
2. Filtrar por "cron"
3. Verificar execução e possíveis erros

---

## 🔄 Como Funciona o Fluxo Completo

```
┌─────────────────────────────────────────────────────────────┐
│                    DIA 1º DO MÊS (00:00)                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Cron Job Roda  │
                    └─────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────┐
        │  Busca todos os clientes ativos     │
        └─────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
        ┌──────────────────┐  ┌──────────────────┐
        │ Cliente Parcelado│  │  Cliente Mensal  │
        └──────────────────┘  └──────────────────┘
                    │                   │
                    ▼                   ▼
        ┌──────────────────┐  ┌──────────────────┐
        │ Busca parcela do │  │ Usa valor do     │
        │ mês atual        │  │ contrato         │
        └──────────────────┘  └──────────────────┘
                    │                   │
                    ▼                   ▼
        ┌──────────────────────────────────────┐
        │  Verifica se já existe entrada no    │
        │  financeiro para este mês/cliente    │
        └──────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
            ┌──────────┐        ┌──────────┐
            │   SIM    │        │   NÃO    │
            │  (pula)  │        │ (cria)   │
            └──────────┘        └──────────┘
                                        │
                                        ▼
                            ┌────────────────────────┐
                            │ Cria entrada financeira│
                            │ - Tipo: income         │
                            │ - Categoria: Mensalida.│
                            │ - Status: PENDING      │
                            └────────────────────────┘
                                        │
                                        ▼
                            ┌────────────────────────┐
                            │  Parcelas atrasadas    │
                            │  marcadas como LATE    │
                            └────────────────────────┘
```

---

## 🎯 Quando uma Parcela é PAGA

```
┌─────────────────────────────────────────────────────────────┐
│          OWNER marca parcela como "CONFIRMADO"              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ Atualiza status │
                    │ da parcela      │
                    └─────────────────┘
                              │
                              ▼
              ┌──────────────────────────────┐
              │ Verifica se já existe entrada│
              │ financeira para esta parcela │
              └──────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
            ┌──────────┐        ┌──────────┐
            │   SIM    │        │   NÃO    │
            │  (pula)  │        │ (cria)   │
            └──────────┘        └──────────┘
                                        │
                                        ▼
                        ┌────────────────────────────┐
                        │ Cria entrada financeira    │
                        │ - Tipo: income             │
                        │ - Status: CONFIRMED        │
                        │ - Descrição: "Parcela X/Y  │
                        │   paga - Cliente"          │
                        │ - Data: data do pagamento  │
                        └────────────────────────────┘
                                        │
                                        ▼
                        ┌────────────────────────────┐
                        │ Saldo da org atualizado!   │
                        └────────────────────────────┘
```

---

## ❓ Perguntas Frequentes

### O cron não vai rodar em desenvolvimento local, certo?

✅ Correto! O cron só roda em produção (Vercel ou similar). Para desenvolvimento, use a API manual: `/api/admin/process-payments`

### O que acontece se eu rodar o processamento várias vezes no mesmo mês?

✅ Nada! O sistema verifica se já existe entrada financeira e não duplica.

### Como sei se o cron está funcionando em produção?

✅ Verifique no Vercel Dashboard → Logs → Filtrar por "cron" ou "process-monthly-payments"

### Preciso fazer algo quando mudar o mês?

❌ Não! O cron roda automaticamente no dia 1º às 00:00 UTC.

### E se um cliente atrasar o pagamento?

✅ O cron marca automaticamente a parcela como `LATE` se passou do vencimento.

### Posso testar sem criar clientes reais?

✅ Sim! Crie clientes de teste com status "ativo" e rode a API manual.

### Quanto custa o cron no Vercel?

💰 Requer plano Pro ($20/mês). Alternativas grátis: cron-job.org, EasyCron, GitHub Actions (veja documentação completa)

---

## 🐛 Troubleshooting

### Erro: "Não autorizado" ao chamar o cron

**Solução:** Certifique-se de passar o header:

```
Authorization: Bearer gc-2024-cron-secret-pay-auto-q8w9e7r6t5y4u3i2o1p0
```

### Nenhuma entrada criada

**Verificar:**

- Cliente está com status "active" ou "onboarding"?
- Cliente tem `contractValue` definido (mensal) ou parcelas criadas (parcelado)?
- Data de vencimento da parcela é no mês atual?

### Entrada duplicada

**Causa:** Bug improvável (sistema tem proteção)
**Solução:** Reporte o caso com os dados do cliente

### Cron não aparece no Vercel

**Solução:**

1. Certifique-se que `vercel.json` está na raiz do projeto
2. Faça um novo deploy
3. Verifique se está no plano Pro

---

## 📞 Suporte

Em caso de dúvidas ou problemas:

1. Verifique os logs no console do navegador
2. Verifique os logs do servidor (`pnpm dev`)
3. Teste primeiro com a API manual antes de confiar no cron
4. Consulte a documentação completa em `docs/SISTEMA_PAGAMENTOS.md`

---

**✅ Sistema pronto para uso! Bons testes! 🚀**
