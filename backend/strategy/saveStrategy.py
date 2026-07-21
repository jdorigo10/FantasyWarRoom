import sqlite3

async def save_strategy(data):
    db_path = r"C:\Users\jdori\Documents\jdorigo10-Repos\FantasyWarRoom\db\saved_info.db"

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    rounds = data.get("rounds", [])

    # Ensure exactly 16 values
    rounds = (rounds + [""] * 16)[:16]

    cursor.execute(
        """
        INSERT INTO strategies (
            id, pick, teams, year, rank, name, description,
            round1, round2, round3, round4,
            round5, round6, round7, round8,
            round9, round10, round11, round12,
            round13, round14, round15, round16
        )
        VALUES (
            ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?
        )
        ON CONFLICT(id) DO UPDATE SET
            pick = excluded.pick,
            teams = excluded.teams,
            year = excluded.year,
            rank = excluded.rank,
            name = excluded.name,
            description = excluded.description,
            round1 = excluded.round1,
            round2 = excluded.round2,
            round3 = excluded.round3,
            round4 = excluded.round4,
            round5 = excluded.round5,
            round6 = excluded.round6,
            round7 = excluded.round7,
            round8 = excluded.round8,
            round9 = excluded.round9,
            round10 = excluded.round10,
            round11 = excluded.round11,
            round12 = excluded.round12,
            round13 = excluded.round13,
            round14 = excluded.round14,
            round15 = excluded.round15,
            round16 = excluded.round16;
        """,
        (
            data["id"],
            data["pick"],
            data["teams"],
            data["year"],
            data["rank"],
            data["name"],
            data["description"],
            *rounds,
        )
    )

    conn.commit()
    conn.close()

    return {"success": True}
