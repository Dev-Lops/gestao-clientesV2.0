import AppShell from '@/components/layout/AppShell'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Card } from '@/components/ui/card'
import { getSessionProfile } from '@/services/auth/session'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function ProfilePage() {
  const { user } = await getSessionProfile()
  if (!user) redirect('/login')

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-950 dark:via-blue-950/20 dark:to-slate-900 p-8">
          <div className="max-w-2xl mx-auto">
            <Card className="p-8">
              <h1 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">Meu Perfil</h1>
              <p className="text-slate-500 dark:text-slate-400 mb-6">Veja e edite suas informações pessoais.</p>
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-lg font-semibold">
                  {(user.name ?? user.email).slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="text-lg font-semibold text-slate-900 dark:text-white">{user.name ?? 'Sem nome'}</div>
                  <div className="text-sm text-slate-500">{user.email}</div>
                  <div className="mt-2">
                    <Link href="/settings" className="text-sm text-blue-600 hover:underline">Editar perfil</Link>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
