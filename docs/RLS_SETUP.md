# PostgreSQL RLS (Row Level Security) - Plano de Implementação

Este documento descreve como habilitar RLS e integrar com a aplicação via variáveis de sessão.

## Objetivo

Garantir que consultas a `Org`, `Client`, `Task`, `Media`, `Invoice`, `Payment` sejam automaticamente filtradas pelo `orgId` do usuário logado.

## Abordagem

1. Variável de sessão por requisição: `app.current_org`.
2. Políticas RLS que exigem `org_id = current_setting('app.current_org', true)`.
3. Execução das queries dentro de uma transação que chama `SELECT set_config('app.current_org', $orgId, true)` (já existe helper `withOrgScope`).

## Exemplo de Migração SQL (Prisma Migrate -> migration.sql)

> ATENÇÃO: Execute em ambiente de staging primeiro.

```sql
-- Habilitar RLS
ALTER TABLE "Org" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Client" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Task" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Media" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Invoice" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Payment" ENABLE ROW LEVEL SECURITY;

-- Políticas por organização
CREATE POLICY org_isolation_select ON "Client"
  FOR SELECT USING ("orgId" = current_setting('app.current_org', true));
CREATE POLICY org_isolation_modify ON "Client"
  FOR UPDATE USING ("orgId" = current_setting('app.current_org', true));
CREATE POLICY org_isolation_insert ON "Client"
  FOR INSERT WITH CHECK ("orgId" = current_setting('app.current_org', true));

-- Repetir padrões conforme as tabelas acima (Task, Media, Invoice, Payment, etc.).
```

## Uso na Aplicação

```ts
import { withOrgScope } from '@/lib/db/scope'

await withOrgScope(orgId, async (tx) => {
  const clients = await tx.client.findMany({ where: { status: 'active' } })
  // As políticas RLS garantem isolamento por org
})
```

## Observações Importantes

- Com pool de conexões, o escopo deve ser aplicado dentro de uma transação (como no helper) para garantir consistência.
- Caso use PgBouncer em modo `transaction`, mantenha todas as queries sensíveis dentro do `withOrgScope`.
- Teste extensivamente antes de ligar RLS em produção.
