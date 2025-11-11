'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useUser } from '@/context/UserContext'
import { auth } from '@/lib/firebase'
import { signOut } from 'firebase/auth'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const { user } = useUser()
  const router = useRouter()

  const handleLogout = async () => {
    if (!auth) {
      // If Firebase auth isn't initialized, just navigate to login.
      router.push('/login')
      return
    }
    await signOut(auth)
    router.push('/login')
  }

  return (
    <ProtectedRoute>
      <main className="p-8">
        <h1 className="text-2xl font-bold">Bem-vindo(a), {user?.displayName}</h1>
        <p className="mt-2 text-gray-600">Email: {user?.email}</p>
        <button
          onClick={handleLogout}
          className="mt-6 px-4 py-2 bg-red-600 text-white rounded-lg"
        >
          Sair
        </button>
      </main>
    </ProtectedRoute>
  )
}
