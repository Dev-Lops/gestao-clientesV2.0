/**
 * Endpoint proxy para Twilio WhatsApp
 * Converte formato simples {to, body} para formato Twilio
 *
 * Configure no .env:
 *   WHATSAPP_API_URL=http://localhost:3000/api/whatsapp/twilio-proxy
 *   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxx
 *   TWILIO_AUTH_TOKEN=your_auth_token
 *   TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
 */

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { to, body } = await req.json()

    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const fromNumber =
      process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'

    if (!accountSid || !authToken) {
      return NextResponse.json(
        { ok: false, error: 'Twilio credentials not configured' },
        { status: 500 }
      )
    }

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`

    // Formatar número com prefixo whatsapp:
    const toFormatted = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`

    const formData = new URLSearchParams()
    formData.append('From', fromNumber)
    formData.append('To', toFormatted)
    formData.append('Body', body)

    const basicAuth = Buffer.from(`${accountSid}:${authToken}`).toString(
      'base64'
    )

    const res = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('[TwilioProxy] Error:', data)
      return NextResponse.json(
        { ok: false, error: data.message || 'Twilio API error', details: data },
        { status: res.status }
      )
    }

    return NextResponse.json({
      ok: true,
      status: res.status,
      messageSid: data.sid,
      data,
    })
  } catch (e) {
    console.error('[TwilioProxy] Exception:', e)
    return NextResponse.json(
      { ok: false, error: (e as Error).message },
      { status: 500 }
    )
  }
}
