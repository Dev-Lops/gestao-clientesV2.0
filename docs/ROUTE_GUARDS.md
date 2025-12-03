# Route Guards sem Middleware (Netlify)

Este guia mostra como aplicar segurança e controle de acesso nas rotas quando o `middleware` está desativado no Netlify.

## Helpers disponíveis

- `applySecurityHeaders(req, res?)`: Aplica CSP, CORS e demais headers de segurança. Retorna um `NextResponse`.
- `guardAccess(req)`: Executa validações de autenticação e papel (role). Retorna `NextResponse` de redireciono quando bloqueado ou `null` quando permitido.

Importe de `src/proxy.ts`:

```ts
import { applySecurityHeaders, guardAccess } from '@/src/proxy'
```

## Uso em Route Handlers (API)

```ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { applySecurityHeaders, guardAccess } from '@/src/proxy'

export function GET(req: NextRequest) {
  const guard = guardAccess(req)
  if (guard) return guard

  const res = NextResponse.json({ ok: true })
  return applySecurityHeaders(req, res)
}
```

## Uso em Páginas Server Components (App Router)

Para páginas sensíveis (`/billing`, `/admin`, `/dashboard`), valide no server e faça redireciono via `redirect` do Next.

```ts
// app/(dashboard)/billing/page.tsx
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function BillingPage() {
  const token = cookies().get('auth')?.value
  const role = cookies().get('role')?.value

  if (!token) redirect('/login')
  if (role !== 'OWNER') redirect('/')

  // Render...
}
```

Se precisar dos headers de segurança em respostas stream/edge, use um handler intermediário (por exemplo via Route Handler para dados) e aplique `applySecurityHeaders`.

## Observações

- Em produção (`NODE_ENV=production`), os headers incluem CSP com `nonce`, CORS limitado ao `APP_URL`/`NEXT_PUBLIC_APP_URL` e políticas de segurança adicionais.
- `guardAccess` replica a lógica do `middleware` (login, callback, convites, roles CLIENT/OWNER).
- Em outras plataformas (Vercel, etc.), o `middleware` permanece ativo e utiliza a mesma lógica via `proxy(req)`.
