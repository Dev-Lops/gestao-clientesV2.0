# 🚨 Troubleshooting: Netlify Build Errors

## ❌ Erro 1: "Failed retrieving extensions for site"

### Sintoma

```
Failed retrieving extensions for site 607b1bc1-0405-4b03-9612-c49889bad40b:
fetch failed. Double-check your login status with 'netlify status'
Failed during stage 'Reading and parsing configuration files'
```

### Causa

O Netlify está tentando buscar extensões/plugins de um site antigo que pode não existir mais ou ter problemas de permissão. O plugin `@netlify/plugin-nextjs` estava causando este erro.

### ✅ Solução

**1. Plugin removido do `netlify.toml`**

- ✅ Já foi removido o plugin problemático
- Next.js 16 funciona nativamente no Netlify sem plugins

**2. Criar novo site no Netlify (se necessário):**

- Delete o site antigo no Dashboard
- Crie um novo site conectando ao repositório GitHub
- Selecione branch `master`
- O Netlify detectará automaticamente o `netlify.toml`

**3. Re-autenticar CLI (se usando deploy via CLI):**

```bash
netlify logout
netlify login
netlify link
```

---

## ❌ Erro 2: "Secrets scanning found secrets in build"

### Sintoma

```
"AIza***" detected as a likely secret:
  found value at line 3 in .netlify/.next/server/chunks/ssr/[root-of-the-server]__38b797f2._.js
  ...

Secrets scanning detected secrets in files during build.
Build failed due to a user error: Build script returned non-zero exit code: 2
```

### Causa

O Netlify detectou a `NEXT_PUBLIC_FIREBASE_API_KEY` no código bundled. Essa variável é **pública por natureza** (prefixo `NEXT_PUBLIC_`) e precisa estar no bundle do cliente para autenticação Firebase.

### ✅ Solução

**Desabilitar Smart Detection** no `netlify.toml`:

```toml
[build.environment]
  NODE_VERSION = "20"
  PNPM_VERSION = "9"
  SECRETS_SCAN_SMART_DETECTION_ENABLED = "false"
```

✅ **Já aplicado** - A variável foi adicionada ao netlify.toml.

### 🔒 Por que é seguro?

1. **Firebase API Keys são públicas** - Documentação oficial: [Firebase API Key Security](https://firebase.google.com/docs/projects/api-keys)
2. **Proteção via Firebase Rules** - Segurança está nas regras do Firestore/Storage, não na API Key
3. **Domain Restrictions** - Configure restrições de domínio no Firebase Console
4. **Next.js requer no cliente** - Variáveis `NEXT_PUBLIC_*` precisam estar no bundle

### 🛡️ Alternativas (se preferir)

**Opção 1: Omitir valores específicos**

```toml
[build.environment]
  SECRETS_SCAN_SMART_DETECTION_OMIT_VALUES = "AIza***"
```

**Opção 2: Desabilitar scanning completo** (não recomendado)

```toml
[build.environment]
  SECRETS_SCAN_ENABLED = "false"
```

---

## ❌ Erro 3: "No projects matched the filters"

```
Error: No projects matched the filters in "/opt/build/repo"
```

## Causa

O Netlify está usando configurações antigas do **Dashboard UI** em vez do arquivo `netlify.toml`.

**Evidência nos logs:**

```
Line 193: command: pnpm --filter gestao-clientes... run build
Line 194: commandOrigin: ui  ← O comando vem da UI, não do netlify.toml!
```

## ✅ Solução Rápida

### Opção 1: Limpar Configurações do Dashboard (RECOMENDADO)

1. **Acesse o Netlify Dashboard**
   - Vá para: https://app.netlify.com
   - Selecione seu site

2. **Limpar Build Settings**
   - Navegue: **Site settings** → **Build & deploy** → **Build settings**
   - **Build command**: DELETE o valor (deixe vazio)
   - **Publish directory**: DELETE o valor (deixe vazio)
   - Click **Save**

3. **Limpar Cache e Redeploy**
   - Vá em: **Deploys** → **Trigger deploy**
   - Selecione: **Clear cache and deploy site**

### Opção 2: Sobrescrever no Dashboard

Se preferir manter configurações no dashboard:

1. **Site settings** → **Build & deploy** → **Build settings**
2. **Build command**: `pnpm run build`
3. **Publish directory**: `.next`
4. Click **Save**
5. **Trigger deploy**

## 🔍 Por que isso acontece?

O Netlify tem uma **ordem de precedência**:

1. **Configurações do Dashboard (UI)** ← Tem prioridade
2. `netlify.toml` no repositório
3. Valores padrão

Quando você configura algo no dashboard, o `netlify.toml` é ignorado!

## ✅ Verificar se funcionou

Após o próximo deploy, verifique os logs:

```
✅ Correto:
$ pnpm run build
commandOrigin: config  ← Vem do netlify.toml

❌ Errado:
$ pnpm --filter gestao-clientes... run build
commandOrigin: ui  ← Ainda vem do dashboard
```

## 🎯 Configuração Correta

Nosso `netlify.toml` já está configurado corretamente:

```toml
[build]
  command = "pnpm install --frozen-lockfile && pnpm run prisma:generate && pnpm run build"
  publish = ".next"
  base = "."

[build.environment]
  NODE_VERSION = "20"
  PNPM_VERSION = "9"
```

## 📋 Checklist de Deploy

- [ ] Limpar configurações do dashboard do Netlify
- [ ] Verificar que `netlify.toml` existe no repositório
- [ ] Trigger deploy com cache limpo
- [ ] Verificar logs: `commandOrigin: config`
- [ ] Build deve executar: `pnpm run build`
- [ ] Diretório `.next` deve ser criado
- [ ] Deploy bem-sucedido

## 🆘 Se ainda não funcionar

### 1. Verificar Branch

Certifique-se que está fazendo deploy da branch correta:

```bash
# Ver branch atual
git branch

# Deve ser 'master' ou a branch de produção
# Se não for:
git checkout master
git pull origin master
```

### 2. Verificar netlify.toml no repositório

```bash
# Verificar se o arquivo existe
cat netlify.toml

# Verificar se foi commitado
git log --oneline netlify.toml

# Se necessário, commitar novamente
git add netlify.toml
git commit -m "fix: atualizar netlify.toml"
git push origin master
```

### 3. Logs Detalhados

No Netlify Dashboard:

1. Vá em **Deploys**
2. Click no deploy falhado
3. Expanda todos os logs
4. Procure por:
   - `commandOrigin:` - deve ser `config`
   - Erros de instalação do pnpm
   - Erros de build do Next.js

### 4. Testar Build Localmente

```bash
# Simular ambiente Netlify
rm -rf .next node_modules

# Instalar
pnpm install --frozen-lockfile

# Gerar Prisma
pnpm run prisma:generate

# Build
pnpm run build

# Verificar .next
ls -la .next
```

## 📞 Suporte

Se nada funcionar:

1. **Netlify Support**
   - Dashboard → Support → Open a ticket
   - Mencione que o `netlify.toml` está sendo ignorado

2. **GitHub Issues**
   - Abra uma issue no repositório

3. **Documentação**
   - [Netlify Configuration](https://docs.netlify.com/configure-builds/file-based-configuration/)
   - [Build Command Priority](https://docs.netlify.com/configure-builds/overview/#build-settings)

## 🎉 Sucesso!

Quando funcionar, você verá nos logs:

```
✓ $ pnpm run build
✓ (build.command completed in XXXs)
✓ Next.js cache restored
✓ Building Next.js application...
✓ Build completed successfully
✓ Published directory .next
```

---

**Última atualização**: 23 de Novembro de 2025
