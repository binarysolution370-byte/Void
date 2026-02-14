import { NextRequest } from "next/server";
import { getOrCreateSessionId } from "@/lib/server/session";
import { getSupabaseServerClient } from "@/lib/server/supabase";
import { json } from "@/lib/server/http";

interface RouteParams {
  params: {
    id: string;
  };
}

const GRACE_PERIOD_MS = 60 * 1000;

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { sessionId, generated } = getOrCreateSessionId(request);
  const supabase = getSupabaseServerClient();

  const { data: reply, error: replyError } = await supabase
    .from("replies")
    .select("id, author_session_id, created_at, deleted_at")
    .eq("id", params.id)
    .maybeSingle();

  if (replyError) {
    return json({ error: replyError.message }, { status: 500, sessionId, generatedSession: generated });
  }

  if (!reply) {
    return json({ error: "Reply not found." }, { status: 404, sessionId, generatedSession: generated });
  }

  if (!reply.author_session_id || reply.author_session_id !== sessionId) {
    return json({ error: "Access denied." }, { status: 403, sessionId, generatedSession: generated });
  }

  if (reply.deleted_at) {
    return json({ error: "Reply already deleted." }, { status: 409, sessionId, generatedSession: generated });
  }

  const createdAtMs = new Date(reply.created_at).getTime();
  const nowMs = Date.now();
  if (!Number.isFinite(createdAtMs) || nowMs - createdAtMs > GRACE_PERIOD_MS) {
    return json(
      { error: "Grace window expired." },
      { status: 409, sessionId, generatedSession: generated }
    );
  }

  const { error: updateError } = await supabase
    .from("replies")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", params.id);

  if (updateError) {
    return json({ error: updateError.message }, { status: 500, sessionId, generatedSession: generated });
  }

  return json({ ok: true }, { status: 200, sessionId, generatedSession: generated });
}
