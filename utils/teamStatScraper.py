import httpx
import json
import sqlite3

#### SET THESE VARIABLES BEFORE RUNNING ####
year = 2026    # CURRENTLY HAVE 2023, 2024, 2025, 2026
############################################
  
# Get the previous seasons stats
ESPN_STANDINGS_API = f"https://site.web.api.espn.com/apis/v2/sports/football/nfl/standings?season={year-1}"

response = httpx.get(ESPN_STANDINGS_API)
data = response.json()

# map of team ids to a object of stats
team_stats = dict()
for conf in data.get("children", []):
    for t in conf.get("standings", {}).get("entries", []):
        # Team ID
        id = t.get("team", {}).get("id")

        pa = -1.0
        pf = -1.0
        win_pct = -1.0

        for stat in t.get("stats", []):
            if stat.get("name") == "pointsAgainst":
                pa = round(stat.get("value") / 17, 2)
            elif stat.get("name") == "pointsFor":
                pf = round(stat.get("value") / 17, 2)
            elif stat.get("name") == "winPercent":
                win_pct = round(stat.get("value"), 3)

        team = {
            "pa": str(pa), 
            "pf": str(pf),
            "win_pct": str(win_pct)
        }
        team_stats[str(id)] = team


# For each team get their bye week and calculate their SOS
ESPN_FF_API = f"https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/{year}?view=proTeamSchedules_wl"

response = httpx.get(ESPN_FF_API)
data = response.json()

teams = []
for t in data.get("settings", {}).get("proTeams", []):
    # Team ABBV
    abbv = t.get("abbrev")
    if abbv == "FA":
        continue
    
    # Team ID
    id = t.get("id")

    # bye week
    bye_week = t.get("byeWeek")

    # Get Previous Season Stats
    stats = team_stats.get(str(id), {})

    # Games (weeks 1-18)
    sos = 0.0
    for w, g in t.get("proGamesByScoringPeriod", {}).items():
        homeId = g[0].get("homeProTeamId")
        awayId = g[0].get("awayProTeamId")

        opponentId = homeId if awayId == id else awayId
        opponent_stats = team_stats.get(str(opponentId), {})

        sos += float(opponent_stats.get("win_pct", 0.0))
    sos = round(sos / 17, 3)

    team = {
        "id": str(id),
        # year
        "bye_week": bye_week,
        "sos": sos,
        "ppg": stats.get("pf", "NA"),
        "papg": stats.get("pa", "NA")
    }
    teams.append(team)

    print(f"Scraped {abbv}: SOS={sos}, PPG={team['ppg']}, PAPG={team['papg']}")

print(f"Total Teams Scraped: {len(teams)}")


# Upload to SQLite
db_path = r"C:\Users\jdori\Documents\jdorigo10-Repos\FantasyWarRoom\db\past_info.db"

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.executemany("""
    INSERT INTO team_preseason (
        team_id,
        season_year,
        bye_week,
        strength_of_schedule,
        previous_off_ppg,
        previous_def_ppg
    )
    VALUES (?, ?, ?, ?, ?, ?)
""", [
    (
        team["id"],
        year,
        team["bye_week"],
        team["sos"],
        team["ppg"],
        team["papg"]
    )
    for team in teams
])

conn.commit()
conn.close()
