import type { Handler } from '@netlify/functions'

export const handler: Handler = async () => {
  const baseUrl = process.env.SITE_URL || process.env.URL || ''
  const now = new Date()
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const endpoint = `${baseUrl}/api/finance/summary?month=${month}`
  const res = await fetch(endpoint)
  const text = await res.text()
  return {
    statusCode: res.status,
    body: text,
  }
}
