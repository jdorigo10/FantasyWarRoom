import httpx
import json
from datetime import datetime
import sqlite3

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
year = "2026"           # CURRENTLY HAVE 2023, 2024, 2025, 2026
position = "QB"
DRAFT_RANK_TYPE = "PPR" # "STANDARD"
UPLOAD = False
current_year = 2026
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
db_path = r"C:\Users\jdori\Documents\jdorigo10-Repos\FantasyWarRoom\db\past_info.db"

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute("SELECT player_id FROM players")
rows = cursor.fetchall()

existing_player_ids = {row[0] for row in rows}

conn.close()


# SCRAPE PLAYER INFO FROM ESPN APIS
players = []
for p in data.get("players", []):
    player_info = p.get("player", {})
    if not player_info:
        continue

    # Player ID
    id = player_info.get("id")

    if UPLOAD:
        if id in existing_player_ids:
            continue

    # Player Name
    name = player_info.get("fullName")

    # Player Position
    position = player_info.get("defaultPositionId")
    if (position == 1):
        position = "QB"
    elif (position == 2):
        position = "RB"
    elif (position == 3):
        position = "WR"
    elif (position == 4):
        position = "TE"
    elif (position == 5):
        position = "K"
    elif (position == 16):
        position = "DST"
    else:
        continue

    ESPN_PLAYER_API = f"https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/{year}/athletes/{id}"
    player_response = httpx.get(ESPN_PLAYER_API)
    if not player_response:
        continue
    player_data = player_response.json()

    # Player Date of Birth
    if position == "DST":
        dob = "NA"
        exp = 99
    else:
        birthdate = player_data.get("dateOfBirth")
        if not birthdate:
            print(f"WARNING: No date of birth found for player {name} (ID={id}). Skipping.")
            continue
        dob = datetime.fromisoformat(birthdate.replace("Z", "+00:00")).date().isoformat()

    player = {
        "id": str(id),
        "name": name,
        "position": position,
        "dob": str(dob)
    }
    players.append(player)

    print(f"Scraped {name}: ID={id}, POS={position}, DOB={dob}")

print(f"Total Players Scraped: {len(players)}")

if len(players) == 0:
    print("No new players to upload to the database.")
elif UPLOAD:
    # UPLOAD NEW PLAYER TO DB
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    cursor.executemany("""
        INSERT INTO players (
            player_id,
            full_name,
            position,
            date_of_birth
        )
        VALUES (?, ?, ?, ?)
    """, [
        (
            player["id"],
            player["name"],
            player["position"],
            player["dob"]
        )
        for player in players
    ])

    conn.commit()
    conn.close()
