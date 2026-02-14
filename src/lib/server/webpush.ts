import webpush from "web-push";

let configured = false;

function configure(): boolean {
  if (configured) {
    return true;
  }

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  if (!publicKey || !privateKey || !subject) {
    return false;
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

export interface PushSubscriptionPayload {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export function parsePushSubscription(value: string | null | undefined): PushSubscriptionPayload | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as Partial<PushSubscriptionPayload>;
    if (
      typeof parsed.endpoint !== "string" ||
      typeof parsed.keys?.p256dh !== "string" ||
      typeof parsed.keys?.auth !== "string"
    ) {
      return null;
    }
    return {
      endpoint: parsed.endpoint,
      keys: {
        p256dh: parsed.keys.p256dh,
        auth: parsed.keys.auth
      }
    };
  } catch {
    return null;
  }
}

export async function sendWebPush(
  subscription: PushSubscriptionPayload,
  payload: { title: string; body: string; url: string }
): Promise<boolean> {
  if (!configure()) {
    return false;
  }

  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}
