'use client'

import { ClientHealthCard, ClientHealthMetrics } from './ClientHealthCard'

export function ClientHealthCardWrapper({ metrics }: { metrics: ClientHealthMetrics }) {
  return <ClientHealthCard metrics={metrics} variant="detailed" />
}
