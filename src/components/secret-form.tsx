"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type React from "react";
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
  const [placeholder, setPlaceholder] = useState("ce que tu ne diras jamais a voix haute...");
  const [placeholderFading, setPlaceholderFading] = useState(false);
  const [nudgePulse, setNudgePulse] = useState(false);
  const [releasePhase, setReleasePhase] = useState<"idle" | "releasing" | "silence" | "confirm">("idle");
  const [floatFragment, setFloatFragment] = useState<null | { text: string; left: number; top: number; tiltDeg: number }>(
    null
  );
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

  useEffect(() => {
    function onPulse() {
      setNudgePulse(true);
      window.setTimeout(() => setNudgePulse(false), 650);
    }
    window.addEventListener("void:pulseForm", onPulse as EventListener);
    return () => window.removeEventListener("void:pulseForm", onPulse as EventListener);
  }, []);

  useEffect(() => {
    // Writing nudge: 8s desktop / 12s mobile, cancelled on focus or typing.
    if (releasePhase !== "idle") {
      return;
    }
    const mobile = typeof window !== "undefined" ? window.matchMedia("(max-width: 768px)").matches : false;
    const firstDelay = mobile ? 12000 : 8000;
    const secondDelay = mobile ? 24000 : 20000;

    let interacted = false;
    let t1 = 0;
    let t2 = 0;
    let fade1 = 0;
    let fade2 = 0;

    function stop() {
      interacted = true;
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(fade1);
      window.clearTimeout(fade2);
    }

    function onFocus() {
      stop();
    }

    function onType() {
      if (content.trim().length > 0) {
        stop();
      }
    }

    const textarea = document.getElementById("secret-input");
    textarea?.addEventListener("focus", onFocus);

    t1 = window.setTimeout(() => {
      if (interacted) return;
      const pool = [
        "qu'est-ce que tu gardes pour toi en ce moment ?",
        "il y a quelque chose que tu n'as jamais dit ?",
        "ici personne ne saura que c'est toi.",
        "ecris. lache. disparais.",
        "qu'est-ce qui pese ce soir ?",
        "personne ne juge ici.",
        "tu peux tout dire. vraiment."
      ];
      const next = pool[Math.floor(Math.random() * pool.length)] ?? pool[0];
      setPlaceholderFading(true);
      fade1 = window.setTimeout(() => {
        setPlaceholder(next);
        fade2 = window.setTimeout(() => setPlaceholderFading(false), 300);
      }, 300);
    }, firstDelay);

    t2 = window.setTimeout(() => {
      if (interacted) return;
      setNudgePulse(true);
      window.setTimeout(() => setNudgePulse(false), 650);
    }, secondDelay);

    onType();

    return () => {
      textarea?.removeEventListener("focus", onFocus);
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, releasePhase]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }
    setIsSubmitting(true);
    setStatus("");
    try {
      const beforeText = content;
      const created = await createSecret(content);
      // Release animation orchestration
      const formEl = document.getElementById("void-drop");
      if (formEl) {
        const rect = formEl.getBoundingClientRect();
        const tiltDeg = Math.random() < 0.5 ? -2 : 2;
        setFloatFragment({
          text: beforeText.length > 60 ? `${beforeText.slice(0, 57).trim()}...` : beforeText,
          left: Math.round(rect.left + rect.width * 0.12),
          top: Math.round(rect.top + rect.height * 0.45),
          tiltDeg
        });
        window.setTimeout(() => setFloatFragment(null), 1250);
      }

      setReleasePhase(window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "confirm" : "releasing");
      window.setTimeout(() => setReleasePhase("silence"), 400);
      window.setTimeout(() => setReleasePhase("confirm"), 900);
      window.setTimeout(() => setReleasePhase("idle"), 1400);

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
    <section aria-label="Deposer un secret" id="void-drop">
      <div
        className={`void-glass void-glass--strong void-form relative ${nudgePulse ? "void-form--nudge" : ""} ${releasePhase === "releasing" ? "void-form--releasing" : ""}`}
      >
        <textarea
          id="secret-input"
          aria-label="Secret"
          className="void-textarea"
          value={content}
          maxLength={5000}
          onChange={(event) => setContent(event.target.value)}
          placeholder={placeholder}
          style={{ opacity: placeholderFading ? 0 : 1, transition: "opacity 300ms ease" }}
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

        {releasePhase === "confirm" ? <div className="void-release-center">lache.</div> : null}
      </div>

      {floatFragment ? (
        <div
          className="void-release-float"
          style={
            {
              left: floatFragment.left,
              top: floatFragment.top,
              ["--tilt" as never]: `${floatFragment.tiltDeg}deg`
            } as React.CSSProperties
          }
        >
          {floatFragment.text}
        </div>
      ) : null}

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
