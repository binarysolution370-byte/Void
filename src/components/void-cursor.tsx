"use client";

import { useEffect, useRef, useState } from "react";

function shouldEnableCursor(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return false;
  }
  if (window.matchMedia("(pointer: coarse)").matches) {
    return false;
  }
  return true;
}

export function VoidCursor() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(shouldEnableCursor());
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const el = ref.current;
    if (!el) return;

    let targetX = -100;
    let targetY = -100;
    let x = targetX;
    let y = targetY;
    let active = false;
    let raf = 0;

    function isInteractive(node: Element | null): boolean {
      if (!node) return false;
      return Boolean(node.closest("a,button,[role='button'],input,textarea,select,summary"));
    }

    function onMove(event: MouseEvent) {
      targetX = event.clientX;
      targetY = event.clientY;
    }

    function onOver(event: Event) {
      active = isInteractive(event.target as Element);
      if (ref.current) {
        ref.current.classList.toggle("void-cursor--active", active);
      }
    }

    function tick() {
      x += (targetX - x) * 0.15;
      y += (targetY - y) * 0.15;
      if (ref.current) {
        ref.current.style.transform = `translate3d(${x - 6}px, ${y - 6}px, 0)`;
      }
      raf = window.requestAnimationFrame(tick);
    }

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseover", onOver, true);
    raf = window.requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver, true);
      window.cancelAnimationFrame(raf);
    };
  }, [enabled]);

  if (!enabled) {
    return null;
  }

  return <div ref={ref} className="void-cursor" aria-hidden="true" />;
}
