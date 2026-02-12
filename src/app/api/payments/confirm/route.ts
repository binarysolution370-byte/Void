import { NextRequest } from "next/server";
import { json } from "@/lib/server/http";
import { getOrCreateSessionId } from "@/lib/server/session";
import { savePurchaseFromPaymentIntent } from "@/lib/server/payments";
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
  if (typeof paymentIntentId !== "string") {
    return json({ error: "paymentIntentId is required." }, { status: 400, sessionId, generatedSession: generated });
  }

  try {
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
