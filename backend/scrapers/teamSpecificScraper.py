import sqlite3

async def scrape_team_specifics(year: str):
    db_path = r"C:\Users\jdori\Documents\jdorigo10-Repos\FantasyWarRoom\db\fantasy_info.db"

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    cursor.execute(
        "SELECT * FROM team_preseason WHERE season_year = ?;",
        (int(year),)
    )
    rows = cursor.fetchall()

    conn.close()

    teams = []
    for row in rows:
        # ID
        id = row[0]

        # Bye
        bye = row[2]

        # SOS
        sos = row[3]

        # Off & Deff ppg
        off_ppg = row[4]
        def_ppg = row[5]

        team = {
            "teamId": str(id),
            "bye": str(bye),
            "sos": str(sos),
            "offPpg": str(off_ppg),
            "defPpg": str(def_ppg)
        }
        teams.append(team)

        print(f"Scraped Team: {id} | ID: {id} | SOS: {sos} | OFF PPG: {off_ppg} | DEF PPG: {def_ppg}")

    print(f"Total Teams Scraped: {len(teams)}")
    return {"teams": teams}
