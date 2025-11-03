from fastapi import FastAPI
from app.db.session import Base, engine
from app.routes import health, standings

# create tables on startup (simple for now; Alembic later)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="PL Watchtower")
app.include_router(health.router)
app.include_router(standings.router)

@app.get("/")
def root():
    return {"message": "PL Watchtower API up"}
