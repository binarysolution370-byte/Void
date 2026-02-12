"use client";

import { RitualActionButton } from "@/components/ritual-action-button";

export function OfferInk({ unlocked }: { unlocked: boolean }) {
  if (!unlocked) {
    return null;
  }

  return (
    <details className="border border-white/20 p-3">
      <summary className="cursor-pointer text-sm">Chaque mot merite d'etre attendu.</summary>
      <div className="mt-2 flex flex-wrap gap-2">
        <RitualActionButton offerId="ink_typewriter" label="Machine a ecrire — 0,99EUR" />
      </div>
    </details>
  );
}
