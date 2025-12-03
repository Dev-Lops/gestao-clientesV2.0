import {
  computeInvoiceSubtotal,
  computeInvoiceTotal,
  sumInstallments,
} from '@/lib/finance'
import { describe, expect, it } from 'vitest'

describe('finance helpers', () => {
  it('computes subtotal and total with discount and tax', () => {
    const items = [
      { quantity: 2, unitAmount: 100 },
      { quantity: 1, unitAmount: 50 },
    ]
    expect(computeInvoiceSubtotal(items)).toBe(250)
    expect(computeInvoiceTotal({ items, discount: 25, tax: 10 })).toBe(235)
  })

  it('sums installments robustly', () => {
    expect(sumInstallments([100, 100.5, 99.5])).toBe(300)
  })
})
