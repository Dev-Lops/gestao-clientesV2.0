import { firebaseApp } from '@/lib/firebase'
import {
  getDatabase,
  onDisconnect,
  ref,
  serverTimestamp,
  set,
} from 'firebase/database'
import { useEffect } from 'react'

/**
 * Hook para atualizar status de presença do usuário em tempo real no Firebase Realtime Database.
 * @param userId string | undefined
 */
export function usePresence(userId?: string) {
  useEffect(() => {
    if (!userId) return
    if (!firebaseApp) return
    const db = getDatabase(firebaseApp)
    const statusRef = ref(db, `/status/${userId}`)

    // Marca como online ao conectar
    set(statusRef, { state: 'online', lastChanged: serverTimestamp() })
    // Marca como offline ao desconectar (mesmo se fechar aba)
    onDisconnect(statusRef).set({
      state: 'offline',
      lastChanged: serverTimestamp(),
    })

    // Também marca como offline ao sair da página
    const handleUnload = () =>
      set(statusRef, { state: 'offline', lastChanged: serverTimestamp() })
    window.addEventListener('beforeunload', handleUnload)

    return () => {
      set(statusRef, { state: 'offline', lastChanged: serverTimestamp() })
      window.removeEventListener('beforeunload', handleUnload)
    }
  }, [userId])
}
