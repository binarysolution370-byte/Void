import { NextRequest } from "next/server";
import { json } from "@/lib/server/http";
import { getOrCreateSessionId } from "@/lib/server/session";
import { getSupabaseServerClient } from "@/lib/server/supabase";

export async function GET(request: NextRequest) {
  const { sessionId, generated } = getOrCreateSessionId(request);
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("purchases")
    .select("id, feature_type, offer_id, amount, currency, created_at, expires_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return json({ error: error.message }, { status: 500, sessionId, generatedSession: generated });
  }

  return json(
    {
      items: data ?? []
    },
    { status: 200, sessionId, generatedSession: generated }
  );
}
