import { useEffect, useState } from 'react'

export interface AssigneeOption {
  id: string
  name: string
  email?: string
  role: 'OWNER' | 'STAFF'
  isActive: boolean
}

/**
 * Hook para buscar owners e staff disponíveis para atribuição de tasks
 */
export function useAssignees(orgId?: string) {
  const [assignees, setAssignees] = useState<AssigneeOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!orgId) {
      setAssignees([])
      setLoading(false)
      return
    }

    const fetchAssignees = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/organizations/${orgId}/assignees`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error('Falha ao buscar atribuíveis')
        }

        const data = await response.json()
        setAssignees(data)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Erro desconhecido'))
        setAssignees([])
      } finally {
        setLoading(false)
      }
    }

    fetchAssignees()
  }, [orgId])

  return { assignees, loading, error }
}
