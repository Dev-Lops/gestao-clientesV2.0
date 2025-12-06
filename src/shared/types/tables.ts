import { ClientStatus } from './client'

export interface AppClient {
  id: string
  name: string
  email: string | null
  phone: string | null
  status: ClientStatus
  plan: string | null
  main_channel: string | null
  instagram_user_id: string | null
  instagram_username: string | null
  instagram_access_token: string | null
  instagram_token_expires_at: string | null
  orgId: string
  clientUserId: string | null
  contract_value: number | null
  payment_day: number | null
  contract_start: string | null
  contract_end: string | null
  is_installment: boolean
  installment_count: number | null
  installment_value: number | null
  installment_payment_days: number[]
  created_at: string
  updated_at: string
}

export interface Installment {
  id: string
  number: number
  amount: number
  dueDate: string
  status: 'PENDING' | 'CONFIRMED' | 'LATE'
  paidAt: string | null
  notes: string | null
  clientId: string
  createdAt: string
  updatedAt: string
}
