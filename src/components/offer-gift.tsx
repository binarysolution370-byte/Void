"use client";

import { RitualActionButton } from "@/components/ritual-action-button";

export function OfferGift({ unlocked }: { unlocked: boolean }) {
  if (!unlocked) {
    return null;
  }

  return (
    <details className="border border-white/20 p-3">
      <summary className="cursor-pointer text-sm">Un vide pour deux.</summary>
      <p className="void-muted mt-2 text-xs">Quelqu'un quelque part a ouvert un vide pour toi.</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <RitualActionButton offerId="gift_void_for_two" label="OFFRIR — 4,99EUR" />
      </div>
    </details>
  );
}
