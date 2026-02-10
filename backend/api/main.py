import asyncio
import sys

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.scrapers.playerScraper import scrape_player_info
from backend.scrapers.teamScraper import scrape_team_info
from backend.scrapers.playerSpecificScraper import scrape_player_specifics
from backend.scrapers.pastPlayerScraper import scrape_past_year


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5000",  # your TSX app
        "http://127.0.0.1:5000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.api_route("/health", methods=["GET", "HEAD"])
def health():
    return {"ok": True}


################
### Scrapers ###
################

@app.get("/api/players")
async def get_players(year: str, position: str):
    return await scrape_player_info(year, position)

@app.get("/api/teams")
async def get_teams(year: str):
    return await scrape_team_info(year)

@app.get("/api/playerSpecifics")
async def get_player_specifics(year: str, playerIds: str):
    return await scrape_player_specifics(year, playerIds)

@app.get("/api/pastPlayers")
async def get_past_players(year: str, position: str):
    return await scrape_past_year(year, position)
