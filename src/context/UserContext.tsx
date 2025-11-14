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

  // Detecção mais robusta e precisa
  const userAgent = navigator.userAgent.toLowerCase()
  const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0

  // Lista expandida de mobile user agents
  const mobilePatterns = [
    /android/i,
    /webos/i,
    /iphone/i,
    /ipad/i,
    /ipod/i,
    /blackberry/i,
    /windows phone/i,
    /iemobile/i,
    /opera mini/i,
    /mobile/i,
  ]

  const isMobileUserAgent = mobilePatterns.some(pattern => pattern.test(userAgent))

  // Considera mobile se:
  // 1. Tem user agent mobile E tem touch
  // 2. OU tela menor que 768px (mobile típico)
  const isSmallScreen = window.innerWidth < 768

  const isMobile = (isMobileUserAgent && hasTouchScreen) || isSmallScreen

  console.log('[isMobileDevice] Resultado:', isMobile, {
    userAgent: navigator.userAgent.substring(0, 50) + '...',
    hasTouchScreen,
    isMobileUserAgent,
    isSmallScreen,
    width: window.innerWidth
  })

  return isMobile
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

    let isCheckingRedirect = false

    // Check for redirect result when component mounts (for mobile login)
    const checkRedirectResult = async () => {
      if (!auth || isCheckingRedirect) return // Type guard for TypeScript
      isCheckingRedirect = true

      console.log('[UserContext] 🔍 Verificando redirect result...')
      console.log('[UserContext] URL atual:', window.location.href)
      console.log('[UserContext] Query params:', window.location.search)

      const wasPendingRedirect = localStorage.getItem('pendingAuthRedirect') === 'true'
      console.log('[UserContext] Tinha redirect pendente?', wasPendingRedirect)

      try {
        // SEMPRE tentar pegar o redirect result, sem delay artificial
        console.log('[UserContext] ⏳ Chamando getRedirectResult...')
        const result = await getRedirectResult(auth)
        console.log('[UserContext] getRedirectResult retornou:', result ? '✅ resultado encontrado' : '❌ null')

        if (result && result.user) {
          console.log('[UserContext] ✅ Redirect result detectado!')
          console.log('[UserContext] User UID:', result.user.uid)
          console.log('[UserContext] User email:', result.user.email)
          console.log('[UserContext] User displayName:', result.user.displayName)
          console.log('[UserContext] Provider data:', result.user.providerData)

          // Limpar flag de redirect pendente
          localStorage.removeItem('pendingAuthRedirect')

          // Retrieve invite token from sessionStorage if it was stored
          const inviteToken = sessionStorage.getItem('pendingInviteToken')
          console.log('[UserContext] Invite token recuperado:', inviteToken || 'nenhum')

          if (inviteToken) {
            sessionStorage.removeItem('pendingInviteToken')
          }

          // Handle the redirect result the same way as popup result
          console.log('[UserContext] 🚀 Processando auth result...')
          await handleAuthResult(result.user, inviteToken)
        } else {
          console.log('[UserContext] ❌ Nenhum redirect result encontrado')
          // Limpar flag apenas se havia uma pendente
          if (wasPendingRedirect) {
            console.log('[UserContext] 🧹 Limpando flag de redirect pendente sem resultado')
            localStorage.removeItem('pendingAuthRedirect')
            sessionStorage.removeItem('pendingInviteToken')
          }
          setLoading(false)
        }
      } catch (error) {
        console.error('[UserContext] ❌ Erro ao processar redirect result:', error)
        const err = error as { code?: string; message?: string }
        console.error('[UserContext] Código do erro:', err.code)
        console.error('[UserContext] Mensagem:', err.message)
        console.error('[UserContext] Stack:', (error as Error)?.stack)

        // Limpar storage em caso de erro
        localStorage.removeItem('pendingAuthRedirect')
        sessionStorage.removeItem('pendingInviteToken')
        setLoading(false)
      } finally {
        isCheckingRedirect = false
      }
    }

    checkRedirectResult()

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('[UserContext] onAuthStateChanged disparado:', firebaseUser?.uid || 'null')
      console.log('[UserContext] Email:', firebaseUser?.email || 'null')

      // Se usuário autenticado mas sem sessão ativa, pode ser resultado de redirect mobile
      if (firebaseUser) {
        const wasPendingRedirect = localStorage.getItem('pendingAuthRedirect') === 'true'

        // Verifica se tem sessão ativa
        try {
          const sessionCheck = await fetch('/api/session', { method: 'GET' })
          const hasSession = sessionCheck.ok

          console.log('[UserContext] Tem sessão ativa?', hasSession)

          // Se tem usuário mas não tem sessão e tinha redirect pendente, processar
          if (!hasSession && wasPendingRedirect) {
            console.log('[UserContext] 🔄 Usuário autenticado sem sessão, processando...')
            const inviteToken = sessionStorage.getItem('pendingInviteToken')
            if (inviteToken) {
              sessionStorage.removeItem('pendingInviteToken')
            }
            localStorage.removeItem('pendingAuthRedirect')
            await handleAuthResult(firebaseUser, inviteToken)
            return // Exit early to avoid setting loading to false
          }
        } catch (error) {
          console.error('[UserContext] Erro ao verificar sessão:', error)
        }
      }

      setUser(firebaseUser)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [handleAuthResult])

  const loginWithGoogle = async (inviteToken?: string | null) => {
    if (!auth || !provider) {
      console.error('[UserContext] ❌ Firebase não inicializado')
      throw new Error('Firebase auth not initialized')
    }

    console.log('[UserContext] 🔐 Iniciando login com Google')
    console.log('[UserContext] inviteToken:', inviteToken || 'nenhum')
    console.log('[UserContext] URL:', window.location.href)

    // Store invite token in sessionStorage so it's available after redirect
    if (inviteToken) {
      console.log('[UserContext] 💾 Salvando invite token no sessionStorage')
      sessionStorage.setItem('pendingInviteToken', inviteToken)
    }

    const useMobile = isMobileDevice()
    console.log('[UserContext] 📱 Detecção de dispositivo:')
    console.log('  - É mobile:', useMobile)
    console.log('  - User agent:', navigator.userAgent)
    console.log('  - Window width:', window.innerWidth)
    console.log('  - Touch points:', navigator.maxTouchPoints)
    console.log('  - Método:', useMobile ? '🔄 REDIRECT' : '🪟 POPUP')

    try {
      // Mobile: sempre usar redirect (popups não funcionam bem)
      if (useMobile) {
        console.log('[UserContext] 🚀 Iniciando signInWithRedirect...')
        // Marcar que estamos aguardando um redirect
        localStorage.setItem('pendingAuthRedirect', 'true')
        console.log('[UserContext] ✓ Flag de redirect pendente salva')

        await signInWithRedirect(auth, provider)
        console.log('[UserContext] ✓ signInWithRedirect chamado - aguardando redirecionamento')
        // redirect flow continues in checkRedirectResult
        return
      }

      // Desktop: tentar popup primeiro, fallback para redirect
      console.log('[UserContext] 💻 Desktop: tentando popup')
      try {
        const result = await signInWithPopup(auth, provider)
        console.log('[UserContext] ✅ Popup bem-sucedido')
        await handleAuthResult(result.user, inviteToken)
      } catch (e: unknown) {
        // Fallback para redirect se popup falhar (bloqueado pelo navegador)
        const code = (e as { code?: string } | null | undefined)?.code || ''
        const popupIssues = ['auth/popup-blocked', 'auth/cancelled-popup-request', 'auth/popup-closed-by-user']

        if (popupIssues.includes(code)) {
          console.warn('[UserContext] ⚠️ Popup falhou (código:', code, '), tentando redirect...')
          localStorage.setItem('pendingAuthRedirect', 'true')
          await signInWithRedirect(auth, provider)
        } else {
          console.error('[UserContext] ❌ Erro inesperado no popup:', code)
          throw e
        }
      }
    } catch (error) {
      console.error('[UserContext] ❌ Erro no login:', error)
      const err = error as { code?: string; message?: string }
      console.error('[UserContext] Código:', err.code)
      console.error('[UserContext] Mensagem:', err.message)
      console.error('[UserContext] Detalhes completos:', JSON.stringify(error, null, 2))

      // Limpar storage em caso de erro
      localStorage.removeItem('pendingAuthRedirect')
      sessionStorage.removeItem('pendingInviteToken')

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
