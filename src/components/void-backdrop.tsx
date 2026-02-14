"use client";

import { usePathname } from "next/navigation";
import { GhostStream } from "@/components/ghost-stream";

export function VoidBackdrop() {
  const pathname = usePathname();
  if (pathname !== "/") {
    return null;
  }
  return <GhostStream />;
}

