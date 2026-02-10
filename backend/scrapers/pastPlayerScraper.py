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

async def scrape_past_year(year: str, position: str):    
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

    players = dict()
    for p in data.get("players", []):
        player_info = p.get("player", {})
        if not player_info:
            continue

        # Player ID
        id = player_info.get("id")

        # Name
        name = player_info.get("fullName")

        # Average Draft Position (ADP)
        adp = round(player_info.get("ownership", {}).get("averageDraftPosition"), 1)
        #adp = ADP_INFO.get(year, {}).get(str(name), 999)

        # Projected & Final Points Per Game (PPG) & Games Played
        projectedPpg = 0
        finalPpg = 0
        totalGames = 0
        for stat in player_info.get("stats", []):
            if stat.get("appliedAverage"):
                total = stat.get("appliedTotal")
                if stat.get("id") == f"10{year}":
                    projectedPpg = stat.get("appliedAverage")
                    if (total / projectedPpg) < 10: 
                        # If less than 10 games projected to be played, nerf PPG
                        projectedPpg = projectedPpg / 2
                elif stat.get("id") == f"00{year}":
                    finalPpg = stat.get("appliedAverage")
                    totalGames= round(total / finalPpg) if finalPpg > 0 else 0
        projectedPpg = round(projectedPpg, 2)
        finalPpg = round(finalPpg, 2)

        # Injury Status
        injuryStatus = "HEALTHY"
        status = player_info.get("injuryStatus")
        if status == "INJURY_RESERVE":
            injuryStatus = "IR"
        elif status == "QUESTIONABLE" or status == "DOUBTFUL" or status == "OUT":
            injuryStatus = "HURT"

        player = {
            "adp": adp,
            "pppg": projectedPpg,
            "fppg": finalPpg,
            "totalGames": totalGames,
            "age": -1,
            "experience": -1,
            "injury": injuryStatus
        }
        players[str(id)] = player

        print(f"Scraped) {name}: ADP={adp}, Proj PPG={projectedPpg}, Final PPG={finalPpg}")

    print(f"Total Players Scraped: {len(players)}")
    return {"players": players}