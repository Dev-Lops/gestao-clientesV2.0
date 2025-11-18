"use client";

import { BrandingSkeleton } from "@/components/ui/component-skeleton";
import dynamic from "next/dynamic";

// Lazy load BrandingStudio - componente pesado com canvas e preview
const BrandingStudio = dynamic(() => import("./BrandingStudio"), {
  loading: () => <BrandingSkeleton />,
  ssr: false,
});

export default BrandingStudio;
