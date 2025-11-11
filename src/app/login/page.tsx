'use client'

import { useUser } from '@/context/UserContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function LoginPage() {
  const { loginWithGoogle, loading, user } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard')
    }
  }, [loading, user, router])

  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-violet-700">
      <div className="bg-white/10 backdrop-blur-xl p-10 rounded-2xl shadow-2xl text-center max-w-md w-full">
        <h1 className="text-3xl font-semibold text-white mb-6">
          👋 Bem-vindo ao <span className="text-violet-300">MyGest</span>
        </h1>
        <p className="text-violet-100 mb-8">
          Gerencie seus clientes, tarefas e conteúdo — tudo em um só lugar.
        </p>

        <button
          onClick={loginWithGoogle}
          disabled={loading}
          className="w-full py-3 bg-white text-violet-700 font-semibold rounded-lg shadow-lg hover:bg-violet-50 transition"
        >
          {loading ? 'Carregando...' : 'Entrar com Google'}
        </button>
      </div>
    </div>
  )
}
