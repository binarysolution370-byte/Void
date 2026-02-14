"use client";

import { useEffect, useState } from "react";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") {
    return true;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function VoidIntro() {
  const [visible, setVisible] = useState(true);
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setVisible(false);
      return;
    }

    const openTimer = window.setTimeout(() => setOpened(true), 600);
    const timer = window.setTimeout(() => setVisible(false), 2400);
    return () => {
      window.clearTimeout(openTimer);
      window.clearTimeout(timer);
    };
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div className={`void-intro ${opened ? "void-intro--opened" : ""}`} aria-hidden="true">
      <div className="void-intro-vhalf void-intro-vhalf--left">
        <svg className="void-intro-vsvg" viewBox="0 0 200 200" role="presentation">
          <path d="M 40 40 L 100 160 L 100 160" />
        </svg>
      </div>
      <div className="void-intro-vhalf void-intro-vhalf--right">
        <svg className="void-intro-vsvg" viewBox="0 0 200 200" role="presentation">
          <path d="M 160 40 L 100 160 L 100 160" />
        </svg>
      </div>
      <div className="void-intro-line" />
      <div className="void-intro-word" aria-label="VOID">
        <span className="void-intro-letter">V</span>
        <span className="void-intro-letter">O</span>
        <span className="void-intro-letter">I</span>
        <span className="void-intro-letter">D</span>
      </div>
    </div>
  );
}
