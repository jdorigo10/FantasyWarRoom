import httpx
import json

# Import ADP Info
from backend.scrapers.ADP_INFO import ADP_INFO

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
    0: 40,
    2: 80,
    4: 80,
    6: 40,
    16: 32,
    17: 32
}

async def scrape_player_info(year: str, position: str):    
    ESPN_FF_API = f"https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/{year}/segments/0/leaguedefaults/3?view=kona_player_info"
    DRAFT_RANK_TYPE = "PPR" if (year == "2025") else "STANDARD"
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

    async with httpx.AsyncClient() as client:
        response = await client.get(ESPN_FF_API, headers=headers)
        data = response.json()

    players = []
    for p in data.get("players", []):
        player_info = p.get("player", {})
        if not player_info:
            continue

        # Player ID
        id = player_info.get("id")

        # Draft Rank
        draftRank = player_info.get("draftRanksByRankType", {}).get(DRAFT_RANK_TYPE,{}).get("rank")

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

        # Player Team ID
        teamId = player_info.get("proTeamId")

        # Average Draft Position (ADP)
        #adp = round(player_info.get("ownership", {}).get("averageDraftPosition"), 1)
        adp = ADP_INFO.get(year, {}).get(str(name), 170)

        # Projected Points Per Game (PPG)
        ppg = 0
        for stat in player_info.get("stats", []):
            if stat.get("appliedAverage"):
                ppg = stat.get("appliedAverage")
                total = stat.get("appliedTotal")
                if (total / ppg) < 10: 
                    # If less than 10 games projected to be played, nerf PPG
                    ppg = ppg / 2
                break
        ppg = round(ppg, 2)

        # Injury & Suspension Status
        injuryStatus = "HEALTHY"
        isSuspended = "CLEAR"
        status = player_info.get("injuryStatus")
        if status == "INJURY_RESERVE":
            injuryStatus = "IR"
        elif status == "QUESTIONABLE" or status == "DOUBTFUL" or status == "OUT":
            injuryStatus = "HURT"
        elif status == "SUSPENDED":
            isSuspended = "SUSPENDED"

        player = {
            "id": str(id),
            "rank": draftRank,
            "name": name,
            "position": position,
            "teamId": str(teamId),
            "adp": adp,
            "ppg": ppg,
            "status": isSuspended,
            "injury": injuryStatus
        }
        players.append(player)

        print(f"Scraped) {name}: Rank={draftRank}, ADP={adp}, PPG={ppg}, Status={isSuspended}, Injury={injuryStatus}")

    print(f"Total Players Scraped: {len(players)}")
    return {"players": players}