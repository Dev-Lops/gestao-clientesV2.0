'use client'
import { auth, provider } from '@/lib/firebase'
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signOut, 
  User 
} from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { createContext, ReactNode, useContext, useEffect, useState, useCallback } from 'react'

// Utility function to detect mobile devices
const isMobileDevice = () => {
  if (typeof window === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  ) || window.innerWidth < 768
}

interface UserContextType {
  user: User | null
  loading: boolean
  loginWithGoogle: (inviteToken?: string | null) => Promise<void>
  logout: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

// Helper para detectar se é mobile
function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  ) || window.innerWidth < 768
}

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Shared logic for handling authentication result (from popup or redirect)
  const handleAuthResult = useCallback(async (result: { user: User }, inviteToken?: string | null) => {
    // Atualiza o estado do usuário imediatamente
    console.log('[UserContext] setUser com:', result.user.uid)
    setUser(result.user)

    // Obtém token FRESCO (força refresh)
    const idToken = await firebaseUser.getIdToken(true)
    if (!idToken) throw new Error('Falha ao obter ID token do usuário')

    console.log('[UserContext] Token obtido, criando sessão...')

    // Seta cookie de sessão HttpOnly e faz onboarding via rota API
    // Se houver convite (link), não cria org automaticamente (evita criar org se ele aceitar)
    const response = await fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken, skipOrgCreation: !!inviteToken }),
    })

    if (!response.ok) {
      let errorText = ''
      let errorJson: { error?: string; details?: unknown } | undefined = undefined
      try {
        errorJson = await response.json()
        errorText = JSON.stringify(errorJson)
      } catch {
        errorText = await response.text()
      }
      console.error('[UserContext] Erro ao criar sessão:', errorText)

      // Se token inválido, faz logout para limpar estado e mostra detalhes no dev
      const isInvalid =
        (typeof errorText === 'string' && errorText.includes('Invalid token')) ||
        (errorJson && errorJson.error === 'Invalid token')
      if (isInvalid) {
        if (errorJson?.details) {
          console.warn('[UserContext] Detalhes do token (dev):', errorJson.details)
        }
        console.warn('[UserContext] Token inválido detectado, fazendo logout...')
        if (auth) {
          await signOut(auth)
          setUser(null)
        }
      }

      throw new Error('Falha ao criar sessão')
    }

    console.log('[UserContext] Sessão criada com sucesso')

    // Após login, verifica convites pendentes para o e-mail do usuário
    // Preferimos detectar pelo e-mail (mais resiliente do que depender do token no URL)
    let nextPath: string | null = null
    try {
      const inv = await fetch('/api/invites/for-me', { method: 'GET' })
      if (inv.ok) {
        const data = await inv.json()
        const invite = Array.isArray(data?.data) ? data.data[0] : undefined
        if (invite) {
          console.log('[UserContext] Convite pendente detectado. Aceitando automaticamente...')
          const r = await fetch('/api/invites/accept', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: invite.token }),
          })
          if (r.ok) {
            const j = await r.json()
            nextPath = j.nextPath || null
            console.log('[UserContext] Convite aceito, nextPath:', nextPath)
            await new Promise((resolve) => setTimeout(resolve, 1500))
          } else {
            console.error('[UserContext] Erro ao aceitar convite:', await r.text())
          }
        }
      } else {
        console.warn('[UserContext] Falha ao consultar convites do usuário', await inv.text())
      }
    } catch (e) {
      console.error('[UserContext] Erro ao verificar convites:', e)
    }

    // Se não houve convite aceito, verifica se o usuário já tem org
    if (!nextPath) {
      try {
        const s = await fetch('/api/session', { method: 'GET' })
        if (s.ok) {
          const j = await s.json()
          if (!j.orgId) {
            nextPath = '/onboarding'
          } else {
            nextPath = '/'
          }
        } else {
          // Caso não autenticado por algum motivo, navega para login
          nextPath = '/login'
        }
      } catch {
        nextPath = '/'
      }
    }

    console.log('[UserContext] User state antes de redirecionar:', !!firebaseUser)
    console.log('[UserContext] Redirecionando para:', nextPath)
    router.refresh()
    if (nextPath) router.push(nextPath)
  }, [router])

  useEffect(() => {
    if (!auth) {
      // If auth is not initialized (missing env or server-side), don't try to
      // subscribe. Mark loading as false so the UI can continue.
      // Avoid synchronous setState inside effect body (can trigger cascading renders)
      Promise.resolve().then(() => setLoading(false))
      return
    }

    // Check for redirect result when component mounts (for mobile login)
    const checkRedirectResult = async () => {
      if (!auth) return // Type guard for TypeScript
      
      try {
        const result = await getRedirectResult(auth)
        if (result) {
          console.log('[UserContext] Redirect result detected:', result.user.uid)
          // Retrieve invite token from sessionStorage if it was stored
          const inviteToken = sessionStorage.getItem('pendingInviteToken')
          if (inviteToken) {
            sessionStorage.removeItem('pendingInviteToken')
          }
          // Handle the redirect result the same way as popup result
          await handleAuthResult(result, inviteToken)
        }
      } catch (error) {
        console.error('[UserContext] Error handling redirect result:', error)
      }
    }

    checkRedirectResult()

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log('[UserContext] onAuthStateChanged disparado:', firebaseUser?.uid || 'null')
      setUser(firebaseUser)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [handleAuthResult])

  const loginWithGoogle = async (inviteToken?: string | null) => {
    if (!auth || !provider) throw new Error('Firebase auth not initialized')

    console.log('[UserContext] Iniciando login com Google, inviteToken:', inviteToken)
    
    // Store invite token in sessionStorage so it's available after redirect
    if (inviteToken) {
      sessionStorage.setItem('pendingInviteToken', inviteToken)
    }

    const useMobile = isMobileDevice()
    console.log('[UserContext] Usando método de login:', useMobile ? 'redirect' : 'popup')

    try {
      if (useMobile) {
        // On mobile devices, use redirect (popup doesn't work well)
        await signInWithRedirect(auth, provider)
        // The redirect will happen, and we'll handle the result in useEffect
        // No code after this line will execute
      } else {
        // On desktop, use popup (better UX)
        const result = await signInWithPopup(auth, provider)
        await handleAuthResult(result, inviteToken)
      }
    } catch (error) {
      console.error('[UserContext] Erro no login:', error)
      throw error
    }
  }

  const loginWithGoogle = async (inviteToken?: string | null) => {
    if (!auth || !provider) throw new Error('Firebase auth not initialized')

    console.log('[UserContext] Iniciando login com Google, inviteToken:', inviteToken)

    // Salva o token de convite no sessionStorage para recuperar após redirect
    if (inviteToken) {
      sessionStorage.setItem('pendingInviteToken', inviteToken)
    }

    const isMobile = isMobileDevice()
    console.log('[UserContext] Dispositivo mobile detectado:', isMobile)

    if (isMobile) {
      // Mobile: usa redirect (mais confiável em mobile)
      console.log('[UserContext] Usando signInWithRedirect para mobile')
      await signInWithRedirect(auth, provider)
      // O fluxo continua no useEffect após o redirect
    } else {
      // Desktop: usa popup (experiência melhor)
      console.log('[UserContext] Usando signInWithPopup para desktop')
      const result = await signInWithPopup(auth, provider)

      // Recupera token de convite se houver
      const savedToken = sessionStorage.getItem('pendingInviteToken')
      if (savedToken) {
        sessionStorage.removeItem('pendingInviteToken')
      }

      await processLoginResult(result.user, savedToken || inviteToken)
    }
  }

  const logout = async () => {
    if (!auth) throw new Error('Firebase auth not initialized')

    try {
      // Remove cookie do servidor PRIMEIRO
      await fetch('/api/logout', { method: 'POST' })

      // Faz logout do Firebase
      await signOut(auth)

      // Força refresh e redireciona
      router.refresh()
      router.push('/login')
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
      // Mesmo com erro, tenta redirecionar
      router.push('/login')
    }
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
