import { getSupabaseServerClient } from "@/lib/server/supabase";
import { parsePushSubscription, sendWebPush } from "@/lib/server/webpush";
import { createEchoAccessToken } from "@/lib/server/echo-access";

interface TriggerEchoNotificationInput {
  secretId: string;
}

function getEchoWebhookUrl(): string | null {
  const value = process.env.VOID_ECHO_WEBHOOK_URL;
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function triggerFirstEchoNotification(input: TriggerEchoNotificationInput): Promise<void> {
  const supabase = getSupabaseServerClient();
  const { data: tokenRow, error: tokenError } = await supabase
    .from("notification_tokens")
    .select("id, secret_id, push_token, notified_at")
    .eq("secret_id", input.secretId)
    .is("notified_at", null)
    .maybeSingle();

  if (tokenError || !tokenRow?.push_token) {
    return;
  }

  const accessToken = createEchoAccessToken(input.secretId);
  const payload = {
    title: "VOID",
    body: "Le vide a bouge.",
    url: `/echo/${input.secretId}?t=${encodeURIComponent(accessToken)}`
  };

  const subscription = parsePushSubscription(tokenRow.push_token);
  let sent = false;

  if (subscription) {
    sent = await sendWebPush(subscription, payload);
  }

  if (!sent) {
    const webhookUrl = getEchoWebhookUrl();
    if (!webhookUrl) {
      return;
    }
    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          token: tokenRow.push_token,
          ...payload
        }),
        cache: "no-store"
      });
      sent = response.ok;
    } catch {
      sent = false;
    }
  }

  if (!sent) {
    return;
  }

  await supabase
    .from("notification_tokens")
    .update({
      notified_at: new Date().toISOString(),
      push_token: null
    })
    .eq("id", tokenRow.id);
}
