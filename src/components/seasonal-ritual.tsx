"use client";

import { useMemo } from "react";
import { RitualActionButton } from "@/components/ritual-action-button";

function getSeasonalLabel(date: Date): { label: string; active: boolean } {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  if (month === 2 && day === 14) {
    return { label: "Lettre jamais envoyee", active: true };
  }
  if (month === 10 && day === 31) {
    return { label: "Message de l'au-dela", active: true };
  }
  if (month === 1 && day === 1) {
    return { label: "Voeux secrets", active: true };
  }
  return { label: "Papier Nuit", active: false };
}

export function SeasonalRitual({ unlocked }: { unlocked: boolean }) {
  const now = useMemo(() => new Date(), []);
  const hour = now.getHours();
  const nightWindow = hour === 23 || hour === 0;
  const seasonal = getSeasonalLabel(now);

  if (!unlocked || (!nightWindow && !seasonal.active)) {
    return null;
  }

  return (
    <details className="border border-white/20 p-3">
      <summary className="cursor-pointer text-sm">La nuit porte les secrets.</summary>
      <p className="void-muted mt-2 text-xs">Presence discrete. Pas d'urgence.</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <RitualActionButton offerId="long_letter_1000" label="Longue lettre -30%" />
        <RitualActionButton offerId="capsule_7d" label="Capsule -20%" />
        <RitualActionButton offerId="paper_parchment" label={`${seasonal.label} — 0,99EUR`} />
      </div>
    </details>
  );
}
