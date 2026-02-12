"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { createSecret } from "@/lib/api";
import { isMonetizationUnlocked } from "@/lib/monetization";
import { OfferCapsule } from "@/components/offer-capsule";
import { OfferLongLetter } from "@/components/offer-long-letter";
import { OfferSeal } from "@/components/offer-seal";
import { SeasonalRitual } from "@/components/seasonal-ritual";
import { isFlagEnabled } from "@/lib/feature-flags";

const MAX_CHARS = 300;

interface SecretFormProps {
  onSuccess?: () => void;
}

export function SecretForm({ onSuccess }: SecretFormProps) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [ritualUnlocked, setRitualUnlocked] = useState(false);
  const [capsuleFlag, setCapsuleFlag] = useState(false);
  const [sealFlag, setSealFlag] = useState(false);

  const remaining = useMemo(() => MAX_CHARS - content.length, [content.length]);
  const canSubmit = content.trim().length > 0 && content.length <= MAX_CHARS && !isSubmitting;

  useEffect(() => {
    setRitualUnlocked(isMonetizationUnlocked(7));
    setCapsuleFlag(isFlagEnabled({ name: "capsule_position_test", rollout: 20 }));
    setSealFlag(isFlagEnabled({ name: "seal_position_test", rollout: 20 }));
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }
    setIsSubmitting(true);
    setStatus("");
    try {
      await createSecret(content);
      setContent("");
      setStatus("Secret depose.");
      onSuccess?.();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Echec de l'envoi.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="void-card" aria-labelledby="drop-secret-title">
      <p className="void-kicker mb-1">Etape 1</p>
      <h2 id="drop-secret-title" className="mb-2 text-2xl font-semibold sm:text-3xl">
        Lacher un secret
      </h2>
      <div className="void-accent-line mb-4" />
      <p className="void-muted mb-4 text-sm">300 caracteres max. Aucune trace perso. Aucune reaction sociale.</p>
      <form className="space-y-3" onSubmit={onSubmit}>
        <label htmlFor="secret-input" className="void-label">
          Secret
        </label>
        <textarea
          id="secret-input"
          className="void-input min-h-28"
          value={content}
          maxLength={5000}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Ecris ici, puis laisse tomber."
          required
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="void-muted text-sm" aria-live="polite">
            {remaining} restants
          </p>
          <button type="submit" className="void-button" disabled={!canSubmit}>
            {isSubmitting ? "Envoi..." : "LACHER"}
          </button>
        </div>
        {status ? (
          <p className="text-sm font-medium" aria-live="polite">
            {status}
          </p>
        ) : null}
      </form>
      <div className="mt-4 space-y-2">
        <OfferLongLetter currentLength={content.length} unlocked={ritualUnlocked} />
        <OfferCapsule unlocked={ritualUnlocked && capsuleFlag} />
        <OfferSeal unlocked={ritualUnlocked && sealFlag} />
        <SeasonalRitual unlocked={ritualUnlocked} />
      </div>
    </section>
  );
}
