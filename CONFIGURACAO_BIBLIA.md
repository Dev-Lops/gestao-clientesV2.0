# Versículo da Bíblia — Configuração Simplificada

## Visão Geral

O widget de versículos na sidebar agora usa diretamente o endpoint público da API “A Bíblia Digital”, sem necessidade de token.

## API Utilizada

**A Bíblia Digital** - API gratuita de versículos bíblicos em português

- Site: <https://www.abibliadigital.com.br/>
- Documentação: <https://www.abibliadigital.com.br/api>
- Versão: NVI (Nova Versão Internacional)
- Autenticação: Não é necessária para uso básico (limite de 20 requisições/hora)

## Como Funciona no Projeto

- Endpoint interno: `GET /api/verses/random`
- Esse endpoint chama o público: `GET https://www.abibliadigital.com.br/api/verses/nvi/random`
- O componente adapta a resposta para o formato esperado e exibe o texto, livro, capítulo e versículo.
- Navegação Próximo/Anterior: desativada (sem ID sequencial). O botão “atualizar” carrega um novo verso aleatório.

Não é necessário configurar variáveis de ambiente.

## Como Funciona

### Versículo Aleatório

O widget busca um versículo aleatório a cada clique no botão de atualizar. Para o endpoint público, o limite típico é ~20 requisições por hora.

## Endpoints da API

O sistema utiliza os seguintes endpoints:

### GET /api/verses/random

Retorna um versículo aleatório (proxy para o endpoint público em NVI)

## Componentes

### BibleVerseWidget

**Localização**: `src/features/verses/BibleVerseWidget.tsx`

**Modos**:

- `compact`: Versão compacta para sidebar (padrão na sidebar)
- Normal: Versão completa para cards no dashboard

**Uso**:

```tsx
// Modo compacto (sidebar)
<BibleVerseWidget compact />

// Modo normal (card no dashboard)
<BibleVerseWidget />
```

## Resolução de Problemas

### Limite de Requisições (429 Too Many Requests)

- O endpoint público limita a ~20 requisições por hora.
- Se atingir o limite, aguarde alguns minutos e tente novamente.
- Opcionalmente, você pode criar uma chave na API e adaptar o endpoint para autenticação (não é necessário por padrão neste projeto).

### Erros de Rede

- Verifique sua conexão com a internet.
- Veja o console do navegador para detalhes do erro ao carregar o verso.

## Alternativas de API

Se preferir usar outra API bíblica, basta:

1. Ajustar `BIBLE_API_BASE` para o endpoint da nova API
2. Adaptar os endpoints em `src/app/api/verses/` se necessário
3. Atualizar o formato de resposta no componente

## Observações

- O endpoint público pode variar ao longo do tempo; se houver mudanças na API, adapte `src/app/api/verses/random/route.ts`.
- Caso queira reativar navegação Próximo/Anterior, será necessário um provedor que exponha IDs sequenciais de versículos ou uma base própria.
