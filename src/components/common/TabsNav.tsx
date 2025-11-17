"use client";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Briefcase,
  Calendar,
  Image,
  Info,
  Lightbulb,
  ListTodo,
  Trash2,
  UserPlus,
} from "lucide-react";

type IconKey =
  | "info"
  | "listTodo"
  | "image"
  | "lightbulb"
  | "briefcase"
  | "calendar"
  | "userPlus"
  | "trash2";

const iconMap: Record<IconKey, LucideIcon> = {
  info: Info,
  listTodo: ListTodo,
  image: Image,
  lightbulb: Lightbulb,
  briefcase: Briefcase,
  calendar: Calendar,
  userPlus: UserPlus,
  trash2: Trash2,
};

interface TabItem {
  href: string;
  label: string;
  icon: string;
  destructive?: boolean;
}

interface TabsNavProps {
  items: TabItem[];
}


export function TabsNav({ items }: TabsNavProps) {
  const pathname = usePathname();
  return (
    <nav className="flex w-full overflow-x-auto no-scrollbar gap-1">
      {items.map((item) => {
        const Icon = iconMap[item.icon as IconKey];
        const active = pathname?.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} className={
            `gap-2 px-3 py-2 text-sm rounded-lg inline-flex items-center whitespace-nowrap transition-colors border ` +
            (item.destructive
              ? "text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 border-transparent"
              : active
                ? "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-foreground"
                : "hover:bg-slate-100 dark:hover:bg-slate-800 border-transparent text-foreground")
          }>
            {Icon && <Icon className="h-4 w-4" />}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default TabsNav;
