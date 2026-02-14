"use client";

import { useEffect, useState } from "react";
import { keepSecret } from "@/lib/keep";
import { deleteReply, pullSecret, releaseSecret, replySecret } from "@/lib/api";
import type { Secret } from "@/lib/types";
import { isMonetizationUnlocked } from "@/lib/monetization";
import { OfferEternity } from "@/components/offer-eternity";
import { OfferInk } from "@/components/offer-ink";
import { isFlagEnabled } from "@/lib/feature-flags";

function isEmptyPayload(value: unknown): value is { empty: true; message: string } {
  if (!value || typeof value !== "object") {
    return false;
  }
  return "empty" in value && "message" in value;
}

export function SecretReceiver() {
  const [currentSecret, setCurrentSecret] = useState<Secret | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isActioning, setIsActioning] = useState(false);
  const [ritualUnlocked, setRitualUnlocked] = useState(false);
  const [inkFlag, setInkFlag] = useState(false);
  const [eternityFlag, setEternityFlag] = useState(false);
  const [sealBroken, setSealBroken] = useState(false);
  const [visibleContent, setVisibleContent] = useState("");
  const [postedReplyId, setPostedReplyId] = useState<string | null>(null);
  const [graceDeadlineMs, setGraceDeadlineMs] = useState<number | null>(null);
  const [clockMs, setClockMs] = useState<number>(Date.now());

  useEffect(() => {
    setRitualUnlocked(isMonetizationUnlocked(7));
    setInkFlag(isFlagEnabled({ name: "ink_effect_test", rollout: 40 }));
    setEternityFlag(isFlagEnabled({ name: "eternity_offer_test", rollout: 15 }));
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setClockMs(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!currentSecret || !sealBroken) {
      return;
    }

    if (currentSecret.ink_effect !== "typewriter") {
      setVisibleContent(currentSecret.content);
      return;
    }

    setVisibleContent("");
    let index = 0;
    const interval = window.setInterval(() => {
      index += 1;
      setVisibleContent(currentSecret.content.slice(0, index));
      if (index >= currentSecret.content.length) {
        window.clearInterval(interval);
      }
    }, 20);

    return () => window.clearInterval(interval);
  }, [currentSecret, sealBroken]);

  async function onPull() {
    setIsLoading(true);
    setStatus("");
    try {
      const data = await pullSecret();
      if (isEmptyPayload(data)) {
        setCurrentSecret(null);
        setSealBroken(false);
        setVisibleContent("");
        setStatus(data.message);
      } else {
        setCurrentSecret(data);
        setReplyContent("");
        setPostedReplyId(null);
        setGraceDeadlineMs(null);
        setSealBroken(!data.is_sealed);
        setVisibleContent(data.is_sealed ? "" : data.content);
        setStatus("Secret recu.");
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Impossible de puiser.");
    } finally {
      setIsLoading(false);
    }
  }

  async function onReply() {
    if (!currentSecret || postedReplyId || replyContent.trim().length === 0 || replyContent.length > 300) {
      return;
    }
    setIsActioning(true);
    setStatus("");
    try {
      const reply = await replySecret(currentSecret.id, replyContent);
      setReplyContent("");
      setPostedReplyId(reply.id);
      setGraceDeadlineMs(Date.now() + 60 * 1000);
      setStatus("Echo depose.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Echec de la reponse.");
    } finally {
      setIsActioning(false);
    }
  }

  async function onUndoReply() {
    if (!postedReplyId || !graceDeadlineMs || Date.now() > graceDeadlineMs) {
      setStatus("Fenetre de grace expiree.");
      return;
    }
    setIsActioning(true);
    setStatus("");
    try {
      await deleteReply(postedReplyId);
      setPostedReplyId(null);
      setGraceDeadlineMs(null);
      setStatus("Echo retire.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Echec du retrait.");
    } finally {
      setIsActioning(false);
    }
  }

  async function onRelease() {
    if (!currentSecret) {
      return;
    }
    setIsActioning(true);
    setStatus("");
    try {
      await releaseSecret(currentSecret.id);
      setCurrentSecret(null);
      setReplyContent("");
      setPostedReplyId(null);
      setGraceDeadlineMs(null);
      setSealBroken(false);
      setVisibleContent("");
      setStatus("Secret relache.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Echec du relachement.");
    } finally {
      setIsActioning(false);
    }
  }

  function onKeep() {
    if (!currentSecret) {
      return;
    }
    keepSecret({
      id: currentSecret.id,
      content: currentSecret.content,
      keptAt: new Date().toISOString()
    });
    setStatus("Secret garde dans Mon Vide.");
  }

  const graceRemainingMs = graceDeadlineMs ? Math.max(0, graceDeadlineMs - clockMs) : 0;
  const showUndo = Boolean(postedReplyId && graceRemainingMs > 0);

  return (
    <section className="void-card" aria-labelledby="receiver-title">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="void-kicker mb-1">Etape 2</p>
          <h2 id="receiver-title" className="text-2xl font-semibold sm:text-3xl">
            Puiser
          </h2>
        </div>
        <button type="button" className="void-button" onClick={onPull} disabled={isLoading}>
          {isLoading ? "Recherche..." : "PUISER"}
        </button>
      </div>
      <div className="void-accent-line mb-4" />

      {!currentSecret ? (
        <p className="void-muted min-h-14 text-sm sm:text-base">
          {status || "Aucun secret dans les mains pour le moment."}
        </p>
      ) : (
        <div className="space-y-4">
          <article className="border border-white/30 bg-black/30 p-4">
            {currentSecret.is_sealed && !sealBroken ? (
              <div className="space-y-2">
                <p className="void-muted text-sm">Sceau {currentSecret.seal_type || "classique"} intact.</p>
                <button type="button" className="void-button text-sm" onClick={() => setSealBroken(true)}>
                  Briser le sceau
                </button>
              </div>
            ) : (
              <p className="whitespace-pre-wrap break-words text-base sm:text-lg">{visibleContent}</p>
            )}
          </article>

          {!postedReplyId ? (
            <div className="space-y-2">
              <label htmlFor="reply-input" className="void-label">
                Tu peux repondre. Ou ne rien dire.
              </label>
              <textarea
                id="reply-input"
                className="void-input min-h-24"
                maxLength={300}
                value={replyContent}
                onChange={(event) => setReplyContent(event.target.value)}
                placeholder="Une voix. Une fois."
              />
              <p className="void-muted text-sm">{300 - replyContent.length} restants</p>
            </div>
          ) : (
            <p className="void-muted text-sm">Ta voix est deposee.</p>
          )}

          <div className="flex flex-wrap gap-2">
            {!postedReplyId ? (
              <button
                type="button"
                className="void-button"
                onClick={onReply}
                disabled={isActioning || replyContent.trim().length === 0}
              >
                REPONDRE
              </button>
            ) : null}
            {showUndo ? (
              <button type="button" className="void-button" onClick={onUndoReply} disabled={isActioning}>
                RETIRER ({Math.ceil(graceRemainingMs / 1000)}s)
              </button>
            ) : null}
            <button type="button" className="void-button" onClick={onKeep}>
              GARDER
            </button>
            <button type="button" className="void-button" onClick={onRelease} disabled={isActioning}>
              LAISSER FILER
            </button>
          </div>
          <div className="space-y-2 pt-1">
            <OfferInk unlocked={ritualUnlocked && inkFlag} />
            <OfferEternity unlocked={ritualUnlocked && eternityFlag} />
          </div>
        </div>
      )}

      {status ? (
        <p className="mt-3 text-sm font-medium" aria-live="polite">
          {status}
        </p>
      ) : null}
    </section>
  );
}
