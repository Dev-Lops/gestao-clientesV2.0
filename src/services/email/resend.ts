import { Resend } from 'resend'
import { renderInviteEmailHtml } from './templates/inviteHtml'

const apiKey = process.env.RESEND_API_KEY

// Sanitiza o remetente: bloqueia domínios gratuitos não verificáveis e força fallback seguro
function getSafeFromEmail(): string {
  const envFrom = process.env.EMAIL_FROM?.trim()
  if (!envFrom) return 'Convites <onboarding@resend.dev>'

  // Lista de domínios gratuitos que não podem ser verificados na Resend
  const freeDomains = [
    'gmail.com',
    'outlook.com',
    'hotmail.com',
    'yahoo.com',
    'live.com',
    'icloud.com',
  ]
  const fromLower = envFrom.toLowerCase()

  for (const domain of freeDomains) {
    if (fromLower.includes(`@${domain}`)) {
      console.warn(
        `[Resend] EMAIL_FROM usa domínio gratuito (${domain}); usando onboarding@resend.dev`
      )
      return 'Convites <onboarding@resend.dev>'
    }
  }

  return envFrom
}

const fromEmail = getSafeFromEmail()
const appBaseUrl =
  process.env.APP_BASE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
  'http://localhost:3000'

let client: Resend | null = null
if (apiKey) {
  client = new Resend(apiKey)
}

export type InviteEmailParams = {
  to: string
  token: string
  orgName: string
  roleRequested: 'STAFF' | 'CLIENT'
  clientName?: string | null
}

export async function sendInviteEmail(params: InviteEmailParams) {
  if (!client) {
    console.warn('[Resend] RESEND_API_KEY not set; skipping email send')
    return { skipped: true }
  }

  const { to, token, orgName, roleRequested, clientName } = params
  const link = `${appBaseUrl}/invite/${encodeURIComponent(token)}`

  const subject =
    roleRequested === 'STAFF'
      ? `[Convite] Equipe - ${orgName}`
      : `[Convite] Cliente${clientName ? `: ${clientName}` : ''} - ${orgName}`

  const html = renderInviteEmailHtml({
    orgName,
    roleRequested,
    clientName: clientName || null,
    inviteLink: link,
  })

  const text =
    roleRequested === 'STAFF'
      ? `Você foi convidado(a) para a equipe da organização ${orgName}.\n\nPara aceitar o convite, acesse: ${link}`
      : `Você foi convidado(a) como cliente${clientName ? ` (${clientName})` : ''} na organização ${orgName}.\n\nPara aceitar o convite, acesse: ${link}`

  const result = await client.emails.send({
    from: fromEmail,
    to,
    subject,
    html,
    text,
  })
  return result
}

// Using string renderer with internal HTML escaper

export async function sendTestEmail(
  to: string,
  subject = 'Teste de envio - Gestão de Clientes',
  html?: string
): Promise<{ skipped: boolean; result?: unknown }> {
  if (!client) {
    console.warn('[Resend] RESEND_API_KEY not set; skipping test email')
    return { skipped: true }
  }

  const safeHtml =
    html ||
    `<html><body style="font-family: Inter, system-ui, -apple-system, Segoe UI, Arial;">
      <div style="max-width:640px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px">
        <h1 style="margin:0 0 8px 0;font-size:18px;color:#0f172a">Teste de Email</h1>
        <p style="margin:0;color:#334155">Se você recebeu esta mensagem, o envio via Resend está funcionando.</p>
      </div>
    </body></html>`

  const result = await client.emails.send({
    from: fromEmail,
    to,
    subject,
    html: safeHtml,
  })
  return { skipped: false, result }
}
