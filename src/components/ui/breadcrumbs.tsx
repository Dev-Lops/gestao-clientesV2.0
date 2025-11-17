import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";
import { Fragment } from "react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  showHome?: boolean;
}

export function Breadcrumbs({ items, showHome = true }: BreadcrumbsProps) {
  const allItems = showHome
    ? [{ label: "Início", href: "/", icon: Home }, ...items]
    : items;

  return (
    <nav
      className="flex items-center gap-2 text-sm text-muted-foreground"
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center gap-2">
        {allItems.map((item, i) => {
          const isLast = i === allItems.length - 1;
          const Icon = item.icon;

          return (
            <Fragment key={i}>
              {i > 0 && (
                <ChevronRight className="h-4 w-4 text-muted-foreground/60" />
              )}
              <li>
                {item.href && !isLast ? (
                  <Link
                    href={item.href}
                    className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                    <span>{item.label}</span>
                  </Link>
                ) : (
                  <span
                    className={`flex items-center gap-1.5 ${isLast ? "text-foreground font-medium" : ""}`}
                    aria-current={isLast ? "page" : undefined}
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                    <span>{item.label}</span>
                  </span>
                )}
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
