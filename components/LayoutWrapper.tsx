"use client";

import { usePathname } from "next/navigation";
import NeoLayout from "./NeoLayout";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';
  const isModernPage = pathname === '/modern';
  
  if (isLoginPage || isModernPage) {
    return <>{children}</>;
  }
  
  return <NeoLayout>{children}</NeoLayout>;
}