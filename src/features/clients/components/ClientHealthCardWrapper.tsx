'use client'

import { ClientHealthCard, ClientHealthMetrics } from './ClientHealthCard'

export function ClientHealthCardWrapper({ metrics }: { metrics: ClientHealthMetrics }) {
  // Use the compact variant to provide a concise, actionable summary above the Gargalos card
  return <ClientHealthCard metrics={metrics} variant="compact" />
}
