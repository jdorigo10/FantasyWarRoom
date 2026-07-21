import sqlite3

async def load_tags(year: int):
    db_path = r"C:\Users\jdori\Documents\jdorigo10-Repos\FantasyWarRoom\db\saved_info.db"

    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT playerId, favorite, target
        FROM tags
        WHERE year = ?
        """,
        (year,)
    )

    rows = cursor.fetchall()
    conn.close()

    tags = [
        {
            "playerId": row["playerId"],
            "favorite": row["favorite"],
            "target": row["target"]
        }
        for row in rows
    ]

    return {"tags": tags}
