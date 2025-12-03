import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

const inputVariants = cva(
  "w-full rounded-xl border transition-all duration-200 px-4 py-2.5 bg-white/80 dark:bg-slate-900/40 backdrop-blur-sm placeholder:text-slate-500 disabled:cursor-not-allowed disabled:opacity-50 shadow-xs",
  {
    variants: {
      variant: {
        default:
          "border-slate-200 dark:border-slate-800 focus:border-blue-500 focus-visible:ring-[3px] focus-visible:ring-blue-500/25",
        error:
          "border-red-500 focus:border-red-500 focus-visible:ring-[3px] focus-visible:ring-red-500/25",
      },
      size: {
        sm: "h-9 text-sm",
        default: "h-10 text-base",
        lg: "h-12 text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
  VariantProps<typeof inputVariants> {
  error?: string;
  isInvalid?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, isInvalid, variant, size, ...props }, ref) => {
    const hasError = isInvalid || !!error;
    const finalVariant = hasError ? "error" : variant;

    return (
      <input
        type={type}
        className={cn(inputVariants({ variant: finalVariant, size }), className)}
        ref={ref}
        aria-invalid={hasError ? "true" : undefined}
        aria-describedby={
          error ? `${props.id}-error` : props["aria-describedby"]
        }
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input, inputVariants };

