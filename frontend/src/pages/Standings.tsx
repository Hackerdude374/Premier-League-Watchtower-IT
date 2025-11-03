// src/pages/Standings.tsx
import { useEffect, useState } from "react";
import ThemeToggle from "../components/ThemeToggle";

type Team = { id: number; name: string; tla?: string; crest?: string };
type Row = {
  season: string;
  position: number;
  team: Team;
  played: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goal_diff: number;
};

export default function Standings() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetch("/standings/"); // proxied to :8000 in vite.config.ts
      if (!res.ok) throw new Error(`GET /standings failed: ${res.status}`);
      const data = await res.json();
      setRows(data);
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/standings/refresh", { method: "POST" });
      // backend may return { ok, inserted, last_updated? }
      try {
        const body = await res.json();
        if (body?.last_updated) setLastUpdated(body.last_updated);
      } catch { /* ignore if not JSON */ }
      await load();
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-neutral-900 text-gray-900 dark:text-gray-100">
      {/* gradient header card */}
      <div className="max-w-5xl mx-auto p-6">
        <div className="rounded-2xl p-6 mb-6 shadow-lg
                        bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-500
                        text-white">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-3xl md:text-4xl font-extrabold drop-shadow">
              Premier League Standings
            </h1>
            <div className="flex items-center gap-2">
              <button
                onClick={refreshData}
                disabled={refreshing}
                className="px-3 py-2 rounded-lg bg-white/90 text-gray-900
                           hover:bg-white disabled:opacity-60 transition"
              >
                {refreshing ? "Refreshing…" : "Refresh"}
              </button>
              <ThemeToggle />
            </div>
          </div>
          {lastUpdated && (
            <p className="text-sm mt-2 text-white/90">
              Last updated: {new Date(lastUpdated).toLocaleString()}
            </p>
          )}
        </div>

        {/* content card */}
        <div className="bg-white dark:bg-neutral-800/80 backdrop-blur rounded-xl
                        border border-gray-200 dark:border-neutral-700 shadow">
          {loading ? (
            <div className="p-8 flex justify-center">
              <div className="animate-spin h-8 w-8 border-4 border-white/30 dark:border-white/20 border-t-transparent rounded-full" />
            </div>
          ) : err ? (
            <div className="p-6 text-red-400">{err}</div>
          ) : (
            <div className="overflow-x-auto rounded-xl">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 dark:bg-neutral-800/60 text-left
                                  text-gray-600 dark:text-gray-300 sticky top-0">
                  <tr>
                    <th className="p-2">Pos</th>
                    <th className="p-2">Team</th>
                    <th className="p-2">Pts</th>
                    <th className="p-2">W</th>
                    <th className="p-2">D</th>
                    <th className="p-2">L</th>
                    <th className="p-2">GD</th>
                  </tr>
                </thead>
                <tbody className="text-gray-800 dark:text-gray-100">
                  {rows.map((r) => (
                    <tr
                      key={r.team.id}
                      className="border-t border-gray-200 dark:border-neutral-700
                                 hover:bg-gray-100/60 dark:hover:bg-neutral-800
                                 transition-colors"
                    >
                      <td className="p-2">{r.position}</td>
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          {r.team.crest ? (
                            <img src={r.team.crest} alt="" width={20} height={20} />
                          ) : null}
                          <span>{r.team.name}</span>
                          {r.team.tla ? (
                            <span className="text-gray-500">({r.team.tla})</span>
                          ) : null}
                        </div>
                      </td>
                      <td className="p-2">{r.points}</td>
                      <td className="p-2">{r.won}</td>
                      <td className="p-2">{r.draw}</td>
                      <td className="p-2">{r.lost}</td>
                      <td className="p-2">{r.goal_diff}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
          Data cached from football-data.org by your FastAPI backend.
        </p>
      </div>
    </div>
  );
}
