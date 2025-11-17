import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title = "Nenhum dado encontrado",
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-6 sm:py-10 px-2 sm:px-4 text-center w-full",
        className
      )}
    >
      {Icon && (
        <div className="mb-3 sm:mb-4 rounded-full bg-muted p-2 sm:p-3">
          <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
        </div>
      )}
      <h3 className="text-base sm:text-lg font-medium text-foreground mb-1">{title}</h3>
      {description && (
        <p className="text-xs sm:text-sm text-muted-foreground max-w-xs sm:max-w-sm mx-auto">{description}</p>
      )}
      {action && <div className="mt-3 sm:mt-4">{action}</div>}
    </div>
  );
}

export default EmptyState;
