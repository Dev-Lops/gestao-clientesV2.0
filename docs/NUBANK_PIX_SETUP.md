# Guia de Configuração - Integração Pix Nubank

## 📋 Pré-requisitos

- Conta PJ no Nubank
- Acesso ao Portal do Desenvolvedor do Nubank
- Certificado digital para APIs (será gerado no portal)

## 🚀 Passo a Passo

### 1. Acessar o Portal do Desenvolvedor Nubank

1. Acesse: https://dev.nubank.com.br (ou portal específico para PJ)
2. Faça login com sua conta PJ do Nubank
3. Vá em **"Minhas Aplicações"** ou **"APIs"**

### 2. Criar uma Nova Aplicação

1. Clique em **"Nova Aplicação"** ou **"Criar App"**
2. Preencha os dados:
   - **Nome da aplicação**: Sistema de Gestão de Clientes
   - **Descrição**: Integração para receber notificações de Pix
   - **Tipo**: API de Notificações Pix
3. Selecione as permissões necessárias:
   - ✅ Ler transações Pix
   - ✅ Receber webhooks de Pix

### 3. Configurar Webhook

1. Na seção **"Webhooks"** da sua aplicação
2. Adicione a URL do webhook:
   ```
   https://seu-dominio.com/api/webhooks/nubank/pix
   ```
3. Selecione os eventos:
   - ✅ `pix.received` (Pix recebido)
4. **Importante**: Anote o **Webhook Secret** gerado (você vai precisar!)

### 4. Obter Credenciais da API

1. Na sua aplicação, vá em **"Credenciais"**
2. Copie:
   - **Client ID**
   - **Client Secret**
   - **Certificate** (se necessário)

### 5. Configurar Variáveis de Ambiente

Adicione as seguintes variáveis no seu arquivo `.env`:

```bash
# Nubank Pix Integration
NUBANK_CLIENT_ID=seu_client_id_aqui
NUBANK_CLIENT_SECRET=seu_client_secret_aqui
NUBANK_WEBHOOK_SECRET=seu_webhook_secret_aqui

# Organização padrão (para pagamentos não identificados)
DEFAULT_ORG_ID=seu_org_id_aqui
```

### 6. Testar a Integração

#### Teste Local (Desenvolvimento)

1. **Instale ngrok** para expor sua aplicação local:

   ```bash
   npm install -g ngrok
   ```

2. **Inicie seu servidor local**:

   ```bash
   pnpm dev
   ```

3. **Exponha a porta 3000**:

   ```bash
   ngrok http 3000
   ```

4. **Copie a URL do ngrok** (ex: `https://abc123.ngrok.io`)

5. **Configure no Portal do Nubank**:
   - Webhook URL: `https://abc123.ngrok.io/api/webhooks/nubank/pix`

6. **Faça um Pix de teste** para sua conta PJ

#### Teste em Produção

1. Configure o webhook com sua URL de produção
2. Faça um Pix real de um valor pequeno (ex: R$ 1,00)
3. Verifique nos logs se o pagamento foi registrado

### 7. Verificar Logs

Após receber um Pix, você pode verificar nos logs:

```bash
# Logs do sistema
tail -f logs/app.log

# Ou verificar no dashboard do Nubank
# Portal > Sua Aplicação > Logs de Webhook
```

## 🔧 Troubleshooting

### Webhook não está sendo chamado

1. Verifique se a URL está acessível publicamente
2. Verifique se o certificado SSL está válido
3. Teste a URL manualmente: `curl https://seu-dominio.com/api/webhooks/nubank/pix`

### Erro 401 (Unauthorized)

- Verifique se o `NUBANK_WEBHOOK_SECRET` está correto no `.env`
- Verifique se a assinatura está sendo validada corretamente

### Pagamento não identificado

- Certifique-se de que o CPF/CNPJ do pagador está cadastrado no sistema
- Verifique se o cliente tem uma fatura em aberto com o valor exato

### Cliente não encontrado

- O sistema vai registrar como receita genérica
- Você pode vincular manualmente depois no dashboard

## 📊 Como Funciona

### Fluxo do Pagamento

```
Cliente paga via Pix
    ↓
Nubank detecta o pagamento
    ↓
Nubank envia webhook para seu sistema
    ↓
Sistema verifica assinatura
    ↓
Sistema busca cliente pelo CPF/CNPJ
    ↓
Sistema procura fatura em aberto com valor compatível
    ↓
┌─────────────────────┬─────────────────────┐
│ Fatura encontrada   │ Fatura não encontrada│
│ Marca como PAID     │ Registra como avulso │
│ Cria Payment        │ Cria Payment         │
│ Cria Finance        │ Cria Finance         │
└─────────────────────┴─────────────────────┘
```

### Tolerância de Valor

O sistema aceita uma diferença de até **R$ 0,01** entre o valor do Pix e o valor da fatura.

### Identificação de Cliente

O sistema busca clientes por:

1. CPF do pagador
2. CNPJ do pagador

**Importante**: Cadastre os clientes com CPF/CNPJ corretos!

## 🔒 Segurança

### Validação de Assinatura

Todos os webhooks são validados usando HMAC SHA256:

```typescript
const hmac = crypto.createHmac('sha256', webhookSecret)
hmac.update(payload)
const signature = hmac.digest('hex')
```

### Rate Limiting

Considere adicionar rate limiting ao endpoint:

```typescript
// Exemplo com Upstash
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 m'),
})
```

## 📱 Notificações

Para receber notificações quando um Pix é recebido, você pode:

1. Adicionar notificações por email
2. Adicionar notificações no sistema
3. Integrar com WhatsApp (via Evolution API)

## 🆘 Suporte

### Documentação Oficial do Nubank

- Portal: https://dev.nubank.com.br
- Docs: https://dev.nubank.com.br/docs

### Suporte Técnico

- Email: developer@nubank.com.br
- Chat: Disponível no portal do desenvolvedor

## 📝 Próximos Passos

Após configurar:

1. ✅ Teste com valores pequenos
2. ✅ Monitore os logs por alguns dias
3. ✅ Configure notificações
4. ✅ Documente o processo para sua equipe
5. ✅ Configure backup dos dados de pagamento

## 💡 Dicas

- **Mantenha o webhook secret seguro** - nunca commite no git!
- **Use variáveis de ambiente** diferentes para dev/staging/prod
- **Monitore os logs** regularmente nos primeiros dias
- **Teste com diferentes cenários**: fatura em aberto, sem fatura, valor diferente, etc.
- **Cadastre CPF/CNPJ corretos** dos clientes para garantir identificação automática
