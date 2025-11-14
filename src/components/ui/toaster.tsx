"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="top-right"
      toastOptions={{
        classNames: {
          toast: "bg-white border-slate-200",
          title: "text-slate-900",
          description: "text-slate-500",
          actionButton: "bg-slate-900 text-white",
          cancelButton: "bg-slate-100 text-slate-900",
          error: "bg-red-50 border-red-200 text-red-900",
          success: "bg-green-50 border-green-200 text-green-900",
        },
      }}
    />
  );
}
