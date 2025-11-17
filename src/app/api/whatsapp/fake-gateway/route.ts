/**
 * Endpoint fake para testes locais sem gateway real
 * Simula envio de WhatsApp logando no console
 *
 * Configure no .env.local:
 *   WHATSAPP_API_URL=http://localhost:3000/api/whatsapp/fake-gateway
 *   WHATSAPP_API_TOKEN=fake_token_for_testing
 */

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { to, body } = await req.json()

    console.log('\n' + '='.repeat(80))
    console.log('📱 FAKE WHATSAPP GATEWAY - Mensagem Simulada')
    console.log('='.repeat(80))
    console.log(`📞 Para: ${to}`)
    console.log(`📅 Data: ${new Date().toLocaleString('pt-BR')}`)
    console.log(`📝 Tamanho: ${body.length} caracteres`)
    console.log('-'.repeat(80))
    console.log(body)
    console.log('='.repeat(80) + '\n')

    // Simular pequeno delay
    await new Promise((resolve) => setTimeout(resolve, 300))

    return NextResponse.json({
      ok: true,
      status: 200,
      messageId: `fake_msg_${Date.now()}`,
      message: 'Mensagem simulada com sucesso (fake gateway)',
    })
  } catch (e) {
    console.error('[FakeGateway] Error:', e)
    return NextResponse.json(
      { ok: false, error: (e as Error).message },
      { status: 500 }
    )
  }
}
