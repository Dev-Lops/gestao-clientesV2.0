import { cn } from "@/lib/utils";
import * as React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  isInvalid?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, isInvalid, ...props }, ref) => {
    const hasError = isInvalid || !!error;

    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm ring-offset-white",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "placeholder:text-slate-500",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "transition-colors duration-200",
          hasError
            ? "border-destructive focus-visible:ring-destructive/20"
            : "border-slate-200 focus-visible:ring-slate-950",
          className,
        )}
        ref={ref}
        aria-invalid={hasError ? "true" : undefined}
        aria-describedby={
          error ? `${props.id}-error` : props["aria-describedby"]
        }
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };

