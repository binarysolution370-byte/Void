import { createHmac, timingSafeEqual } from "crypto";

interface EchoAccessPayload {
  secretId: string;
  exp: number;
}

function getSigningSecret(): string {
  const secret = process.env.VOID_ECHO_LINK_SECRET;
  if (secret && secret.trim().length > 0) {
    return secret.trim();
  }
  const fallback = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (fallback && fallback.trim().length > 0) {
    return fallback.trim();
  }
  throw new Error("Missing VOID_ECHO_LINK_SECRET");
}

function toBase64Url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(input: string): Buffer {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(normalized + padding, "base64");
}

function sign(input: string): string {
  return toBase64Url(createHmac("sha256", getSigningSecret()).update(input).digest());
}

export function createEchoAccessToken(secretId: string, ttlSeconds = 60 * 60 * 24 * 90): string {
  const payload: EchoAccessPayload = {
    secretId,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds
  };
  const payloadPart = toBase64Url(JSON.stringify(payload));
  const signaturePart = sign(payloadPart);
  return `${payloadPart}.${signaturePart}`;
}

export function verifyEchoAccessToken(token: string, expectedSecretId: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 2) {
    return false;
  }

  const [payloadPart, signaturePart] = parts;
  const expectedSig = sign(payloadPart);
  const sigA = Buffer.from(signaturePart);
  const sigB = Buffer.from(expectedSig);
  if (sigA.length !== sigB.length || !timingSafeEqual(sigA, sigB)) {
    return false;
  }

  try {
    const payload = JSON.parse(fromBase64Url(payloadPart).toString("utf8")) as EchoAccessPayload;
    if (payload.secretId !== expectedSecretId) {
      return false;
    }
    if (!Number.isFinite(payload.exp) || payload.exp < Math.floor(Date.now() / 1000)) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
