import { Badge } from "@/components/ui/badge";
import { ClientStatus } from "@/types/client";
import { CLIENT_STATUS_LABELS } from "@/types/enums";

const statusVariantMap: Record<ClientStatus, "success" | "warning" | "info" | "danger" | "default"> = {
  new: "info",
  onboarding: "warning",
  active: "success",
  paused: "warning",
  closed: "danger",
};

export function StatusBadge({ status }: { status: ClientStatus }) {
  return (
    <Badge variant={statusVariantMap[status]} className="uppercase tracking-wide">
      {CLIENT_STATUS_LABELS[status] || status}
    </Badge>
  );
}
