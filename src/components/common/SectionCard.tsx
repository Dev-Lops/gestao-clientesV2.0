import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface SectionCardProps {
  title: string;
  icon?: LucideIcon;
  iconGradient?: string; // tailwind gradient classes
  headerGradient?: "default" | "success" | "danger" | "none";
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

const headerGradients: Record<Exclude<SectionCardProps["headerGradient"], undefined>, string> = {
  default: "bg-linear-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800",
  success: "bg-linear-to-r from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950",
  danger: "bg-linear-to-r from-red-50 to-pink-50 dark:from-red-950 dark:to-pink-950",
  none: "",
};

export function SectionCard({
  title,
  icon: Icon,
  iconGradient = "from-blue-500 to-purple-500",
  headerGradient = "default",
  actions,
  children,
  className,
}: SectionCardProps) {
  return (
    <Card className={cn(" shadow-lg hover:shadow-xl transition-shadow ", className)}>
      <CardHeader className={headerGradients[headerGradient]}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl ">
          <CardTitle className="text-lg font-semibold flex items-center gap-2 rounded">
            {Icon ? (
              <span className={cn("h-8 w-8 rounded-lg bg-linear-to-br flex items-center justify-center", iconGradient)}>
                <Icon className="h-4 w-4 text-white" />
              </span>
            ) : null}
            {title}
          </CardTitle>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
      </CardHeader>
      <CardContent className="mt-4">{children}</CardContent>
    </Card>
  );
}

export default SectionCard;
