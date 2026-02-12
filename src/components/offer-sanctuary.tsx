"use client";

import { RitualActionButton } from "@/components/ritual-action-button";

export function OfferSanctuary({ unlocked }: { unlocked: boolean }) {
  if (!unlocked) {
    return null;
  }

  return (
    <details className="border border-white/20 p-3">
      <summary className="cursor-pointer text-sm">Tes secrets te survivent.</summary>
      <div className="mt-2 flex flex-wrap gap-2">
        <RitualActionButton offerId="sanctuary_monthly" label="1 mois — 1,99EUR" />
        <RitualActionButton offerId="sanctuary_yearly" label="1 an — 14,99EUR" />
        <RitualActionButton offerId="sanctuary_lifetime" label="A vie — 49,99EUR" />
      </div>
    </details>
  );
}
