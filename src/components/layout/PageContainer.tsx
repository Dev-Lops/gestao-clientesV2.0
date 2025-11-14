"use client";

import { cn } from "@/lib/utils";
import React from "react";

interface PageContainerProps {
  className?: string;
  children: React.ReactNode;
}

// Uniform wrapper for pages to ensure consistent light/dark background & spacing.
// Provides responsive padding and inherits CSS variable driven colors.
export function PageContainer({ className, children }: PageContainerProps) {
  return (
    <div
      className={cn(
        "w-full min-h-[calc(100vh-0px)] px-4 sm:px-6 lg:px-8 py-6 lg:py-8 bg-background text-foreground transition-colors",
        className,
      )}
    >
      {children}
    </div>
  );
}

export default PageContainer;
