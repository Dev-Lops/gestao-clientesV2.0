'use client'
import { useUser } from '@/context/UserContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function LoginPage() {
  const { user, loginWithGoogle, loading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  if (loading) return <div>Carregando...</div>

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      <h1 className="text-3xl font-bold mb-6">Gestão de Clientes</h1>
      <button
        onClick={loginWithGoogle}
        className="bg-white text-black px-6 py-3 rounded-lg font-semibold shadow-lg hover:bg-gray-100"
      >
        Entrar com Google
      </button>
    </div>
  )
}
