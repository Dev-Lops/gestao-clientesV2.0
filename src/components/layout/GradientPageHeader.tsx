import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface GradientPageHeaderProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  gradient?: "primary" | "success" | "danger" | "brand";
  actions?: ReactNode;
  className?: string;
}

const gradients: Record<NonNullable<GradientPageHeaderProps["gradient"]>, string> = {
  primary: "from-blue-600 via-indigo-600 to-purple-600",
  success: "from-emerald-600 via-teal-600 to-cyan-600",
  danger: "from-red-600 via-rose-600 to-orange-500",
  brand: "from-slate-900 via-slate-800 to-slate-700",
};

export function GradientPageHeader({
  title,
  subtitle,
  icon: Icon,
  gradient = "primary",
  actions,
  className,
}: GradientPageHeaderProps) {
  return (
    <header
      className={cn(
        "relative overflow-hidden rounded-2xl bg-linear-to-br p-6 sm:p-8 text-white shadow-2xl",
        gradients[gradient],
        className,
      )}
    >
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold">{title}</h1>
            {subtitle ? (
              <p className="text-sm sm:text-base text-white/80 mt-1">{subtitle}</p>
            ) : null}
          </div>
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}

export default GradientPageHeader;
