# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Japan Snowcast is a single-page weather and ski conditions dashboard for **20 Japanese ski resorts**. It is a **no-build, no-framework** application — plain HTML, CSS, and vanilla JavaScript that runs directly in the browser.

Live site: https://haobochuang.github.io/japan-snowcast/
GitHub: https://github.com/haobochuang/japan-snowcast

## Running the App

Open `index.html` directly in any modern browser. No build step, package manager, or server required. Leaflet.js is **bundled locally** (`leaflet.js`, `leaflet.css`, `images/`). Google Fonts loads from CDN.

## Architecture

All application logic lives in three files:
- `index.html` — markup and local script/style tags
- `style.css` — ~800 lines; uses CSS custom properties for theming
- `app.js` — ~1100 lines; entirely functional (no classes, no modules)

Local assets:
- `leaflet.js` — Leaflet 1.9.4 bundled locally (CDN was unreliable)
- `leaflet.css` — Leaflet 1.9.4 CSS
- `images/` — Leaflet default marker images (`marker-icon.png`, `marker-icon-2x.png`, `marker-shadow.png`)

### app.js structure (top to bottom)

1. **Constants & data** — `OPEN_METEO` / `OPEN_METEO_ARCHIVE` endpoints, WMO weather code map, `RESORTS` array (20 resorts with static metadata, photos, and fallback forecast data hardcoded)
2. **Utility functions** — `wmoInfo()`, `deriveCondition()`, `formatDate()`, `nowJST()`, `todayStrJST()`, etc.
3. **API layer** — `fetchResortWeather()` / `fetchAllWeather()` fetch Open-Meteo forecast in parallel; `fetchResortHistory()` fetches Open-Meteo archive for 3-month history; `processWeatherData()` / `processHistoryData()` mutate resort objects
4. **Rendering** — `renderSummary()`, `buildCard()` (returns HTML string), `openModal()` / `closeModal()`, `applyFilter()`, `buildHistoryHTML()`, `renderHistoryIntoModal()`
5. **Map** — `initMap()`, `renderMapMarkers()`, `conditionColor()` for the inline map; `initBigMap()`, `renderBigMapMarkers()`, `openBigMap()`, `closeBigMap()` for the full-screen map modal
6. **Init & lifecycle** — `init()` runs on `DOMContentLoaded`; `scheduleRefresh()` re-fetches every 6 hours

### State model

Global mutable state is minimal:
- `RESORTS` array — enriched in-place by `processWeatherData()` after each API fetch; `resort.historyCache` stores 3-month history (undefined = not fetched, null = failed, object = success)
- Leaflet `map` / `bigMap` / layer references held in module-level variables
- UI state is DOM-driven (CSS classes `hidden`, `active`, `open`)

### Data flow

```
init()
  → render immediately with fallback data (non-blocking)
  → fetchAllWeather()  (parallel Open-Meteo calls, 8s per resort / 10s global timeout)
  → processWeatherData() per resort  (mutates RESORTS)
  → renderSummary() + buildCard() × 20 + renderMapMarkers()
  → scheduleRefresh() every 6 h

openModal(resort)
  → renderHistoryIntoModal()  (lazy, cached on resort.historyCache)
  → fetchResortHistory()  (Open-Meteo archive, 12s timeout)
  → processHistoryData()  → buildHistoryHTML()
```

### Fallback / offline behaviour

Every resort object contains hardcoded `forecast` and `weeklySnow` arrays. If the Open-Meteo API call fails the card renders with this static data and shows a "Demo" badge instead of "Live". The UI renders immediately on page load; live data fills in asynchronously (max 10s wait).

## External APIs

- **Open-Meteo forecast** (`https://api.open-meteo.com/v1/forecast`) — free, no auth required; hourly and daily weather variables for a lat/lon
- **Open-Meteo archive** (`https://archive-api.open-meteo.com/v1/archive`) — free, no auth; used for 3-month history (snowfall, temperature hi/lo, wind speed)
- **Map tiles** — OpenStreetMap tiles (`https://tile.openstreetmap.org/{z}/{x}/{y}.png`)
- **Resort photos** — Wikimedia Commons (CC-licensed), fetched at runtime

## Key domain logic

- `deriveCondition()` classifies snow quality (Powder / Packed Powder / Groomed / etc.) from snow depth and WMO code
- Powder day threshold: ≥ 30 cm base depth **or** ≥ 38 cm summit depth
- **Avg Top Depth** in summary bar = average of each resort's `baseDepth × 1.5`
- All timestamps use `Asia/Tokyo` (JST, UTC+9); `nowJST()` and `todayStrJST()` handle this
- 48-hour snowfall is aggregated from hourly `snowfall` values in `processWeatherData()`
- History is aggregated into ~13 weekly buckets in `processHistoryData()`

## Resorts (20 total)

| # | Resort | Region |
|---|--------|--------|
| 1 | Niseko United | Hokkaido |
| 2 | Rusutsu | Hokkaido |
| 3 | Furano | Hokkaido |
| 4 | Hakuba Valley | Nagano |
| 5 | Nozawa Onsen | Nagano |
| 6 | Shiga Kogen | Nagano |
| 7 | Myoko Suginohara | Niigata |
| 8 | Zao Onsen | Yamagata |
| 9 | Kiroro | Hokkaido |
| 10 | Appi Kogen | Iwate |
| 11 | Tomamu | Hokkaido |
| 12 | Naeba | Niigata |
| 13 | Geto Kogen | Iwate |
| 14 | Madarao Kogen | Nagano |
| 15 | Cortina | Nagano |
| 16 | Asahidake | Hokkaido |
| 17 | Sahoro | Hokkaido |
| 18 | Tazawako | Akita |
| 19 | Grandeco | Fukushima |
| 20 | Yuzawa Kogen | Niigata |

## Git / Deployment

- Git identity: Jackie / haobo.chuang@gmail.com
- Remote: `origin` → https://github.com/haobochuang/japan-snowcast.git
- Branch: `master`
- Deployed via GitHub Pages (auto-deploys from master)
