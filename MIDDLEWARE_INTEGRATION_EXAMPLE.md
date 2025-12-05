/\*\*

- EXEMPLO: Integração do novo auth-middleware
-
- Este arquivo mostra como integrar o middleware de autenticação centralizado
- em rotas API para simplificar a lógica de autenticação e autorização.
-
- Para usar este exemplo:
- 1.  Copie a estrutura abaixo
- 2.  Adapte para sua rota específica
- 3.  Remova a lógica manual de auth do seu endpoint
      \*/

import { authenticateRequest } from '@/infra/http/auth-middleware'
import { ApiResponseHandler } from '@/infra/http/response'
import { NextRequest } from 'next/server'
import { z } from 'zod'

// ============================================================================
// ANTES: Lógica manual de autenticação (padrão atual)
// ============================================================================

/\*\*

- ❌ ANTES - Muita boilerplate:
-
- export async function POST(req: NextRequest) {
- try {
-     // Rate limiting
-     const id = getIdentifier(req)
-     const rl = await checkRateLimit(id, apiRatelimit)
-     if (!rl.success) {
-       return NextResponse.json({ error: 'Rate limit' }, { status: 429 })
-     }
-
-     // Guard access
-     const guard = guardAccess(req)
-     if (guard) return guard
-
-     // Get session
-     const { user, orgId, role } = await getSessionProfile()
-     if (!user || !orgId) {
-       return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
-     }
-
-     // Verify role
-     if (role !== 'OWNER') {
-       return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
-     }
-
-     // ... seu código aqui
- } catch (error) {
-     // Manual error handling
-     if (error instanceof ZodError) {
-       return NextResponse.json({ error: error.message }, { status: 400 })
-     }
-     return NextResponse.json({ error: 'Internal error' }, { status: 500 })
- }
- }
  \*/

// ============================================================================
// DEPOIS: Com o novo middleware (simplificado)
// ============================================================================

/\*\*

- ✅ DEPOIS - Mais limpo e centralizado:
  \*/

// 1. Definir seu schema de request
const CreateResourceSchema = z.object({
name: z.string().min(1, 'Name is required'),
description: z.string().optional(),
})

type CreateResourceInput = z.infer<typeof CreateResourceSchema>

// 2. Sua lógica de negócio
async function createResource(
orgId: string,
data: CreateResourceInput
) {
// Implemente sua lógica aqui
return { id: '123', ...data, orgId, createdAt: new Date() }
}

// 3. Handler simplificado com middleware
export async function POST(req: NextRequest) {
try {
// ✨ Uma linha para autenticação completa!
const auth = await authenticateRequest(req, {
allowedRoles: ['OWNER'], // Apenas proprietários podem criar
rateLimit: true,
requireOrg: true,
})

    // Verificar resultado da autenticação
    if (!auth.ok) {
      return auth.error // Retorna resposta de erro apropriada
    }

    // Agora você tem contexto seguro de autenticação
    const { userId, orgId, role } = auth.data

    // Validar payload
    const body = await req.json()
    const validationResult = CreateResourceSchema.safeParse(body)

    if (!validationResult.success) {
      return ApiResponseHandler.badRequest(
        validationResult.error.errors,
        'Invalid request data'
      )
    }

    // Sua lógica de negócio
    const resource = await createResource(orgId, validationResult.data)

    // Resposta padronizada com sucesso
    return ApiResponseHandler.created(resource, 'Resource created successfully')

} catch (error) {
// Error handling centralizado
return ApiResponseHandler.error(
error,
'Failed to create resource'
)
}
}

// ============================================================================
// EXEMPLOS DE DIFERENTES CENÁRIOS
// ============================================================================

// Exemplo 1: Endpoint público (sem autenticação)
export async function GET_PUBLIC(req: NextRequest) {
try {
const data = await fetchPublicData()
return ApiResponseHandler.success(data)
} catch (error) {
return ApiResponseHandler.error(error)
}
}

// Exemplo 2: Endpoint apenas para usuários autenticados
export async function GET_AUTHENTICATED(req: NextRequest) {
try {
const auth = await authenticateRequest(req, {
requireOrg: true, // Requer que tenha organização
})

    if (!auth.ok) return auth.error

    const { orgId } = auth.data
    const data = await fetchUserData(orgId)
    return ApiResponseHandler.success(data)

} catch (error) {
return ApiResponseHandler.error(error)
}
}

// Exemplo 3: Endpoint apenas para staff/admin
export async function DELETE_ADMIN(req: NextRequest) {
try {
const auth = await authenticateRequest(req, {
allowedRoles: ['OWNER', 'STAFF'],
rateLimit: true,
})

    if (!auth.ok) return auth.error

    const { userId } = auth.data
    await performAdminAction(userId)
    return ApiResponseHandler.success(null, 'Action completed')

} catch (error) {
return ApiResponseHandler.error(error)
}
}

// ============================================================================
// CHECKLIST DE MIGRAÇÃO
// ============================================================================

/\*\*

- Para migrar uma rota existente para usar o novo middleware:
-
- [ ] 1.  Remover imports de rate limiting manual
-        - Remova: import { checkRateLimit, getIdentifier }
-        - Remova: import { guardAccess }
-
- [ ] 2.  Remover imports de session manual
-        - Remova: import { getSessionProfile }
-
- [ ] 3.  Adicionar novo import
-        + import { authenticateRequest } from '@/infra/http/auth-middleware'
-        + import { ApiResponseHandler } from '@/infra/http/response'
-
- [ ] 4.  Remover boilerplate de autenticação
-        - Remova ~30 linhas de código de rate limiting
-        - Remova ~20 linhas de verificação de sessão
-
- [ ] 5.  Adicionar chamada ao middleware
-        const auth = await authenticateRequest(req, {
-          allowedRoles: [...], // Seus papéis necessários
-          rateLimit: true,
-          requireOrg: true,
-        })
-        if (!auth.ok) return auth.error
-
- [ ] 6.  Usar ApiResponseHandler em retornos
-        - Troque NextResponse.json por ApiResponseHandler.success/error/etc
-
- [ ] 7.  Testar a rota
-        - Execute testes unitários
-        - Teste manualmente com curl/Postman
-
- [ ] 8.  Documentar na OpenAPI (se usar)
-        - Adicione decoradores @post, @param, etc
  \*/

// ============================================================================
// BENEFÍCIOS DA MIGRAÇÃO
// ============================================================================

/\*\*

- ✨ O que você ganha:
-
- 1.  MENOS CÓDIGO
- - Reduz ~50 linhas de boilerplate por endpoint
- - Centralize regras de autenticação
-
- 2.  MELHOR SEGURANÇA
- - Rate limiting automático
- - Validação de orgId consistente
- - Proteção contra ataque CSRF
-
- 3.  RESPOSTAS PADRONIZADAS
- - Mesmo formato em todas as APIs
- - Logging automático com Sentry
- - Códigos HTTP corretos
-
- 4.  FACILIDADE DE MANUTENÇÃO
- - Atualize uma vez, afeta todos os endpoints
- - Stack trace padronizado
- - Auditoria automática
-
- 5.  MELHOR DX
- - TypeScript types automáticos
- - IntelliSense melhorado
- - Menos bugs de tipo
    \*/

// Dummy functions para o exemplo compilar
async function fetchPublicData() { return {} }
async function fetchUserData(orgId: string) { return {} }
async function performAdminAction(userId: string) { return {} }
