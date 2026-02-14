import { NextRequest } from "next/server";
import { json } from "@/lib/server/http";
import { getOrCreateSessionId } from "@/lib/server/session";
import { savePurchaseFromPaymentIntent, savePurchaseFromSinetPay } from "@/lib/server/payments";
import { checkSinetPayPayment } from "@/lib/server/sinetpay";
import { getStripeClient } from "@/lib/server/stripe";

export async function POST(request: NextRequest) {
  const { sessionId, generated } = getOrCreateSessionId(request);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON payload." }, { status: 400, sessionId, generatedSession: generated });
  }

  const paymentIntentId =
    typeof body === "object" && body !== null ? (body as { paymentIntentId?: unknown }).paymentIntentId : null;
  const provider = typeof body === "object" && body !== null ? (body as { provider?: unknown }).provider : "stripe";
  if (typeof paymentIntentId !== "string") {
    return json({ error: "paymentIntentId is required." }, { status: 400, sessionId, generatedSession: generated });
  }
  if (provider !== "stripe" && provider !== "sinetpay") {
    return json({ error: "provider is invalid." }, { status: 400, sessionId, generatedSession: generated });
  }

  try {
    if (provider === "sinetpay") {
      const result = await checkSinetPayPayment(paymentIntentId);
      const metadataRaw = result.metadata || "{}";
      let metadata: Record<string, string> = {};
      try {
        metadata = JSON.parse(metadataRaw) as Record<string, string>;
      } catch {
        metadata = {};
      }

      const offerId = metadata.offer_id;
      const effectiveSession = metadata.session_id || sessionId;
      if (!offerId) {
        return json({ error: "Missing offer_id in metadata." }, { status: 400, sessionId, generatedSession: generated });
      }

      const status = (result.status || "").toUpperCase();
      if (status !== "ACCEPTED") {
        return json(
          {
            ok: false,
            status,
            message: "Le rituel n'est pas termine."
          },
          { status: 409, sessionId, generatedSession: generated }
        );
      }

      const purchase = await savePurchaseFromSinetPay({
        sessionId: effectiveSession,
        transactionId: result.transaction_id || paymentIntentId,
        offerId,
        amount: (result.amount ?? 0) / 100,
        currency: result.currency || "XOF",
        status: "succeeded",
        metadata
      });

      return json(
        {
          ok: true,
          message: "C'est fait.",
          purchase
        },
        { status: 200, sessionId, generatedSession: generated }
      );
    }

    const stripe = getStripeClient();
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== "succeeded") {
      return json(
        {
          ok: false,
          status: paymentIntent.status,
          message: "Le rituel n'est pas termine."
        },
        { status: 409, sessionId, generatedSession: generated }
      );
    }

    const purchase = await savePurchaseFromPaymentIntent({
      sessionId: paymentIntent.metadata.session_id || sessionId,
      paymentIntent
    });

    return json(
      {
        ok: true,
        message: "C'est fait.",
        purchase
      },
      { status: 200, sessionId, generatedSession: generated }
    );
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : "Stripe confirm error." },
      { status: 500, sessionId, generatedSession: generated }
    );
  }
}
