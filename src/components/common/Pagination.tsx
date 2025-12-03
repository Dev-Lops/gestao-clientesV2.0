"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export function Pagination({
  page,
  total,
  pageSize,
  baseHref = "/",
  className,
}: {
  page: number;
  total: number;
  pageSize: number;
  baseHref?: string;
  className?: string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const buildHref = (nextPage: number) => {
    // Se o baseHref já termina com '=' (padrão financePage=), apenas adicionar o número
    if (baseHref.endsWith('=')) {
      return `${baseHref}${nextPage}`;
    }
    // Caso contrário, usar o padrão antigo
    const separator = baseHref.includes("?") ? "&" : "?";
    return `${baseHref}${separator}page=${nextPage}`;
  };

  return (
    <div className={className ?? "flex items-center justify-between gap-3 text-xs"}>
      <div>
        Página {page} de {totalPages}
      </div>
      <div className="flex gap-2">
        {page > 1 && (
          <Button variant="outline" size="sm" asChild>
            <Link href={buildHref(page - 1)}>Anterior</Link>
          </Button>
        )}
        {page < totalPages && (
          <Button variant="outline" size="sm" asChild>
            <Link href={buildHref(page + 1)}>Próxima</Link>
          </Button>
        )}
      </div>
    </div>
  );
}

export default Pagination;
