import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface KPICardProps {
  label: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  variant?: "danger" | "warning" | "info" | "success" | "neutral" | "dark";
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
}

const variants = {
  danger: {
    gradient: "from-red-500 to-pink-500",
    glow: "from-red-500/10 to-pink-500/10",
    textColor: "text-red-600",
  },
  warning: {
    gradient: "from-amber-500 to-orange-500",
    glow: "from-amber-500/10 to-orange-500/10",
    textColor: "text-amber-600",
  },
  info: {
    gradient: "from-blue-500 to-cyan-500",
    glow: "from-blue-500/10 to-cyan-500/10",
    textColor: "text-blue-600",
  },
  success: {
    gradient: "from-emerald-500 to-green-500",
    glow: "from-emerald-500/10 to-green-500/10",
    textColor: "text-emerald-600",
  },
  neutral: {
    gradient: "from-purple-500 to-fuchsia-500",
    glow: "from-purple-500/10 to-fuchsia-500/10",
    textColor: "text-purple-600",
  },
  dark: {
    gradient: "from-slate-600 to-slate-800",
    glow: "from-slate-500/10 to-slate-700/10",
    textColor: "text-slate-600",
  },
} as const;


export function KPICard({ label, value, description, icon: Icon, variant = "info", className, labelClassName, valueClassName }: KPICardProps) {
  const v = variants[variant ?? "info"];
  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center bg-linear-to-br from-white to-gray-50 border border-gray-200 rounded-2xl p-5 sm:p-7 md:p-10 min-h-14 h-full shadow-lg transition-all hover:shadow-xl hover:border-gray-300 gap-1 sm:gap-2",
        className
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center rounded-full shadow-lg border-2 border-white",
          "bg-linear-to-br " + v.gradient,
          "shadow-[0_4px_16px_0_rgba(0,0,0,0.08)]",
          "h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14"
        )}
      >
        <Icon className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-white drop-shadow" />
      </div>
      <div className={cn("text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight", v.textColor, "text-center w-full", valueClassName)}>{value}</div>
      <div className={cn("text-base sm:text-lg font-semibold text-gray-700 text-center w-full leading-tight", labelClassName)}>{label}</div>
      {description ? (
        <div className="text-xs sm:text-sm text-gray-500 text-center w-full leading-snug">{description}</div>
      ) : null}
      <div className="absolute bottom-1 sm:bottom-2 left-0 w-full h-1 sm:h-2 bg-linear-to-r from-transparent via-gray-100 to-transparent rounded-b-2xl pointer-events-none" />
    </div>
  );
}

export default KPICard;
// ...arquivo finalizado corretamente, sem caracteres extras
