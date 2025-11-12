import AppShell from '@/components/layout/AppShell'
import { PageLayout } from '@/components/layout/PageLayout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { FinanceManagerGlobal } from '@/features/finance/components/FinanceManagerGlobal'
import { getSessionProfile } from '@/services/auth/session'
import { redirect } from 'next/navigation'

export default async function FinancePage() {
  const { user, orgId } = await getSessionProfile()
  if (!user) redirect('/login')
  if (!orgId) redirect('/')

  return (
    <ProtectedRoute>
      <AppShell>
        <PageLayout>
          <FinanceManagerGlobal orgId={orgId} />
        </PageLayout>
      </AppShell>
    </ProtectedRoute>
  )
}
