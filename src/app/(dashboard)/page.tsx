'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useUser } from '@/context/UserContext'
import { firebaseApp } from '@/lib/firebase'
import { getAuth, signOut } from 'firebase/auth'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const { user } = useUser()
  const router = useRouter()

  const handleLogout = async () => {
    await signOut(getAuth(firebaseApp))
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
