import { NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { getOrCreateSessionId } from "@/lib/server/session";
import { containsBlockedWords, sanitizeSecretText } from "@/lib/server/sanitize";
import { getSupabaseServerClient } from "@/lib/server/supabase";
import { json } from "@/lib/server/http";
import { getBlockedWords } from "@/lib/server/env";

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
  if (content.length < 1 || content.length > 200) {
    return json(
      { error: "content must contain between 1 and 200 characters." },
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
  const { data, error } = await supabase.rpc("create_reply", {
    p_target_secret_id: params.id,
    p_content: content
  });

  if (error) {
    if (error.message.includes("reply_limit_reached")) {
      return json(
        { error: "This secret already received its allowed reply." },
        { status: 409, sessionId, generatedSession: generated }
      );
    }
    return json({ error: error.message }, { status: 500, sessionId, generatedSession: generated });
  }

  if (!data || data.length === 0) {
    return json({ error: "Secret not found." }, { status: 404, sessionId, generatedSession: generated });
  }

  const inserted = data[0];
  return json(
    {
      id: inserted.id,
      content: inserted.content,
      created_at: inserted.created_at,
      is_reply: inserted.is_reply,
      parent_secret_id: inserted.parent_secret_id
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
