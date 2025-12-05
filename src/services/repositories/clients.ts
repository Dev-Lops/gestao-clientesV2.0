import { prisma } from '@/lib/prisma'
import { ClientStatus } from '@/types/enums'
import { AppClient } from '@/types/tables'
import type { ClientPlan, SocialChannel } from '@prisma/client'

export async function listClientsByOrg(orgId: string): Promise<AppClient[]> {
  const rows = await prisma.client.findMany({
    where: { orgId },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email ?? null,
    phone: r.phone ?? null,
    status: r.status as ClientStatus,
    plan: r.plan ?? null,
    main_channel: r.mainChannel ?? null,
    instagram_user_id: r.instagramUserId ?? null,
    instagram_username: r.instagramUsername ?? null,
    instagram_access_token: r.instagramAccessToken ?? null,
    instagram_token_expires_at:
      r.instagramTokenExpiresAt?.toISOString() ?? null,
    orgId: r.orgId,
    clientUserId: r.clientUserId ?? null,
    contract_value: r.contractValue ?? null,
    payment_day: r.paymentDay ?? null,
    contract_start: r.contractStart?.toISOString() ?? null,
    contract_end: r.contractEnd?.toISOString() ?? null,
    is_installment: r.isInstallment ?? false,
    installment_count: r.installmentCount ?? null,
    installment_value: r.installmentValue ?? null,
    installment_payment_days: r.installmentPaymentDays ?? [],
    created_at: r.createdAt.toISOString(),
    updated_at: r.updatedAt.toISOString(),
  }))
}

export async function getClientById(id?: string): Promise<AppClient | null> {
  if (!id || typeof id !== 'string' || id.trim().length === 0) {
    return null
  }
  const client = await prisma.client.findUnique({
    where: { id },
  })

  if (!client) return null

  return {
    id: client.id,
    name: client.name,
    email: client.email ?? null,
    phone: client.phone ?? null,
    status: client.status as ClientStatus,
    plan: client.plan ?? null,
    main_channel: client.mainChannel ?? null,
    instagram_user_id: client.instagramUserId ?? null,
    instagram_username: client.instagramUsername ?? null,
    instagram_access_token: client.instagramAccessToken ?? null,
    instagram_token_expires_at:
      client.instagramTokenExpiresAt?.toISOString() ?? null,
    orgId: client.orgId,
    clientUserId: client.clientUserId ?? null,
    contract_value: client.contractValue ?? null,
    payment_day: client.paymentDay ?? null,
    contract_start: client.contractStart?.toISOString() ?? null,
    contract_end: client.contractEnd?.toISOString() ?? null,
    is_installment: client.isInstallment ?? false,
    installment_count: client.installmentCount ?? null,
    installment_value: client.installmentValue ?? null,
    installment_payment_days: client.installmentPaymentDays ?? [],
    created_at: client.createdAt.toISOString(),
    updated_at: client.updatedAt.toISOString(),
  }
}

export interface CreateClientInput {
  name: string
  email?: string
  phone?: string
  status?: ClientStatus
  plan?: ClientPlan
  mainChannel?: SocialChannel
  orgId: string
  contractStart?: Date
  contractEnd?: Date
  paymentDay?: number
  contractValue?: number
  isInstallment?: boolean
  installmentCount?: number
  installmentValue?: number
  installmentPaymentDays?: number[]
}

export async function createClient(
  data: CreateClientInput
): Promise<AppClient> {
  const client = await prisma.client.create({
    data: {
      name: data.name,
      email: data.email ?? '',
      phone: data.phone,
      status: data.status || 'new',
      plan: data.plan,
      mainChannel: data.mainChannel,
      orgId: data.orgId,
      contractStart: data.contractStart,
      contractEnd: data.contractEnd,
      paymentDay: data.paymentDay,
      contractValue: data.contractValue,
      isInstallment: data.isInstallment || false,
      installmentCount: data.installmentCount,
      installmentValue: data.installmentValue,
      installmentPaymentDays: data.installmentPaymentDays || [],
    },
  })

  return {
    id: client.id,
    name: client.name,
    email: client.email ?? null,
    phone: client.phone ?? null,
    status: client.status as ClientStatus,
    plan: client.plan ?? null,
    main_channel: client.mainChannel ?? null,
    instagram_user_id: client.instagramUserId ?? null,
    instagram_username: client.instagramUsername ?? null,
    instagram_access_token: client.instagramAccessToken ?? null,
    instagram_token_expires_at:
      client.instagramTokenExpiresAt?.toISOString() ?? null,
    orgId: client.orgId,
    clientUserId: client.clientUserId ?? null,
    contract_value: client.contractValue ?? null,
    payment_day: client.paymentDay ?? null,
    contract_start: client.contractStart?.toISOString() ?? null,
    contract_end: client.contractEnd?.toISOString() ?? null,
    is_installment: client.isInstallment ?? false,
    installment_count: client.installmentCount ?? null,
    installment_value: client.installmentValue ?? null,
    installment_payment_days: client.installmentPaymentDays ?? [],
    created_at: client.createdAt.toISOString(),
    updated_at: client.updatedAt.toISOString(),
  }
}
