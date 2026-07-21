import httpx
import json
import sqlite3
import math

# Map of Position Names to their ESPN Slot IDs
POSITION_IDS = {
    "QB": 0,
    "RB": 2,
    "WR": 4,
    "TE": 6,
    "DST": 16,
    "K": 17
}

# Map of Positions to their limits
POSITION_LIMITS = {
    0: 240,
    2: 480,
    4: 480,
    6: 240,
    16: 32,
    17: 80
}

#### SET THESE VARIABLES BEFORE RUNNING ####
year = 2026             # CURRENTLY HAVE 2022, 2023, 2024, 2025
position = "QB"
DRAFT_RANK_TYPE = "PPR" # "STANDARD"
UPLOAD = False
############################################

ESPN_FF_API = f"https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/{year}/segments/0/leaguedefaults/3?view=kona_player_info"
POSITION_ID = POSITION_IDS[position]
FILTER = {
    "players": {
        "limit": POSITION_LIMITS[POSITION_ID],
        "filterSlotIds": {
            "value": [POSITION_ID]
        },
        "sortDraftRanks": {
            "sortPriority": 100,
            "sortAsc": True,
            "value": DRAFT_RANK_TYPE
        }
    }
}

headers = {
    "x-fantasy-filter": json.dumps(FILTER)
}

response = httpx.get(ESPN_FF_API, headers=headers)
data = response.json()

# GET EXISTING PLAYERS FROM DB
db_path = r"C:\Users\jdori\Documents\jdorigo10-Repos\FantasyWarRoom\db\fantasy_info.db"

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute("SELECT player_id, season_year FROM player_postseason")
rows = cursor.fetchall()

existing_player_ids = {(row[0], row[1]) for row in rows}

conn.close()


players = []
for p in data.get("players", []):
    player_info = p.get("player", {})
    if not player_info:
        continue

    # Player Name
    name = player_info.get("fullName")

    # Player ID
    id = player_info.get("id")

    # Team id
    team = player_info.get("proTeamId")
    if position != "DST":
        for stat in player_info.get("stats", []):
            if str(stat.get("scoringPeriodId")) == str(18) and str(stat.get("seasonId")) == str(year) and str(stat.get("statSourceId")) == str(0):
                team = stat.get("proTeamId")

    # check if player already exists in the database for the given year
    if (id, year) in existing_player_ids:
        continue

    # Points Per Game (PPG)
    points = -99.0
    avg = -99.0
    for stat in player_info.get("stats", []):
        if stat.get("externalId") != str(year) or stat.get("id") != ("00" + str(year)):
            continue

        avg = stat.get("appliedAverage", -99.0)
        points = stat.get("appliedTotal", -99.0)

    if avg == -99.0 or points == -99.0:
        print(f"WARNING: No stats found for player {name} (avg={avg}, points={points}). Skipping.")
        continue

    if avg != 0:
        ppg = round(avg, 2)
        actualGames = round(points / avg)
    else:
        ppg = 0.0
        actualGames = 0

    # Game by Game Points Scored
    breakdown = [-99, -99, -99, -99, -99, -99, -99, -99, -99, -99, -99, -99, -99, -99, -99, -99, -99, -99]
    for stat in player_info.get("stats", []):
        if str(stat.get("seasonId")) == str(year) and str(stat.get("statSourceId")) == str(0):
            if int(stat.get("scoringPeriodId")) > 0:
                breakdown[int(stat.get("scoringPeriodId"))-1] = float(stat.get("appliedTotal"))
    breakdown_string = ", ".join(f"{value:.2f}" for value in breakdown)

    player = {
        "id": str(id),
        # year
        "team": str(team),
        "ppg": str(ppg),
        "games": str(actualGames),
        "breakdown": str(breakdown_string)
    }
    players.append(player)

    print(f"Scraped) {name}: PPG={ppg}, Games={actualGames} ({breakdown_string})")

print(f"Total Players Scraped: {len(players)}")


# Upload stats to the database
if UPLOAD:
    db_path = r"C:\Users\jdori\Documents\jdorigo10-Repos\FantasyWarRoom\db\fantasy_info.db"

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    cursor.executemany("""
        INSERT INTO player_postseason (
            player_id,
            season_year,
            team_id,
            actual_ppg,
            actual_games,
            breakdown
        )
        VALUES (?, ?, ?, ?, ?, ?)
    """, [
        (
            player["id"],
            year,
            player["team"],
            player["ppg"],
            player["games"],
            player["breakdown"]
        )
        for player in players
    ])

    conn.commit()
    conn.close()
