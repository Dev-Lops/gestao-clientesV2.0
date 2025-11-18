"use client";
import type { ReactNode } from "react";
import { useState } from "react";

interface ConfirmFormButtonProps {
  action: string;
  method?: string;
  className?: string;
  children: ReactNode;
  confirmMessage: string;
}

export function ConfirmFormButton({
  action,
  method = "post",
  className = "",
  children,
  confirmMessage
}: ConfirmFormButtonProps) {
  const [submitting, setSubmitting] = useState(false);

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    if (!confirm(confirmMessage)) {
      e.preventDefault();
      return;
    }
    setSubmitting(true);
  }

  return (
    <form method={method} action={action} className={className}>
      <button
        type="submit"
        className="px-3 py-2 rounded-md text-sm transition-all "
        disabled={submitting}
        onClick={handleClick}
      >
        {children}
      </button>
    </form>
  );
}
