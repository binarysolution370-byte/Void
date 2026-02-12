"use client";

const FIRST_SEEN_KEY = "void_first_seen_at";

export function getFirstSeenAt(): number {
  if (typeof window === "undefined") {
    return Date.now();
  }

  const raw = localStorage.getItem(FIRST_SEEN_KEY);
  if (raw) {
    const parsed = Number(raw);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  const now = Date.now();
  localStorage.setItem(FIRST_SEEN_KEY, String(now));
  return now;
}

export function isMonetizationUnlocked(minDays = 7): boolean {
  const firstSeen = getFirstSeenAt();
  const deltaDays = (Date.now() - firstSeen) / (1000 * 60 * 60 * 24);
  return deltaDays >= minDays;
}
