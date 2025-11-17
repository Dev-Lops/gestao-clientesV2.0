import { cn } from "@/lib/utils";
import * as React from "react";
import { Label } from "./label";

/**
 * FormField: Componente composto para formulários
 * Agrupa Label + Input/Textarea + Description + Error
 * Garante acessibilidade com IDs únicos e aria-*
 */

interface FormFieldProps {
  children: React.ReactNode;
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
  htmlFor?: string;
  className?: string;
  id?: string;
}

let fieldIdCounter = 0;

export function FormField({
  children,
  label,
  description,
  error,
  required = false,
  htmlFor,
  className,
  id: providedId,
}: FormFieldProps) {
  const fieldId = React.useId() || `field-${++fieldIdCounter}`;
  const inputId = providedId || htmlFor || fieldId;
  const descriptionId = description ? `${inputId}-description` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  // Para componentes simples como Input, tenta adicionar as props de acessibilidade
  // Para componentes compostos como Select, apenas renderiza
  const enhancedChild = React.isValidElement(children) && typeof children.type === 'string'
    ? React.cloneElement(children, {
      id: inputId,
      "aria-invalid": error ? true : undefined,
      "aria-describedby": [descriptionId, errorId].filter(Boolean).join(" ") || undefined,
    } as React.HTMLProps<HTMLElement>)
    : children;

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label htmlFor={inputId} className={cn(required && "after:content-['*'] after:ml-0.5 after:text-destructive")}>
          {label}
        </Label>
      )}

      {description && (
        <p
          id={descriptionId}
          className="text-sm text-muted-foreground"
        >
          {description}
        </p>
      )}

      {enhancedChild}

      {error && (
        <p
          id={errorId}
          className="text-sm font-medium text-destructive"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * FormSection: Agrupa múltiplos FormFields com título opcional
 */
interface FormSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormSection({
  title,
  description,
  children,
  className,
}: FormSectionProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <h3 className="text-lg font-semibold leading-none tracking-tight">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      <div className="space-y-4">{children}</div>
    </div>
  );
}

/**
 * FormActions: Container para botões de ação do formulário
 */
interface FormActionsProps {
  children: React.ReactNode;
  className?: string;
  align?: "left" | "center" | "right";
}

export function FormActions({
  children,
  className,
  align = "right",
}: FormActionsProps) {
  const alignClasses = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 pt-6 border-t",
        alignClasses[align],
        className,
      )}
    >
      {children}
    </div>
  );
}
