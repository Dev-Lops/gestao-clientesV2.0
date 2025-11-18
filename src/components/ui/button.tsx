import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";
import { Spinner } from "./spinner";

/**
 * Button Component - Design System MyGest
 * Componente de botão sofisticado com gradientes e animações
 */

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring/50",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95",
        destructive:
          "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95",
        success:
          "bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95",
        warning:
          "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95",
        outline:
          "border-2 border-slate-300 hover:border-slate-400 dark:border-slate-700 dark:hover:border-slate-600 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-900 dark:text-white",
        secondary:
          "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white shadow-sm hover:shadow-md",
        ghost:
          "hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-900 dark:text-white",
        link:
          "text-blue-600 dark:text-blue-400 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-6 py-2.5",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-8 text-base",
        xl: "h-14 px-10 text-lg",
        icon: "size-10",
        "icon-sm": "size-9",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ComponentProps<"button">,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
  loadingText?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      isLoading = false,
      loadingText,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";

    // When using Slot (asChild), ensure a single React element child and avoid invalid props
    if (asChild) {
      // Slot does not accept ref, so omit it
      return (
        <Comp
          data-slot="button"
          data-loading={isLoading || undefined}
          aria-busy={isLoading || undefined}
          className={cn(
            buttonVariants({ variant, size, className }),
            isLoading ? "pointer-events-none opacity-70" : undefined
          )}
          {...props}
        >
          {children}
        </Comp>
      );
    }

    return (
      <Comp
        ref={ref}
        data-slot="button"
        data-loading={isLoading || undefined}
        aria-busy={isLoading || undefined}
        disabled={isLoading || disabled}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {isLoading && (
          <Spinner size="sm" className="mr-0.5" aria-hidden="true" />
        )}
        {isLoading && loadingText ? loadingText : children}
      </Comp>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };

