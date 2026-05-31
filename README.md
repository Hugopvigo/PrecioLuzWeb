# ⚡ PrecioLuz Web

> Precio de la luz PVPC en tiempo real · España Peninsular

Web app que muestra los precios horarios del PVPC (Precio Voluntario para el Pequeño Consumidor) publicados por REE/ESIOS, con diseño visual idéntico a la [app Android PrecioLuz](https://github.com/Hugopvigo/PrecioLuzApp).

---

## Características

- **Precios en tiempo real** — hoy y mañana (desde las 20:15h)
- **Sin API key para el usuario** — el servidor obtiene los datos una vez al día y los sirve como JSON
- **3 reintentos automáticos** para precios de mañana: 20:15 · 20:45 · 21:30 hora Madrid
- **Diseño réplica de la app Android** — Aurora background, glassmorphism, colores por tier
- **Rate limiting** — 20 req/min por IP para proteger el endpoint
- **Caché SQLite** en servidor — ESIOS solo se consulta 4 veces al día máximo
- **Dark / Light / Auto** tema con toggle en el header

---

## Vista previa

```
┌─────────────────────────────────────┐
│ ⚡ PrecioLuz   Precio de la luz · PVPC   ✦ │
├─────────────────────────────────────┤
│ Hoy                        ● En directo │
│ Sábado, 31 de mayo                      │
│                                         │
│ ┌─────────────────────────────────┐     │
│ │ Ahora · 14–15h                  │     │
│ │ 0,1823            €/kWh         │     │
│ │ ● Caro   Punta   ↑ Sube a 15:00 │     │
│ └─────────────────────────────────┘     │
│                                         │
│ ┌────────┐ ┌────────┐ ┌────────┐       │
│ │Mín 💰  │ │ Media  │ │Máx 💀  │       │
│ │ 0,061  │ │ 0,112  │ │ 0,201  │       │
│ │03–04h  │ │ €/kWh  │ │19–20h  │       │
│ └────────┘ └────────┘ └────────┘       │
│                                         │
│         [ Hoy ]  [ Mañana ]            │
└─────────────────────────────────────────┘
```

---

## Arquitectura

```
                    ┌─────────────────────┐
                    │    Cloudflare DNS    │
                    └──────────┬──────────┘
                               │ HTTPS
                    ┌──────────▼──────────┐
                    │   Apache (SSL/TLS)  │
                    │ precioluz.hugopvigo │
                    └──────────┬──────────┘
                               │ :8081
              ┌────────────────▼────────────────┐
              │         Docker Compose           │
              │                                  │
              │  ┌──────────┐  ┌──────────────┐ │
              │  │  Nginx   │  │   FastAPI    │ │
              │  │  :80     │  │   :8000      │ │
              │  │ React SPA│  │ + APScheduler│ │
              │  │ /api/ ──►│  │ + SQLite     │ │
              │  └──────────┘  └──────┬───────┘ │
              └─────────────────────── │ ────────┘
                                       │ 1×/día máx
                              ┌────────▼────────┐
                              │  REE / ESIOS API │
                              └─────────────────┘
```

**Stack:**
- `server/` — Python 3.12 · FastAPI · APScheduler · aiosqlite · slowapi
- `web/` — React 19 · TypeScript · Vite 8 · Tailwind CSS 4 · TanStack Query

---

## Estructura del proyecto

```
PrecioLuzWeb/
├── server/
│   ├── main.py          # FastAPI app + rate limiting (slowapi)
│   ├── scheduler.py     # APScheduler: 06:05 / 20:15 / 20:45 / 21:30 Madrid
│   ├── esios.py         # Fetch ESIOS — solo Península (geo_id 8741)
│   ├── db.py            # SQLite via aiosqlite
│   └── requirements.txt
├── web/
│   ├── src/
│   │   ├── App.tsx                     # Layout principal + tabs
│   │   ├── types.ts                    # HourPrice, DayPrices, PriceTier
│   │   ├── utils.ts                    # buildDayPrices, colores por tier
│   │   ├── components/
│   │   │   ├── AuroraBackground.tsx    # Fondo animado con blobs
│   │   │   ├── GlassCard.tsx           # Card glassmorphism
│   │   │   ├── HeroPriceCard.tsx       # Precio actual + tier + tendencia
│   │   │   ├── StatRow.tsx             # Mín 💰 / Media / Máx 💀
│   │   │   ├── HourList.tsx            # 24 filas con barras y emojis
│   │   │   └── LiveIndicator.tsx       # Dot verde pulsante
│   │   └── hooks/
│   │       └── usePrices.ts            # React Query, staleTime 30min
│   └── index.html
├── docker/
│   ├── docker-compose.yml  # api (interno) + web (puerto 8081)
│   ├── Dockerfile.api
│   ├── Dockerfile.web
│   └── nginx.conf          # SPA + proxy /api/ → FastAPI
└── .env.example
```

---

## Despliegue

### Requisitos
- Docker + Docker Compose
- Token de API de [ESIOS/REE](https://api.esios.ree.es/) (gratuito, registro en web de REE)

### Pasos

```bash
# 1. Clonar y configurar entorno
git clone https://github.com/Hugopvigo/PrecioLuzWeb.git
cd PrecioLuzWeb
cp .env.example .env
# Editar .env y añadir tu ESIOS_API_TOKEN

# 2. Arrancar
docker compose -f docker/docker-compose.yml up -d --build

# 3. Verificar
curl http://localhost:8081/api/precios
```

La app estará disponible en `http://localhost:8081`.

### Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `ESIOS_API_TOKEN` | Token de la API de REE/ESIOS (obligatorio) |
| `TZ` | Zona horaria del servidor (debe ser `Europe/Madrid`) |
| `LOG_LEVEL` | Nivel de log Python: `INFO` (defecto) o `DEBUG` |

---

## API Endpoint

### `GET /api/precios`

Devuelve los precios del día actual y, a partir de las 20:15h, del día siguiente.

**Rate limit:** 20 peticiones/minuto por IP · `Cache-Control: public, max-age=1800`

```json
{
  "updated_at": "2026-05-31T21:30:00+02:00",
  "today": {
    "date": "2026-05-31",
    "prices": [0.06123, 0.05891, ..., 0.18340]
  },
  "tomorrow": {
    "date": "2026-06-01",
    "prices": [0.07201, 0.06890, ..., 0.15620]
  }
}
```

`prices` es un array de 24 valores en **€/kWh con impuestos incluidos**, siendo el índice la hora (0 = 00:00–01:00, 23 = 23:00–24:00). `tomorrow` es `null` antes de las 20:15h.

### `GET /api/health`

```json
{"status": "ok"}
```

---

## Scheduler de precios

| Hora (Madrid) | Acción |
|---------------|--------|
| 06:05 | Actualiza precios de hoy + limpia datos de anteayer |
| 20:15 | Intento 1 — precios de mañana |
| 20:45 | Intento 2 — precios de mañana (si el 1 falló) |
| 21:30 | Intento 3 — precios de mañana (último intento) |

REE publica los precios del día siguiente habitualmente entre las 20:00 y las 20:30h. Los 3 intentos cubren los casos de publicación tardía.

---

## Desarrollo local

```bash
# Instalar dependencias frontend
npm install

# Backend (en un terminal)
cd server && pip install -r requirements.txt
uvicorn server.main:app --reload --port 8000

# Frontend (en otro terminal)
npm run dev   # Vite en :5173, proxy /api → :8000
```

---

## Relación con la app Android

Este proyecto actúa como backend para [PrecioLuzApp](https://github.com/Hugopvigo/PrecioLuzApp). La app Android consume `GET /api/precios`, almacena los resultados en Room (caché local) y no necesita API key propia de ESIOS.

Diseño visual: los colores, componentes y lógica de tiers/tramos son una traducción directa del código Kotlin de la app.

---

## Licencia

MIT — ver [LICENSE](LICENSE)
