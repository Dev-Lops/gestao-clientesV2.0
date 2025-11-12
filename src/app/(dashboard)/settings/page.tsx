import AppShell from '@/components/layout/AppShell'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Card } from '@/components/ui/card'
import { getSessionProfile } from '@/services/auth/session'
import { redirect } from 'next/navigation'
import { OrgForm } from './OrgForm'
import { ProfileForm } from './ProfileForm'

export default async function SettingsPage() {
  const { user, role } = await getSessionProfile()
  if (!user) redirect('/login')


  return (
    <ProtectedRoute>
      <AppShell>
        <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-950 dark:via-blue-950/20 dark:to-slate-900 p-8">
          <div className="max-w-2xl mx-auto">
            <Card className="p-8">
              <h1 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">Configurações</h1>
              <p className="text-slate-500 dark:text-slate-400 mb-6">Edite suas informações de perfil e preferências da conta.</p>
              <ProfileForm initialName={user.name} initialImage={null} />
              {role === 'OWNER' && (
                <div className="max-w-3xl mx-auto mt-8">
                  <Card className="p-8">
                    <h2 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">Dados da Organização</h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-6">Atualize CNPJ, endereço e informações de contato da sua empresa.</p>
                    <OrgForm />
                  </Card>
                </div>
              )}
            </Card>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
