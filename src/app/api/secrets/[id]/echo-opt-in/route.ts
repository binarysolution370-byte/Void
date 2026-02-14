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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON payload." }, { status: 400, sessionId, generatedSession: generated });
  }

  const enabled = typeof body === "object" && body !== null ? (body as { enabled?: unknown }).enabled : undefined;
  const pushToken =
    typeof body === "object" && body !== null ? (body as { pushToken?: unknown }).pushToken : undefined;
  const pushSubscription =
    typeof body === "object" && body !== null ? (body as { pushSubscription?: unknown }).pushSubscription : undefined;

  if (typeof enabled !== "boolean") {
    return json({ error: "enabled must be a boolean." }, { status: 400, sessionId, generatedSession: generated });
  }

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

  if (!secret.author_session_id || secret.author_session_id !== sessionId) {
    return json({ error: "Access denied." }, { status: 403, sessionId, generatedSession: generated });
  }

  if (!enabled) {
    const { error: deleteError } = await supabase.from("notification_tokens").delete().eq("secret_id", params.id);
    if (deleteError) {
      return json({ error: deleteError.message }, { status: 500, sessionId, generatedSession: generated });
    }
    return json({ ok: true, enabled: false }, { status: 200, sessionId, generatedSession: generated });
  }

  let tokenToStore: string | null = null;
  if (typeof pushSubscription === "object" && pushSubscription !== null) {
    tokenToStore = JSON.stringify(pushSubscription);
  } else if (typeof pushToken === "string" && pushToken.trim().length > 0) {
    tokenToStore = pushToken.trim();
  }

  if (!tokenToStore) {
    return json(
      { error: "pushSubscription or pushToken is required." },
      { status: 400, sessionId, generatedSession: generated }
    );
  }

  const { error: upsertError } = await supabase.from("notification_tokens").upsert(
    {
      secret_id: params.id,
      push_token: tokenToStore,
      notified_at: null
    },
    {
      onConflict: "secret_id"
    }
  );

  if (upsertError) {
    return json({ error: upsertError.message }, { status: 500, sessionId, generatedSession: generated });
  }

  return json({ ok: true, enabled: true }, { status: 200, sessionId, generatedSession: generated });
}
