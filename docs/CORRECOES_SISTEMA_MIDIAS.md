# 🔧 Correções do Sistema de Mídias

**Data:** 15 de Novembro de 2025  
**Branch:** release/v1.0.0

---

## 📋 Problemas Identificados e Corrigidos

### 1. ❌ Problema: Logos do Branding Ficavam Desorganizadas

**Descrição:** Quando o usuário enviava logos através do branding, as imagens iam para a raiz da pasta de mídias, causando desorganização.

**Solução Implementada:**

- ✅ Criação automática da pasta "Logos" ao primeiro upload de logo
- ✅ Todos os uploads do componente Uploader (branding) agora são marcados como `isLogo: true`
- ✅ Arquivos marcados como logo são automaticamente direcionados para a pasta "Logos"
- ✅ Tag "logo" adicionada automaticamente aos arquivos

**Código:**

```typescript
// Em upload/route.ts
if (isLogo) {
  let logoFolder = await prisma.mediaFolder.findFirst({
    where: {
      clientId,
      name: 'Logos',
      parentId: null,
    },
  })
  if (!logoFolder) {
    logoFolder = await prisma.mediaFolder.create({
      data: {
        name: 'Logos',
        description: 'Logos e identidade visual do cliente',
        clientId,
      },
    })
  }
  folderId = logoFolder.id
  if (!tags.includes('logo')) {
    tags.push('logo')
  }
}
```

**Resultado:**

- Pasta "Logos" criada automaticamente no primeiro upload
- Todas as logos organizadas em um único local
- Fácil localização e gerenciamento de identidade visual

---

### 2. ❌ Problema: Limite de Upload Muito Baixo (100MB)

**Descrição:** O limite de 100MB era insuficiente para arquivos de design profissional, vídeos e arquivos grandes.

**Solução Implementada:**

- ✅ Limite aumentado de 100MB para **1.5GB**
- ✅ Mensagem de erro atualizada para refletir o novo limite

**Mudança:**

```typescript
// Antes
const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB

// Depois
const MAX_FILE_SIZE = 1.5 * 1024 * 1024 * 1024 // 1.5GB
```

**Observações:**

- Compressão automática ainda funciona para imagens > 2MB
- Vídeos e documentos grandes são suportados
- Progresso de upload em tempo real para arquivos grandes

---

### 3. ❌ Problema: Pastas Duplicadas ao Criar

**Descrição:** Ao criar uma pasta, às vezes ela aparecia duplicada na interface ou permitia criar múltiplas pastas com o mesmo nome.

**Soluções Implementadas:**

#### A) Validação no Backend

- ✅ Verificação de pasta existente com mesmo nome no mesmo nível
- ✅ Retorno de erro 409 (Conflict) se pasta já existe

```typescript
// Verifica se já existe pasta com mesmo nome no mesmo nível
const existingFolder = await prisma.mediaFolder.findFirst({
  where: {
    clientId,
    name: name.trim(),
    parentId: parentId || null,
  },
})
if (existingFolder) {
  return NextResponse.json(
    { error: 'Pasta com esse nome já existe neste local' },
    { status: 409 }
  )
}
```

#### B) Revalidação no Frontend

- ✅ Após criar pasta, revalidar lista completa ao invés de adicionar manualmente
- ✅ Exibir mensagem de erro específica ao usuário

```typescript
// Antes (mutação otimista - podia duplicar)
await mutateFolders((prev) => [saved, ...(prev ?? [])], {
  revalidate: false,
})

// Depois (revalidação completa)
await mutateFolders() // Busca do servidor
```

#### C) Tratamento de Erros Melhorado

- ✅ Captura e exibe mensagem específica do erro
- ✅ Toast com mensagem clara para o usuário

**Resultado:**

- Impossível criar pastas duplicadas
- Feedback claro quando tentativa de duplicação
- Interface sempre sincronizada com banco de dados

---

## 🔍 Arquivos Modificados

### Backend

1. **src/app/api/clients/[id]/media/upload/route.ts**
   - Aumentado `MAX_FILE_SIZE` para 1.5GB
   - Adicionado parâmetro `isLogo` no FormData
   - Lógica de criação/busca automática da pasta "Logos"
   - Adição automática de tag "logo"

2. **src/app/api/clients/[id]/media/folders/route.ts**
   - Validação de pasta duplicada no POST
   - Verificação de nome + parentId únicos
   - Erro 409 com mensagem clara

### Frontend

3. **src/features/clients/components/Uploader.tsx**
   - Adicionado `fd.append("isLogo", "true")` no upload
   - Marca todos os uploads do branding como logo

4. **src/features/clients/components/MediaManager.tsx**
   - Mudança de mutação otimista para revalidação completa
   - Tratamento de erro melhorado com mensagem específica
   - Captura e exibição de erro do backend

---

## 🧪 Testes Recomendados

### Teste 1: Upload de Logo

1. ✅ Ir para página de Branding
2. ✅ Fazer upload de uma logo
3. ✅ Verificar se pasta "Logos" foi criada automaticamente
4. ✅ Confirmar que logo está dentro da pasta "Logos"
5. ✅ Verificar se tag "logo" foi adicionada

### Teste 2: Limite de Upload

1. ✅ Selecionar arquivo de 100MB - 500MB
2. ✅ Verificar upload com sucesso
3. ✅ Selecionar arquivo > 1.5GB
4. ✅ Verificar mensagem de erro apropriada

### Teste 3: Pasta Duplicada

1. ✅ Criar pasta "Teste"
2. ✅ Tentar criar outra pasta "Teste" no mesmo nível
3. ✅ Verificar mensagem de erro
4. ✅ Confirmar que apenas uma pasta existe

### Teste 4: Organização de Logos

1. ✅ Fazer upload de 3 logos diferentes pelo branding
2. ✅ Ir para Mídias
3. ✅ Verificar que todas estão na pasta "Logos"
4. ✅ Verificar que não há logos fora da pasta

---

## 📊 Impacto das Mudanças

### Positivos

- ✅ **Organização**: Logos sempre no lugar certo
- ✅ **Flexibilidade**: Suporte a arquivos grandes (vídeos 4K, designs pesados)
- ✅ **Confiabilidade**: Não mais pastas duplicadas
- ✅ **UX**: Feedback claro de erros
- ✅ **Automação**: Pasta Logos criada automaticamente

### Considerações

- ⚠️ Arquivos muito grandes (> 500MB) podem demorar para upload
- ⚠️ Certifique-se de que o servidor suporta uploads grandes
- ⚠️ Pode ser necessário configurar timeout do servidor

---

## ⚙️ Configurações do Servidor

Para suportar uploads de 1.5GB, certifique-se de:

### Next.js (next.config.ts)

```typescript
export default {
  api: {
    bodyParser: {
      sizeLimit: '1.5gb',
    },
  },
}
```

### Vercel (vercel.json)

```json
{
  "functions": {
    "api/**/*.ts": {
      "maxDuration": 300,
      "memory": 3008
    }
  }
}
```

### Nginx (se aplicável)

```nginx
client_max_body_size 1536M;
proxy_read_timeout 300s;
```

---

## 🔮 Melhorias Futuras (Opcional)

- [ ] **Upload em Chunks**: Para arquivos > 500MB, fazer upload em partes
- [ ] **Compressão de Vídeo**: Reduzir tamanho de vídeos pesados
- [ ] **Pasta Customizável**: Permitir usuário escolher pasta de logos
- [ ] **Validação de Formato**: Apenas PNG/SVG para logos
- [ ] **Versionamento**: Manter histórico de versões de logos

---

## ✅ Resumo

Todas as correções foram implementadas com sucesso:

1. ✅ **Logos organizadas** automaticamente em pasta "Logos"
2. ✅ **Limite aumentado** para 1.5GB
3. ✅ **Pastas duplicadas** não podem mais ser criadas

O sistema está mais robusto, organizado e pronto para uso profissional! 🎉

---

## 📞 Troubleshooting

### Problema: Upload trava em arquivos grandes

**Solução:** Verificar configurações de timeout do servidor

### Problema: Pasta Logos não aparece

**Solução:** Fazer primeiro upload de logo, ela será criada automaticamente

### Problema: Erro ao criar pasta com nome existente

**Solução:** Escolher nome diferente ou usar a pasta existente

---

**Desenvolvido em:** 15/11/2025  
**Versão:** 1.0.0
