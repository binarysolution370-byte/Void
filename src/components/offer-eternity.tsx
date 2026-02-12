"use client";

import { RitualActionButton } from "@/components/ritual-action-button";

export function OfferEternity({ unlocked }: { unlocked: boolean }) {
  if (!unlocked) {
    return null;
  }

  return (
    <details className="border border-white/20 p-3">
      <summary className="cursor-pointer text-sm">Ce secret ne devrait pas disparaitre.</summary>
      <p className="void-muted mt-2 text-xs">Certaines voix ne devraient jamais s'eteindre.</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <RitualActionButton offerId="eternity_secret" label="OFFRIR — 1,99EUR" />
      </div>
    </details>
  );
}
