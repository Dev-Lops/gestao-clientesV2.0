# Solução de Problemas: Instagram OAuth

## Erro: "Invalid platform app"

Este erro ocorre quando o Instagram não reconhece seu App ID. Siga o checklist abaixo:

### ✅ Checklist de Configuração

#### 1. Verificar App ID

```bash
# Verifique se o INSTAGRAM_APP_ID está correto no .env
# O App ID deve ser um número, exemplo: 123456789012345
```

**Como encontrar o App ID correto:**

1. Acesse: https://developers.facebook.com/apps/
2. Selecione seu app
3. **Configurações** → **Básico**
4. Copie o **"ID do Aplicativo"** (App ID)

#### 2. Verificar se Instagram Basic Display está ativado

1. No painel do seu app no Facebook Developers
2. Vá em **Adicionar Produtos** (no menu lateral)
3. Procure por **"Instagram Basic Display"**
4. Se não estiver instalado, clique em **"Configurar"**

#### 3. Configurar Instagram Basic Display

Após adicionar o produto:

1. Vá em **Instagram Basic Display** → **Configurações Básicas**
2. Preencha os campos obrigatórios:

   - **Valid OAuth Redirect URIs**:
     - `http://localhost:3000/api/instagram/callback` (dev)
     - `https://seu-dominio.com/api/instagram/callback` (prod)
   - **Deauthorize Callback URL**:
     - `https://seu-dominio.com/api/instagram/deauthorize`
   - **Data Deletion Request URL**:
     - `https://seu-dominio.com/api/instagram/delete`

3. **IMPORTANTE**: Clique em **"Salvar Alterações"** no final da página

4. Copie o **Instagram App ID** e **Instagram App Secret**

#### 4. Configurar Variáveis de Ambiente

No arquivo `.env`:

```env
# IMPORTANTE: Use o Instagram App ID, NÃO o Facebook App ID
INSTAGRAM_APP_ID=seu_instagram_app_id_aqui
INSTAGRAM_APP_SECRET=seu_instagram_app_secret_aqui
INSTAGRAM_REDIRECT_URI=http://localhost:3000/api/instagram/callback
```

**ATENÇÃO:**

- Certifique-se de usar o **Instagram App ID** da seção "Instagram Basic Display"
- NÃO use o Facebook App ID (são diferentes!)

#### 5. Reiniciar o Servidor

Após alterar o `.env`:

```bash
# Pare o servidor (Ctrl+C)
# Inicie novamente
pnpm dev
```

### 🔍 Como Verificar

1. **Teste o endpoint de conexão:**

```bash
curl "http://localhost:3000/api/instagram/connect?clientId=test123"
```

Resposta esperada:

```json
{
  "authUrl": "https://api.instagram.com/oauth/authorize?client_id=SEU_APP_ID&redirect_uri=..."
}
```

2. **Copie a `authUrl` e cole no navegador**
   - Se aparecer a tela de login do Instagram = ✅ configuração correta
   - Se aparecer "Invalid platform app" = ❌ App ID incorreto ou produto não instalado

### 🐛 Erros Comuns

#### "Instagram não configurado. Configure INSTAGRAM_APP_ID e INSTAGRAM_REDIRECT_URI"

**Causa:** Variáveis de ambiente não carregadas

**Solução:**

1. Verifique se o arquivo `.env` existe na raiz do projeto
2. Verifique se as variáveis estão corretas (sem aspas extras)
3. Reinicie o servidor

#### "Invalid platform app"

**Causa 1:** App ID incorreto

- Solução: Copie novamente da seção Instagram Basic Display

**Causa 2:** Instagram Basic Display não instalado

- Solução: Adicione o produto no Facebook Developers

**Causa 3:** Usando Facebook App ID ao invés do Instagram App ID

- Solução: Use o App ID específico do Instagram Basic Display

#### "Redirect URI mismatch"

**Causa:** URI de callback não cadastrada

**Solução:**

1. Vá em Instagram Basic Display → Configurações Básicas
2. Adicione em "Valid OAuth Redirect URIs": `http://localhost:3000/api/instagram/callback`
3. Certifique-se de que `INSTAGRAM_REDIRECT_URI` no `.env` seja exatamente igual
4. Salve as alterações

#### "The client_id provided is invalid"

**Causa:** App ID vazio, com espaços, ou formato inválido

**Solução:**

```env
# ❌ Errado (com aspas)
INSTAGRAM_APP_ID="123456789"

# ✅ Correto (sem aspas)
INSTAGRAM_APP_ID=123456789012345
```

### 📋 Exemplo Completo de Configuração

1. **Facebook Developers:**

```
App ID (Facebook): 987654321 (NÃO use este)
Instagram Basic Display:
  - Instagram App ID: 123456789012345 (USE ESTE)
  - Instagram App Secret: abc123def456...
  - Valid OAuth Redirect URIs: http://localhost:3000/api/instagram/callback
```

2. **Arquivo .env:**

```env
INSTAGRAM_APP_ID=123456789012345
INSTAGRAM_APP_SECRET=abc123def456ghi789...
INSTAGRAM_REDIRECT_URI=http://localhost:3000/api/instagram/callback
```

3. **Testar:**
   - Acesse a página de um cliente
   - Clique em "Conectar Instagram"
   - Deve redirecionar para tela de login do Instagram

### 🔄 Modo de Desenvolvimento vs Produção

#### Desenvolvimento (localhost)

```env
INSTAGRAM_REDIRECT_URI=http://localhost:3000/api/instagram/callback
```

No Facebook Developers:

- Valid OAuth Redirect URIs: `http://localhost:3000/api/instagram/callback`

#### Produção

```env
INSTAGRAM_REDIRECT_URI=https://seu-dominio.com/api/instagram/callback
```

No Facebook Developers:

- Valid OAuth Redirect URIs: `https://seu-dominio.com/api/instagram/callback`

**IMPORTANTE:** Você pode adicionar múltiplas URIs (uma por linha)

### 📞 Ainda com Problemas?

1. Verifique o console do navegador (F12) para ver a URL completa gerada
2. Verifique os logs do servidor Next.js
3. Confirme que o app está em modo "Desenvolvimento" (não precisa revisão do Facebook)
4. Tente criar um novo app do zero e seguir o passo a passo

### 🔗 Links Úteis

- [Instagram Basic Display API Docs](https://developers.facebook.com/docs/instagram-basic-display-api)
- [Começar com Instagram Basic Display](https://developers.facebook.com/docs/instagram-basic-display-api/getting-started)
- [OAuth Flow](https://developers.facebook.com/docs/instagram-basic-display-api/overview#instagram-user-access-tokens)
- [Status do Facebook/Instagram](https://developers.facebook.com/status/)
