import sqlite3

async def scrape_player_specifics(year: str):    
    db_path = r"C:\Users\jdori\Documents\jdorigo10-Repos\FantasyWarRoom\db\fantasy_info.db"

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    cursor.execute("""
        SELECT *
        FROM (
            SELECT
                pp.*,
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
        WHERE
            (position = 'QB'  AND position_rank <= 40)
            OR (position = 'RB'  AND position_rank <= 80)
            OR (position = 'WR'  AND position_rank <= 80)
            OR (position = 'TE'  AND position_rank <= 40)
            OR (position = 'DST' AND position_rank <= 32)
            OR (position = 'K'   AND position_rank <= 32)
        ORDER BY draft_rank ASC;
    """, (int(year),))
    rows = cursor.fetchall()

    conn.close()

    players = []
    for row in rows:
        # Player ID
        id = row[0]

        # Team ID
        team_id = row[2]

        # Age & Experience
        age = row[3]
        exp = row[4]

        # Draft Rank & ADP
        draft_rank = row[5]
        adp = row[6]

        # PPG & Games
        ppg = row[7]
        games = row[8]

        # Suspended, Injured, NewTeam
        suspension_status = row[9]
        injury_status = row[10]
        new_team = row[11]

        player = {
            "id": str(id),
            "teamId": str(team_id),
            "age": str(age),
            "exp": str(exp),
            "draftRank": str(draft_rank),
            "adp": str(adp),
            "ppg": str(ppg),
            "games": str(games),
            "suspensionStatus": str(suspension_status),
            "injuryStatus": str(injury_status),
            "teamStatus": str(new_team)
        }
        players.append(player)

        print(f"Scraped) {id}: Rank={draft_rank}, ADP={adp}, PPG={ppg}, Projected Games={games}")

    print(f"Total Players Scraped: {len(players)}")
    return {"players": players}
