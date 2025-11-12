import AppShell from '@/components/layout/AppShell'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Card } from '@/components/ui/card'
import { getSessionProfile } from '@/services/auth/session'
import { redirect } from 'next/navigation'
import MembersAdminPage from './members/page'

export default async function AdminPage() {
  const { user, orgId, role } = await getSessionProfile()

  if (!user || !orgId) {
    redirect('/login')
  }

  if (role !== 'OWNER') {
    return (
      <ProtectedRoute>
        <AppShell>
          <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-950 dark:via-blue-950/20 dark:to-slate-900 p-8">
            <Card className="p-8 text-center max-w-md mx-auto">
              <div className="space-y-4">
                <div className="text-5xl">🔒</div>
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
                  Acesso Restrito
                </h1>
                <p className="text-slate-500 dark:text-slate-400">
                  Apenas proprietários da organização podem acessar esta página.
                </p>
              </div>
            </Card>
          </div>
        </AppShell>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-950 dark:via-blue-950/20 dark:to-slate-900 p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Administração
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Gerencie membros e permissões da organização
              </p>
            </div>
            <MembersAdminPage />
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
