/**
 * EXEMPLO: Como usar auto-refresh em componentes client
 * 
 * Este arquivo demonstra diferentes formas de usar o hook useAutoRefresh
 * em componentes específicos da sua aplicação
 */

'use client'

import { useAutoRefresh } from '@/hooks/useAutoRefresh'
import { useEffect, useState } from 'react'

// ============================================
// EXEMPLO 1: Auto-refresh básico
// ============================================
export function Example1BasicAutoRefresh() {
  useAutoRefresh({
    interval: 5000,
    showToast: true,
  })

  return <div>Esta página atualiza automaticamente a cada 5 segundos</div>
}

// ============================================
// EXEMPLO 2: Auto-refresh com indicador customizado
// ============================================
export function Example2CustomIndicator() {
  const [isRefreshing, setIsRefreshing] = useState(false)

  useAutoRefresh({
    interval: 5000,
    showToast: false, // Desabilita toast padrão
    onRefreshStart: () => setIsRefreshing(true),
    onRefreshEnd: () => setIsRefreshing(false),
  })

  return (
    <div>
      {isRefreshing && (
        <div className="fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg">
          🔄 Atualizando...
        </div>
      )}
      {/* Seu conteúdo aqui */}
    </div>
  )
}

// ============================================
// EXEMPLO 3: Auto-refresh condicional
// ============================================
export function Example3ConditionalRefresh({ isPremium }: { isPremium: boolean }) {
  useAutoRefresh({
    interval: isPremium ? 3000 : 10000, // Premium: 3s, Free: 10s
    enabled: true, // Pode desabilitar baseado em condições
    showToast: true,
  })

  return (
    <div>
      Atualizando a cada {isPremium ? '3' : '10'} segundos
    </div>
  )
}

// ============================================
// EXEMPLO 4: Auto-refresh apenas ao voltar à aba
// ============================================
export function Example4FocusOnly() {
  useAutoRefresh({
    interval: 999999, // Intervalo muito grande (desabilita polling)
    refreshOnFocus: true, // Só atualiza ao voltar à aba
    refreshOnReconnect: true, // E ao reconectar
    showToast: true,
  })

  return <div>Atualiza apenas quando você volta à aba</div>
}

// ============================================
// EXEMPLO 5: Auto-refresh com analytics
// ============================================
export function Example5WithAnalytics() {
  const [refreshCount, setRefreshCount] = useState(0)

  useAutoRefresh({
    interval: 5000,
    showToast: true,
    onRefreshStart: () => {
      console.log('Iniciando refresh...')
    },
    onRefreshEnd: () => {
      setRefreshCount(prev => prev + 1)
      console.log(`Refresh #${refreshCount + 1} concluído`)

      // Enviar para analytics
      // analytics.track('page_refreshed', { count: refreshCount + 1 })
    },
  })

  return (
    <div>
      <p>Página foi atualizada {refreshCount} vezes</p>
    </div>
  )
}

// ============================================
// EXEMPLO 6: Lista de tarefas com auto-refresh
// ============================================
interface Task {
  id: string
  title: string
  status: string
}

export function Example6TaskList({ initialTasks }: { initialTasks: Task[] }) {
  const [lastUpdate, setLastUpdate] = useState(new Date())

  // Sincroniza com dados do servidor quando props mudam

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLastUpdate(new Date())
  }, [initialTasks])

  useAutoRefresh({
    interval: 5000,
    showToast: true,
  })

  return (
    <div>
      <div className="mb-4 text-sm text-gray-500">
        Última atualização: {lastUpdate.toLocaleTimeString()}
      </div>
      <ul>
        {initialTasks.map(task => (
          <li key={task.id}>
            {task.title} - {task.status}
          </li>
        ))}
      </ul>
    </div>
  )
}

// ============================================
// EXEMPLO 7: Painel de métricas em tempo real
// ============================================
interface Metrics {
  users: number
  sales: number
  revenue: number
}

export function Example7RealTimeMetrics({ initialMetrics }: { initialMetrics: Metrics }) {
  const [isUpdating, setIsUpdating] = useState(false)

  // Use initialMetrics directly instead of local state
  useAutoRefresh({
    interval: 3000, // 3 segundos para métricas
    showToast: false,
    onRefreshStart: () => setIsUpdating(true),
    onRefreshEnd: () => setIsUpdating(false),
  })

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className={`bg-blue-100 p-4 rounded ${isUpdating ? 'animate-pulse' : ''}`}>
        <h3>Usuários</h3>
        <p className="text-3xl font-bold">{initialMetrics.users}</p>
      </div>
      <div className={`bg-green-100 p-4 rounded ${isUpdating ? 'animate-pulse' : ''}`}>
        <h3>Vendas</h3>
        <p className="text-3xl font-bold">{initialMetrics.sales}</p>
      </div>
      <div className={`bg-purple-100 p-4 rounded ${isUpdating ? 'animate-pulse' : ''}`}>
        <h3>Receita</h3>
        <p className="text-3xl font-bold">R$ {initialMetrics.revenue}</p>
      </div>
    </div>
  )
}

// ============================================
// EXEMPLO 8: Desabilitar durante edição
// ============================================
export function Example8DisableDuringEdit() {
  const [isEditing, setIsEditing] = useState(false)

  useAutoRefresh({
    interval: 5000,
    enabled: !isEditing, // Desabilita enquanto usuário está editando
    showToast: true,
  })

  return (
    <div>
      <button onClick={() => setIsEditing(!isEditing)}>
        {isEditing ? 'Parar Edição' : 'Iniciar Edição'}
      </button>

      {isEditing && (
        <div className="bg-yellow-100 p-2 mt-2">
          ⏸️ Auto-refresh pausado durante edição
        </div>
      )}

      <textarea
        disabled={!isEditing}
        className="w-full mt-4"
        placeholder="Digite aqui..."
        aria-label="Campo de texto"
      />
    </div>
  )
}


