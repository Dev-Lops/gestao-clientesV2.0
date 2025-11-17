import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface PageLayoutProps {
  children: ReactNode;
  className?: string;
  /**
   * If true, center the inner container and constrain its max-width.
   * If false, the inner container will be full width (useful when a
   * fixed sidebar occupies the left side).
   */
  centered?: boolean;
  maxWidth?:
  | "md"
  | "lg"
  | "xl"
  | "2xl"
  | "3xl"
  | "4xl"
  | "5xl"
  | "6xl"
  | "7xl"
  | "full";
}

const maxWidthClasses = {
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
  "6xl": "max-w-6xl",
  "7xl": "max-w-7xl",
  full: "max-w-full",
};

/**
 * Container padrão para conteúdo de páginas com background e espaçamento consistente
 */
export function PageLayout({
  children,
  className,
  centered = true,
  maxWidth = "7xl",
}: PageLayoutProps) {
  const innerMax = centered ? maxWidthClasses[maxWidth] : "max-w-full";

  return (
    <div className="relative dark:from-slate-950 dark:via-blue-950/20 dark:to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob" />
        <div className="absolute top-0 -right-4 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000" />
      </div>

      <div
        className={cn(
          "relative px-4 py-6 sm:px-6 sm:py-8",
          centered ? "mx-auto" : "",
          innerMax,
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
