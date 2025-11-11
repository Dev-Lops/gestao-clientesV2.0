'use client'

import { useUser } from '@/context/UserContext'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUser()
  const router = useRouter()
  const pathname = usePathname()
  const [checkingOrg, setCheckingOrg] = useState(true)

  useEffect(() => {
    if (loading) return

    if (!user) {
      setCheckingOrg(false)
      router.replace('/login')
      return
    }

    if (!db) {
      setCheckingOrg(false)
      return
    }

    let active = true

    const verifyOrganization = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        const hasOrg = userDoc.exists() && Boolean(userDoc.data()?.orgId)

        if (!hasOrg && !pathname.startsWith('/onboarding')) {
          router.replace('/onboarding')
          return
        }
      } catch (error) {
        console.error('Erro ao verificar organização do usuário:', error)
      } finally {
        if (active) {
          setCheckingOrg(false)
        }
      }
    }

    void verifyOrganization()

    return () => {
      active = false
    }
  }, [loading, user, router, pathname])

  if (loading || checkingOrg) {
    return <div className="p-8 text-gray-500">Carregando...</div>
  }

  if (!user) return null

  return <>{children}</>
}
