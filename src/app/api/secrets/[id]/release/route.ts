import { NextRequest } from "next/server";
import { getOrCreateSessionId } from "@/lib/server/session";
import { getSupabaseServerClient } from "@/lib/server/supabase";
import { json } from "@/lib/server/http";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { sessionId, generated } = getOrCreateSessionId(request);
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("secrets")
    .update({
      is_delivered: false,
      delivered_at: null,
      receiver_session_id: null
    })
    .eq("id", params.id)
    .eq("receiver_session_id", sessionId)
    .select("id")
    .maybeSingle();

  if (error) {
    return json({ error: error.message }, { status: 500, sessionId, generatedSession: generated });
  }

  if (!data?.id) {
    return json(
      { error: "Secret not found or session mismatch." },
      { status: 404, sessionId, generatedSession: generated }
    );
  }

  return json({ ok: true }, { status: 200, sessionId, generatedSession: generated });
}
