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
  id: string;
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
  const generatedId = React.useId();
  const id = `dropdown-${generatedId}`;
  const [uncontrolled, setUncontrolled] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : uncontrolled;

  const setOpen = React.useCallback(
    (v: boolean) => {
      if (controlledOpen === undefined) setUncontrolled(v);
      onOpenChange?.(v);
    },
    [controlledOpen, onOpenChange],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  return (
    <DropdownContext.Provider value={{ open, setOpen, id, side, align }}>
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
  const { setOpen, open, id } = useDropdown();
  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement & {
      props: { onClick?: (e: React.MouseEvent) => void };
    };

    const existingOnClick = child.props?.onClick;

    const mergedOnClick = (e: React.MouseEvent) => {
      if (typeof existingOnClick === "function") {
        try {
          existingOnClick(e);
        } catch {
          // swallow any child handler errors to avoid breaking the menu
        }
      }
      setOpen(!open);
    };

    return React.cloneElement(
      child as React.ReactElement<Record<string, unknown>>,
      {
        ["data-dropdown-id"]: id,
        ["data-state"]: open ? "open" : "closed",
        onClick: mergedOnClick,
      },
    );
  }
  return (
    <button data-dropdown-id={id} data-state={open ? "open" : "closed"} onClick={() => setOpen(!open)}
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
  const { open, setOpen, id, side, align } = useDropdown();
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (!open) return;
      const target = e.target as Element | null;
      const clickedInsideContent = contentRef.current?.contains(target as Node);
      const clickedOnTrigger = target?.closest?.(`[data-dropdown-id="${id}"]`);
      if (!clickedInsideContent && !clickedOnTrigger) {
        setOpen(false);
      }
    }
    window.addEventListener("mousedown", onClickOutside);
    return () => window.removeEventListener("mousedown", onClickOutside);
  }, [open, setOpen, id]);

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
