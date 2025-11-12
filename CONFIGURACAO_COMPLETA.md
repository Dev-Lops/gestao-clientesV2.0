# ✅ SISTEMA DE PAGAMENTO AUTOMÁTICO - CONFIGURADO

## 📌 Status: PRONTO PARA TESTE

### O que foi feito:

1. ✅ **Variável de ambiente configurada**

   - `CRON_SECRET` adicionada no `.env`
   - Valor: `gc-2024-cron-secret-pay-auto-q8w9e7r6t5y4u3i2o1p0`

2. ✅ **APIs funcionais**

   - `/api/cron/process-monthly-payments` - Endpoint do cron (GET/POST)
   - `/api/admin/process-payments` - Teste manual para OWNER (POST)
   - `/api/clients/[id]/installments` - Gerenciar parcelas (GET/POST/PATCH/DELETE)

3. ✅ **Configuração do Vercel**

   - `vercel.json` criado com cron schedule
   - Schedule: `0 0 1 * *` (todo dia 1º do mês às 00:00)

4. ✅ **Correções de TypeScript**

   - Todos os erros de lint corrigidos
   - Types adequados para prevenir null/undefined
   - Validações de orgId em todos os endpoints

5. ✅ **Documentação completa**
   - `GUIA_PAGAMENTO_AUTOMATICO.md` - Guia passo a passo
   - `docs/SISTEMA_PAGAMENTOS.md` - Documentação técnica completa
   - `test-payment-system.ps1` - Script de teste automatizado

---

## 🚀 PRÓXIMO PASSO: TESTAR AGORA!

### Opção 1: Usar o Script Automatizado (Recomendado)

```powershell
# No PowerShell, na raiz do projeto:
.\test-payment-system.ps1
```

Este script irá:

- Verificar se o servidor está rodando
- Testar a API manual (como OWNER)
- Testar o endpoint do cron (simulação)
- Salvar os resultados em arquivos JSON
- Mostrar estatísticas e detalhes

### Opção 2: Teste Manual

```powershell
# 1. Certifique-se que o servidor está rodando
pnpm dev

# 2. Em outro terminal, teste a API manual:
$headers = @{"Content-Type" = "application/json"}
Invoke-WebRequest -Uri "http://localhost:3000/api/admin/process-payments" -Method POST -Headers $headers

# 3. Teste o endpoint do cron:
$headers = @{"Authorization" = "Bearer gc-2024-cron-secret-pay-auto-q8w9e7r6t5y4u3i2o1p0"}
Invoke-WebRequest -Uri "http://localhost:3000/api/cron/process-monthly-payments" -Method GET -Headers $headers
```

---

## 📋 Cenário de Teste Completo

### 1. Preparar Cliente de Teste

1. Acesse o sistema (como OWNER)
2. Vá em "Clientes"
3. Crie ou selecione um cliente
4. Edite e configure:
   - Status: `Ativo`
   - Valor do contrato: `R$ 1000,00`
   - Dia de pagamento: `5`

### 2. Criar Parcelas (Opcional)

1. Entre no cliente
2. Vá na aba "Info"
3. Role até "Gerenciar Parcelas"
4. Clique em "Criar Parcelas"
5. Configure:
   - Número de parcelas: `12`
   - Valor por parcela: `R$ 500,00`
   - Data de início: `01/11/2025`
6. Clique em "Criar"

### 3. Executar Processamento

```powershell
.\test-payment-system.ps1
```

### 4. Verificar Resultados

1. **No Financeiro:**

   - Acesse a página de Financeiro
   - Deve haver entrada(s) nova(s):
     - Tipo: Receita
     - Categoria: Mensalidade
     - Descrição: "Pagamento mensal - [Nome]" ou "Parcela 1/12 - [Nome]"
     - Valor: Conforme configurado

2. **Nas Parcelas:**
   - Acesse o cliente → Info → Parcelas
   - Parcelas atrasadas devem estar marcadas como `LATE` (vermelho)
   - Parcelas pendentes como `PENDING` (amarelo)

### 5. Testar Marcar Parcela como Paga

1. Na lista de parcelas, clique em "Editar"
2. Altere:
   - Status: `Confirmado`
   - Data de pagamento: Escolha uma data
   - Observações (opcional): "Pago via PIX"
3. Clique em "Salvar"
4. Verifique no Financeiro:
   - Nova entrada criada automaticamente
   - Descrição: "Parcela X/Y paga - [Nome do Cliente]"

---

## 🎯 O que cada endpoint faz

### `/api/admin/process-payments` (POST)

**Quem pode usar:** Apenas OWNER  
**O que faz:**

- Busca clientes ativos da sua organização
- Para clientes parcelados: cria entrada da parcela do mês atual
- Para clientes mensais: cria entrada com valor do contrato
- Marca parcelas atrasadas como `LATE`
- **Não duplica** - verifica antes de criar

**Quando usar:**

- Para testar o sistema localmente
- Para processar pagamentos manualmente
- Para corrigir processamentos perdidos

### `/api/cron/process-monthly-payments` (GET/POST)

**Quem pode usar:** Apenas com Bearer token (`CRON_SECRET`)  
**O que faz:**

- Mesma lógica da API manual
- Processa **TODAS as organizações** do sistema
- Criado para ser chamado pelo Vercel Cron

**Quando usar:**

- Automaticamente pelo cron (dia 1º do mês)
- Manualmente para testar o cron localmente

### `/api/clients/[id]/installments` (PATCH)

**Quem pode usar:** Apenas OWNER  
**O que faz:**

- Atualiza status da parcela
- **Quando marcada como CONFIRMADO:**
  - Cria entrada financeira automaticamente
  - Tipo: Receita (income)
  - Categoria: Mensalidade
  - Descrição: "Parcela X/Y paga - Cliente"

**Quando usar:**

- Quando cliente pagar a parcela
- Para marcar parcela como atrasada manualmente
- Para adicionar observações

---

## 🔧 Configuração para Produção

### 1. Adicionar CRON_SECRET no Vercel

```bash
# Via CLI
vercel env add CRON_SECRET production

# Digite quando solicitado:
gc-2024-cron-secret-pay-auto-q8w9e7r6t5y4u3i2o1p0
```

**Ou via Dashboard:**

1. Acesse seu projeto no Vercel
2. Settings → Environment Variables
3. Adicione:
   - Name: `CRON_SECRET`
   - Value: `gc-2024-cron-secret-pay-auto-q8w9e7r6t5y4u3i2o1p0`
   - Environments: ☑️ Production

### 2. Deploy

```bash
git add .
git commit -m "feat: sistema de pagamento automático configurado"
git push origin main
```

### 3. Verificar Cron no Vercel

Após o deploy:

1. Vercel Dashboard → Seu Projeto
2. Settings → Cron Jobs
3. Deve aparecer:
   ```
   Path: /api/cron/process-monthly-payments
   Schedule: 0 0 1 * *
   Status: ● Active
   Next Run: 01 Dec 2025, 00:00:00 UTC
   ```

### 4. Monitorar

**Ver logs do cron:**

1. Vercel Dashboard → Logs
2. Filtrar por `/api/cron/process-monthly-payments`
3. Verificar execução dia 1º do mês

**Testar antes do dia 1º:**

```bash
# Chamar manualmente via curl
curl -X POST https://seu-dominio.vercel.app/api/cron/process-monthly-payments \
  -H "Authorization: Bearer gc-2024-cron-secret-pay-auto-q8w9e7r6t5y4u3i2o1p0"
```

---

## 💡 Alternativas ao Vercel Cron (Se não tiver plano Pro)

### Opção 1: Cron-job.org (Grátis)

1. Crie conta em https://cron-job.org
2. Crie novo job:
   - URL: `https://seu-dominio.com/api/cron/process-monthly-payments`
   - Schedule: `0 0 1 * *`
   - HTTP Method: GET
   - Authentication:
     - Type: Custom
     - Header: `Authorization`
     - Value: `Bearer gc-2024-cron-secret-pay-auto-q8w9e7r6t5y4u3i2o1p0`

### Opção 2: GitHub Actions (Grátis)

Crie `.github/workflows/monthly-payments.yml`:

```yaml
name: Process Monthly Payments
on:
  schedule:
    - cron: '0 0 1 * *'
jobs:
  process:
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -X POST https://seu-dominio.com/api/cron/process-monthly-payments \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

---

## ❓ FAQ

**O teste não retorna nada?**

- Certifique-se que tem clientes com status `ativo` ou `onboarding`
- Clientes mensais precisam ter `contractValue` definido
- Clientes parcelados precisam ter parcelas criadas

**Erro "Não autorizado"?**

- Para API manual: faça login como OWNER
- Para cron: verifique se o token está correto

**Entradas duplicadas?**

- Improvável - sistema tem proteção
- Verifique se o processamento foi executado múltiplas vezes

**Cron não aparece no Vercel?**

- Vercel Cron requer plano Pro ($20/mês)
- Use alternativas gratuitas (cron-job.org, GitHub Actions)

---

## ✅ Checklist Final

Antes de considerar pronto:

- [ ] Testou a API manual localmente
- [ ] Criou cliente de teste e verificou entrada financeira
- [ ] Testou criar parcelas
- [ ] Testou marcar parcela como paga
- [ ] Verificou integração com financeiro
- [ ] Testou endpoint do cron localmente
- [ ] Configurou `CRON_SECRET` no Vercel (ou alternativa)
- [ ] Fez deploy para produção
- [ ] Verificou que cron aparece no dashboard
- [ ] Agendou teste para dia 1º do próximo mês

---

## 📚 Documentação Adicional

- **Guia Completo:** `GUIA_PAGAMENTO_AUTOMATICO.md`
- **Documentação Técnica:** `docs/SISTEMA_PAGAMENTOS.md`
- **Script de Teste:** `test-payment-system.ps1`

---

**Sistema pronto! Comece testando localmente antes de ir para produção! 🚀**
