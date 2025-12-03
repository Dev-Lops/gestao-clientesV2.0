import { prisma } from '@/lib/prisma'

/**
 * Executa operações dentro de uma transação vinculada a um escopo de organização
 * usando variáveis de sessão Postgres. Útil para políticas RLS que referenciam
 * `current_setting('app.current_org', true)`.
 */
export async function withOrgScope<T>(
  orgId: string,
  fn: (tx: typeof prisma) => Promise<T>
) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(
      `SELECT set_config('app.current_org', $1, true)`,
      orgId
    )
    return fn(tx)
  })
}
