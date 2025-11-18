"use client";

import { FinanceManagerSkeleton } from "@/components/ui/component-skeleton";
import dynamic from "next/dynamic";

// Lazy load FinanceManagerGlobal - componente pesado com gráficos e tabelas
const FinanceManagerGlobal = dynamic(
  () =>
    import("./FinanceManagerGlobal").then((mod) => ({
      default: mod.FinanceManagerGlobal,
    })),
  {
    loading: () => <FinanceManagerSkeleton />,
    ssr: false,
  }
);

export { FinanceManagerGlobal };
