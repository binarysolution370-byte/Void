import { NextRequest } from "next/server";
import { json } from "@/lib/server/http";
import { getOrCreateSessionId } from "@/lib/server/session";
import { getSupabaseServerClient } from "@/lib/server/supabase";

export async function POST(request: NextRequest) {
  const { sessionId, generated } = getOrCreateSessionId(request);
  const supabase = getSupabaseServerClient();

  const { data: existing, error: existingError } = await supabase
    .from("site_visits")
    .select("id, visit_count")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (existingError) {
    return json({ error: existingError.message }, { status: 500, sessionId, generatedSession: generated });
  }

  const referrer = request.headers.get("referer");
  const userAgent = request.headers.get("user-agent");

  if (existing?.id) {
    const { error: updateError } = await supabase
      .from("site_visits")
      .update({
        last_seen_at: new Date().toISOString(),
        visit_count: (existing.visit_count ?? 0) + 1,
        user_agent: userAgent,
        referrer
      })
      .eq("id", existing.id);

    if (updateError) {
      return json({ error: updateError.message }, { status: 500, sessionId, generatedSession: generated });
    }
  } else {
    const { error: insertError } = await supabase.from("site_visits").insert({
      session_id: sessionId,
      first_seen_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
      visit_count: 1,
      user_agent: userAgent,
      referrer
    });

    if (insertError) {
      return json({ error: insertError.message }, { status: 500, sessionId, generatedSession: generated });
    }
  }

  return json({ ok: true }, { sessionId, generatedSession: generated });
}
