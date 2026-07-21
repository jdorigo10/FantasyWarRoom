import httpx
import json
import sqlite3

#### SET THESE VARIABLES BEFORE RUNNING ####
year = "2026"    # CURRENTLY HAVE 2023, 2024, 2025, 2026
############################################
  
ESPN_FF_API = f"https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/{year}?view=proTeamSchedules_wl"

response = httpx.get(ESPN_FF_API)
data = response.json()

games = []
for t in data.get("settings", {}).get("proTeams", []):
    # Games (weeks 1-18)
    for w, g in t.get("proGamesByScoringPeriod", {}).items():
        week = w

        homeId = g[0].get("homeProTeamId")
        awayId = g[0].get("awayProTeamId")

        gameId = g[0].get("id")

        if not any(game["gameId"] == gameId for game in games):
            games.append({
                "year": year,
                "week": week,
                "homeId": homeId,
                "awayId": awayId,
                "gameId": gameId
            })

print(f"Total Games Scraped: {len(games)}")


db_path = r"C:\Users\jdori\Documents\jdorigo10-Repos\FantasyWarRoom\db\fantasy_info.db"

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.executemany("""
    INSERT INTO games (
        season_year,
        week,
        home_team_id,
        away_team_id,
        game_id
    )
    VALUES (?, ?, ?, ?, ?)
""", [
    (
        game["year"],
        game["week"],
        game["homeId"],
        game["awayId"],
        game["gameId"]
    )
    for game in games
])

conn.commit()
conn.close()
