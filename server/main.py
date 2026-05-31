import logging
import os
from contextlib import asynccontextmanager
from datetime import datetime, timedelta

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from pytz import timezone
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from .db import init_db, get_prices, save_prices
from .esios import fetch_day_prices
from .scheduler import setup_scheduler

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("precioluz")

MADRID_TZ = timezone("Europe/Madrid")


def _real_ip(request: Request) -> str:
    """Lee X-Real-IP inyectado por Nginx; fallback a IP de conexion directa."""
    return (
        request.headers.get("X-Real-IP")
        or request.headers.get("X-Forwarded-For", "").split(",")[0].strip()
        or (request.client.host if request.client else "unknown")
    )


limiter = Limiter(key_func=_real_ip)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    # Precarga precios de hoy al arrancar si no estan en DB
    today = datetime.now(MADRID_TZ).strftime("%Y-%m-%d")
    if not await get_prices(today):
        prices = await fetch_day_prices(today)
        if prices:
            await save_prices(today, prices)
            logger.info("Precios de hoy (%s) precargados al arrancar", today)
    scheduler = setup_scheduler()
    scheduler.start()
    logger.info("Scheduler iniciado con %d jobs", len(scheduler.get_jobs()))
    yield
    scheduler.shutdown()


app = FastAPI(title="PrecioLuz API", docs_url=None, redoc_url=None, lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


def _build_day(date: str, prices: list[float]) -> dict:
    return {"date": date, "prices": prices}


@app.get("/api/precios")
@limiter.limit("20/minute")
async def get_precios(request: Request):
    now          = datetime.now(MADRID_TZ)
    today_str    = now.strftime("%Y-%m-%d")
    tomorrow_str = (now + timedelta(days=1)).strftime("%Y-%m-%d")

    today_prices    = await get_prices(today_str)
    tomorrow_prices = await get_prices(tomorrow_str)

    if not today_prices:
        return JSONResponse({"error": "datos no disponibles"}, status_code=503)

    published_at  = now.replace(hour=20, minute=15, second=0, microsecond=0)
    show_tomorrow = now >= published_at and tomorrow_prices is not None

    payload = {
        "updated_at": now.isoformat(),
        "today":    _build_day(today_str, today_prices),
        "tomorrow": _build_day(tomorrow_str, tomorrow_prices) if show_tomorrow else None,
    }
    response = JSONResponse(payload)
    response.headers["Cache-Control"] = "public, max-age=1800"
    return response


@app.get("/api/health")
@limiter.limit("5/minute")
async def health(request: Request):
    return {"status": "ok"}
