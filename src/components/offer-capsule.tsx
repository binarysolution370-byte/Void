"use client";

import { RitualActionButton } from "@/components/ritual-action-button";

export function OfferCapsule({ unlocked }: { unlocked: boolean }) {
  if (!unlocked) {
    return null;
  }

  return (
    <details className="border border-white/20 p-3">
      <summary className="cursor-pointer text-sm">Ce secret peut attendre.</summary>
      <p className="void-muted mt-2 text-xs">Tout le monde n'est pas pret aujourd'hui.</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <RitualActionButton offerId="capsule_1d" label="Demain — 0,49EUR" />
        <RitualActionButton offerId="capsule_7d" label="7 jours — 0,99EUR" />
        <RitualActionButton offerId="capsule_30d" label="30 jours — 1,99EUR" />
      </div>
    </details>
  );
}
