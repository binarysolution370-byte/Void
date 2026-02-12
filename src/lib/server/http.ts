import { NextResponse } from "next/server";
import { SESSION_HEADER_NAME } from "@/lib/server/session";

interface JsonOptions {
  status?: number;
  sessionId?: string;
  generatedSession?: boolean;
  rateLimitRemaining?: number;
  rateLimitReset?: number;
}

export function json<T>(payload: T, options: JsonOptions = {}) {
  const response = NextResponse.json(payload, { status: options.status ?? 200 });

  if (options.sessionId && options.generatedSession) {
    response.headers.set(SESSION_HEADER_NAME, options.sessionId);
  }

  if (typeof options.rateLimitRemaining === "number") {
    response.headers.set("x-ratelimit-remaining", String(options.rateLimitRemaining));
  }

  if (typeof options.rateLimitReset === "number") {
    response.headers.set("x-ratelimit-reset", String(options.rateLimitReset));
  }

  return response;
}
