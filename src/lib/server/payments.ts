import { randomBytes } from "crypto";
import type Stripe from "stripe";
import { addDays } from "@/lib/server/time";
import { getOffering, type Offering } from "@/lib/payments/catalog";
import { getSupabaseServerClient } from "@/lib/server/supabase";

function computeExpiry(offering: Offering): string | null {
  if (!offering.durationDays) {
    return null;
  }
  return addDays(new Date(), offering.durationDays).toISOString();
}

export async function savePurchaseFromPaymentIntent(params: {
  sessionId: string;
  paymentIntent: Stripe.PaymentIntent;
}) {
  const { sessionId, paymentIntent } = params;
  const offerId = paymentIntent.metadata.offer_id;
  const offering = getOffering(offerId);
  if (!offering) {
    throw new Error(`Unknown offer: ${offerId}`);
  }

  const supabase = getSupabaseServerClient();
  const expiresAt = computeExpiry(offering);
  const amount = (paymentIntent.amount_received || paymentIntent.amount) / 100;
  const purchasePayload = {
    session_id: sessionId,
    feature_type: offering.featureType,
    offer_id: offering.id,
    amount,
    currency: (paymentIntent.currency || "eur").toUpperCase(),
    stripe_payment_intent_id: paymentIntent.id,
    status: paymentIntent.status,
    metadata: paymentIntent.metadata,
    expires_at: expiresAt
  };

  const { data: existingPurchase, error: existingError } = await supabase
    .from("purchases")
    .select("id")
    .eq("stripe_payment_intent_id", paymentIntent.id)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  let purchase:
    | {
        id: string;
      }
    | null = null;

  if (existingPurchase?.id) {
    const { data: updated, error: updateError } = await supabase
      .from("purchases")
      .update(purchasePayload)
      .eq("id", existingPurchase.id)
      .select("id")
      .single();

    if (updateError || !updated) {
      throw new Error(updateError?.message ?? "Failed to update purchase.");
    }
    purchase = updated;
  } else {
    const { data: inserted, error: insertError } = await supabase
      .from("purchases")
      .insert(purchasePayload)
      .select("id")
      .single();

    if (insertError || !inserted) {
      throw new Error(insertError?.message ?? "Failed to insert purchase.");
    }
    purchase = inserted;
  }

  await grantEntitlementFromOffering({
    sessionId,
    offering,
    purchaseId: purchase.id
  });

  return purchase;
}

export async function grantEntitlementFromOffering(params: {
  sessionId: string;
  offering: Offering;
  purchaseId: string;
}) {
  const { sessionId, offering, purchaseId } = params;
  const supabase = getSupabaseServerClient();
  const expiresAt = computeExpiry(offering);

  if (offering.featureType === "paper") {
    const paperId = offering.id.replace("paper_", "");
    await supabase.from("unlocked_papers").upsert(
      {
        session_id: sessionId,
        paper_id: paperId,
        purchase_id: purchaseId
      },
      { onConflict: "session_id,paper_id" }
    );
    return;
  }

  if (offering.featureType === "long_letter") {
    const maxChars = offering.id.includes("5000") ? 5000 : offering.id.includes("infinite") ? 50000 : 1000;
    await supabase.from("long_letter_entitlements").insert({
      session_id: sessionId,
      max_chars: maxChars,
      purchase_id: purchaseId,
      expires_at: expiresAt
    });
    return;
  }

  if (offering.featureType === "ink") {
    const inkEffect = offering.id.replace("ink_", "");
    await supabase.from("ink_entitlements").upsert(
      {
        session_id: sessionId,
        ink_effect: inkEffect,
        purchase_id: purchaseId
      },
      { onConflict: "session_id,ink_effect" }
    );
    return;
  }

  if (offering.featureType === "seal") {
    const sealType = offering.id.replace("seal_", "");
    await supabase.from("seal_entitlements").insert({
      session_id: sessionId,
      seal_type: sealType,
      remaining_uses: 1,
      purchase_id: purchaseId,
      expires_at: expiresAt
    });
    return;
  }

  if (offering.featureType === "gift") {
    const token = randomBytes(20).toString("hex");
    await supabase.from("gifted_voids").insert({
      giver_session_id: sessionId,
      gift_token: token,
      purchase_id: purchaseId,
      max_chars: 1000,
      seals_quota: 3,
      expires_at: expiresAt ?? addDays(new Date(), 30).toISOString()
    });
    return;
  }

  if (offering.featureType === "sanctuary") {
    const tier = offering.id.includes("yearly") ? "yearly" : offering.id.includes("lifetime") ? "lifetime" : "monthly";
    await supabase.from("sanctuary_access").insert({
      session_id: sessionId,
      tier,
      purchase_id: purchaseId,
      expires_at: expiresAt
    });
  }
}
