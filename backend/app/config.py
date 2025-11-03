import os
from dotenv import load_dotenv
load_dotenv()  # loads .env in container/dev

class Settings:
    FOOTBALL_API_BASE: str = "https://api.football-data.org/v4"
    FOOTBALL_API_KEY: str = os.getenv("FOOTBALL_DATA_API_KEY", "")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://pl_user:pl_pass@localhost:5432/pl_db")
    LEAGUE_CODE: str = os.getenv("LEAGUE_CODE", "PL")  # Premier League

settings = Settings()
