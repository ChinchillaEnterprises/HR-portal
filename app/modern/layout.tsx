"use client";

import NeoLayout from "@/components/NeoLayout";

export default function ModernLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <NeoLayout>{children}</NeoLayout>;
}