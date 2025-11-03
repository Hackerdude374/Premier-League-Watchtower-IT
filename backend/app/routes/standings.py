from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db import models
from app.services.football_data import fetch_pl_standings_json, parse_standings

router = APIRouter(prefix="/standings", tags=["standings"])



@router.post("/refresh")
def refresh_standings(db: Session = Depends(get_db)):
    try:
        data = fetch_pl_standings_json()
        rows = parse_standings(data)

        if not rows:
            return JSONResponse(status_code=200, content={"ok": True, "inserted": 0})

        # --- Clean old standings for this season ---
        season = rows[0]["season"]
        db.query(models.Standing).filter(models.Standing.season == season).delete()
        db.commit()

        # --- Upsert teams and insert new standings ---
        for row in rows:
            t = row["team"]
            team = db.get(models.Team, t["id"])
            if not team:
                team = models.Team(id=t["id"], name=t["name"], tla=t["tla"], crest=t["crest"])
                db.add(team)
            else:
                team.name, team.tla, team.crest = t["name"], t["tla"], t["crest"]

            s = row["standing"]
            st = models.Standing(
                season=season, team_id=t["id"], position=s["position"],
                played=s["played"], won=s["won"], draw=s["draw"],
                lost=s["lost"], points=s["points"], goal_diff=s["goal_diff"]
            )
            db.add(st)

        db.commit()
        return JSONResponse(status_code=201, content={"ok": True, "inserted": len(rows)})

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/")
def get_current_standings(db: Session = Depends(get_db)):
    # latest season by string max
    latest = db.query(models.Standing.season).order_by(models.Standing.season.desc()).limit(1).scalar()
    if not latest:
        return []
    q = (
        db.query(models.Standing, models.Team)
        .join(models.Team, models.Team.id == models.Standing.team_id)
        .filter(models.Standing.season == latest)
        .order_by(models.Standing.position.asc())
    )
    return [
        {
            "season": s.season,
            "position": s.position,
            "team": {"id": t.id, "name": t.name, "tla": t.tla, "crest": t.crest},
            "played": s.played, "won": s.won, "draw": s.draw, "lost": s.lost,
            "points": s.points, "goal_diff": s.goal_diff
        }
        for s, t in q.all()
    ]
