from fastapi import FastAPI
from app.db.session import Base, engine
from app.routes import health, standings
from app.config import settings

# --- Validate critical env vars ---
if not settings.FOOTBALL_API_KEY:
    raise RuntimeError("Missing FOOTBALL_DATA_API_KEY environment variable")

# --- Create DB tables on startup (simple for now) ---
Base.metadata.create_all(bind=engine)

app = FastAPI(title="PL Watchtower")
app.include_router(health.router)
app.include_router(standings.router)

@app.get("/")
def root():
    return {"message": "PL Watchtower API up"}
