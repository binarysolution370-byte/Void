import { NextRequest } from "next/server";
import Stripe from "stripe";
import { getStripeWebhookSecret } from "@/lib/server/env";
import { savePurchaseFromPaymentIntent } from "@/lib/server/payments";
import { getStripeClient } from "@/lib/server/stripe";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing stripe-signature", { status: 400 });
  }

  const payload = await request.text();
  const webhookSecret = getStripeWebhookSecret();
  const stripe = getStripeClient();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    return new Response(error instanceof Error ? error.message : "Invalid webhook signature", { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const sessionId = paymentIntent.metadata.session_id;
    if (sessionId) {
      try {
        await savePurchaseFromPaymentIntent({ sessionId, paymentIntent });
      } catch (error) {
        return new Response(error instanceof Error ? error.message : "Failed to persist purchase", { status: 500 });
      }
    }
  }

  return new Response("ok", { status: 200 });
}
