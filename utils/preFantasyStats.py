import httpx
import json
from datetime import datetime
import sqlite3
import pandas as pd

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
EDIT = False
CURRENT_YEAR = 2026
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


# EXCEL WORKAROUNDS (2025 ADP workaround)
EXCEL_FILE = r"C:\Users\jdori\Documents\jdorigo10-Repos\FantasyWarRoom\excelData\2025.xlsx"
SHEET_NAME = position
def load_adp_map(excel_file, sheet_name):
    # Read only columns A and F
    df = pd.read_excel(
        excel_file,
        sheet_name=sheet_name,
        usecols="A,F"
    )

    # Rename columns for easier access
    df.columns = ["player_id", "adp"]

    adp_map = {}

    for _, row in df.iterrows():
        player_id = int(row["player_id"])

        # Skip blank ADP values
        if pd.isna(row["adp"]):
            continue

        adp = float(row["adp"])
        adp_map[player_id] = adp

    return adp_map
if int(year) == 2025:
    adp_map = load_adp_map(EXCEL_FILE, SHEET_NAME)



# GET EXISTING PLAYERS FROM DB
db_path = r"C:\Users\jdori\Documents\jdorigo10-Repos\FantasyWarRoom\db\past_info.db"

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute("SELECT player_id, date_of_birth FROM players")
rows = cursor.fetchall()

# map of player ids to their date of birth
db_player_info = {}
for row in rows:
    player = {
        "id": row[0],
        "dob": row[1]
    }
    db_player_info[str(player["id"])] = player

conn.close()

# GET SEASON INFO FROM DB
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute(
    "SELECT * FROM seasons WHERE season_year = ?;",
    (year,)
)

season = cursor.fetchone()

conn.close()

# GET PLAYER POST SEASON STATS
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute("SELECT player_id, season_year, team_id FROM player_postseason")
rows = cursor.fetchall()

# map of player ids to their date of birth and debut year
past_players = {}
for row in rows:
    player = {
        "id": row[0],
        "year": row[1],
        "team": row[2]
    }
    past_players[str(player["id"]) + "_" + str(player["year"])] = player

conn.close()


# GET PLAYERS PRESEASON FROM NEXT YEAR
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute(
    "SELECT player_id, experience FROM player_preseason WHERE season_year = ?;",
    (int(year)+1,)
)
rows = cursor.fetchall()

# map of player ids to their next season info
next_years_players = {}
for row in rows:
    player = {
        "id": row[0],
        "exp": row[1]
    }
    next_years_players[str(player["id"])] = player

conn.close()

# SCRAPE PLAYER INFO FROM ESPN APIS
players = []
for p in data.get("players", []):
    player_info = p.get("player", {})
    if not player_info:
        continue

    name = player_info.get("fullName")

    # Player ID
    id = player_info.get("id")

    # Player Team ID
    # NOTE: pre CURRENT_YEAR, need to look at team on week 1
    teamId = player_info.get("proTeamId")
    if int(year) < CURRENT_YEAR:
        for stat in player_info.get("stats", []):
            if str(stat.get("scoringPeriodId")) == str(1) and str(stat.get("seasonId")) == str(year) and str(stat.get("statSourceId")) == str(0):
                teamId = stat.get("proTeamId")
    
    # AGE
    if str(id) not in db_player_info:
        print(f"SKIPPING: No date of birth found for player {name} (ID={id})")
        continue # skip players we dont have age for
    player_dob = db_player_info[str(id)]["dob"]
    if player_dob == "NA":
        age = 99
    else:
        dob = datetime.strptime(player_dob, "%Y-%m-%d")
        season_start  = datetime.strptime(season[1], "%Y-%m-%d")
        age = season_start.year - dob.year
        if (season_start.month, season_start.day) < (dob.month, dob.day):
            age -= 1


    # Experience
    exp = 99
    if position != "DST":
        if int(year) != CURRENT_YEAR and str(id) in next_years_players:
            exp = int(next_years_players[str(id)]["exp"]) - 1
        else:
            ESPN_PLAYER_API = f"https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/{year}/athletes/{id}"
            player_response = httpx.get(ESPN_PLAYER_API)
            player_data = player_response.json()

            debutYear = int(player_data.get("debutYear", 99))
            if debutYear and debutYear != 99:
                exp = int(year) - debutYear
            else:
                experience = player_data.get("experience").get("years")
                exp = int(experience) if experience is not None else -1
                if exp == -1:
                    print(f"WARNING: No experience found for player {name} (ID={id}). Skipping.")
                    continue
                elif exp > 0 and int(player_data.get("status").get("id")) == 1:
                    exp = exp - (CURRENT_YEAR-int(year)) - 1

    # Draft Rank
    draftRank = player_info.get("draftRanksByRankType", {}).get(DRAFT_RANK_TYPE,{}).get("rank")

    # Average Draft Position (ADP)
    if int(year) == 2025:
        if int(id) in adp_map:
            adp = adp_map[int(id)] # 2025 workaround
        else:
            adp = 180
    else:
        if not player_info.get("ownership", {}).get("averageDraftPosition"):
            continue
        adp = round(player_info.get("ownership", {}).get("averageDraftPosition"), 1)

    # Points Per Game (PPG) & Games
    # NOTE: pre CURRENT_YEAR, need to see if values exist
    points = 0
    avg = 0
    for stat in player_info.get("stats", []):
        if stat.get("externalId") != str(year) or stat.get("id") != ("10" + str(year)):
            continue

        avg = stat.get("appliedAverage", 0)
        points = stat.get("appliedTotal", 0)

    #if avg == 0 or points == 0:
        #print(f"WARNING: No stats found for player {name} (avg={avg}, points={points}). Using 0.0")

    if avg != 0:
        ppg = round(avg, 2)
        projected_games = round(points / avg)
    else:
        ppg = 0.0
        projected_games = 0

    # Suspended & Injured
    # NOTE: pre CURRENT_YEAR, must be done manually for each player (not DEF)
    if position == "DST":
        injured = "NA"
        suspended = "NA"
    else:
        injured = "HEALTHY"
        suspended = "CLEAR"

        if int(year) >= CURRENT_YEAR:
            status = player_info.get("injuryStatus", "ACTIVE")
            if status == "INJURY_RESERVE":
                injured = "IR"
            elif status == "QUESTIONABLE" or status == "DOUBTFUL" or status == "OUT":
                injured = "HURT"
            elif status == "SUSPENDED":
                suspended = "SUSPENDED"
        else:
            injured = "UNKNOWN"
            suspended = "UNKNOWN"

    # New Team
    # NOTE: pre CURRENT_YEAR, need to go back and edit players who teams changed above
    if position == "DST":
        new_team = "NA"
    else:
        if (str(id) + "_" + str(int(year)-1)) not in past_players:
            new_team = "TODO"
            if exp == 0:
                new_team = "ROOKIE"
        else:
            past_team = past_players[str(id) + "_" + str(int(year)-1)]["team"]
            new_team = "YES" if str(past_team) != str(teamId) else "NO"

    # skip players that dont matter and dont have good data
    if (new_team == "TODO" or exp < 0) and (not draftRank or int(draftRank) >= 1000):
        continue

    player = {
        "player_id": str(id),
        "year": str(year),
        "team_id": teamId,
        "age": age,
        "experience": exp,
        "rank": draftRank,
        "adp": adp,
        "ppg": ppg,
        "games": projected_games,
        "suspended": suspended,
        "injured": injured,
        "new_team": new_team
    }
    players.append(player)

    # Check if year is the current year and if so check if we should be updating existing player info
    # (ie. current date is early than league started date)
    if int(year) == CURRENT_YEAR:
        current_date = datetime.today()
        season_start = datetime.strptime(season[1], "%Y-%m-%d")
        if current_date < season_start:
            EDIT = True
            UPLOAD = False

    print(f"Scraped {name}: Age={age}, Exp={exp}, Rank={draftRank}, ADP={adp}, PPG={ppg}, Projected Games={projected_games}, Suspended={suspended}, Injured={injured}, New Team={new_team}")

print(f"Total Players Scraped: {len(players)}")

if len(players) == 0 or not (UPLOAD or EDIT):
    print("No new players to upload to the database.")
elif UPLOAD or EDIT:
    # UPLOAD/EDIT NEW PLAYER TO DB
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    if UPLOAD:
        print("Uploading new players to the database.")
        cursor.executemany("""
            INSERT INTO player_preseason (
                player_id,
                season_year,
                team_id,
                age,
                experience,
                draft_rank,
                average_draft_position,
                projected_ppg,
                projected_games,
                is_suspended,
                is_injured,
                new_team
            )
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
            ON CONFLICT(player_id, season_year)
            DO UPDATE SET
                team_id = player_preseason.team_id,
                age = player_preseason.age,
                experience = excluded.experience,
                draft_rank = player_preseason.draft_rank,
                average_draft_position = player_preseason.average_draft_position,
                projected_ppg = player_preseason.projected_ppg,
                projected_games = player_preseason.projected_games,
                is_suspended = player_preseason.is_suspended,
                is_injured = player_preseason.is_injured,
                new_team = player_preseason.new_team
        """, [
            (
                player["player_id"],
                player["year"],
                player["team_id"],
                player["age"],
                player["experience"],
                player["rank"],
                player["adp"],
                player["ppg"],
                player["games"],
                player["suspended"],
                player["injured"],
                player["new_team"]
            )
            for player in players
        ])
    elif EDIT:
        print("Editting new players to the database.")
        cursor.executemany("""
            INSERT INTO player_preseason (
                player_id,
                season_year,
                team_id,
                age,
                experience,
                draft_rank,
                average_draft_position,
                projected_ppg,
                projected_games,
                is_suspended,
                is_injured,
                new_team
            )
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
            ON CONFLICT(player_id, season_year)
            DO UPDATE SET
                team_id = excluded.team_id,
                age = excluded.age,
                experience = player_preseason.experience,
                draft_rank = excluded.draft_rank,
                average_draft_position = excluded.average_draft_position,
                projected_ppg = excluded.projected_ppg,
                projected_games = excluded.projected_games,
                is_suspended = excluded.is_suspended,
                is_injured = excluded.is_injured,
                new_team = excluded.new_team
        """, [
            (
                player["player_id"],
                player["year"],
                player["team_id"],
                player["age"],
                player["experience"],
                player["rank"],
                player["adp"],
                player["ppg"],
                player["games"],
                player["suspended"],
                player["injured"],
                player["new_team"]
            )
            for player in players
        ])

    conn.commit()
    conn.close()
