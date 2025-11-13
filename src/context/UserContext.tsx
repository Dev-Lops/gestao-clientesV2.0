'use client'
import { auth, provider } from '@/lib/firebase'
import { usePresence } from '@/lib/usePresence'
import {
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  User
} from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react'

// Utility function to detect mobile devices
const isMobileDevice = () => {
  if (typeof window === 'undefined') return false
  // Melhor detecção de mobile: verifica user agent E touch capability
  const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  const mobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  )
  return (mobileUserAgent || hasTouchScreen) && window.innerWidth < 1024
}

interface UserContextType {
  user: User | null
  loading: boolean
  loginWithGoogle: (inviteToken?: string | null) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  // Atualiza presença em tempo real no Firebase Realtime Database
  usePresence(user?.uid)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Shared logic for handling authentication result (from popup or redirect)
  const handleAuthResult = useCallback(async (firebaseUser: User, inviteToken?: string | null) => {
    // Atualiza o estado do usuário imediatamente
    console.log('[UserContext] setUser com:', firebaseUser.uid)
    setUser(firebaseUser)

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

      console.log('[UserContext] Verificando redirect result...')
      try {
        const result = await getRedirectResult(auth)
        if (result) {
          console.log('[UserContext] ✅ Redirect result detectado!')
          console.log('[UserContext] User UID:', result.user.uid)
          console.log('[UserContext] User email:', result.user.email)

          // Retrieve invite token from sessionStorage if it was stored
          const inviteToken = sessionStorage.getItem('pendingInviteToken')
          console.log('[UserContext] Invite token recuperado:', inviteToken)

          if (inviteToken) {
            sessionStorage.removeItem('pendingInviteToken')
          }

          // Handle the redirect result the same way as popup result
          console.log('[UserContext] Processando auth result...')
          await handleAuthResult(result.user, inviteToken)
        } else {
          console.log('[UserContext] Nenhum redirect result pendente')
        }
      } catch (error) {
        console.error('[UserContext] ❌ Erro ao processar redirect result:', error)
        console.error('[UserContext] Detalhes:', JSON.stringify(error, null, 2))
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
    if (!auth || !provider) {
      console.error('[UserContext] Firebase não inicializado')
      throw new Error('Firebase auth not initialized')
    }

    console.log('[UserContext] Iniciando login com Google')
    console.log('[UserContext] inviteToken:', inviteToken)
    console.log('[UserContext] window.location.href:', window.location.href)

    // Store invite token in sessionStorage so it's available after redirect
    if (inviteToken) {
      sessionStorage.setItem('pendingInviteToken', inviteToken)
    }

    const useMobile = isMobileDevice()
    console.log('[UserContext] Mobile detectado:', useMobile)
    console.log('[UserContext] User agent:', navigator.userAgent)
    console.log('[UserContext] Window width:', window.innerWidth)
    console.log('[UserContext] Método de login:', useMobile ? 'redirect' : 'popup')

    try {
      // Mobile: sempre usar redirect (popups não funcionam bem)
      if (useMobile) {
        console.log('[UserContext] Iniciando signInWithRedirect...')
        await signInWithRedirect(auth, provider)
        console.log('[UserContext] signInWithRedirect chamado - aguardando redirecionamento')
        // redirect flow continues in checkRedirectResult
        return
      }

      // Desktop: tentar popup primeiro, fallback para redirect
      try {
        console.log('[UserContext] Desktop: tentando popup')
        const result = await signInWithPopup(auth, provider)
        await handleAuthResult(result.user, inviteToken)
      } catch (e: unknown) {
        // Fallback para redirect se popup falhar (bloqueado pelo navegador)
        const code = (e as { code?: string } | null | undefined)?.code || ''
        const popupIssues = ['auth/popup-blocked', 'auth/cancelled-popup-request', 'auth/popup-closed-by-user']
        if (popupIssues.includes(code)) {
          console.warn('[UserContext] Popup falhou (código:', code, '), tentando redirect...')
          await signInWithRedirect(auth, provider)
        } else {
          throw e
        }
      }
    } catch (error) {
      console.error('[UserContext] Erro no login:', error)
      console.error('[UserContext] Detalhes do erro:', JSON.stringify(error, null, 2))
      throw error
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

  const refreshUser = useCallback(async () => {
    if (!auth) return
    if (auth.currentUser) {
      try {
        await auth.currentUser.reload()
      } catch (e) {
        console.warn('[UserContext] Falha ao recarregar usuário Firebase', e)
      }
      setUser(auth.currentUser)
      // Também força um refresh do router para SSR consumir novos dados
      try { router.refresh() } catch { }
    }
  }, [router])

  return (
    <UserContext.Provider value={{ user, loading, loginWithGoogle, logout, refreshUser }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser deve ser usado dentro de UserProvider')
  return ctx
}
