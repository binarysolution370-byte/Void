"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "PUITS" },
  { href: "/void", label: "MON VIDE" },
  { href: "/about", label: "MANIFESTE" }
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="void-bottomnav" aria-label="Navigation mobile">
      <div className="void-bottomnav-inner">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className="void-bottomtab" aria-current={active ? "page" : undefined}>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

