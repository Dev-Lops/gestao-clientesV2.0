"use client";

import { BrandingSkeleton } from "@/components/ui/component-skeleton";
import dynamic from "next/dynamic";

// Lazy load BrandingManager - componente pesado com upload de arquivos
const BrandingManager = dynamic(
  () =>
    import("./BrandingManager").then((mod) => ({
      default: mod.BrandingManager,
    })),
  {
    loading: () => <BrandingSkeleton />,
    ssr: false, // Componente interativo, não precisa SSR
  }
);

export { BrandingManager };
