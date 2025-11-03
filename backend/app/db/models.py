from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.types import Date, Boolean
from app.db.session import Base

class Team(Base):
    __tablename__ = "teams"
    id = Column(Integer, primary_key=True, index=True)      # API team id
    name = Column(String, nullable=False)
    tla = Column(String, nullable=True)                     # 3-letter code
    crest = Column(String, nullable=True)

class Standing(Base):
    __tablename__ = "standings"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    season = Column(String, nullable=False)
    team_id = Column(Integer, ForeignKey("teams.id"), index=True)
    position = Column(Integer, nullable=False)
    played = Column(Integer, nullable=False)
    won = Column(Integer, nullable=False)
    draw = Column(Integer, nullable=False)
    lost = Column(Integer, nullable=False)
    points = Column(Integer, nullable=False)
    goal_diff = Column(Integer, nullable=True)
