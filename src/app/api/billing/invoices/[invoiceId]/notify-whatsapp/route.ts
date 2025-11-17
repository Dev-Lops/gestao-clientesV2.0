import { can, type AppRole } from '@/lib/permissions'
import { getSessionProfile } from '@/services/auth/session'
import { BillingService } from '@/services/billing/BillingService'
import { WhatsAppService } from '@/services/notifications/WhatsAppService'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const { orgId, role } = await getSessionProfile()
    if (!orgId || !role)
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    if (!can(role as AppRole, 'read', 'finance'))
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

    const { invoiceId } = await params
    const invoiceMessage = await BillingService.composeInvoiceWhatsAppMessage(
      invoiceId,
      orgId
    )

    // Parse body (opcional permitir custom message)
    let overrideBody: string | undefined
    const contentType = req.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      const body = await req.json().catch(() => ({}))
      overrideBody = body.body
    } else if (contentType?.includes('multipart/form-data')) {
      const fd = await req.formData()
      overrideBody = fd.get('body') as string
    }

    // Recuperar telefone do cliente
    const phoneData = await fetch(
      `${process.env.APP_URL || ''}/api/clients/phone?invoiceId=${invoiceId}`,
      { cache: 'no-store' }
    ).catch(() => null)
    let phone: string | null = null
    if (phoneData?.ok) {
      const json = await phoneData.json().catch(() => null)
      phone = json?.phone || null
    }
    // fallback: buscar direto via prisma se tivermos acesso interno
    if (!phone) {
      // Lazy import para evitar circular
      const { prisma } = await import('@/lib/prisma')
      const inv = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: { client: true },
      })
      phone = inv?.client?.phone || null
    }
    if (!phone)
      return NextResponse.json(
        { error: 'Telefone do cliente não encontrado' },
        { status: 400 }
      )

    if (!WhatsAppService.isEnabled())
      return NextResponse.json(
        { error: 'WhatsApp não configurado' },
        { status: 400 }
      )

    const sendRes = await WhatsAppService.send({
      to: phone,
      body: overrideBody || invoiceMessage,
    })

    return NextResponse.json({
      success: sendRes.ok,
      details: sendRes,
      usedBody: overrideBody || invoiceMessage,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro ao enviar WhatsApp'
    const code = msg.includes('não encontrada') ? 404 : 400
    return NextResponse.json({ error: msg }, { status: code })
  }
}
