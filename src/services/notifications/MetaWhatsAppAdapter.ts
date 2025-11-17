/**
 * Adaptador para Meta WhatsApp Cloud API
 * Converte nosso formato simples {to, body} para o formato oficial da Meta
 */

export class MetaWhatsAppAdapter {
  static async send(
    to: string,
    body: string,
    token: string,
    phoneNumberId: string
  ) {
    const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`

    // Limpar número: remover espaços, traços, parênteses
    const cleanPhone = to.replace(/\D/g, '')

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: cleanPhone,
      type: 'text',
      text: {
        preview_url: false,
        body,
      },
    }

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        console.error('[MetaWhatsAppAdapter] Error:', data)
        return {
          ok: false,
          status: res.status,
          error: data?.error?.message || 'Unknown error',
          data,
        }
      }

      return {
        ok: true,
        status: res.status,
        messageId: data?.messages?.[0]?.id,
        data,
      }
    } catch (e) {
      console.error('[MetaWhatsAppAdapter] Exception:', e)
      return {
        ok: false,
        error: (e as Error).message,
      }
    }
  }
}
