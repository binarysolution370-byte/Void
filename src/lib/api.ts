import { getSessionId } from "@/lib/session";
import { sanitizePlainText } from "@/lib/sanitize";
import type { ApiEmptyResponse, PaymentHistoryItem, PaymentIntentResponse, Secret } from "@/lib/types";

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

export async function replySecret(secretId: string, content: string): Promise<Secret> {
  return apiFetch<Secret>(`/api/secrets/${secretId}/reply`, {
    method: "POST",
    body: JSON.stringify({ content: sanitizePlainText(content) })
  });
}

export async function releaseSecret(secretId: string): Promise<{ ok: true }> {
  return apiFetch<{ ok: true }>(`/api/secrets/${secretId}/release`, {
    method: "POST"
  });
}

export async function createPaymentIntent(offerId: string): Promise<PaymentIntentResponse> {
  return apiFetch<PaymentIntentResponse>("/api/payments/create-payment-intent", {
    method: "POST",
    body: JSON.stringify({ offerId })
  });
}

export async function confirmPaymentIntent(paymentIntentId: string): Promise<{ ok: boolean; message: string }> {
  return apiFetch<{ ok: boolean; message: string }>("/api/payments/confirm", {
    method: "POST",
    body: JSON.stringify({ paymentIntentId })
  });
}

export async function getPaymentHistory(): Promise<{ items: PaymentHistoryItem[] }> {
  return apiFetch<{ items: PaymentHistoryItem[] }>("/api/payments/history");
}
