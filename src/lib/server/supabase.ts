import { createClient } from "@supabase/supabase-js";
import { getSupabaseServerEnv } from "@/lib/server/env";

export function getSupabaseServerClient() {
  const env = getSupabaseServerEnv();
  return createClient(env.url, env.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
