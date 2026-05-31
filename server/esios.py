import asyncio
import logging
import os
from datetime import datetime

import aiohttp
from pytz import timezone

logger = logging.getLogger("precioluz.esios")

ESIOS_URL = "https://api.esios.ree.es/indicators/1001"
GEO_PENINSULA = 8741
MADRID_TZ = timezone("Europe/Madrid")
MAX_RETRIES = 3
RETRY_DELAY_S = 8


async def fetch_day_prices(date: str) -> list[float] | None:
    """Devuelve lista de 24 precios euro/kWh (indice = hora) o None si fallan todos los reintentos."""
    token = os.getenv("ESIOS_API_TOKEN")
    if not token:
        logger.critical("ESIOS_API_TOKEN no configurado")
        return None

    local_start = MADRID_TZ.localize(
        datetime.strptime(date, "%Y-%m-%d").replace(hour=0, minute=0, second=0)
    )
    local_end = local_start.replace(hour=23, minute=59, second=59)
    params = {
        "start_date": local_start.isoformat(),
        "end_date":   local_end.isoformat(),
        "time_trunc": "hour",
    }
    headers = {"x-api-key": token, "Accept": "application/json"}

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    ESIOS_URL, headers=headers, params=params,
                    timeout=aiohttp.ClientTimeout(total=20),
                ) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        prices = _parse(data)
                        if prices:
                            return prices
                        logger.warning("Respuesta incompleta para %s (intento %d/%d)", date, attempt, MAX_RETRIES)
                    else:
                        logger.warning("ESIOS HTTP %d para %s (intento %d/%d)", resp.status, date, attempt, MAX_RETRIES)
        except Exception:
            logger.exception("Error de red para %s (intento %d/%d)", date, attempt, MAX_RETRIES)

        if attempt < MAX_RETRIES:
            await asyncio.sleep(RETRY_DELAY_S)

    return None


def _parse(data: dict) -> list[float] | None:
    try:
        values = data["indicator"]["values"]
    except (KeyError, TypeError):
        return None

    bucket: dict[int, float] = {}
    for v in values:
        if v.get("geo_id") != GEO_PENINSULA:
            continue
        try:
            hour_str = v.get("time_interval", {}).get("start", "") or v.get("datetime", "")
            hour_num = datetime.fromisoformat(hour_str).astimezone(MADRID_TZ).hour
            bucket[hour_num] = round(v["value"] / 1000, 5)   # euro/MWh -> euro/kWh
        except Exception:
            continue

    if len(bucket) != 24:
        return None
    return [bucket[h] for h in range(24)]
