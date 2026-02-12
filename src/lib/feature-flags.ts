"use client";

import { getVariant } from "@/lib/ab-testing";
import { getSessionId } from "@/lib/session";

interface FlagContext {
  name: string;
  rollout?: number;
}

export function isFlagEnabled(context: FlagContext): boolean {
  const sessionId = getSessionId();
  const variant = getVariant(sessionId, context.name);
  const baseEnabled = variant === "A";

  if (typeof context.rollout !== "number") {
    return baseEnabled;
  }

  const sample = Number.parseInt(sessionId.replaceAll("-", "").slice(0, 6), 16) % 100;
  return sample < context.rollout;
}
