"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const items = [
  { href: "/", label: "puits" },
  { href: "/void", label: "mon vide" },
  { href: "/about", label: "manifeste" }
];

export function Navigation() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav aria-label="Navigation principale" className={`void-topnav ${scrolled ? "void-topnav--scrolled" : ""}`}>
      <div className="flex items-center justify-between gap-6">
        <Link href="/" className="void-logo" aria-label="VOID">
          <svg className="void-logo-mark" viewBox="0 0 64 64" role="presentation">
            <path
              className="void-logo-half void-logo-half--left"
              d="M12 10 L30 54"
              stroke="var(--void-glow)"
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
            />
            <path
              className="void-logo-half void-logo-half--right"
              d="M52 10 L34 54"
              stroke="var(--void-glow)"
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
          <span className="void-logo-type">OID</span>
        </Link>

        <div className="void-navlinks">
          {items.map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className="void-navlink" aria-current={active ? "page" : undefined}>
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
