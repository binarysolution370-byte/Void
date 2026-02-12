import { randomUUID } from "crypto";
import { NextRequest } from "next/server";

const SESSION_HEADER = "x-session-id";

function normalize(input: string): string {
  return input.trim().slice(0, 128);
}

export function getOrCreateSessionId(request: NextRequest): {
  sessionId: string;
  generated: boolean;
} {
  const headerValue = request.headers.get(SESSION_HEADER);
  if (headerValue && headerValue.trim().length > 0) {
    return { sessionId: normalize(headerValue), generated: false };
  }
  return { sessionId: randomUUID(), generated: true };
}

export const SESSION_HEADER_NAME = SESSION_HEADER;
