"use client";

import { initPostHog, trackPageview } from "@/lib/analytics/posthog";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function PostHogProvider() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    initPostHog();
  }, []);

  useEffect(() => {
    if (!pathname) return;
    const path = `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ""}`;
    trackPageview(path);
  }, [pathname, searchParams]);

  return null;
}
