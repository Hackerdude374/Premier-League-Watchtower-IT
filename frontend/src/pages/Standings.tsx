import { useEffect, useState } from "react";
import { fetchStandings } from "../services/api";

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
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const data = await fetchStandings();
      setRows(data);
    } catch (e) {
      setErr(String(e));
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    try {
      setRefreshing(true);
      await fetch("/standings/refresh", { method: "POST" });
      await load();
    } catch (e) {
      setErr(String(e));
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <div className="p-6">Loading…</div>;
  if (err) return <div className="p-6 text-red-600">Error: {err}</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Premier League Standings</h1>
        <button
          onClick={refreshData}
          disabled={refreshing}
          className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-left">
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
          <tbody>
            {rows.map((r) => (
              <tr key={r.team.id} className="border-t">
                <td className="p-2">{r.position}</td>
                <td className="p-2 flex items-center gap-2">
                  {r.team.crest && (
                    <img src={r.team.crest} alt={r.team.name} width={20} />
                  )}
                  <span>{r.team.name}</span>
                  {r.team.tla && (
                    <span className="text-gray-500">({r.team.tla})</span>
                  )}
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

      <p className="text-xs text-gray-500 mt-2">
        Data cached from football-data.org via your FastAPI backend.
      </p>
    </div>
  );
}
