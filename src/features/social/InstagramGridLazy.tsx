"use client";

import { InstagramGridSkeleton } from "@/components/ui/component-skeleton";
import dynamic from "next/dynamic";

// Lazy load InstagramGrid - componente com API externa e mídias
const InstagramGrid = dynamic(
  () =>
    import("./InstagramGrid").then((mod) => ({
      default: mod.InstagramGrid,
    })),
  {
    loading: () => <InstagramGridSkeleton />,
    ssr: false,
  }
);

export { InstagramGrid };
