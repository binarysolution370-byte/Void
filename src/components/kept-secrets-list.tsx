"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { confirmPaymentIntent, getPaymentHistory } from "@/lib/api";
import { getKeptSecrets, removeKeptSecret } from "@/lib/keep";
import { isMonetizationUnlocked } from "@/lib/monetization";
import type { KeptSecret, PaymentHistoryItem } from "@/lib/types";
import { OfferGift } from "@/components/offer-gift";
import { OfferPaper } from "@/components/offer-paper";
import { OfferSanctuary } from "@/components/offer-sanctuary";
import { isFlagEnabled } from "@/lib/feature-flags";

function exportAsText(items: KeptSecret[]) {
  const lines = items.map((item) => `[${new Date(item.keptAt).toLocaleString("fr-FR")}]\n${item.content}\n`);
  const blob = new Blob([lines.join("\n---\n\n")], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "void-mon-vide.txt";
  anchor.click();
  URL.revokeObjectURL(url);
}

function exportAsImage(items: KeptSecret[]) {
  const width = 1200;
  const lineHeight = 36;
  const padding = 80;
  const height = Math.max(800, padding * 2 + items.length * lineHeight * 4);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }

  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 54px Trebuchet MS, Franklin Gothic Medium, Arial Narrow, sans-serif";
  ctx.fillText("VOID - Mon Vide", padding, padding);
  ctx.font = "400 28px Trebuchet MS, Franklin Gothic Medium, Arial Narrow, sans-serif";

  let y = padding + 80;
  items.forEach((item, index) => {
    const date = new Date(item.keptAt).toLocaleString("fr-FR");
    ctx.fillText(`#${index + 1}  ${date}`, padding, y);
    y += lineHeight;

    const words = item.content.split(" ");
    let line = "";
    words.forEach((word) => {
      const test = `${line}${word} `;
      if (ctx.measureText(test).width > width - padding * 2) {
        ctx.fillText(line.trim(), padding, y);
        y += lineHeight;
        line = `${word} `;
      } else {
        line = test;
      }
    });
    if (line.trim()) {
      ctx.fillText(line.trim(), padding, y);
      y += lineHeight;
    }
    y += lineHeight;
  });

  const url = canvas.toDataURL("image/png");
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "void-mon-vide.png";
  anchor.click();
}

export function KeptSecretsList() {
  const [items, setItems] = useState<KeptSecret[]>([]);
  const [history, setHistory] = useState<PaymentHistoryItem[]>([]);
  const [ritualStatus, setRitualStatus] = useState("");
  const [ritualUnlocked, setRitualUnlocked] = useState(false);
  const [giftFlag, setGiftFlag] = useState(false);
  const [sanctuaryFlag, setSanctuaryFlag] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    setItems(getKeptSecrets().sort((a, b) => (a.keptAt < b.keptAt ? 1 : -1)));
    setRitualUnlocked(isMonetizationUnlocked(7));
    setGiftFlag(isFlagEnabled({ name: "gift_cta_test", rollout: 30 }));
    setSanctuaryFlag(isFlagEnabled({ name: "sanctuary_cta_test", rollout: 30 }));
    getPaymentHistory()
      .then((result) => setHistory(result.items))
      .catch(() => setHistory([]));
  }, []);

  useEffect(() => {
    const ritual = searchParams.get("ritual");
    const pi = searchParams.get("pi");
    const tx = searchParams.get("tx");
    const provider = searchParams.get("provider");
    if (ritual === "done" && (pi || tx)) {
      const id = pi || tx || "";
      const effectiveProvider = provider === "sinetpay" ? "sinetpay" : "stripe";
      confirmPaymentIntent(id, effectiveProvider)
        .then((result) => {
          setRitualStatus(result.message || "C'est fait.");
          return getPaymentHistory();
        })
        .then((result) => setHistory(result.items))
        .catch((error) => setRitualStatus(error instanceof Error ? error.message : "Le rituel a echoue."));
      return;
    }
    if (ritual === "cancel") {
      setRitualStatus("Le rituel est reste en suspens.");
    }
  }, [searchParams]);

  const hasItems = items.length > 0;
  const itemCountLabel = useMemo(() => `${items.length} secret${items.length > 1 ? "s" : ""}`, [items.length]);

  function onDelete(id: string) {
    removeKeptSecret(id);
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <section className="void-card" aria-labelledby="kept-title">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="void-kicker mb-1">Memoire locale</p>
          <h1 id="kept-title" className="text-2xl font-semibold sm:text-3xl">
            Mon Vide
          </h1>
          <p className="void-muted text-sm">{itemCountLabel}</p>
        </div>
        {hasItems ? (
          <div className="flex flex-wrap gap-2">
            <button type="button" className="void-button text-sm" onClick={() => exportAsText(items)}>
              EXPORT TXT
            </button>
            <button type="button" className="void-button text-sm" onClick={() => exportAsImage(items)}>
              EXPORT PNG
            </button>
          </div>
        ) : null}
      </div>
      <div className="void-accent-line mb-4" />

      {!hasItems ? (
        <p className="void-muted text-sm">Rien de garde pour le moment.</p>
      ) : (
        <ul className="space-y-3" aria-label="Secrets gardes">
          {items.map((item) => (
            <li key={item.id} className="border border-white/30 bg-black/25 p-4">
              <p className="mb-3 whitespace-pre-wrap break-words">{item.content}</p>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <time className="void-muted text-sm" dateTime={item.keptAt}>
                  {new Date(item.keptAt).toLocaleString("fr-FR")}
                </time>
                <button type="button" className="void-button text-sm" onClick={() => onDelete(item.id)}>
                  SUPPRIMER
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 space-y-2">
        <OfferPaper unlocked={ritualUnlocked} />
        <OfferGift unlocked={ritualUnlocked && giftFlag} />
        <OfferSanctuary unlocked={ritualUnlocked && sanctuaryFlag} />
      </div>

      {ritualStatus ? <p className="mt-3 text-sm">{ritualStatus}</p> : null}
      {history.length > 0 ? (
        <div className="mt-4 border border-white/20 p-3">
          <p className="void-muted text-xs uppercase">Rituels passes</p>
          <ul className="mt-2 space-y-1">
            {history.slice(0, 5).map((item) => (
              <li key={item.id} className="text-xs">
                {item.offer_id} - {item.amount.toFixed(2)} {item.currency}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
