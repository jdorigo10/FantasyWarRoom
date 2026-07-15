import sqlite3

async def scrape_past_player_info(year: str):    
    db_path = r"C:\Users\jdori\Documents\jdorigo10-Repos\FantasyWarRoom\db\past_info.db"

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    cursor.execute("""
        WITH ranked_players AS (
            SELECT
                pp.player_id,
                pp.draft_rank,
                p.position,
                ROW_NUMBER() OVER (
                    PARTITION BY p.position
                    ORDER BY pp.draft_rank ASC
                ) AS position_rank
            FROM player_preseason pp
            INNER JOIN players p
                ON pp.player_id = p.player_id
            WHERE pp.season_year = ?
                AND pp.draft_rank IS NOT NULL
        )
        SELECT
            post.*
        FROM player_postseason post
        INNER JOIN ranked_players rp
            ON post.player_id = rp.player_id
        WHERE post.season_year = ?
            AND (
                (rp.position = 'QB'  AND rp.position_rank <= 40)
                OR (rp.position = 'RB'  AND rp.position_rank <= 80)
                OR (rp.position = 'WR'  AND rp.position_rank <= 80)
                OR (rp.position = 'TE'  AND rp.position_rank <= 40)
                OR (rp.position = 'DST' AND rp.position_rank <= 32)
                OR (rp.position = 'K'   AND rp.position_rank <= 32)
            )
        ORDER BY post.actual_ppg DESC;
    """, (int(year), int(year)))

    rows = cursor.fetchall()

    conn.close()

    players = []
    for row in rows:
        # Player ID
        id = row[0]

        # PPG
        ppg = row[3]

        # Games Played
        games = row[4]

        # Scoring Breakdown
        breakdown = row[5]

        player = {
            "id": str(id),
            "ppg": str(ppg),
            "games": str(games),
            "breakdown": str(breakdown)
        }
        players.append(player)

        print(f"Scraped) {id}: PPG={ppg} GAMES={games} ({breakdown})")

    print(f"Total Players Scraped: {len(players)}")
    return {"players": players}
