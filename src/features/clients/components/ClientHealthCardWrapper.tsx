"use client";

import { ClientHealthCard, ClientHealthMetrics } from "./ClientHealthCard";

export function ClientHealthCardWrapper({
  metrics,
  canViewAmounts = true,
}: {
  metrics: ClientHealthMetrics;
  canViewAmounts?: boolean;
}) {
  // Use the compact variant to provide a concise, actionable summary above the Gargalos card
  return (
    <ClientHealthCard
      metrics={metrics}
      variant="compact"
      canViewAmounts={canViewAmounts}
    />
  );
}
