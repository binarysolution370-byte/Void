"use client";

import { useEffect } from "react";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") {
    return true;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function VoidReveal() {
  useEffect(() => {
    if (prefersReducedMotion()) {
      document.documentElement.dataset.voidReveal = "1";
      return;
    }

    const timer = window.setTimeout(() => {
      document.documentElement.dataset.voidReveal = "1";
    }, 1400);

    return () => window.clearTimeout(timer);
  }, []);

  return null;
}

