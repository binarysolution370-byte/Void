import { NextRequest } from "next/server";
import { getOrCreateSessionId } from "@/lib/server/session";
import { getSupabaseServerClient } from "@/lib/server/supabase";
import { json } from "@/lib/server/http";
import { verifyEchoAccessToken } from "@/lib/server/echo-access";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { sessionId, generated } = getOrCreateSessionId(request);
  const token = request.nextUrl.searchParams.get("t");
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

  if (!secret.author_session_id || secret.author_session_id !== sessionId) {
    if (!token || !verifyEchoAccessToken(token, params.id)) {
      return json({ error: "Access denied." }, { status: 403, sessionId, generatedSession: generated });
    }
  }

  const { data: replies, error: repliesError } = await supabase
    .from("replies")
    .select("id, content, created_at")
    .eq("secret_id", params.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (repliesError) {
    return json({ error: repliesError.message }, { status: 500, sessionId, generatedSession: generated });
  }

  return json(
    {
      secretId: params.id,
      replies: replies ?? []
    },
    { status: 200, sessionId, generatedSession: generated }
  );
}
