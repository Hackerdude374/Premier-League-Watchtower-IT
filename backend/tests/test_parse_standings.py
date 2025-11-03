from app.services.football_data import parse_standings

def test_parse_standings_total_only():
    sample = {
      "season":{"startDate":"2025-08-10"},
      "standings":[{"type":"TOTAL","table":[
        {"position":1,"team":{"id":57,"name":"Arsenal FC","tla":"ARS","crest":"u"},
         "playedGames":10,"won":8,"draw":1,"lost":1,"points":25,"goalDifference":15}
      ]}]
    }
    rows = parse_standings(sample)
    assert len(rows) == 1
    row = rows[0]
    assert row["season"] == "2025"
    assert row["team"]["id"] == 57
    assert row["standing"]["points"] == 25
