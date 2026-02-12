"use client";

import DOMPurify from "dompurify";

export function sanitizePlainText(input: string): string {
  const cleaned = DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  return cleaned.replace(/\s+/g, " ").trim();
}
