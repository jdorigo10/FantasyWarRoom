import sqlite3

async def scrape_team_info():
    db_path = r"C:\Users\jdori\Documents\jdorigo10-Repos\FantasyWarRoom\db\past_info.db"

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    cursor.execute(
        "SELECT * FROM teams"
    )
    rows = cursor.fetchall()

    conn.close()

    teams = []
    for row in rows:
        # ID & Abbv
        id = row[0]
        abbv = row[1]

        team = {
            "teamId": str(id),
            "teamAbbv": str(abbv)
        }
        teams.append(team)

        print(f"Scraped Team: {abbv} | ID: {id}")

    print(f"Total Teams Scraped: {len(teams)}")
    return {"teams": teams}
