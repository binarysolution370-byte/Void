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
  const [replyOpen, setReplyOpen] = useState(false);

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
        setReplyOpen(false);
        setStatus(data.message);
      } else {
        setCurrentSecret(data);
        setReplyContent("");
        setPostedReplyId(null);
        setGraceDeadlineMs(null);
        setReplyOpen(false);
        setSealBroken(!data.is_sealed);
        setVisibleContent(data.is_sealed ? "" : data.content);
        setStatus("");
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
      setStatus("");
      setReplyOpen(false);
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
      setReplyOpen(false);
      setSealBroken(false);
      setVisibleContent("");
      setStatus("");
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
    <section aria-label="Puiser un secret">
      <p className="void-sep">— ou —</p>
      <div className="flex justify-center">
        <button type="button" className="void-btn-outline" onClick={onPull} disabled={isLoading}>
          {isLoading ? "..." : "PUISER"}
        </button>
      </div>

      {!currentSecret ? (
        <div className="mt-5 text-center">
          <p style={{ fontStyle: "italic", fontWeight: 300, color: "var(--void-text-ghost)", fontSize: 16 }}>
            {status || "le vide est silencieux pour l'instant."}
          </p>
          <p style={{ marginTop: 8, fontWeight: 300, fontSize: 10, letterSpacing: "0.1em", color: "var(--void-text-ghost)" }}>
            reviens plus tard
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          <article className="void-secretcard">
            {currentSecret.is_sealed && !sealBroken ? (
              <div>
                <p className="void-secretmeta">sceau intact</p>
                <div className="mt-3">
                  <button type="button" className="void-btn-outline" onClick={() => setSealBroken(true)}>
                    BRISER
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="void-secrettext">{visibleContent}</p>
                <p className="void-secretmeta">recu il y a quelques instants</p>
              </>
            )}
            <div className="void-actions" aria-label="Actions">
              <button type="button" className="void-action" onClick={() => setReplyOpen((v) => !v)} disabled={Boolean(postedReplyId)}>
                repondre
              </button>
              <button type="button" className="void-action void-action--keep" onClick={onKeep}>
                garder
              </button>
              <button type="button" className="void-action void-action--release" onClick={onRelease} disabled={isActioning}>
                laisser filer
              </button>
            </div>
          </article>

          {replyOpen && !postedReplyId ? (
            <div className="void-glass void-form relative" style={{ borderRadius: "12px", padding: 18 }}>
              <button
                type="button"
                aria-label="Fermer"
                onClick={() => setReplyOpen(false)}
                style={{
                  position: "absolute",
                  top: 10,
                  right: 12,
                  background: "transparent",
                  border: "none",
                  color: "var(--void-text-ghost)",
                  cursor: "pointer",
                  fontSize: 18
                }}
              >
                ×
              </button>
              <textarea
                aria-label="Reponse"
                className="void-textarea"
                maxLength={300}
                value={replyContent}
                onChange={(event) => setReplyContent(event.target.value)}
                placeholder="ta reponse part dans le vide..."
              />
              <div className={`void-counter ${300 - replyContent.length <= 20 ? "void-counter--warn" : ""}`}>
                {Math.max(0, 300 - replyContent.length)}
              </div>
              <div className="mt-3 flex justify-end">
                <button type="button" className="void-btn-primary" style={{ width: "auto", paddingInline: 22 }} onClick={onReply} disabled={isActioning || replyContent.trim().length === 0}>
                  ENVOYER
                </button>
              </div>
            </div>
          ) : null}

          {postedReplyId ? (
            <p style={{ fontWeight: 300, color: "var(--void-text-ghost)", fontSize: 12, fontStyle: "italic" }}>
              ta voix est deposee.
            </p>
          ) : null}

          {showUndo ? (
            <button type="button" className="void-btn-outline" onClick={onUndoReply} disabled={isActioning}>
              RETIRER ({Math.ceil(graceRemainingMs / 1000)}s)
            </button>
          ) : null}
          <div className="space-y-2 pt-1">
            <OfferInk unlocked={ritualUnlocked && inkFlag} />
            <OfferEternity unlocked={ritualUnlocked && eternityFlag} />
          </div>
        </div>
      )}

      {status ? (
        <p className="mt-3 text-[12px]" style={{ color: "var(--void-text-secondary)", fontWeight: 300 }} aria-live="polite">
          {status}
        </p>
      ) : null}
    </section>
  );
}
