import { NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { getOrCreateSessionId } from "@/lib/server/session";
import { containsBlockedWords, sanitizeSecretText } from "@/lib/server/sanitize";
import { getSupabaseServerClient } from "@/lib/server/supabase";
import { json } from "@/lib/server/http";
import { getBlockedWords } from "@/lib/server/env";

export async function POST(request: NextRequest) {
  const { sessionId, generated } = getOrCreateSessionId(request);
  try {
    const limit = await checkRateLimit("create-secret", sessionId);
    if (!limit.success) {
      return json(
        { error: "Rate limit exceeded. Try again later." },
        {
          status: 429,
          sessionId,
          generatedSession: generated,
          rateLimitRemaining: limit.remaining,
          rateLimitReset: limit.reset
        }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON payload." }, { status: 400, sessionId, generatedSession: generated });
    }

    const rawContent = typeof body === "object" && body !== null ? (body as { content?: unknown }).content : null;
    if (typeof rawContent !== "string") {
      return json({ error: "content must be a string." }, { status: 400, sessionId, generatedSession: generated });
    }

    const content = sanitizeSecretText(rawContent);
    const supabase = getSupabaseServerClient();
    const nowIso = new Date().toISOString();
    const { data: longLetter } = await supabase
      .from("long_letter_entitlements")
      .select("max_chars, expires_at")
      .eq("session_id", sessionId)
      .or(`expires_at.is.null,expires_at.gte.${nowIso}`)
      .order("max_chars", { ascending: false })
      .limit(1)
      .maybeSingle();

    const maxCharsAllowed = longLetter?.max_chars ?? 300;
    if (content.length < 1 || content.length > maxCharsAllowed) {
      return json(
        { error: `content must contain between 1 and ${maxCharsAllowed} characters.` },
        { status: 400, sessionId, generatedSession: generated }
      );
    }

    if (containsBlockedWords(content, getBlockedWords())) {
      return json(
        { error: "content contains blocked terms." },
        { status: 400, sessionId, generatedSession: generated }
      );
    }

    const duplicateWindowIso = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: duplicate, error: duplicateError } = await supabase
      .from("secrets")
      .select("id")
      .eq("content", content)
      .gte("created_at", duplicateWindowIso)
      .limit(1);

    if (duplicateError) {
      return json({ error: duplicateError.message }, { status: 500, sessionId, generatedSession: generated });
    }

    if (duplicate && duplicate.length > 0) {
      return json(
        { error: "Duplicate secret detected in the last 5 minutes." },
        { status: 409, sessionId, generatedSession: generated }
      );
    }

    const deliverAtValue =
      typeof body === "object" && body !== null ? (body as { deliverAt?: unknown }).deliverAt : undefined;
    const isSealedValue =
      typeof body === "object" && body !== null ? (body as { isSealed?: unknown }).isSealed : undefined;
    const sealTypeValue =
      typeof body === "object" && body !== null ? (body as { sealType?: unknown }).sealType : undefined;
    const paperIdValue =
      typeof body === "object" && body !== null ? (body as { paperId?: unknown }).paperId : undefined;
    const inkEffectValue =
      typeof body === "object" && body !== null ? (body as { inkEffect?: unknown }).inkEffect : undefined;

    let deliverAfter: string | null = null;
    if (typeof deliverAtValue === "string") {
      const parsedDeliver = new Date(deliverAtValue);
      if (Number.isNaN(parsedDeliver.getTime())) {
        return json({ error: "deliverAt is invalid." }, { status: 400, sessionId, generatedSession: generated });
      }
      deliverAfter = parsedDeliver.toISOString();
    }
    const isSealed = typeof isSealedValue === "boolean" ? isSealedValue : false;
    const sealType = typeof sealTypeValue === "string" ? sealTypeValue : null;
    const paperId = typeof paperIdValue === "string" ? paperIdValue : null;
    const inkEffect = typeof inkEffectValue === "string" ? inkEffectValue : null;

    const { data: inserted, error: insertError } = await supabase
      .from("secrets")
      .insert({
        content,
        author_session_id: sessionId,
        is_reply: false,
        deliver_after: deliverAfter,
        is_sealed: isSealed,
        seal_type: sealType,
        paper_id: paperId,
        ink_effect: inkEffect
      })
      .select(
        "id, content, created_at, is_reply, parent_secret_id, is_sealed, seal_type, paper_id, ink_effect, author_session_id"
      )
      .single();

    if (insertError || !inserted) {
      return json(
        { error: insertError?.message ?? "Insert failed." },
        { status: 500, sessionId, generatedSession: generated }
      );
    }

    return json(inserted, {
      status: 201,
      sessionId,
      generatedSession: generated,
      rateLimitRemaining: limit.remaining,
      rateLimitReset: limit.reset
    });
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : "Internal error." },
      { status: 500, sessionId, generatedSession: generated }
    );
  }
}
