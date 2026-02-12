import { NextRequest } from "next/server";
import { getOffering } from "@/lib/payments/catalog";
import { json } from "@/lib/server/http";
import { getOrCreateSessionId } from "@/lib/server/session";
import { getStripeClient } from "@/lib/server/stripe";

export async function POST(request: NextRequest) {
  const { sessionId, generated } = getOrCreateSessionId(request);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON payload." }, { status: 400, sessionId, generatedSession: generated });
  }

  const offerId = typeof body === "object" && body !== null ? (body as { offerId?: unknown }).offerId : null;
  if (typeof offerId !== "string") {
    return json({ error: "offerId is required." }, { status: 400, sessionId, generatedSession: generated });
  }

  const offering = getOffering(offerId);
  if (!offering) {
    return json({ error: "Unknown offering." }, { status: 404, sessionId, generatedSession: generated });
  }

  try {
    const stripe = getStripeClient();
    const origin = request.nextUrl.origin;
    const paymentIntent = await stripe.paymentIntents.create({
      amount: offering.amountEurCents,
      currency: "eur",
      automatic_payment_methods: {
        enabled: true
      },
      metadata: {
        session_id: sessionId,
        feature_type: offering.featureType,
        offer_id: offering.id
      },
      description: offering.label
    });

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${origin}/void?ritual=done&pi=${paymentIntent.id}`,
      cancel_url: `${origin}/void?ritual=cancel`,
      payment_intent_data: {
        metadata: {
          session_id: sessionId,
          feature_type: offering.featureType,
          offer_id: offering.id
        }
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            product_data: {
              name: offering.label
            },
            unit_amount: offering.amountEurCents
          }
        }
      ]
    });

    return json(
      {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        checkoutUrl: checkoutSession.url,
        offer: offering,
        copy: {
          title: "C'est fait.",
          subtitle: "Le geste est enregistre."
        }
      },
      { status: 200, sessionId, generatedSession: generated }
    );
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : "Stripe error." },
      { status: 500, sessionId, generatedSession: generated }
    );
  }
}
