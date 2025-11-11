'use client'
import { auth, provider } from '@/lib/firebase'
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth'
import { createContext, ReactNode, useContext, useEffect, useState } from 'react'

interface UserContextType {
  user: User | null
  loading: boolean
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!auth) {
      // If auth is not initialized (missing env or server-side), don't try to
      // subscribe. Mark loading as false so the UI can continue.
      // Avoid synchronous setState inside effect body (can trigger cascading renders)
      Promise.resolve().then(() => setLoading(false))
      return
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const loginWithGoogle = async () => {
    if (!auth || !provider) throw new Error('Firebase auth not initialized')
    await signInWithPopup(auth, provider)
  }

  const logout = async () => {
    if (!auth) throw new Error('Firebase auth not initialized')
    await signOut(auth)
  }

  return (
    <UserContext.Provider value={{ user, loading, loginWithGoogle, logout }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser deve ser usado dentro de UserProvider')
  return ctx
}
