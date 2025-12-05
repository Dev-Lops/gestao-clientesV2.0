/**
 * Invoice Status Value Object
 * Representa os possíveis status de uma fatura
 */

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  OPEN = 'OPEN',
  PAID = 'PAID',
  VOID = 'VOID',
  OVERDUE = 'OVERDUE',
}

export const InvoiceStatusLabels: Record<InvoiceStatus, string> = {
  [InvoiceStatus.DRAFT]: 'Rascunho',
  [InvoiceStatus.OPEN]: 'Aberto',
  [InvoiceStatus.PAID]: 'Pago',
  [InvoiceStatus.VOID]: 'Cancelado',
  [InvoiceStatus.OVERDUE]: 'Vencido',
}

export const InvoiceStatusColors: Record<InvoiceStatus, string> = {
  [InvoiceStatus.DRAFT]: 'gray',
  [InvoiceStatus.OPEN]: 'blue',
  [InvoiceStatus.PAID]: 'green',
  [InvoiceStatus.VOID]: 'red',
  [InvoiceStatus.OVERDUE]: 'orange',
}
