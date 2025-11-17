import { cn } from "@/lib/utils";

type InvoiceStatus = "OPEN" | "OVERDUE" | "PAID" | "VOID" | "DRAFT" | string;

export function StatusBadge({
  status,
  className,
}: {
  status: InvoiceStatus;
  className?: string;
}) {
  const base =
    "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap";

  const map: Record<string, string> = {
    PAID:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    OVERDUE: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300",
    OPEN:
      "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    VOID:
      "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    DRAFT:
      "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  };

  const cls = cn(base, map[status] ?? map["OPEN"], className);
  return (
    <span aria-label={`status ${status}`} className={cls}>
      {status}
    </span>
  );
}

export default StatusBadge;
