import { NextRequest } from "next/server";
import { json } from "@/lib/server/http";
import { getSupabaseServerClient } from "@/lib/server/supabase";
import { getAnalyticsDashboardKey } from "@/lib/server/env";

function startOfDayIso(): string {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.toISOString();
}

function daysAgoIso(days: number): string {
  const now = new Date();
  now.setDate(now.getDate() - days);
  return now.toISOString();
}

export async function GET(request: NextRequest) {
  const key = request.headers.get("x-dashboard-key");
  if (!key || key !== getAnalyticsDashboardKey()) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();

  const [{ count: totalVisitors }, { count: visitorsToday }, { count: visitors7d }] = await Promise.all([
    supabase.from("site_visits").select("id", { count: "exact", head: true }),
    supabase.from("site_visits").select("id", { count: "exact", head: true }).gte("first_seen_at", startOfDayIso()),
    supabase.from("site_visits").select("id", { count: "exact", head: true }).gte("first_seen_at", daysAgoIso(7))
  ]);

  const { data: rows, error: rowsError } = await supabase.from("site_visits").select("visit_count");
  if (rowsError) {
    return json({ error: rowsError.message }, { status: 500 });
  }

  const totalVisits = (rows ?? []).reduce((sum, row) => sum + (row.visit_count ?? 0), 0);

  const { data: latestVisitors, error: latestError } = await supabase
    .from("site_visits")
    .select("session_id, first_seen_at, last_seen_at, visit_count")
    .order("last_seen_at", { ascending: false })
    .limit(20);

  if (latestError) {
    return json({ error: latestError.message }, { status: 500 });
  }

  return json({
    totalVisitors: totalVisitors ?? 0,
    visitorsToday: visitorsToday ?? 0,
    visitorsLast7Days: visitors7d ?? 0,
    totalVisits,
    latestVisitors: latestVisitors ?? []
  });
}
