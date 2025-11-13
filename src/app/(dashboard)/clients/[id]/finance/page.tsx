import { FinanceManagerV2 } from '@/features/clients/components'
import { can, type AppRole } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { getSessionProfile } from '@/services/auth/session'
import { redirect } from 'next/navigation'

interface ClientFinancePageProps {
  params: Promise<{ id: string }>
}

export default async function ClientFinancePage({
  params
}: ClientFinancePageProps) {
  const { id } = await params

  const { role, orgId } = await getSessionProfile()
  if (!role || !orgId) {
    redirect('/login')
  }

  // Only OWNER should access client finance UI
  const authorized = can(role as unknown as AppRole, 'read', 'finance') && can(role as unknown as AppRole, 'update', 'finance')
  if (!authorized) {
    redirect(`/clients/${id}/info`)
  }

  // Ensure client belongs to same org
  const client = await prisma.client.findUnique({ where: { id } })
  if (!client || client.orgId !== orgId) {
    redirect('/dashboard')
  }

  return <FinanceManagerV2 clientId={id} />
}
