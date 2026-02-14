import { NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { getOrCreateSessionId } from "@/lib/server/session";
import { containsBlockedWords, sanitizeSecretText } from "@/lib/server/sanitize";
import { getSupabaseServerClient } from "@/lib/server/supabase";
import { json } from "@/lib/server/http";
import { getBlockedWords } from "@/lib/server/env";
import { triggerFirstEchoNotification } from "@/lib/server/echo";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { sessionId, generated } = getOrCreateSessionId(request);
  const limit = await checkRateLimit("reply-secret", sessionId);
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
  if (content.length < 1 || content.length > 300) {
    return json(
      { error: "content must contain between 1 and 300 characters." },
      { status: 400, sessionId, generatedSession: generated }
    );
  }

  if (containsBlockedWords(content, getBlockedWords())) {
    return json(
      { error: "content contains blocked terms." },
      { status: 400, sessionId, generatedSession: generated }
    );
  }

  const supabase = getSupabaseServerClient();
  const { data: secret, error: secretError } = await supabase
    .from("secrets")
    .select("id, author_session_id")
    .eq("id", params.id)
    .maybeSingle();

  if (secretError) {
    return json({ error: secretError.message }, { status: 500, sessionId, generatedSession: generated });
  }

  if (!secret) {
    return json({ error: "Secret not found." }, { status: 404, sessionId, generatedSession: generated });
  }

  if (secret.author_session_id && secret.author_session_id === sessionId) {
    return json(
      { error: "You cannot reply to your own secret." },
      { status: 403, sessionId, generatedSession: generated }
    );
  }

  const { data: inserted, error: insertError } = await supabase
    .from("replies")
    .insert({
      secret_id: params.id,
      content,
      author_session_id: sessionId
    })
    .select("id, secret_id, content, created_at")
    .single();

  if (insertError || !inserted) {
    if (insertError?.code === "23505") {
      return json(
        { error: "You already replied to this secret." },
        { status: 409, sessionId, generatedSession: generated }
      );
    }
    return json({ error: insertError?.message ?? "Reply insert failed." }, { status: 500, sessionId, generatedSession: generated });
  }

  await triggerFirstEchoNotification({
    secretId: params.id
  });

  return json(
    {
      id: inserted.id,
      secret_id: inserted.secret_id,
      content: inserted.content,
      created_at: inserted.created_at
    },
    {
      status: 201,
      sessionId,
      generatedSession: generated,
      rateLimitRemaining: limit.remaining,
      rateLimitReset: limit.reset
    }
  );
}
