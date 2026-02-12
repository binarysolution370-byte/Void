"use client";

import { RitualActionButton } from "@/components/ritual-action-button";

export function OfferPaper({ unlocked }: { unlocked: boolean }) {
  if (!unlocked) {
    return null;
  }

  return (
    <details className="border border-white/20 p-3">
      <summary className="cursor-pointer text-sm">Ce souvenir merite un plus bel ecrin.</summary>
      <div className="mt-2 flex flex-wrap gap-2">
        <RitualActionButton offerId="paper_parchment" label="Parchemin ancien — 0,49EUR" />
      </div>
    </details>
  );
}
