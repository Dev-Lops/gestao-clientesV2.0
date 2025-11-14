"use client";

import { SidebarV3 } from "@/components/layout/SidebarV3";
import { useSidebar } from "@/components/ui/sidebar";

export function AppSidebar() {
  const { isOpen, close } = useSidebar();

  return <SidebarV3 isOpen={isOpen} onClose={close} />;
}

export default AppSidebar;
