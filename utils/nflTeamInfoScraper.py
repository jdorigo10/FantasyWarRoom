import httpx
import json
from openpyxl import load_workbook

#### SET THESE VARIABLES BEFORE RUNNING ####
year = "2026"   # IF new teams, just make it for current year
############################################
  
ESPN_FF_API = f"https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/{year}?view=proTeamSchedules_wl"

response = httpx.get(ESPN_FF_API)
data = response.json()

teams = []
for t in data.get("settings", {}).get("proTeams", []):
    # Team ID
    id = t.get("id")

    # Team ABBV
    abbv = t.get("abbrev")

    # Team City
    location = t.get("location")

    # Team Name
    name = t.get("name")

    # Team Full Name
    fullName = f"{location} {name}"

    team = {
        "id": str(id),
        "abbv": abbv,
        "location": location,
        "name": name,
        "fullName": fullName
    }
    teams.append(team)

    print(f"Scraped {fullName}: ID={id}, ABBV={abbv}")

print(f"Total Teams Scraped: {len(teams)}")
