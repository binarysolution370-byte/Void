"use client";

import { useState } from "react";
import { confirmPaymentIntent, createPaymentIntent } from "@/lib/api";

interface RitualActionButtonProps {
  offerId: string;
  label: string;
}

export function RitualActionButton({ offerId, label }: RitualActionButtonProps) {
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function onClick() {
    setLoading(true);
    setStatus("");
    try {
      const intent = await createPaymentIntent(offerId);
      if (intent.checkoutUrl) {
        window.location.assign(intent.checkoutUrl);
        return;
      }
      const confirmation = await confirmPaymentIntent(intent.paymentIntentId);
      setStatus(confirmation.message || "C'est fait.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Le rituel n'a pas pu etre prepare.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button type="button" className="void-button text-xs sm:text-sm" onClick={onClick} disabled={loading}>
        {loading ? "..." : label}
      </button>
      {status ? <span className="void-muted text-xs">{status}</span> : null}
    </div>
  );
}
