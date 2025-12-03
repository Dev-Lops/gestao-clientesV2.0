# Netlify Next.js 16 Middleware Workaround

## Problema

O plugin oficial do Netlify para Next.js (`@netlify/plugin-nextjs` v5.15.1) espera encontrar o arquivo `.next/server/middleware.js.nft.json` durante o deploy. No entanto, o Next.js 16 mudou sua arquitetura de middleware e não gera mais esse arquivo - agora usa edge chunks em `.next/server/edge/chunks/`.

### Erro Original

```
Error: ENOENT: no such file or directory, open '/opt/build/repo/.next/server/middleware.js.nft.json'
```

## Solução Implementada

Criamos uma solução em duas etapas para contornar a limitação do plugin Netlify:

### 1. Pre-Build Script (`scripts/prebuild-middleware-nft.mjs`)

Executa **antes** do `next build` e cria um placeholder vazio do arquivo `.next/server/middleware.js.nft.json`. Isso evita erros ENOENT durante a compilação do Next.js.

### 2. Post-Build Script (`scripts/netlify-middleware-workaround.mjs`)

Executa **após** o `next build` e:

1. Lê o `middleware-manifest.json` gerado pelo Next.js 16
2. Extrai as referências aos edge chunks
3. **Substitui** o placeholder com um arquivo NFT válido contendo os paths corretos
4. Valida que todos os arquivos referenciados existem

### Arquivos Modificados

- **package.json**:
  - Adicionado `@netlify/plugin-nextjs` como devDependency
  - Scripts `prebuild` e `postbuild` adicionados ao fluxo de build
  - Build agora: `prebuild → next build → copy:headers → postbuild`
- **scripts/prebuild-middleware-nft.mjs**: Cria placeholder antes do build
- **scripts/netlify-middleware-workaround.mjs**: Gera arquivo NFT final após build
- **netlify.toml**: Plugin já configurado

### Como Funciona

1. **Pre-Build**: Cria `.next/server/middleware.js.nft.json` vazio para evitar ENOENT
2. **Next Build**: Compila normalmente com Turbopack, gerando edge chunks
3. **Post-Build**: Substitui o placeholder com conteúdo real extraído do manifest

O arquivo NFT (Node File Trace) gerado contém:

- Paths para os 7 edge chunks do middleware
- Referências aos manifests (middleware-manifest.json, middleware-build-manifest.js)
- Todos os paths são relativos ao diretório `.next/server/`

Exemplo do conteúdo gerado:

```json
{
  "version": 1,
  "files": [
    "edge/chunks/[root-of-the-server]__3f182778._.js",
    "edge/chunks/_3153473d._.js",
    "edge/chunks/node_modules__pnpm_fbe6446b._.js",
    "edge/chunks/turbopack-edge-wrapper_514f1edf.js",
    "edge/chunks/[root-of-the-server]__7efdf049._.js",
    "edge/chunks/[root-of-the-server]__47647462._.js",
    "edge/chunks/turbopack-edge-wrapper_12fc01df.js",
    "middleware-manifest.json",
    "middleware-build-manifest.js"
  ]
}
```

## Verificação Local

Para testar localmente:

```bash
# Build completo
pnpm run build

# Verificar que o arquivo foi criado
ls -la .next/server/middleware.js.nft.json

# Verificar conteúdo
cat .next/server/middleware.js.nft.json
```

O script valida automaticamente que todos os arquivos referenciados existem e falha se algum estiver faltando.

## Status do Plugin Netlify

- **Versão atual**: v5.15.1
- **Issue relacionada**: [#3211 - incorrect output path of middleware nft for Next.js 16](https://github.com/opennextjs/opennextjs-netlify/issues/3211)
- **Fix parcial**: v5.14.4 tentou corrigir, mas o plugin ainda procura o arquivo no local antigo

## Quando Remover Este Workaround

Este workaround pode ser removido quando:

1. O plugin do Netlify for atualizado para suportar nativamente a nova estrutura do Next.js 16
2. Ou quando você migrar para outro provedor de hospedagem (Vercel tem suporte nativo)

Para remover:

1. Deletar `scripts/netlify-middleware-workaround.mjs`
2. Remover `&& npm run netlify:workaround` do script `build` em package.json
3. Remover a chave `netlify:workaround` dos scripts

## Referências

- [Next.js 16 Release Notes](https://nextjs.org/blog/next-16)
- [Netlify Next.js Runtime Repository](https://github.com/opennextjs/opennextjs-netlify)
- [Node File Trace (vercel/nft)](https://github.com/vercel/nft)
