/**
 * PaymentStatus Value Object
 * Define os status possíveis de um pagamento
 */

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSED = 'PROCESSED',
  VERIFIED = 'VERIFIED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export const PaymentStatusLabels: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]: 'Pendente',
  [PaymentStatus.PROCESSED]: 'Processado',
  [PaymentStatus.VERIFIED]: 'Verificado',
  [PaymentStatus.FAILED]: 'Falha',
  [PaymentStatus.REFUNDED]: 'Reembolsado',
}
