import sqlite3

async def scrape_saved_strategies(year: int, pick: int, teams: int):
    db_path = r"C:\Users\jdori\Documents\jdorigo10-Repos\FantasyWarRoom\db\saved_info.db"

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT *
        FROM strategies
        WHERE year = ?
        AND pick = ?
        AND teams = ?;
        """,
        (int(year), int(pick), int(teams))
    )
    rows = cursor.fetchall()

    conn.close()

    strategies = []
    for row in rows:
        # ID
        id = row[0]

        # Rank
        rank = row[4]

        # Name
        name = row[5]

        # Description
        description = row[6]

        # Rounds 1-16
        rounds = []
        for i in range(7, 23):
            round_value = row[i] if row[i] is not None else ""
            rounds.append(str(round_value))

        strat = {
            "id": str(id),
            "rank": str(rank),
            "name": str(name),
            "description": str(description),
            "rounds": rounds
        }
        strategies.append(strat)

        print(f"Scraped Strategy: {name} | {description}")

    print(f"Total Strategies Scraped: {len(strategies)}")
    return {"strategies": strategies}