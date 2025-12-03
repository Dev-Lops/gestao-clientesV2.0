export type InvoiceItemInput = { quantity: number; unitAmount: number }

export function computeInvoiceSubtotal(items: InvoiceItemInput[]): number {
  return items.reduce(
    (sum, it) => sum + (it.quantity || 0) * (it.unitAmount || 0),
    0
  )
}

export function computeInvoiceTotal(params: {
  items: InvoiceItemInput[]
  discount?: number
  tax?: number
}): number {
  const subtotal = computeInvoiceSubtotal(params.items)
  const discount = Math.max(0, params.discount || 0)
  const tax = Math.max(0, params.tax || 0)
  const total = subtotal - discount + tax
  return Number.isFinite(total) ? Math.max(0, Number(total.toFixed(2))) : 0
}

export function sumInstallments(amounts: number[]): number {
  const total = (amounts || []).reduce((s, v) => s + (v || 0), 0)
  return Number(Number(total.toFixed(2)))
}
