import httpx
import json

async def scrape_team_info(year: str):
    ESPN_FF_API = f"https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/{year}?view=proTeamSchedules_wl"
    FILTER = {
    }
    
    headers = {
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(ESPN_FF_API, headers=headers)
        data = response.json()

    teams = []
    for t in data.get("settings", {}).get("proTeams", []):

        # Team ID
        id = str(t.get("id"))
        if (id == "0"):
            continue

        # Team Abbreviation
        abbv = str(t.get("abbrev")).upper()

        # Bye Week
        byeWeek = str(t.get("byeWeek"))

        # Team Schedules
        schedule = []
        g = t.get("proGamesByScoringPeriod", {})
        for index in range(1, 18):
            if str(index) == byeWeek:
                schedule.append("0") # Bye Week
                continue

            game = g.get(str(index), [])[0]
            awayTeamId = str(game.get("awayProTeamId"))
            homeTeamId = str(game.get("homeProTeamId"))

            opponent = awayTeamId if (homeTeamId == id) else homeTeamId
            schedule.append(opponent)

        team = {
            "teamId": id,
            "teamAbbv": abbv,
            "byeWeek": byeWeek,
            "schedule": schedule
        }
        teams.append(team)

        print(f"Scraped Team: {abbv} | Bye: {byeWeek} | Schedule: {schedule}")

    print(f"Total Teams Scraped: {len(teams)}")
    return {"teams": teams}
