"use client";

import { RitualActionButton } from "@/components/ritual-action-button";

interface OfferLongLetterProps {
  currentLength: number;
  unlocked: boolean;
}

export function OfferLongLetter({ currentLength, unlocked }: OfferLongLetterProps) {
  if (!unlocked || currentLength <= 300) {
    return null;
  }

  return (
    <details className="mt-2 border border-white/20 p-3">
      <summary className="cursor-pointer text-sm">Ta lettre est trop lourde pour le vide.</summary>
      <p className="void-muted mt-2 text-xs">Choisis la taille de ton silence.</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <RitualActionButton offerId="long_letter_1000" label="Ouvrir 1000 — 0,99EUR" />
        <RitualActionButton offerId="long_letter_5000" label="Ouvrir 5000 — 2,99EUR" />
        <RitualActionButton offerId="long_letter_infinite" label="Ouvrir infini — 9,99EUR" />
      </div>
    </details>
  );
}
