"use client";

import { useEffect, useRef, useState } from "react";
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
  const [mirrorVisible, setMirrorVisible] = useState(false);
  const [mirrorDim, setMirrorDim] = useState(false);
  const mirrorTimerRef = useRef<number | null>(null);

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
    if (!currentSecret) {
      setMirrorVisible(false);
      setMirrorDim(false);
      if (mirrorTimerRef.current) {
        window.clearTimeout(mirrorTimerRef.current);
        mirrorTimerRef.current = null;
      }
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    if (sessionStorage.getItem("void_mirror_shown") === "true") {
      return;
    }

    if (mirrorTimerRef.current) {
      window.clearTimeout(mirrorTimerRef.current);
      mirrorTimerRef.current = null;
    }

    mirrorTimerRef.current = window.setTimeout(() => {
      setMirrorVisible(true);
      sessionStorage.setItem("void_mirror_shown", "true");
    }, 4000);

    return () => {
      if (mirrorTimerRef.current) {
        window.clearTimeout(mirrorTimerRef.current);
        mirrorTimerRef.current = null;
      }
    };
  }, [currentSecret]);

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

  function cancelMirror() {
    setMirrorVisible(false);
    if (mirrorTimerRef.current) {
      window.clearTimeout(mirrorTimerRef.current);
      mirrorTimerRef.current = null;
    }
  }

  function onMirrorWrite() {
    setMirrorDim(true);
    cancelMirror();
    window.dispatchEvent(new Event("void:pulseForm"));
    const target = document.getElementById("void-drop");
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
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
      <p className="void-sep">&mdash; ou &mdash;</p>
      <div className="flex justify-center">
        <button type="button" className="void-btn-outline" onClick={onPull} disabled={isLoading}>
          {isLoading ? "..." : "PUISER"}
        </button>
      </div>

      {!currentSecret ? (
        <div className="mt-5 text-center">
          <p className="void-empty">
            {status || "le vide est silencieux pour l'instant."}
          </p>
          <p className="void-empty-sub">
            reviens plus tard
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          <article className={`void-secretcard ${mirrorDim ? "void-secretcard--dim" : ""}`}>
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
              <button
                type="button"
                className="void-action"
                onClick={() => {
                  cancelMirror();
                  setReplyOpen((v) => !v);
                }}
                disabled={Boolean(postedReplyId)}
              >
                repondre
              </button>
              <button
                type="button"
                className="void-action void-action--keep"
                onClick={() => {
                  cancelMirror();
                  onKeep();
                }}
              >
                garder
              </button>
              <button
                type="button"
                className="void-action void-action--release"
                onClick={() => {
                  cancelMirror();
                  void onRelease();
                }}
                disabled={isActioning}
              >
                laisser filer
              </button>
            </div>

            {mirrorVisible ? (
              <div className="mirror-nudge" aria-label="Invitation a ecrire">
                <div className="mirror-line" />
                <p className="mirror-text">tu as lu leur secret. tu veux partager le tien ?</p>
                <button type="button" className="mirror-cta" onClick={onMirrorWrite}>
                  oui, ecrire quelque chose
                </button>
              </div>
            ) : null}
          </article>

          {replyOpen && !postedReplyId ? (
            <div className="void-glass void-glass--strong void-form void-form--compact relative">
              <button type="button" aria-label="Fermer" onClick={() => setReplyOpen(false)} className="void-close">&times;</button>
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
                <button type="button" className="void-btn-primary void-btn-primary--inline" onClick={onReply} disabled={isActioning || replyContent.trim().length === 0}>
                  ENVOYER
                </button>
              </div>
            </div>
          ) : null}

          {postedReplyId ? (
            <p className="void-note">
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
        <p className="void-status" aria-live="polite">
          {status}
        </p>
      ) : null}
    </section>
  );
}

