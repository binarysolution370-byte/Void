"use client";

import { useEffect, useMemo, useState } from "react";

const POOL = [
  "quelqu'un vient de lacher quelque chose",
  "un secret vient d'etre puise",
  "3 personnes lisent en ce moment",
  "quelqu'un a garde un secret il y a peu",
  "le vide s'est rempli",
  "une reponse vient de partir",
  "quelqu'un a ose"
];

function nextDelayMs(): number {
  const min = 5000;
  const max = 9000;
  return Math.floor(min + Math.random() * (max - min));
}

export function LivePulse() {
  const [text, setText] = useState(POOL[0]);
  const [fading, setFading] = useState(false);

  const pool = useMemo(() => POOL, []);

  useEffect(() => {
    let timer = 0;
    let fadeOut = 0;
    let fadeIn = 0;

    function schedule() {
      timer = window.setTimeout(() => {
        setFading(true);
        fadeOut = window.setTimeout(() => {
          const next = pool[Math.floor(Math.random() * pool.length)] ?? pool[0];
          setText(next);
          fadeIn = window.setTimeout(() => setFading(false), 300);
        }, 300);
        schedule();
      }, nextDelayMs());
    }

    schedule();
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(fadeOut);
      window.clearTimeout(fadeIn);
    };
  }, [pool]);

  return (
    <div className="live-pulse" aria-live="polite">
      <span className="pulse-dot" aria-hidden="true" />
      <span className={`pulse-text ${fading ? "pulse-text--fade" : ""}`}>{text}</span>
    </div>
  );
}

