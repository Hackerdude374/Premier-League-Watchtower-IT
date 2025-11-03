import { useEffect, useState } from "react";
import axios from "axios";

export default function Standings() {
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    axios.get("/standings/").then(res => setRows(res.data));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-3">Premier League Standings</h1>
      <table className="table-auto border w-full text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th>Pos</th><th>Team</th><th>Pts</th><th>W</th><th>D</th><th>L</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.team.id}>
              <td>{r.position}</td>
              <td className="flex items-center gap-2">
                <img src={r.team.crest} alt="crest" width={20}/>
                {r.team.name}
              </td>
              <td>{r.points}</td><td>{r.won}</td><td>{r.draw}</td><td>{r.lost}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
