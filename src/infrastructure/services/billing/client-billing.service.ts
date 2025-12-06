import type { ClientBillingPort } from '@/core/ports/services/billing.service'
import { ClientBillingService } from '@/services/billing/ClientBillingService'

export class ClientBillingServiceAdapter implements ClientBillingPort {
  async generateInstallments(params: Parameters<ClientBillingPort['generateInstallments']>[0]) {
    await ClientBillingService.generateInstallments({
      ...params,
      installmentCount:
        params.installmentCount === null ? undefined : params.installmentCount,
      contractValue: params.contractValue ?? undefined,
      contractStart: params.contractStart ?? undefined,
    })
  }
}
