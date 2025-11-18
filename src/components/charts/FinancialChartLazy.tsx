"use client";

import { ChartSkeleton } from "@/components/ui/component-skeleton";
import dynamic from "next/dynamic";

// Lazy load FinancialChart - componente com Recharts (biblioteca pesada)
const FinancialChart = dynamic(
  () =>
    import("./financial-chart").then((mod) => ({
      default: mod.FinancialChart,
    })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false, // Gráficos não precisam SSR
  }
);

export type { FinancialDataPoint } from "./financial-chart";
export { FinancialChart };

