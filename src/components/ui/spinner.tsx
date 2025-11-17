import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2Icon } from "lucide-react";

const spinnerVariants = cva("animate-spin", {
  variants: {
    size: {
      xs: "size-3",
      sm: "size-4",
      md: "size-6",
      lg: "size-8",
      xl: "size-12",
    },
    variant: {
      default: "text-current",
      primary: "text-primary",
      muted: "text-muted-foreground",
      white: "text-white",
    },
  },
  defaultVariants: {
    size: "md",
    variant: "default",
  },
});

export interface SpinnerProps
  extends React.ComponentProps<"svg">,
  VariantProps<typeof spinnerVariants> { }

function Spinner({ className, size, variant, ...props }: SpinnerProps) {
  return (
    <Loader2Icon
      role="status"
      aria-label="Carregando"
      aria-live="polite"
      className={cn(spinnerVariants({ size, variant }), className)}
      {...props}
    />
  );
}

/**
 * Spinner inline para uso em botões e textos
 */
function SpinnerInline({ className }: { className?: string }) {
  return <Spinner size="xs" className={cn("inline-block", className)} />;
}

/**
 * Spinner em círculo (border-based) - melhor para alguns contextos
 */
interface CircleSpinnerProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

function CircleSpinner({ size = "md", className }: CircleSpinnerProps) {
  const sizeClasses = {
    xs: "w-3 h-3 border-2",
    sm: "w-4 h-4 border-2",
    md: "w-6 h-6 border-2",
    lg: "w-8 h-8 border-3",
    xl: "w-12 h-12 border-4",
  };

  return (
    <div
      className={cn(
        "inline-block animate-spin rounded-full border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]",
        sizeClasses[size],
        className,
      )}
      role="status"
      aria-label="Carregando"
      aria-live="polite"
    >
      <span className="sr-only">Carregando...</span>
    </div>
  );
}

/**
 * Animação de dots (3 pontos saltando)
 */
function DotsSpinner({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-1", className)} role="status" aria-label="Carregando">
      <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]" />
      <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]" />
      <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
      <span className="sr-only">Carregando...</span>
    </div>
  );
}

/**
 * Animação de pulse (3 círculos pulsando)
 */
function PulseSpinner({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)} role="status" aria-label="Carregando">
      <div className="w-2.5 h-2.5 bg-current rounded-full animate-pulse opacity-75" />
      <div className="w-2.5 h-2.5 bg-current rounded-full animate-pulse [animation-delay:0.2s] opacity-60" />
      <div className="w-2.5 h-2.5 bg-current rounded-full animate-pulse [animation-delay:0.4s] opacity-45" />
      <span className="sr-only">Carregando...</span>
    </div>
  );
}

export { CircleSpinner, DotsSpinner, PulseSpinner, Spinner, SpinnerInline, spinnerVariants };

