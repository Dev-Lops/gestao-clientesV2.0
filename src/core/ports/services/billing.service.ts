export interface ClientBillingPort {
  generateInstallments(params: {
    clientId: string
    isInstallment?: boolean
    installmentCount?: number | null
    contractValue?: number | null
    contractStart?: Date | null
    paymentDay?: number | null
    installmentValue?: number | null
    installmentPaymentDays?: number[] | null
  }): Promise<void>
}
