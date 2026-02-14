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
  const sinetPayEnabled = process.env.NEXT_PUBLIC_SINETPAY_ENABLED === "true";

  async function onClick(paymentMethod: "stripe" | "sinetpay" = "stripe", mobileOperator?: "orange" | "mtn") {
    setLoading(true);
    setStatus("");
    try {
      const intent = await createPaymentIntent(offerId, paymentMethod, mobileOperator);
      if (intent.checkoutUrl) {
        window.location.assign(intent.checkoutUrl);
        return;
      }
      const confirmation = await confirmPaymentIntent(intent.paymentIntentId, intent.provider ?? "stripe");
      setStatus(confirmation.message || "C'est fait.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Le rituel n'a pas pu etre prepare.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <button type="button" className="void-button text-xs sm:text-sm" onClick={() => onClick("stripe")} disabled={loading}>
          {loading ? "..." : label}
        </button>
        {status ? <span className="void-muted text-xs">{status}</span> : null}
      </div>
      {sinetPayEnabled ? (
        <div className="flex flex-wrap gap-2">
          <button type="button" className="void-button text-xs" onClick={() => onClick("sinetpay", "orange")} disabled={loading}>
            Orange Money
          </button>
          <button type="button" className="void-button text-xs" onClick={() => onClick("sinetpay", "mtn")} disabled={loading}>
            MTN Money
          </button>
        </div>
      ) : null}
    </div>
  );
}
