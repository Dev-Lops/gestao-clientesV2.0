# Auditoria de implementação vs. plano de refatoração

Este documento resume o que já foi implementado e o que ainda está pendente em relação ao plano descrito em `docs/12-auditoria-tecnica.md`. O objetivo é dar visibilidade rápida para priorização da refatoração completa.

## Síntese geral

- **Maturidade atual:** intermediária, com infraestrutura moderna (Next.js 16, React 19, Prisma, React Query) e path aliases já configurados para camadas sugeridas (core/use-cases/ports/infrastructure/presentation/shared).【F:tsconfig.json†L3-L44】
- **Lacunas principais:** ausência de padronização por domínio/camada, lógica de negócio embutida em handlers API, falta de componentes atômicos reutilizáveis e cobertura de testes praticamente inexistente.【F:docs/12-auditoria-tecnica.md†L25-L116】【F:package.json†L1-L86】

## Mapeamento por tema

| Tema / Fase | Status atual | Evidências | Próximos passos sugeridos |
| --- | --- | --- | --- |
| Estrutura de pastas (Fase 1) | **Parcial** – Paths e aliases configurados, porém diretórios duplicados (`core`, `domain`, `infra`, `infrastructure`, `features`, `modules`). | tsconfig com aliases para camadas propostas.【F:tsconfig.json†L15-L33】 | Consolidar árvore seguindo modelo do plano e remover pastas duplicadas/legadas. |
| Camada de domínio (Fase 2) | **Ausente/Parcial** – Não há entidades/value objects claros; regras ficam em handlers. | Auditoria técnica aponta regras no handler de clientes.【F:docs/12-auditoria-tecnica.md†L25-L116】 | Extrair entidades e regras para `core/domain` e criar eventos de domínio. |
| Casos de uso (Fase 3) | **Ausente** – Handlers executam lógica diretamente. | Observação sobre lógica de parcelas no POST de clientes.【F:docs/12-auditoria-tecnica.md†L34-L80】 | Criar use cases (`create-client`, `update-client`, etc.) e injetar via controllers. |
| Infra (Prisma/serviços) (Fase 4) | **Parcial** – Prisma configurado, mas modelagem com strings genéricas e sem soft-delete. | Recomendações de fortalecimento de enums e deleção lógica.【F:docs/12-auditoria-tecnica.md†L92-L146】 | Revisar `schema.prisma`, adicionar enums fortes, soft-delete e paginação nos repositórios. |
| Camada de apresentação (Fase 5) | **Parcial** – Tailwind com tokens, porém sem biblioteca atômica de componentes e estilos duplicados apontados. | Lacunas de componentes base e duplicidade de estilos.【F:docs/12-auditoria-tecnica.md†L64-L91】 | Criar atoms (Button/Input/Card/Badge) e reorganizar features por domínio. |
| Performance e paginação | **Ausente/Parcial** – Queries com `take` fixo e sem cursor; providers globais possivelmente pesados. | Falta de paginação e riscos de over-fetching.【F:docs/12-auditoria-tecnica.md†L15-L63】 | Implementar paginação cursor-based, selecionar campos mínimos e lazy load de providers opcionais. |
| Segurança/observabilidade | **Parcial** – Headers e guardas presentes em pontos específicos; Sentry desativado. | Sentry comentado e validações inconsistentes entre rotas.【F:docs/12-auditoria-tecnica.md†L116-L179】 | Unificar middleware de auth/role, habilitar Sentry e rate limiting em rotas sensíveis. |
| Testes (Fase 6) | **Ausente** – Ferramentas configuradas mas sem suites ativas. | Scripts de testes existentes sem arquivos de teste cobrindo APIs/regra de negócio.【F:package.json†L5-L86】 | Priorizar unitários de domínio, integração para APIs críticas e e2e básicos. |
| Documentação/guia (Fase 7) | **Parcial** – Há documentação técnica (auditoria, README/CONTRIBUTING), mas sem guias de arquitetura final. | Auditoria existente e guias gerais.【F:docs/12-auditoria-tecnica.md†L1-L189】 | Escrever guia de convenções por camada e checklists de PR/refatoração. |

## Roteiro recomendado (curto prazo)

1. **Convergir estrutura** removendo pastas duplicadas e movendo código para a árvore proposta (app/core/use-cases/ports/infrastructure/presentation/shared).
2. **Extrair lógica de negócio** dos handlers (ex.: geração de parcelas em `/api/clients`) para serviços e casos de uso puros, com schemas Zod compartilhados.
3. **Fortalecer Prisma** com enums e soft-delete, adicionando paginação cursor-based em listagens grandes.
4. **Criar biblioteca de componentes atômicos** (Button, Input, Badge, Card) usando `class-variance-authority` e `tailwind-merge` já disponíveis.
5. **Ativar Sentry e padronizar auth/role** com middleware reutilizável e respostas de erro consistentes.
6. **Iniciar suíte de testes** com foco em domínio e APIs críticas; configurar cobertura mínima em CI.
