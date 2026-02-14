import { getSessionId } from "@/lib/session";
import { sanitizePlainText } from "@/lib/sanitize";
import type { ApiEmptyResponse, PaymentHistoryItem, PaymentIntentResponse, Reply, Secret } from "@/lib/types";

interface ApiErrorPayload {
  error?: string;
  message?: string;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "x-session-id": getSessionId(),
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });

  if (!response.ok) {
    let payload: ApiErrorPayload | null = null;
    try {
      payload = (await response.json()) as ApiErrorPayload;
    } catch {
      payload = null;
    }
    throw new Error(payload?.error ?? payload?.message ?? "Erreur reseau.");
  }

  return (await response.json()) as T;
}

export async function createSecret(content: string): Promise<Secret> {
  return apiFetch<Secret>("/api/secrets", {
    method: "POST",
    body: JSON.stringify({ content: sanitizePlainText(content) })
  });
}

export async function pullSecret(): Promise<Secret | ApiEmptyResponse> {
  return apiFetch<Secret | ApiEmptyResponse>("/api/secrets/random");
}

export async function replySecret(secretId: string, content: string): Promise<Reply> {
  return apiFetch<Reply>(`/api/secrets/${secretId}/reply`, {
    method: "POST",
    body: JSON.stringify({ content: sanitizePlainText(content) })
  });
}

export async function deleteReply(replyId: string): Promise<{ ok: true }> {
  return apiFetch<{ ok: true }>(`/api/replies/${replyId}`, {
    method: "DELETE"
  });
}

export async function getEchoReplies(secretId: string, token?: string): Promise<{ secretId: string; replies: Reply[] }> {
  const suffix = token ? `?t=${encodeURIComponent(token)}` : "";
  return apiFetch<{ secretId: string; replies: Reply[] }>(`/api/secrets/${secretId}/replies${suffix}`);
}

export async function setEchoOptIn(
  secretId: string,
  enabled: boolean,
  pushToken?: string,
  pushSubscription?: unknown
): Promise<{ ok: true; enabled: boolean }> {
  return apiFetch<{ ok: true; enabled: boolean }>(`/api/secrets/${secretId}/echo-opt-in`, {
    method: "POST",
    body: JSON.stringify({ enabled, pushToken, pushSubscription })
  });
}

export async function releaseSecret(secretId: string): Promise<{ ok: true }> {
  return apiFetch<{ ok: true }>(`/api/secrets/${secretId}/release`, {
    method: "POST"
  });
}

export async function createPaymentIntent(
  offerId: string,
  paymentMethod: "stripe" | "sinetpay" = "stripe",
  mobileOperator?: "orange" | "mtn"
): Promise<PaymentIntentResponse> {
  return apiFetch<PaymentIntentResponse>("/api/payments/create-payment-intent", {
    method: "POST",
    body: JSON.stringify({ offerId, paymentMethod, mobileOperator })
  });
}

export async function confirmPaymentIntent(
  paymentIntentId: string,
  provider: "stripe" | "sinetpay" = "stripe"
): Promise<{ ok: boolean; message: string }> {
  return apiFetch<{ ok: boolean; message: string }>("/api/payments/confirm", {
    method: "POST",
    body: JSON.stringify({ paymentIntentId, provider })
  });
}

export async function getPaymentHistory(): Promise<{ items: PaymentHistoryItem[] }> {
  return apiFetch<{ items: PaymentHistoryItem[] }>("/api/payments/history");
}
