import asyncio
import sys

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

from fastapi import FastAPI
from fastapi import Body
from fastapi.middleware.cors import CORSMiddleware
from backend.scrapers.teamScraper import scrape_team_info
from backend.scrapers.teamSpecificScraper import scrape_team_specifics
from backend.scrapers.playerScraper import scrape_player_info
from backend.scrapers.playerSpecificScraper import scrape_player_specifics
from backend.scrapers.pastPlayerScraper import scrape_past_player_info
from backend.strategy.strategyScraper import scrape_saved_strategies
from backend.strategy.saveStrategy import save_strategy
from backend.strategy.deleteStrategy import delete_strategy
from backend.tags.loadTags import load_tags
from backend.tags.updateTags import update_tags


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

@app.get("/api/teams")
async def get_teams():
    return await scrape_team_info()

@app.get("/api/teamSpecifics")
async def get_team_specifics(year: str):
    return await scrape_team_specifics(year)

@app.get("/api/players")
async def get_players(year: str):
    return await scrape_player_info(year)

@app.get("/api/playerSpecifics")
async def get_player_specifics(year: str):
    return await scrape_player_specifics(year)

@app.get("/api/pastPlayers")
async def get_past_players(year: str):
    return await scrape_past_player_info(year)

@app.get("/api/strategies")
async def get_saved_strategies(year: int, pick: int, teams: int):
    return await scrape_saved_strategies(year, pick, teams)

@app.post("/api/saveStrategy")
async def post_save_strategy(data: dict = Body(...)):
    return await save_strategy(data)

@app.delete("/api/deleteStrategy")
async def delete_strategy_route(id: int):
    return await delete_strategy(id)

@app.get("/api/tags")
async def get_saved_tags(year: int):
    return await load_tags(year)

@app.post("/api/updateTags")
async def post_updated_tags(data: dict = Body(...)):
    return await update_tags(data)
