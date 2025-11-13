import { sendTestEmail } from '@/services/email/resend'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      to?: string
      subject?: string
      html?: string
    }
    const to = body?.to?.trim()
    if (!to)
      return NextResponse.json(
        { error: 'Campo "to" é obrigatório' },
        { status: 400 }
      )

    const result = await sendTestEmail(to, body.subject, body.html)
    return NextResponse.json({ ok: true, skipped: result.skipped })
  } catch (e) {
    console.error('Erro ao enviar e-mail de teste:', e)
    return NextResponse.json(
      { error: 'Falha ao enviar e-mail de teste' },
      { status: 500 }
    )
  }
}
