import httpx
import json

async def scrape_player_specifics(year: str, playerIds: str):
    count = 0
    players = dict() # playerId -> {age, experience, newTeam}
    for playerId in playerIds.split(","):
        API_ENDPOINT = f"https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/{year}/athletes/{playerId}"
        PREV_APIT_ENDPOINT = f"https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/{str(int(year)-1)}/athletes/{playerId}"

        playerInfo = {
            "age": -1,
            "experience": -1,
            "newTeam": False
        }

        count += 1
        async with httpx.AsyncClient() as client:
            response = await client.get(API_ENDPOINT)
            data = response.json()

        # Player Name
        name = data.get("fullName", "<No Name>")

        # Player Age
        playerInfo["age"] = data.get("age", -1)

        # Player Experience
        playerInfo["experience"] = data.get("experience", {}).get("years", -1)

        # Current Team ID
        currentTeamInfo = data.get("team", {}).get("$ref", "")
        currentTeamId = currentTeamInfo.split("teams/")[1].split("?")[0]

        draftTeamId = currentTeamId
        if (data.get("draft", {}) != {}):
            draftTeam = data.get("draft", {}).get("team", {}).get("$ref", "")
            draftTeamId = draftTeam.split("teams/")[1].split("?")[0]

        if (currentTeamId != draftTeamId and playerInfo["experience"] != 0):
            count += 1
            async with httpx.AsyncClient() as client:
                response = await client.get(PREV_APIT_ENDPOINT)
                data = response.json()

            # Past Team ID
            pastTeamInfo = data.get("team", {}).get("$ref", "")
            pastTeamId = pastTeamInfo.split("teams/")[1].split("?")[0]

            # Is on New Team
            playerInfo["newTeam"] = (currentTeamId != pastTeamId)

        players[playerId] = playerInfo
        print(f"Scraped) {name}: Age={playerInfo['age']} | Experience={playerInfo['experience']} | New Team={playerInfo['newTeam']}")

    print(f"Total Player Specifics Scraped: {count}")
    return {"players": players}