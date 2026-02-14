"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createSecret, setEchoOptIn } from "@/lib/api";
import { subscribeToEchoPush } from "@/lib/push";
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
  const [lastSecretId, setLastSecretId] = useState<string | null>(null);
  const [echoChoiceDone, setEchoChoiceDone] = useState(false);
  const [echoBusy, setEchoBusy] = useState(false);
  const [justDroppedUntil, setJustDroppedUntil] = useState<number>(0);
  const [ritualUnlocked, setRitualUnlocked] = useState(false);
  const [capsuleFlag, setCapsuleFlag] = useState(false);
  const [sealFlag, setSealFlag] = useState(false);

  const remaining = useMemo(() => MAX_CHARS - content.length, [content.length]);
  const canSubmit = content.trim().length > 0 && content.length <= MAX_CHARS && !isSubmitting;
  const counterValue = Math.max(0, remaining);
  const counterWarn = counterValue <= 20;
  const counterShake = remaining < 0;
  const showDropped = Date.now() < justDroppedUntil;

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
      const created = await createSecret(content);
      setContent("");
      setLastSecretId(created.id);
      setEchoChoiceDone(false);
      setJustDroppedUntil(Date.now() + 1500);
      setStatus("");
      onSuccess?.();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Echec de l'envoi.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onEnableEcho() {
    if (!lastSecretId || echoBusy) {
      return;
    }
    setEchoBusy(true);
    setEchoChoiceDone(true);
    if (typeof Notification !== "undefined") {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          setStatus("Notification refusee. Silence conserve.");
          setEchoChoiceDone(true);
          setEchoBusy(false);
          return;
        }
      } catch {
        // no-op
      }
    }

    try {
      const subscription = await subscribeToEchoPush();
      await setEchoOptIn(lastSecretId, true, undefined, subscription.toJSON());
      setStatus("Le geste est fait.");
      setEchoChoiceDone(true);
    } catch (error) {
      setStatus(error instanceof Error ? `Echo: ${error.message}` : "Impossible d'activer l'echo.");
      setEchoChoiceDone(false);
    } finally {
      setEchoBusy(false);
    }
  }

  async function onDisableEcho() {
    if (!lastSecretId || echoBusy) {
      return;
    }
    setEchoBusy(true);
    setEchoChoiceDone(true);
    try {
      await setEchoOptIn(lastSecretId, false);
      setStatus("Le secret part seul.");
      setEchoChoiceDone(true);
    } catch (error) {
      setStatus(error instanceof Error ? `Echo: ${error.message}` : "Impossible de valider ce choix.");
      setEchoChoiceDone(false);
    } finally {
      setEchoBusy(false);
    }
  }

  return (
    <section aria-label="Deposer un secret">
      <div className="void-glass void-form relative">
        <textarea
          id="secret-input"
          aria-label="Secret"
          className="void-textarea"
          value={content}
          maxLength={5000}
          onChange={(event) => setContent(event.target.value)}
          placeholder="ce que tu ne diras jamais a voix haute..."
          required
        />

        <div
          className={`void-counter ${counterWarn ? "void-counter--warn" : ""} ${counterShake ? "void-counter--shake" : ""}`}
          aria-live="polite"
        >
          {counterValue}
        </div>

        <form onSubmit={onSubmit}>
          <button type="submit" className="void-btn-primary" disabled={!canSubmit}>
            {isSubmitting ? "..." : showDropped ? "↑ lache" : "LACHER"}
          </button>
        </form>
      </div>

      {status ? (
        <p className="mt-3 text-[12px]" style={{ color: "var(--void-text-secondary)", fontWeight: 300 }} aria-live="polite">
          {status}
        </p>
      ) : null}

      {lastSecretId && !echoChoiceDone ? (
        <div className="mt-4 void-glass p-4" style={{ borderRadius: "12px" }}>
          <p className="text-[13px]" style={{ fontWeight: 300, color: "var(--void-text-secondary)" }}>
            Si le vide te repond, veux-tu le savoir ?
          </p>
          <div className="mt-3 flex gap-10">
            <button type="button" onClick={onEnableEcho} disabled={echoBusy} className="void-action" style={{ fontSize: 11 }}>
              oui
            </button>
            <button
              type="button"
              onClick={onDisableEcho}
              disabled={echoBusy}
              className="void-action void-action--release"
              style={{ fontSize: 11 }}
            >
              non
            </button>
          </div>
        </div>
      ) : null}

      {lastSecretId ? (
        <p className="mt-3 text-[11px]" style={{ color: "var(--void-text-ghost)", fontWeight: 300 }}>
          <Link className="underline underline-offset-4" href={`/echo/${lastSecretId}`}>
            Voir l&apos;echo de ce secret
          </Link>
        </p>
      ) : null}

      <details className="mt-4" style={{ borderTop: "1px solid var(--void-border)", paddingTop: 16 }}>
        <summary
          className="text-[11px]"
          style={{ cursor: "pointer", color: "var(--void-text-ghost)", letterSpacing: "0.1em", fontWeight: 300 }}
        >
          plus d&apos;espace
        </summary>
        <div className="mt-3 space-y-2">
          <OfferLongLetter currentLength={content.length} unlocked={ritualUnlocked} />
          <OfferCapsule unlocked={ritualUnlocked && capsuleFlag} />
          <OfferSeal unlocked={ritualUnlocked && sealFlag} />
          <SeasonalRitual unlocked={ritualUnlocked} />
        </div>
      </details>
    </section>
  );
}
