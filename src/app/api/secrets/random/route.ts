import { NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { getOrCreateSessionId } from "@/lib/server/session";
import { getSupabaseServerClient } from "@/lib/server/supabase";
import { json } from "@/lib/server/http";

export async function GET(request: NextRequest) {
  const { sessionId, generated } = getOrCreateSessionId(request);
  const limit = await checkRateLimit("pull-secret", sessionId);
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

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.rpc("pull_next_secret", { p_session_id: sessionId });

  if (error) {
    return json({ error: error.message }, { status: 500, sessionId, generatedSession: generated });
  }

  if (!data || data.length === 0) {
    return json(
      { empty: true, message: "Le vide est silencieux." },
      {
        status: 200,
        sessionId,
        generatedSession: generated,
        rateLimitRemaining: limit.remaining,
        rateLimitReset: limit.reset
      }
    );
  }

  const secret = data[0];
  return json(
    {
      id: secret.id,
      content: secret.content,
      created_at: secret.created_at,
      is_reply: secret.is_reply,
      parent_secret_id: secret.parent_secret_id,
      is_sealed: secret.is_sealed,
      seal_type: secret.seal_type,
      paper_id: secret.paper_id,
      ink_effect: secret.ink_effect
    },
    {
      status: 200,
      sessionId,
      generatedSession: generated,
      rateLimitRemaining: limit.remaining,
      rateLimitReset: limit.reset
    }
  );
}
