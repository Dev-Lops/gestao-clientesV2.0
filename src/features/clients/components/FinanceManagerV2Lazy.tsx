"use client";

import { FinanceManagerSkeleton } from "@/components/ui/component-skeleton";
import dynamic from "next/dynamic";

// Lazy load FinanceManagerV2 - componente pesado com gráficos
const FinanceManagerV2 = dynamic(
  () =>
    import("./FinanceManagerV2").then((mod) => ({
      default: mod.FinanceManagerV2,
    })),
  {
    loading: () => <FinanceManagerSkeleton />,
    ssr: false,
  }
);

export { FinanceManagerV2 };
