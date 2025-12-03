import type { Handler } from '@netlify/functions'

export const handler: Handler = async () => {
  const baseUrl = process.env.SITE_URL || process.env.URL || ''
  const endpoint = `${baseUrl}/api/finance/reconcile?notify=true`
  const res = await fetch(endpoint, { method: 'POST' })
  const text = await res.text()
  return {
    statusCode: res.status,
    body: text,
  }
}
