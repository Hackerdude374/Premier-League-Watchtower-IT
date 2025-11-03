from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db import models
from app.services.football_data import fetch_pl_standings_json, parse_standings

router = APIRouter(prefix="/standings", tags=["standings"])

from fastapi.responses import JSONResponse
from sqlalchemy import delete
import logging

log = logging.getLogger("plwatchtower")

@router.post("/refresh")
def refresh_standings(db: Session = Depends(get_db)):
    try:
        data = fetch_pl_standings_json()
        rows = parse_standings(data)

        if not rows:
            return JSONResponse(status_code=200, content={"ok": True, "inserted": 0})

        season = rows[0]["season"]

        # delete old season rows
        db.execute(delete(models.Standing).where(models.Standing.season == season))
        db.commit()

        # upsert teams
        for row in rows:
            t = row["team"]
            team = db.get(models.Team, t["id"])
            if not team:
                db.add(models.Team(id=t["id"], name=t["name"], tla=t["tla"], crest=t["crest"]))
            else:
                team.name, team.tla, team.crest = t["name"], t["tla"], t["crest"]
        db.flush()  # ensure team rows exist before standings

        # insert standings
        for row in rows:
            s, t = row["standing"], row["team"]
            db.add(models.Standing(
                season=season, team_id=t["id"], position=s["position"],
                played=s["played"], won=s["won"], draw=s["draw"],
                lost=s["lost"], points=s["points"], goal_diff=s["goal_diff"]
            ))

        db.commit()
        return JSONResponse(status_code=201, content={"ok": True, "inserted": len(rows)})

    except Exception as e:
        db.rollback()
        log.exception("refresh_standings failed")
        # bubble precise message to help you debug
        raise HTTPException(status_code=502, detail=f"Refresh failed: {e}")


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
