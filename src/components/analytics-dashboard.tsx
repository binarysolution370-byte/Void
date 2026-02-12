"use client";

import { FormEvent, useState } from "react";

interface VisitorRow {
  session_id: string;
  first_seen_at: string;
  last_seen_at: string;
  visit_count: number;
}

interface SummaryPayload {
  totalVisitors: number;
  visitorsToday: number;
  visitorsLast7Days: number;
  totalVisits: number;
  latestVisitors: VisitorRow[];
}

export function AnalyticsDashboard() {
  const [key, setKey] = useState("");
  const [data, setData] = useState<SummaryPayload | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/analytics/summary", {
        method: "GET",
        headers: {
          "x-dashboard-key": key
        }
      });
      const payload = (await response.json()) as SummaryPayload & { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Erreur dashboard.");
        setData(null);
        return;
      }
      setData(payload);
    } catch {
      setError("Impossible de charger le dashboard.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="void-card space-y-4" aria-labelledby="dash-title">
      <h1 id="dash-title" className="text-2xl font-semibold">
        Dashboard Visiteurs
      </h1>

      <form className="space-y-3" onSubmit={onSubmit}>
        <label htmlFor="dashboard-key" className="void-label">
          Cle dashboard
        </label>
        <input
          id="dashboard-key"
          type="password"
          className="void-input"
          value={key}
          onChange={(event) => setKey(event.target.value)}
          required
        />
        <button type="submit" className="void-button" disabled={loading || key.trim().length === 0}>
          {loading ? "Chargement..." : "Afficher"}
        </button>
      </form>

      {error ? <p className="text-sm">{error}</p> : null}

      {data ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <article className="border border-white/30 p-3">
              <p className="void-muted text-xs">Visiteurs uniques (total)</p>
              <p className="text-2xl font-semibold">{data.totalVisitors}</p>
            </article>
            <article className="border border-white/30 p-3">
              <p className="void-muted text-xs">Visiteurs aujourd&apos;hui</p>
              <p className="text-2xl font-semibold">{data.visitorsToday}</p>
            </article>
            <article className="border border-white/30 p-3">
              <p className="void-muted text-xs">Visiteurs 7 jours</p>
              <p className="text-2xl font-semibold">{data.visitorsLast7Days}</p>
            </article>
            <article className="border border-white/30 p-3">
              <p className="void-muted text-xs">Visites cumulées</p>
              <p className="text-2xl font-semibold">{data.totalVisits}</p>
            </article>
          </div>

          <div className="border border-white/30 p-3">
            <p className="mb-2 text-sm font-semibold">Derniers visiteurs</p>
            {data.latestVisitors.length === 0 ? (
              <p className="void-muted text-sm">Aucune donnée.</p>
            ) : (
              <ul className="space-y-2">
                {data.latestVisitors.map((visitor) => (
                  <li key={visitor.session_id} className="text-xs">
                    {visitor.session_id.slice(0, 8)}... | {visitor.visit_count} visites |{" "}
                    {new Date(visitor.last_seen_at).toLocaleString("fr-FR")}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
