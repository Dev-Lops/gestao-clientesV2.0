import { cn } from "@/lib/utils";
import * as React from "react";

/**
 * Card Component - Design System MyGest
 * Componente de card sofisticado com suporte a variantes e estados
 */

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'interactive' | 'bordered';
  hover?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', hover = false, ...props }, ref) => {
    const variantClasses = {
      default: 'border-2 shadow-sm',
      elevated: 'border-2 shadow-lg',
      interactive: 'border-2 shadow-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98]',
      bordered: 'border-2 border-slate-300 dark:border-slate-700',
    };

    return (
      <div
        ref={ref}
        className={cn(
          // Base styles
          'rounded-xl bg-card text-card-foreground transition-all duration-200',
          // Variant styles
          variantClasses[variant],
          // Hover effect
          hover && 'hover:shadow-lg',
          className,
        )}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col space-y-1.5 p-4 sm:p-6",
      className
    )}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-lg sm:text-xl font-semibold leading-tight tracking-tight text-slate-900 dark:text-white",
      className,
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p 
    ref={ref} 
    className={cn(
      "text-sm text-slate-600 dark:text-slate-400 leading-relaxed", 
      className
    )} 
    {...props} 
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn("px-4 sm:px-6 pb-4 sm:pb-6", className)} 
    {...props} 
  />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center gap-2 px-4 sm:px-6 pb-4 sm:pb-6",
      className
    )}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
};
