import requests
from app.config import settings

def fetch_pl_standings_json():
    url = f"{settings.FOOTBALL_API_BASE}/competitions/{settings.LEAGUE_CODE}/standings"
    headers = {"X-Auth-Token": settings.FOOTBALL_API_KEY}
    r = requests.get(url, headers=headers, timeout=15)
    r.raise_for_status()
    return r.json()

def parse_standings(json_obj):
    """Return a list of dict rows to insert into DB."""
    season = str(json_obj.get("season", {}).get("startDate", ""))[:4]  # "2025"
    rows = []
    tables = json_obj.get("standings", [])
    for block in tables:
        if block.get("type") != "TOTAL":
            continue
        for entry in block.get("table", []):
            t = entry.get("team", {})
            rows.append({
                "season": season,
                "team": {
                    "id": t.get("id"),
                    "name": t.get("name"),
                    "tla": t.get("tla"),
                    "crest": t.get("crest"),
                },
                "standing": {
                    "position": entry.get("position"),
                    "played": entry.get("playedGames"),
                    "won": entry.get("won"),
                    "draw": entry.get("draw"),
                    "lost": entry.get("lost"),
                    "points": entry.get("points"),
                    "goal_diff": entry.get("goalDifference"),
                }
            })
    return rows
