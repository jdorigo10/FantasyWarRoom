import sqlite3

async def update_tags(data):
    db_path = r"C:\Users\jdori\Documents\jdorigo10-Repos\FantasyWarRoom\db\saved_info.db"

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    year = data["year"]
    tags = data["tags"]

    # Remove all tags for this year
    cursor.execute(
        """
        DELETE FROM tags
        WHERE year = ?
        """,
        (year,)
    )

    # Insert new tags
    cursor.executemany(
        """
        INSERT INTO tags (
            year,
            playerId,
            favorite,
            target
        )
        VALUES (?, ?, ?, ?)
        """,
        [
            (
                year,
                tag["playerId"],
                int(tag["favorite"]),
                int(tag["target"])
            )
            for tag in tags
        ]
    )

    conn.commit()
    conn.close()

    return {"success": True}
