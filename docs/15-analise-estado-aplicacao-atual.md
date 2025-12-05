# 📊 Análise Atual da Aplicação

## 1) Visão geral
- Base em Next.js 16 com App Router e integração de segurança/observabilidade via headers e Sentry habilitado no `next.config.ts`.
- Refatoração iniciada: camada `core` com casos de uso/repos/ports convivendo com diretórios antigos (`domain/`, `infra/`, `infrastructure/`, `features/`).
- UI tem novos átomos em `presentation/components/atoms`, mas páginas principais ainda consomem serviços legados.

## 2) Arquitetura e organização
- Há paralelismo de camadas: os novos casos de uso/repos/ports estão em `src/core`, enquanto regras antigas continuam em `src/domain` (ex.: validators de clientes) e adapters duplicados em `src/infrastructure/prisma` versus `src/infrastructure/database`. Isso mantém responsabilidades espalhadas e dificulta a migração completa.
- O middleware HTTP compartilhado vive em `src/infra/http`, mas controladores novos estão em `src/infrastructure/http`, reforçando a fragmentação de nomes.

## 3) Domínio e casos de uso
- Clientes agora possuem entidade com regras de soft delete e status de domínio, além de shapes agregados consumidos por infraestrutura e controllers.【F:src/core/domain/client/entities/client.entity.ts†L1-L176】
- Casos de uso de criação/listagem movem lógica de paginação e consulta para `core`, mas metadados ainda são estáticos (page=1, total calculado localmente), indicando necessidade de cálculo real no repositório para paginação cursor-based completa.【F:src/core/use-cases/client/list-clients.use-case.ts†L1-L65】
- Schema Zod compartilhado em `src/shared/schemas/client.schema.ts` replica validators antigos de `src/domain/clients/validators.ts`; coexistência sugere plano de desativar a versão antiga e consolidar dependências.【F:src/shared/schemas/client.schema.ts†L1-L33】【F:src/domain/clients/validators.ts†L1-L34】

## 4) Infraestrutura e dados
- Repositório Prisma de clientes aplica soft delete (`deletedAt: null`) e paginação por cursor com `take + 1`, produzindo cursor de continuação e suporta modo "lite" para respostas menores.【F:src/infrastructure/database/repositories/prisma-client.repository.ts†L13-L95】
- Schema Prisma já inclui `deletedAt` em Client/Task, mas ainda mantém campos críticos como `status` como `String` genérico e valores monetários como `Float`, reduzindo segurança de dados e consistência de enums.【F:prisma/schema.prisma†L69-L145】
- Existem implementações duplicadas de repositórios Prisma antigos (ex.: `src/infrastructure/prisma/ClientPrismaRepository.ts`) que seguem contratos diferentes e permanecem acopladas a serviços legados, precisando ser removidas ou migradas.【F:src/infrastructure/prisma/ClientPrismaRepository.ts†L1-L26】

## 5) APIs, segurança e observabilidade
- Rotas de clientes agora delegam a controllers e aplicam autenticação centralizada, rate limiting e headers de segurança, registrando erros no Sentry para POST/GET.【F:src/app/api/clients/route.ts†L1-L58】
- Middleware `authenticateRequest` aplica rate limit (Upstash), valida sessão/role e exige `orgId` quando configurado, servindo como base para padronizar auth/role nas demais rotas.【F:src/infra/http/auth-middleware.ts†L1-L134】
- Sentry foi habilitado via `withSentryConfig` e políticas de segurança (HSTS, Permissions-Policy, Referrer-Policy) são aplicadas globalmente no Next config.【F:next.config.ts†L1-L86】

## 6) UI/UX e design system
- Biblioteca de átomos inicial (Button/Badge/Card/Input) usa `class-variance-authority` e `tailwind-merge` para variantes de estilo consistentes, estabelecendo base para Atomic Design.【F:src/presentation/components/atoms/Button.tsx†L1-L67】
- Página de clientes do dashboard continua usando serviços e componentes herdados (`listClientsByOrg`, `AppShell`, `GradientPageHeader`) em vez dos casos de uso/controladores novos, indicando necessidade de convergência para a árvore `presentation/core` planejada.【F:src/app/(dashboard)/clients/page.tsx†L1-L156】

## 7) Testes e qualidade
- Tooling de testes permanece configurado (Vitest, Playwright, type-check) nas scripts do `package.json`, mas a suíte existente cobre serviços antigos (`services/repositories/clients`) e não valida os novos casos de uso/ports, revelando lacuna de cobertura na nova arquitetura.【F:package.json†L5-L125】【F:tests/services/clients.test.ts†L1-L78】

## 8) Pontos prioritários identificados
1. Convergir diretórios (`core` → oficial, descomissionar `domain/infra/infrastructure` antigos) e alinhar controllers/middlewares a um único namespace.
2. Completar paginação cursor-based retornando `total/totalPages` reais no repositório e remover cálculos estáticos no use case.
3. Fortalecer Prisma com enums/tipos monetários nativos e remover repositórios legados, garantindo soft-delete consistente.
4. Conectar UI do dashboard aos casos de uso/controladores novos e expandir biblioteca de átomos para moléculas/organismos.
5. Atualizar suíte de testes para cobrir casos de uso, controllers e schemas Zod compartilhados, substituindo mocks de serviços antigos.
