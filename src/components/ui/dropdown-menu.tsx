"use client";

import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

interface DropdownContextValue {
  open: boolean;
  setOpen: (v: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  side?: "top" | "bottom";
  align?: "start" | "end";
}

const DropdownContext = createContext<DropdownContextValue | undefined>(
  undefined,
);

interface DropdownMenuProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  side?: "top" | "bottom";
  align?: "start" | "end";
}

export function DropdownMenu({
  children,
  open: controlledOpen,
  onOpenChange,
  side = "bottom",
  align = "start",
}: DropdownMenuProps) {
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [uncontrolled, setUncontrolled] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : uncontrolled;

  const setOpen = (v: boolean) => {
    if (controlledOpen === undefined) setUncontrolled(v);
    onOpenChange?.(v);
  };

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <DropdownContext.Provider
      value={{ open, setOpen, triggerRef, side, align }}
    >
      {children}
    </DropdownContext.Provider>
  );
}

function useDropdown() {
  const ctx = useContext(DropdownContext);
  if (!ctx) throw new Error("Dropdown components must be inside DropdownMenu");
  return ctx;
}

interface TriggerProps {
  asChild?: boolean;
  children: React.ReactNode;
}

export function DropdownMenuTrigger({ children, asChild }: TriggerProps) {
  const { setOpen, open, triggerRef } = useDropdown();
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as any, {
      ref: triggerRef,
      "data-state": open ? "open" : "closed",
      onClick: (e: React.MouseEvent) => {
        if (React.isValidElement(children)) {
          const maybeOnClick = (children.props as any)?.onClick;
          if (typeof maybeOnClick === "function") maybeOnClick(e);
        }
        setOpen(!open);
      },
    });
  }
  return (
    <button
      ref={triggerRef}
      data-state={open ? "open" : "closed"}
      onClick={() => setOpen(!open)}
      className="inline-flex items-center rounded-md px-3 py-2 text-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
    >
      {children}
    </button>
  );
}

interface ContentProps {
  children: React.ReactNode;
  className?: string;
  sideOffset?: number;
}

export function DropdownMenuContent({
  children,
  className,
  sideOffset = 8,
}: ContentProps) {
  const { open, setOpen, triggerRef, side, align } = useDropdown();
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (!open) return;
      if (
        contentRef.current &&
        !contentRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    window.addEventListener("mousedown", onClickOutside);
    return () => window.removeEventListener("mousedown", onClickOutside);
  }, [open, setOpen]);

  const alignmentClass = align === "end" ? "right-0" : "left-0";
  const verticalPositionClass =
    side === "top"
      ? `bottom-full mb-${sideOffset / 4}`
      : `top-full mt-${sideOffset / 4}`;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={contentRef}
          initial={{ opacity: 0, scale: 0.95, y: side === "top" ? -4 : 4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: side === "top" ? -4 : 4 }}
          transition={{ duration: 0.15 }}
          role="menu"
          className={cn(
            "absolute z-50 min-w-48 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl p-1 origin-top",
            alignmentClass,
            verticalPositionClass,
            className,
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function DropdownMenuItem({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <div
      onClick={() => {
        if (disabled) return;
        onClick?.();
      }}
      className={cn(
        "cursor-pointer select-none rounded-sm px-3 py-2 text-sm flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800",
        disabled && "opacity-50 pointer-events-none",
      )}
    >
      {children}
    </div>
  );
}

export function DropdownMenuSeparator() {
  return <div className="my-1 h-px bg-slate-200 dark:bg-slate-700" />;
}

export function DropdownMenuLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
      {children}
    </div>
  );
}

export function DropdownMenuGroup({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

export function DropdownMenuShortcut({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className="ml-auto text-[10px] font-mono opacity-60">{children}</span>
  );
}

// Placeholder implementations for API compatibility
export function DropdownMenuPortal({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
export function DropdownMenuSub({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
export function DropdownMenuSubTrigger({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="px-3 py-2 text-sm">{children}</div>;
}
export function DropdownMenuSubContent({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="px-1">{children}</div>;
}
