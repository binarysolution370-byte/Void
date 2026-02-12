"use client";

import { RitualActionButton } from "@/components/ritual-action-button";

export function OfferSeal({ unlocked }: { unlocked: boolean }) {
  if (!unlocked) {
    return null;
  }

  return (
    <details className="border border-white/20 p-3">
      <summary className="cursor-pointer text-sm">Ce secret merite d'etre protege.</summary>
      <p className="void-muted mt-2 text-xs">Ce secret n'est pas pour tout le monde.</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <RitualActionButton offerId="seal_classic" label="Apposer un sceau — 0,49EUR" />
      </div>
    </details>
  );
}
