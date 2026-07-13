import sqlite3

async def scrape_player_info(year: str):    
    db_path = r"C:\Users\jdori\Documents\jdorigo10-Repos\FantasyWarRoom\db\past_info.db"

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    cursor.execute("""
        SELECT p.*
        FROM players p
        INNER JOIN player_preseason pp
            ON p.player_id = pp.player_id
        WHERE pp.season_year = ?
    """, (int(year),))
    rows = cursor.fetchall()

    conn.close()

    players = []
    for row in rows:
        # Player ID
        id = row[0]

        # Name
        name = row[1]

        # Position
        pos = row[2]

        player = {
            "id": str(id),
            "name": str(name),
            "position": str(pos)
        }
        players.append(player)

        print(f"Scraped) {name}: POS={pos}")

    print(f"Total Players Scraped: {len(players)}")
    return {"players": players}
