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
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetchStandings()
      .then(data => setRows(data))
      .catch(e => setErr(String(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6">Loading…</div>;
  if (err) return <div className="p-6 text-red-600">Error: {err}</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Premier League Standings</h1>

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
            {rows.map(r => (
              <tr key={r.team.id} className="border-t">
                <td className="p-2">{r.position}</td>
                <td className="p-2 flex items-center gap-2">
                  {r.team.crest ? <img src={r.team.crest} alt="" width={20} /> : null}
                  <span>{r.team.name}</span>
                  {r.team.tla ? <span className="text-gray-500">({r.team.tla})</span> : null}
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
        Data cached from the football-data.org API by your FastAPI backend.
      </p>
    </div>
  );
}
