import logging
from datetime import datetime, timedelta

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from pytz import timezone

from .db import save_prices, delete_old_prices
from .esios import fetch_day_prices

logger = logging.getLogger("precioluz.scheduler")
MADRID_TZ = timezone("Europe/Madrid")


async def _fetch_and_store(date: str, label: str) -> bool:
    prices = await fetch_day_prices(date)
    if prices:
        await save_prices(date, prices)
        logger.info("%s: precios de %s almacenados", label, date)
        return True
    logger.warning("%s: precios de %s no disponibles", label, date)
    return False


async def job_today():
    today = datetime.now(MADRID_TZ).strftime("%Y-%m-%d")
    yesterday = (datetime.now(MADRID_TZ) - timedelta(days=2)).strftime("%Y-%m-%d")
    await _fetch_and_store(today, "job_today")
    await delete_old_prices(yesterday)


async def job_tomorrow(attempt: int):
    tomorrow = (datetime.now(MADRID_TZ) + timedelta(days=1)).strftime("%Y-%m-%d")
    ok = await _fetch_and_store(tomorrow, f"job_tomorrow(attempt={attempt})")
    if not ok:
        logger.info("Intento %d/3 fallido para precios de manana", attempt)


def setup_scheduler() -> AsyncIOScheduler:
    scheduler = AsyncIOScheduler(timezone=MADRID_TZ)

    # Actualiza precios de hoy cada manana
    scheduler.add_job(job_today, "cron", hour=6, minute=5, id="today")

    # 3 intentos para precios de manana (20:15 / 20:45 / 21:30 hora Madrid)
    scheduler.add_job(job_tomorrow, "cron", hour=20, minute=15, args=[1], id="tomorrow_1")
    scheduler.add_job(job_tomorrow, "cron", hour=20, minute=45, args=[2], id="tomorrow_2")
    scheduler.add_job(job_tomorrow, "cron", hour=21, minute=30, args=[3], id="tomorrow_3")

    return scheduler
