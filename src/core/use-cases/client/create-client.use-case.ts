import type { ClientAggregate } from '@/core/domain/client/entities/client.entity'
import type { ClientRepository } from '@/core/ports/repositories/client.repository'
import type { ClientBillingPort } from '@/core/ports/services/billing.service'
import type { CreateClientInput } from '@/shared/schemas/client.schema'
import { CLIENT_STATUS, type ClientStatus } from '@/types/enums'
import type { ClientPlan, SocialChannel } from '@prisma/client'

export class CreateClientUseCase {
  constructor(
    private readonly repository: ClientRepository,
    private readonly billingService: ClientBillingPort
  ) {}

  async execute(
    input: CreateClientInput & {
      orgId: string
    }
  ): Promise<ClientAggregate> {
    const client = await this.repository.create({
      orgId: input.orgId,
      name: input.name,
      email: input.email,
      phone: input.phone,
      status: (input.status as ClientStatus | undefined) ?? CLIENT_STATUS.NEW,
      plan: (input.plan as ClientPlan | undefined) ?? null,
      mainChannel: (input.mainChannel as SocialChannel | undefined) ?? null,
      contractStart: input.contractStart ? new Date(input.contractStart) : null,
      contractEnd: input.contractEnd ? new Date(input.contractEnd) : null,
      paymentDay: input.paymentDay ?? null,
      contractValue: input.contractValue ?? null,
      isInstallment: input.isInstallment ?? false,
      installmentCount: input.installmentCount ?? null,
      installmentValue: input.installmentValue ?? null,
      installmentPaymentDays: input.installmentPaymentDays ?? null,
    })

    await this.billingService.generateInstallments({
      clientId: client.id,
      isInstallment: input.isInstallment,
      installmentCount: input.installmentCount ?? null,
      contractValue: input.contractValue ?? null,
      contractStart: input.contractStart ? new Date(input.contractStart) : null,
      paymentDay: input.paymentDay ?? null,
      installmentValue: input.installmentValue ?? null,
      installmentPaymentDays: input.installmentPaymentDays ?? null,
    })

    return client
  }
}
