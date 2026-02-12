import type { KeptSecret } from "@/lib/types";

const KEPT_KEY = "void_kept";

export function getKeptSecrets(): KeptSecret[] {
  if (typeof window === "undefined") {
    return [];
  }

  const stored = localStorage.getItem(KEPT_KEY);
  if (!stored) {
    return [];
  }

  try {
    const parsed = JSON.parse(stored) as KeptSecret[];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed;
  } catch {
    return [];
  }
}

export function keepSecret(secret: KeptSecret): void {
  const kept = getKeptSecrets();
  const exists = kept.some((item) => item.id === secret.id);
  if (exists) {
    return;
  }
  kept.push(secret);
  localStorage.setItem(KEPT_KEY, JSON.stringify(kept));
}

export function removeKeptSecret(secretId: string): void {
  const kept = getKeptSecrets();
  const next = kept.filter((item) => item.id !== secretId);
  localStorage.setItem(KEPT_KEY, JSON.stringify(next));
}
