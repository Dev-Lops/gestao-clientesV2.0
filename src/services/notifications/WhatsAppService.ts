export interface WhatsAppMessage {
  to: string
  body: string
}

export class WhatsAppService {
  static isEnabled() {
    return !!process.env.WHATSAPP_API_TOKEN
  }

  static async send(msg: WhatsAppMessage) {
    const token = process.env.WHATSAPP_API_TOKEN
    const url = process.env.WHATSAPP_API_URL
    const provider = (process.env.WHATSAPP_PROVIDER || '').toLowerCase()
    const phoneNumberIdEnv = process.env.WHATSAPP_PHONE_NUMBER_ID

    if (!token) {
      return { ok: false, error: 'WhatsApp token not configured' }
    }

    const normalizePhone = (phone: string) => {
      const digits = phone.replace(/\D/g, '')
      if (digits.length === 11 || digits.length === 10) return `+55${digits}`
      if (digits.startsWith('55')) return `+${digits}`
      return `+${digits}`
    }

    const to = normalizePhone(msg.to)

    // Meta provider (prefer explicit provider or fallback by URL detection)
    const isMeta =
      provider === 'meta' || (!provider && url?.includes('graph.facebook.com'))
    if (isMeta) {
      const phoneNumberId =
        phoneNumberIdEnv || url?.match(/\/(\d+)\/messages/)?.[1]
      if (!phoneNumberId) {
        return {
          ok: false,
          error:
            'Meta phone number id missing (set WHATSAPP_PHONE_NUMBER_ID or proper API URL)',
        }
      }
      const { MetaWhatsAppAdapter } = await import('./MetaWhatsAppAdapter')
      return MetaWhatsAppAdapter.send(to, msg.body, token, phoneNumberId)
    }

    // Generic / other gateways require URL
    if (!url) {
      return {
        ok: false,
        error: 'WhatsApp API URL not configured (WHATSAPP_API_URL)',
      }
    }

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...msg, to }),
        cache: 'no-store',
      })
      const data = await res.json().catch(() => null)
      return { ok: res.ok, status: res.status, data }
    } catch (e) {
      return { ok: false, error: (e as Error).message }
    }
  }
}
