import { randomUUID } from "crypto";
import { getSinetPayEnv } from "@/lib/server/env";

interface InitSinetPayParams {
  amount: number;
  description: string;
  metadata: Record<string, string>;
  origin: string;
  mobileOperator?: "orange" | "mtn";
}

interface SinetPayInitResult {
  transactionId: string;
  paymentUrl: string;
}

export async function initSinetPayPayment(params: InitSinetPayParams): Promise<SinetPayInitResult> {
  const env = getSinetPayEnv();
  const transactionId = `void-${randomUUID()}`;
  const notifyUrl = `${params.origin}${env.notifyPath}`;
  const returnUrl = `${params.origin}${env.returnPath}?ritual=done&provider=sinetpay&tx=${transactionId}`;

  const response = await fetch(`${env.baseUrl}/v2/payment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      apikey: env.apiKey,
      site_id: env.siteId,
      transaction_id: transactionId,
      amount: Math.max(100, Math.round(params.amount)),
      currency: env.currency,
      description: params.description,
      notify_url: notifyUrl,
      return_url: returnUrl,
      channels: "MOBILE_MONEY",
      metadata: JSON.stringify({
        ...params.metadata,
        mobile_operator: params.mobileOperator ?? ""
      })
    })
  });

  const payload = (await response.json()) as {
    code?: string;
    message?: string;
    data?: { payment_url?: string };
  };

  const paymentUrl = payload?.data?.payment_url;
  if (!response.ok || !paymentUrl) {
    throw new Error(payload?.message || "SinetPay init failed.");
  }

  return {
    transactionId,
    paymentUrl
  };
}

export async function checkSinetPayPayment(transactionId: string) {
  const env = getSinetPayEnv();
  const response = await fetch(`${env.baseUrl}/v2/payment/check`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      apikey: env.apiKey,
      site_id: env.siteId,
      transaction_id: transactionId
    })
  });

  const payload = (await response.json()) as {
    code?: string;
    message?: string;
    data?: {
      status?: string;
      amount?: number;
      currency?: string;
      metadata?: string;
      transaction_id?: string;
    };
  };

  if (!response.ok || !payload.data) {
    throw new Error(payload?.message || "SinetPay check failed.");
  }

  return payload.data;
}
