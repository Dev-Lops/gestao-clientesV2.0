# Configuração do Feed do Instagram

## Visão Geral

O sistema permite que cada cliente conecte sua própria conta do Instagram através de OAuth, exibindo a grade de posts diretamente na página de Informações do cliente, similar ao feed real do Instagram.

## Fluxo OAuth por Cliente (Recomendado)

### Arquitetura

Cada cliente possui:

- **instagramUserId**: ID numérico do Instagram
- **instagramUsername**: @username do Instagram
- **instagramAccessToken**: Token OAuth do cliente (armazenado com segurança)
- **instagramTokenExpiresAt**: Data de expiração do token

### Pré-requisitos

#### 1. Criar App no Facebook Developers

1. Acesse: https://developers.facebook.com/
2. Vá em "Meus Apps" → "Criar App"
3. Escolha o tipo: **"Consumidor"** ou **"Nenhum"**
4. Preencha os dados básicos do app

#### 2. Configurar Instagram Basic Display API

1. No painel do app, adicione o produto **"Instagram Basic Display"**
2. Vá em **Configurações Básicas** do Instagram Basic Display
3. Anote o **App ID** e **App Secret**
4. Em **Valid OAuth Redirect URIs**, adicione:
   - `http://localhost:3000/api/instagram/callback` (desenvolvimento)
   - `https://seu-dominio.com/api/instagram/callback` (produção)
5. Em **Deauthorize Callback URL**, adicione: `https://seu-dominio.com/api/instagram/deauthorize`
6. Em **Data Deletion Request URL**, adicione: `https://seu-dominio.com/api/instagram/delete`
7. Salve as alterações

#### 3. Configurar Variáveis de Ambiente

Adicione no arquivo `.env` (ou `.env.local`):

```env
# Instagram Basic Display API Credentials
INSTAGRAM_APP_ID=seu_app_id_aqui
INSTAGRAM_APP_SECRET=seu_app_secret_aqui
INSTAGRAM_REDIRECT_URI=http://localhost:3000/api/instagram/callback
```

**IMPORTANTE:** Em produção, altere `INSTAGRAM_REDIRECT_URI` para o domínio real.

### Como o Cliente Conecta o Instagram

1. **Administrador acessa a página do cliente** → aba "Info"
2. **Clica no botão "Conectar Instagram"** na seção Instagram
3. **É redirecionado para o Instagram** para autorizar o app
4. **Cliente faz login no Instagram** e autoriza as permissões:
   - `user_profile`: Acesso ao perfil básico
   - `user_media`: Acesso às mídias (posts, fotos, vídeos)
5. **É redirecionado de volta** para a página do cliente
6. **Sistema automaticamente:**
   - Troca o código por Access Token
   - Converte em Long-Lived Token (60 dias)
   - Busca o perfil do Instagram
   - Salva no banco: `instagramAccessToken`, `instagramUserId`, `instagramUsername`, `instagramTokenExpiresAt`
7. **Feed do Instagram aparece** automaticamente na página do cliente

### Adicionar Contas de Teste (Desenvolvimento)

Para testar em ambiente de desenvolvimento:

1. Vá em **Funções** → **Instagram Testers** no Facebook Developers
2. Clique em "Adicionar Instagram Testers"
3. Digite o **@username** da conta de teste
4. O dono da conta precisa aceitar:
   - Instagram → Configurações → Apps e Sites → Apps de teste
   - Aceitar o convite

**Em produção (app em modo Live):** Não é necessário adicionar testers.

## Fluxo Técnico do OAuth

### 1. Iniciar Autorização

**Endpoint:** `GET /api/instagram/connect?clientId={id}`

Retorna a URL de autorização do Instagram:

```json
{
  "authUrl": "https://api.instagram.com/oauth/authorize?client_id=...&redirect_uri=...&scope=user_profile,user_media&response_type=code&state={clientId}"
}
```

### 2. Callback OAuth

**Endpoint:** `GET /api/instagram/callback?code={code}&state={clientId}`

Fluxo automático:

1. Troca o `code` por short-lived token (1 hora)
2. Converte em long-lived token (60 dias)
3. Busca informações do perfil (`user_id`, `username`)
4. Salva no banco de dados
5. Redireciona para `/clients/{id}/info?instagram_success=true`

### 3. Buscar Feed

**Endpoint:** `GET /api/instagram/feed?clientId={id}&limit=12`

Usa o token armazenado do cliente para buscar posts do Instagram Graph API.

## API Endpoints

### GET /api/instagram/connect

Gera URL de autorização do Instagram OAuth.

**Parâmetros:**

- `clientId` (obrigatório): ID do cliente no sistema

**Resposta:**

```json
{
  "authUrl": "https://api.instagram.com/oauth/authorize?..."
}
```

### GET /api/instagram/callback

Callback do OAuth - processa autorização e salva token.

**Parâmetros (automáticos):**

- `code`: Código de autorização do Instagram
- `state`: ID do cliente (para identificar)

**Redirecionamento:**

- Sucesso: `/clients/{id}/info?instagram_success=true`
- Erro: `/clients/{id}/info?instagram_error={mensagem}`

### GET /api/instagram/feed

Busca posts do Instagram do cliente.

**Parâmetros:**

- `clientId` (obrigatório): ID do cliente
- `limit` (opcional): Número de posts (padrão: 12)

**Resposta:**

```json
{
  "items": [
    {
      "id": "17xxx",
      "media_url": "https://...",
      "permalink": "https://instagram.com/p/...",
      "thumbnail_url": "https://...",
      "media_type": "IMAGE"
    }
  ]
}
```

**Erros:**

- `401`: Token expirado ou Instagram não conectado
- `404`: Cliente não encontrado

## Componentes

### InstagramGrid

**Localização:** `src/features/social/InstagramGrid.tsx`

**Props:**

- `clientId` (obrigatório): ID do cliente no sistema
- `limit` (opcional): Número de posts (padrão: 12)

**Uso:**

```tsx
<InstagramGrid clientId={client.id} />
```

### Botão "Conectar Instagram"

**Localização:** `ClientInfoDisplay.tsx`

Aparece na seção Instagram do formulário de edição do cliente. Ao clicar:

1. Chama `/api/instagram/connect?clientId={id}`
2. Redireciona para URL de autorização do Instagram
3. Cliente autoriza no Instagram
4. Retorna via callback
5. Página recarrega com feed do Instagram exibido

## Renovação Automática de Token

Long-Lived Tokens duram aproximadamente **60 dias**. O sistema armazena `instagramTokenExpiresAt` para rastrear a expiração.

### Renovação Manual (se necessário)

Se um token expirar, o cliente precisa reconectar:

1. Acesse a página do cliente
2. Clique em "Conectar Instagram" novamente
3. Autorize novamente no Instagram

### Implementação Futura: Auto-renovação

Tokens podem ser renovados automaticamente antes de expirar usando:

```bash
curl -X GET "https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token={CURRENT_TOKEN}"
```

Resposta:

```json
{
  "access_token": "novo_token",
  "token_type": "bearer",
  "expires_in": 5184000
}
```

## Resolução de Problemas

### "Instagram não configurado. Configure INSTAGRAM_APP_ID e INSTAGRAM_REDIRECT_URI"

- Verifique se adicionou as variáveis no `.env`:
  - `INSTAGRAM_APP_ID`
  - `INSTAGRAM_APP_SECRET`
  - `INSTAGRAM_REDIRECT_URI`
- Reinicie o servidor: `pnpm dev`

### "Instagram não conectado para este cliente"

- O cliente ainda não conectou o Instagram
- Clique em "Conectar Instagram" na página do cliente
- Siga o fluxo OAuth

### "Token do Instagram expirado. Reconecte a conta"

- O token Long-Lived expirou (após ~60 dias)
- Clique em "Conectar Instagram" novamente
- O sistema obterá um novo token

### Erro ao autorizar no Instagram

Possíveis causas:

- **Redirect URI incorreto**: Verifique se a URL em `INSTAGRAM_REDIRECT_URI` está cadastrada no Facebook Developers
- **App não está em modo Live**: Para contas que não são testers, o app precisa estar aprovado e em modo "Live"
- **Permissões negadas**: Cliente precisa aceitar as permissões `user_profile` e `user_media`

### Feed não aparece após conectar

1. Verifique se `instagramUserId` foi salvo no banco:
   ```sql
   SELECT instagram_user_id, instagram_username, instagram_token_expires_at
   FROM "Client"
   WHERE id = 'client_id';
   ```
2. Verifique se o token está válido (não expirou)
3. Verifique logs do servidor para erros na API do Instagram

### Conta Privada

- O Instagram Basic Display funciona com contas públicas e privadas
- O cliente precisa autorizar o app através do OAuth
- Não é necessário ser seguidor ou ter permissões especiais

## Limites da API

- **Rate Limit:** 200 requisições por hora por user token
- **Dados:** Últimas 25 mídias por requisição (sistema usa limit=12)
- **Validade do Token:** ~60 dias (long-lived token)

## Segurança

### Boas Práticas

- **NUNCA** exponha `INSTAGRAM_APP_SECRET` ou tokens no client-side
- Tokens são armazenados no banco de dados com segurança
- API endpoints validam a existência do cliente antes de retornar dados
- Tokens expirados são detectados e usuário é notificado

### Dados Armazenados

Por cliente:

- `instagramUserId`: ID numérico do Instagram
- `instagramUsername`: @username (apenas referência)
- `instagramAccessToken`: Token OAuth (criptografado no banco)
- `instagramTokenExpiresAt`: Data de expiração

### Proteção de Dados

- Tokens de acesso são server-only (não expostos ao browser)
- Apenas administradores (OWNER/STAFF) podem conectar Instagram
- Feed é exibido apenas para usuários autenticados da organização

## Migração do Sistema Antigo

Se você usava configuração global (`INSTAGRAM_ACCESS_TOKEN`), migre para OAuth:

1. **Remova as variáveis antigas:**

   - ❌ `INSTAGRAM_ACCESS_TOKEN`
   - ❌ `NEXT_PUBLIC_INSTAGRAM_USER_ID`

2. **Adicione as novas variáveis:**

   - ✅ `INSTAGRAM_APP_ID`
   - ✅ `INSTAGRAM_APP_SECRET`
   - ✅ `INSTAGRAM_REDIRECT_URI`

3. **Para cada cliente:**
   - Acesse a página do cliente
   - Clique em "Conectar Instagram"
   - Autorize com a conta do cliente

## Estrutura do Banco de Dados

```prisma
model Client {
  // ... outros campos
  instagramUserId         String?   // ID numérico do Instagram
  instagramUsername       String?   // @username do Instagram
  instagramAccessToken    String?   // Token OAuth (Long-Lived)
  instagramTokenExpiresAt DateTime? // Data de expiração do token
}
```

## Melhorias Futuras

- ✅ OAuth por cliente (implementado)
- ⏳ Auto-renovação de token antes de expirar
- ⏳ Cache de posts (Redis/banco)
- ⏳ Suporte para Instagram Graph API (contas Business/Creator)
- ⏳ Analytics de engajamento
- ⏳ Webhook para detectar quando cliente revoga acesso
- ⏳ Dashboard de status de tokens (expirados, próximos a expirar)

## Checklist de Implementação

- [ ] Criar app no Facebook Developers
- [ ] Configurar Instagram Basic Display API
- [ ] Adicionar Redirect URIs
- [ ] Copiar App ID e App Secret
- [ ] Adicionar variáveis de ambiente (.env)
- [ ] Reiniciar servidor de desenvolvimento
- [ ] Testar com conta de teste
- [ ] Conectar Instagram de um cliente teste
- [ ] Verificar se feed aparece na página do cliente
- [ ] Documentar processo para equipe
- [ ] (Produção) Enviar app para revisão do Facebook
- [ ] (Produção) Atualizar INSTAGRAM_REDIRECT_URI para domínio real

## Suporte

Em caso de dúvidas:

1. **Documentação oficial:** https://developers.facebook.com/docs/instagram-basic-display-api
2. **Status da API:** https://developers.facebook.com/status/
3. **Logs do sistema:** Verifique o console do servidor Next.js
4. **Testes:** Use contas de teste antes de ambiente de produção

```

O Long-Lived Token expira após ~60 dias. Para renovar:

## Suporte

Em caso de dúvidas:

1. **Documentação oficial:** https://developers.facebook.com/docs/instagram-basic-display-api
2. **Status da API:** https://developers.facebook.com/status/
3. **Logs do sistema:** Verifique o console do servidor Next.js
4. **Testes:** Use contas de teste antes de ambiente de produção
```
