"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Le Puits" },
  { href: "/void", label: "Mon Vide" },
  { href: "/about", label: "Manifeste" },
  { href: "/dashboard", label: "Dashboard" }
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav aria-label="Navigation principale" className="void-card">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="void-kicker mb-1">Pas de bruit</p>
          <p className="text-3xl font-black tracking-[0.18em]">VOID</p>
        </div>
        <ul className="flex flex-wrap items-center gap-2">
          {items.map((item) => {
            const active = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="void-button void-nav-link inline-flex min-w-24 justify-center text-sm"
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
