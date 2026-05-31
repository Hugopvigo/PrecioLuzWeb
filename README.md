<div align="center">

# ⚡ PrecioLuz Web

### *El precio de la luz en tu navegador, al instante*

![React](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Python](https://img.shields.io/badge/Python_3.12-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

---

*Web app que muestra los precios horarios del PVPC publicados por REE/ESIOS,*
*con el mismo diseño visual que la [app Android](https://github.com/Hugopvigo/PrecioLuzApp).*

<br>

```
╭──────────────────────────────────────────╮
│ ⚡ PrecioLuz                             │
│                                          │
│    €/kWh                                 │
│   ┌─────┐                                │
│   │0.142│  ● Caro · Punta                │
│   └─────┘  ↑ Sube a las 15:00            │
│                                          │
│   💰 Min: 0.061    💀 Max: 0.201         │
│                                          │
│   [ Hoy ]  [ Mañana ]                    │
╰──────────────────────────────────────────╯
```

</div>

---

## ✨ Características

| | |
|---|---|
| 🔄 | **Tiempo real** — precios de hoy y mañana (desde las 20:15h) |
| 🔒 | **Sin API key** — el servidor gestiona ESIOS, tú solo consumes JSON |
| ⏱️ | **3 reintentos** — 20:15 · 20:45 · 21:30 para precios de mañana |
| 🎨 | **Réplica visual** — Aurora background, glassmorphism, colores por tier |
| 🛡️ | **Rate limiting** — 20 req/min por IP |
| 💾 | **Caché SQLite** — ESIOS solo se consulta 4 veces al día |
| 🌗 | **Dark / Light / Auto** — toggle en el header |

---

## 🏗️ Arquitectura

```
                          ☁️  Cloudflare DNS
                                  │
                                  ▼
                        ┌─────────────────┐
                        │  Apache (SSL)   │
                        │  precioluz.hugo │
                        └────────┬────────┘
                                 │
                    ┌────────────▼────────────┐
                    │     🐳 Docker Compose   │
                    │                         │
                    │  ┌─────────┐ ┌────────┐ │
                    │  │ Nginx   │ │ FastAPI│ │
                    │  │  :80    │ │  :8000 │ │
                    │  │ React ◄─┤─┤  ↕     │ │
                    │  │   SPA   │ │ SQLite │ │
                    │  └─────────┘ └────┬───┘ │
                    └───────────────────│─────┘
                                        │
                               ┌────────▼────────┐
                               │  🇪🇸 REE/ESIOS   │
                               │   1×/día máx    │
                               └─────────────────┘
```

---

## 🚀 Despliegue rápido

### Requisitos
- Docker + Docker Compose
- Token gratuito de [ESIOS/REE](https://api.esios.ree.es/)

### ¡A arrancar!

```bash
# Clonar
git clone https://github.com/Hugopvigo/PrecioLuzWeb.git
cd PrecioLuzWeb

# Configurar
cp .env.example .env
nano .env  # ← Añade tu ESIOS_API_TOKEN

# ¡Listo!
docker compose -f docker/docker-compose.yml up -d --build
```

> 🌐 Disponible en `http://localhost:8081`

### Variables de entorno

| Variable | Descripción |
|:---------|:------------|
| `ESIOS_API_TOKEN` | Token de ESIOS/REE (obligatorio) |
| `TZ` | Zona horaria → `Europe/Madrid` |
| `LOG_LEVEL` | `INFO` (defecto) o `DEBUG` |

---

## 📡 API

### `GET /api/precios`

```json
{
  "updated_at": "2026-05-31T21:30:00+02:00",
  "today": {
    "date": "2026-05-31",
    "prices": [0.061, 0.058, "...", 0.183]
  },
  "tomorrow": {
    "date": "2026-06-01",
    "prices": [0.072, 0.068, "...", 0.156]
  }
}
```

<div align="center">

| Dato | Descripción |
|:-----|:------------|
| `prices` | 24 valores en **€/kWh** (impuestos incluidos) |
| `tomorrow` | `null` antes de las 20:15h |
| Rate limit | 20 peticiones/min por IP |
| Cache | `Cache-Control: public, max-age=1800` |

</div>

### `GET /api/health`

```json
{ "status": "ok" }
```

---

## ⏰ Scheduler

```
 06:05  ──  📅 Actualiza hoy + limpia anteayer
 20:15  ──  🌙 Intento 1: precios de mañana
 20:45  ──  🌙 Intento 2: si el 1 falló
 21:30  ──  🌙 Intento 3: último intento
```

> REE publica los precios del día siguiente entre las 20:00 y 20:30h.
> Los 3 intentos cubren publicaciones tardías.

---

## 🛠️ Desarrollo local

```bash
# Frontend
npm install && npm run dev    # Vite en :5173

# Backend
cd server
pip install -r requirements.txt
uvicorn server.main:app --reload --port 8000
```

> El proxy de Vite redirige `/api/*` → `:8000` automáticamente.

---

## 📁 Estructura

```
PrecioLuzWeb/
├── 🐍 server/
│   ├── main.py          ← FastAPI + rate limiting
│   ├── scheduler.py     ← APScheduler (4 ejecuciones/día)
│   ├── esios.py         ← Fetch ESIOS (solo Península)
│   ├── db.py            ← SQLite async
│   └── requirements.txt
├── ⚛️ web/
│   └── src/
│       ├── App.tsx
│       ├── components/
│       │   ├── AuroraBackground.tsx
│       │   ├── GlassCard.tsx
│       │   ├── HeroPriceCard.tsx
│       │   ├── HourList.tsx
│       │   ├── LiveIndicator.tsx
│       │   └── StatRow.tsx
│       └── hooks/
│           └── usePrices.ts
└── 🐳 docker/
    ├── docker-compose.yml
    ├── Dockerfile.api
    ├── Dockerfile.web
    └── nginx.conf
```

---

## 🔗 Relación con la app Android

Este proyecto es el backend de [PrecioLuzApp](https://github.com/Hugopvigo/PrecioLuzApp).
La app consume `GET /api/precios`, almacena en Room (caché local) y no necesita API key propia.

Los colores, componentes y lógica de tiers son una traducción directa del código Kotlin.

---

<div align="center">

**MIT** — haz lo que quieras ❤️

---

Desarrollado por **[Hugo Pérez-Vigo](https://hugopvigo.es)** · [@hugopvigo](https://x.com/hugopvigo)

[![GitHub](https://img.shields.io/badge/GitHub-Hugopvigo-181717?style=for-the-badge&logo=github)](https://github.com/Hugopvigo)

</div>
