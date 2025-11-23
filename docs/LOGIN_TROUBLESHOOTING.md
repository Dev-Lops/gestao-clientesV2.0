# Guia de Troubleshooting - Login com Google

## 🚨 Problemas Comuns e Soluções

### 1. CSP Violations (Erros de Content Security Policy)

#### Sintomas

```
Refused to create a worker from 'blob:...' because it violates CSP
Refused to connect to 'https://o4510386586320896.ingest.us.sentry.io/...'
```

#### Solução

O arquivo `public/_headers` precisa incluir TODOS os domínios necessários:

**Domínios essenciais para Google OAuth:**

- `https://accounts.google.com` - Popup/redirect de login
- `https://www.gstatic.com` - Scripts do Google
- `https://fonts.gstatic.com` - Fontes do Google
- `https://identitytoolkit.googleapis.com` - API Firebase Auth
- `https://securetoken.googleapis.com` - Tokens Firebase
- `https://*.firebaseapp.com` - iframes Firebase

**Domínios para Sentry:**

- `https://*.ingest.us.sentry.io` - Envio de erros

**Diretivas CSP necessárias:**

```
script-src: 'self' 'unsafe-eval' 'unsafe-inline' https://accounts.google.com https://www.gstatic.com
worker-src: 'self' blob:
connect-src: 'self' https://*.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://*.ingest.us.sentry.io
style-src: 'self' 'unsafe-inline' https://fonts.googleapis.com https://www.gstatic.com
font-src: 'self' data: https://fonts.gstatic.com
frame-src: 'self' https://accounts.google.com https://*.firebaseapp.com
form-action: 'self' https://accounts.google.com
```

### 2. Variáveis de Ambiente Ausentes no Netlify

#### Sintomas

```
⚠️ Missing Firebase env vars: NEXT_PUBLIC_FIREBASE_API_KEY, ...
Firebase initialization skipped due to missing critical env vars
```

#### Solução

Verificar no **Netlify Dashboard > Site Settings > Environment Variables**:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu-projeto-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

**IMPORTANTE:** Após adicionar variáveis, fazer **Redeploy** do site.

### 3. Login não funciona em Mobile

#### Sintomas

- Popup não abre em iPhone/Android
- Login funciona no desktop mas não no celular

#### Solução

O código já está preparado para detectar mobile e usar `signInWithRedirect` automaticamente.

Verificar:

1. CSP permite `frame-ancestors 'self'`
2. Domínio está autorizado no Firebase Console:
   - Firebase Console > Authentication > Settings
   - Authorized domains: adicionar `mygest.netlify.app`

### 4. Loop de Redirecionamento

#### Sintomas

- Após login, volta para `/login` infinitamente
- Console mostra "Pending Redirect" permanentemente

#### Solução

Limpar storage e tentar novamente:

```javascript
// No console do navegador:
localStorage.removeItem('pendingAuthRedirect')
sessionStorage.removeItem('pendingInviteToken')
location.reload()
```

Ou usar o botão **Reset** no componente de debug (adicionar `?debug=true` na URL).

### 5. Cookie de Sessão não Persiste

#### Sintomas

- Login funciona mas ao recarregar pede login novamente
- Cookie `auth` não aparece no DevTools

#### Solução

**No código (já implementado):**

```typescript
// UserContext.tsx - linha ~77
fetch('/api/session', {
  method: 'POST',
  credentials: 'include', // CRUCIAL!
  body: JSON.stringify({ idToken }),
})
```

**No Netlify:**
Verificar que o domínio é HTTPS (cookies SameSite=Lax requerem HTTPS).

## 🔍 Ferramentas de Diagnóstico

### AuthDebug Component

Adicionar `?debug=true` na URL para ver painel de debug:

```
https://mygest.netlify.app/login?debug=true
```

Informações mostradas:

- ✓/✗ Pending Redirect
- ✓/✗ Invite Token
- ✓/✗ Firebase Config
- 🚨 CSP Violations em tempo real
- Dimensões da tela (mobile detection)
- User Agent

### Console Logs

Com `NEXT_PUBLIC_DEBUG_AUTH=true` no `.env`, logs detalhados aparecem:

```typescript
// Logs esperados durante login bem-sucedido:
[LoginPage] Iniciando login...
[UserContext] login { inviteToken: null }
[UserContext] Usando popup (desktop)
[UserContext] setUser { uid: 'abc123...' }
[UserContext] sessão OK
[UserContext] redirect { nextPath: '/dashboard' }
```

## 📋 Checklist de Deploy

Antes de fazer deploy, verificar:

- [ ] `public/_headers` tem CSP completo
- [ ] Variáveis de ambiente configuradas no Netlify
- [ ] Domínio autorizado no Firebase Console
- [ ] Build passa sem erros (`pnpm build`)
- [ ] Testar login em:
  - [ ] Desktop (Chrome, Firefox, Safari)
  - [ ] Mobile (iOS Safari, Android Chrome)
  - [ ] Modo anônimo/privado

## 🆘 Como Reportar Problemas

Se o login continuar falhando, coletar:

1. **Screenshot do erro no console**
2. **URL completa** (com query params)
3. **Device/Browser** (ex: iPhone 14, Safari 16)
4. **Painel de debug** (adicionar `?debug=true`)
5. **Network tab** - verificar requests para `/api/session`

## 🔧 Comandos Úteis

```bash
# Testar localmente
pnpm dev

# Build de produção
pnpm build

# Verificar variáveis de ambiente
echo $NEXT_PUBLIC_FIREBASE_API_KEY

# Logs do Netlify
netlify logs:function api --site=mygest

# Forçar redeploy
netlify deploy --prod
```

## 📚 Documentação Relacionada

- [Firebase Auth Docs](https://firebase.google.com/docs/auth/web/google-signin)
- [CSP MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Netlify Headers](https://docs.netlify.com/routing/headers/)
- [Mobile Login Fix](./MOBILE_LOGIN_FIX.md)

## ✅ Status Atual

**Última atualização:** 2025-11-23

**Correções implementadas:**

- ✅ CSP completo com todos domínios Google/Firebase
- ✅ Worker blobs permitidos
- ✅ Sentry connect-src incluído
- ✅ Mobile redirect flow funcionando
- ✅ AuthDebug component com CSP violations
- ✅ Logging detalhado para troubleshooting

**Testado e funcionando em:**

- ✅ Chrome Desktop
- ✅ Firefox Desktop
- ✅ Safari macOS
- ⏳ Safari iOS (pendente teste)
- ⏳ Chrome Android (pendente teste)
