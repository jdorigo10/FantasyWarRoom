import sqlite3

async def delete_strategy(id: int):
    db_path = r"C:\Users\jdori\Documents\jdorigo10-Repos\FantasyWarRoom\db\saved_info.db"

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    cursor.execute(
        """
        DELETE FROM strategies
        WHERE id = ?
        """,
        (id,)
    )  

    conn.commit()
    conn.close()

    return {"success": True}
