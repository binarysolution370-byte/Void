function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export function getSupabaseServerEnv() {
  return {
    url: required("NEXT_PUBLIC_SUPABASE_URL"),
    serviceRoleKey: required("SUPABASE_SERVICE_ROLE_KEY")
  };
}

export function getBlockedWords(): string[] {
  const raw = process.env.VOID_BLOCKED_WORDS ?? "";
  return raw
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);
}

export function getStripeWebhookSecret(): string {
  return required("STRIPE_WEBHOOK_SECRET");
}

export function getAnalyticsDashboardKey(): string {
  return required("ANALYTICS_DASHBOARD_KEY");
}

export function getSinetPayEnv() {
  return {
    apiKey: required("SINETPAY_API_KEY"),
    siteId: required("SINETPAY_SITE_ID"),
    baseUrl: process.env.SINETPAY_BASE_URL || "https://api-checkout.cinetpay.com",
    notifyPath: process.env.SINETPAY_NOTIFY_PATH || "/api/payments/sinetpay/callback",
    returnPath: process.env.SINETPAY_RETURN_PATH || "/void",
    currency: process.env.SINETPAY_CURRENCY || "XOF"
  };
}
