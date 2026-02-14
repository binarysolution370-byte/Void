import { NextRequest } from "next/server";
import { checkSinetPayPayment } from "@/lib/server/sinetpay";
import { savePurchaseFromSinetPay } from "@/lib/server/payments";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let body: unknown = null;
  let rawText = "";
  try {
    rawText = await request.text();
    body = rawText ? (JSON.parse(rawText) as unknown) : null;
  } catch {
    body = null;
  }

  let transactionId: string | null = null;
  if (typeof body === "object" && body !== null) {
    const candidate =
      (body as { cpm_trans_id?: unknown; transaction_id?: unknown }).cpm_trans_id ||
      (body as { cpm_trans_id?: unknown; transaction_id?: unknown }).transaction_id;
    if (typeof candidate === "string") {
      transactionId = candidate;
    }
  }

  if (!transactionId && rawText.includes("=")) {
    const params = new URLSearchParams(rawText);
    transactionId = params.get("cpm_trans_id") || params.get("transaction_id");
  }

  if (!transactionId || transactionId.trim().length === 0) {
    return new Response("missing transaction id", { status: 400 });
  }

  try {
    const result = await checkSinetPayPayment(transactionId);
    const status = (result.status || "").toUpperCase();

    if (status !== "ACCEPTED") {
      return new Response("ignored", { status: 200 });
    }

    let metadata: Record<string, string> = {};
    try {
      metadata = JSON.parse(result.metadata || "{}") as Record<string, string>;
    } catch {
      metadata = {};
    }

    const sessionId = metadata.session_id;
    const offerId = metadata.offer_id;
    if (!sessionId || !offerId) {
      return new Response("missing metadata", { status: 400 });
    }

    await savePurchaseFromSinetPay({
      sessionId,
      transactionId: result.transaction_id || transactionId,
      offerId,
      amount: (result.amount ?? 0) / 100,
      currency: result.currency || "XOF",
      status: "succeeded",
      metadata
    });

    return new Response("ok", { status: 200 });
  } catch (error) {
    return new Response(error instanceof Error ? error.message : "callback error", { status: 500 });
  }
}
