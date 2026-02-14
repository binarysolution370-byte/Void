import { NextRequest } from "next/server";
import { getOffering } from "@/lib/payments/catalog";
import { json } from "@/lib/server/http";
import { getOrCreateSessionId } from "@/lib/server/session";
import { initSinetPayPayment } from "@/lib/server/sinetpay";
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
  const paymentMethod =
    typeof body === "object" && body !== null ? (body as { paymentMethod?: unknown }).paymentMethod : "stripe";
  const mobileOperator =
    typeof body === "object" && body !== null ? (body as { mobileOperator?: unknown }).mobileOperator : undefined;
  if (typeof offerId !== "string") {
    return json({ error: "offerId is required." }, { status: 400, sessionId, generatedSession: generated });
  }

  if (typeof paymentMethod !== "string" || !["stripe", "sinetpay"].includes(paymentMethod)) {
    return json(
      { error: "paymentMethod must be stripe or sinetpay." },
      { status: 400, sessionId, generatedSession: generated }
    );
  }

  const offering = getOffering(offerId);
  if (!offering) {
    return json({ error: "Unknown offering." }, { status: 404, sessionId, generatedSession: generated });
  }

  try {
    const origin = request.nextUrl.origin;

    if (paymentMethod === "sinetpay") {
      const sinet = await initSinetPayPayment({
        amount: offering.amountEurCents,
        description: offering.label,
        origin,
        mobileOperator: mobileOperator === "orange" || mobileOperator === "mtn" ? mobileOperator : undefined,
        metadata: {
          session_id: sessionId,
          feature_type: offering.featureType,
          offer_id: offering.id
        }
      });

      return json(
        {
          paymentIntentId: sinet.transactionId,
          clientSecret: null,
          checkoutUrl: sinet.paymentUrl,
          provider: "sinetpay",
          offer: offering,
          copy: {
            title: "C'est fait.",
            subtitle: "Le geste est enregistre."
          }
        },
        { status: 200, sessionId, generatedSession: generated }
      );
    }

    const stripe = getStripeClient();
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
        provider: "stripe",
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
