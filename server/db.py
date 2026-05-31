import aiosqlite
from pathlib import Path

DB_PATH = Path("/data/precioluz.db")


async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS prices (
                date      TEXT NOT NULL,
                hour      INTEGER NOT NULL,
                price_kwh REAL NOT NULL,
                PRIMARY KEY (date, hour)
            )
        """)
        await db.commit()


async def save_prices(date: str, prices: list[float]) -> None:
    """Guarda lista de 24 precios euro/kWh (indice = hora)."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.executemany(
            "INSERT OR REPLACE INTO prices (date, hour, price_kwh) VALUES (?, ?, ?)",
            [(date, hour, price) for hour, price in enumerate(prices)],
        )
        await db.commit()


async def get_prices(date: str) -> list[float] | None:
    """Devuelve lista de 24 precios o None si no estan completos."""
    async with aiosqlite.connect(DB_PATH) as db:
        async with db.execute(
            "SELECT price_kwh FROM prices WHERE date = ? ORDER BY hour ASC", (date,)
        ) as cursor:
            rows = await cursor.fetchall()
    if len(rows) != 24:
        return None
    return [row[0] for row in rows]


async def delete_old_prices(before_date: str) -> None:
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("DELETE FROM prices WHERE date < ?", (before_date,))
        await db.commit()
