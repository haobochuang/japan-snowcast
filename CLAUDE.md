# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Japan Snowcast is a single-page weather and ski conditions dashboard for **50 Japanese ski resorts**. It is a **no-build, no-framework** application — plain HTML, CSS, and vanilla JavaScript that runs directly in the browser.

Live site: https://haobochuang.github.io/japan-snowcast/
GitHub: https://github.com/haobochuang/japan-snowcast

## Running the App

Open `index.html` directly in any modern browser. No build step, package manager, or server required. Leaflet.js is **bundled locally** (`leaflet.js`, `leaflet.css`, `images/`). Google Fonts loads from CDN.

## Architecture

All application logic lives in three files:
- `index.html` — markup and local script/style tags
- `style.css` — ~1050 lines; uses CSS custom properties for theming; includes `body.sakura-theme` overrides for light theme
- `app.js` — ~2270 lines; entirely functional (no classes, no modules)

Local assets:
- `leaflet.js` — Leaflet 1.9.4 bundled locally (CDN was unreliable)
- `leaflet.css` — Leaflet 1.9.4 CSS
- `images/` — Leaflet default marker images (`marker-icon.png`, `marker-icon-2x.png`, `marker-shadow.png`)

### app.js structure (top to bottom)

1. **Constants & data** — `OPEN_METEO` / `OPEN_METEO_ARCHIVE` endpoints, WMO weather code map, `RESORTS` array (50 resorts with static metadata, photos, and fallback forecast data hardcoded)
2. **Utility functions** — `wmoInfo()`, `deriveCondition()`, `formatDate()`, `nowJST()`, `todayStrJST()`, etc.
3. **API layer** — `fetchResortWeather()` / `fetchAllWeather()` fetch Open-Meteo forecast in parallel; `fetchResortHistory()` fetches Open-Meteo archive for 3-month history; `fetchResortHistory()` / `fetch10YearSnowfall()` fetch archive data; `processWeatherData()` / `processHistoryData()` / `process10YearData()` mutate resort objects
4. **Rendering** — `renderSummary()`, `buildCard()` (returns HTML string), `openModal()` / `closeModal()`, `applyFilter()`, `buildHistoryHTML()`, `renderHistoryIntoModal()`, `build10YearChartHTML()`, `render10YearIntoModal()`
5. **Map** — `initMap()`, `renderMapMarkers()`, `conditionColor()` for the inline map; `initBigMap()`, `renderBigMapMarkers()`, `openBigMap()`, `closeBigMap()` for the full-screen map modal
6. **Theme** — `applyTheme()`, `initTheme()`; toggles `body.sakura-theme` class; persists choice in `localStorage`
7. **Init & lifecycle** — `init()` runs on `DOMContentLoaded`; `scheduleRefresh()` re-fetches every 6 hours

### State model

Global mutable state is minimal:
- `RESORTS` array — enriched in-place by `processWeatherData()` after each API fetch; `resort.historyCache` stores 3-month history; `resort.decadeCache` stores 10-year seasonal snowfall (undefined = not fetched, null = failed, object = success)
- Leaflet `map` / `bigMap` / layer references held in module-level variables
- UI state is DOM-driven (CSS classes `hidden`, `active`, `open`)
- Theme state: `body.sakura-theme` class present = Sakura (light) theme; persisted in `localStorage` key `theme`

### Data flow

```
init()
  → initTheme()  (reads localStorage, applies sakura-theme class, wires toggle button)
  → render immediately with fallback data (non-blocking)
  → fetchAllWeather()  (parallel Open-Meteo calls, 8s per resort / 10s global timeout)
  → processWeatherData() per resort  (mutates RESORTS)
  → renderSummary() + buildCard() × 50 + renderMapMarkers()
  → scheduleRefresh() every 6 h

openModal(resort)
  → renderHistoryIntoModal()  (lazy, cached on resort.historyCache)
    → fetchResortHistory()  (Open-Meteo archive, 12s timeout)
    → processHistoryData()  → buildHistoryHTML()
  → render10YearIntoModal()  (lazy, cached on resort.decadeCache)
    → fetch10YearSnowfall()  (Open-Meteo archive Nov–Apr, 10 seasons, 20s timeout)
    → process10YearData()  → build10YearChartHTML()
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
- 3-month history is aggregated into ~13 weekly buckets in `processHistoryData()`
- 10-year snowfall counts only ski months (Nov–Apr); each Nov/Dec belongs to that year's season, each Jan–Apr belongs to the prior year's season (e.g. Jan 2024 → season 2023/24)
- Chart container heights are computed dynamically: `MAX_BAR_H + LABEL_OVERHEAD` (34 px) so value labels are never clipped

## Theming

Two themes are supported, toggled by the **🌸 Sakura / 🌙 Dark** button in the header:

| | Dark (default) | Sakura (light) |
|---|---|---|
| CSS hook | no class on `body` | `body.sakura-theme` |
| Background | `#0b0f1a` | `#fdf0f5` |
| Accent | `#4fc3f7` (cyan) | `#c2185b` (cherry) |
| Particles | ❄ snowflakes, white | ✿ petals, pink |

All sakura overrides live at the bottom of `style.css` under `/* ─── Sakura (Light) Theme */`. Hardcoded dark colours (header gradient, map pin bubble, map layer buttons, map legend, card rank badge, card hero overlay) each have an explicit `body.sakura-theme` rule. Theme choice is persisted in `localStorage` key `theme`.

## Resorts (50 total)

| # | Resort | Region |
|---|--------|--------|
| 1 | Niseko United | Hokkaido |
| 2 | Hakuba Valley | Nagano |
| 3 | Nozawa Onsen | Nagano |
| 4 | Myoko Kogen | Niigata |
| 5 | Furano | Hokkaido |
| 6 | Rusutsu | Hokkaido |
| 7 | Kiroro | Hokkaido |
| 8 | Zao Onsen | Yamagata |
| 9 | Shiga Kogen | Nagano |
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
| 21 | Kagura | Niigata |
| 22 | GALA Yuzawa | Niigata |
| 23 | Joetsu Kokusai | Niigata |
| 24 | Moiwa | Hokkaido |
| 25 | Tsugaike Kogen | Nagano |
| 26 | Happo-one | Nagano |
| 27 | Kamui Ski Links | Hokkaido |
| 28 | Akakura Kanko | Niigata |
| 29 | Mt. Rokko Snow Park | Hyogo |
| 30 | Biwako Valley | Shiga |
| 31 | Tenjindaira | Gunma |
| 32 | Karuizawa Prince | Nagano |
| 33 | Sugadaira Kogen | Nagano |
| 34 | Shizukuishi | Iwate |
| 35 | Hachimantai | Akita |
| 36 | Inawashiro | Fukushima |
| 37 | Tsunan | Niigata |
| 38 | Hunter Mountain | Tochigi |
| 39 | Nasu Kogen | Tochigi |
| 40 | Ontake | Nagano |
| 41 | Takasu Snow Park | Gifu |
| 42 | Dynaland | Gifu |
| 43 | Pippu | Hokkaido |
| 44 | Hanazono | Hokkaido |
| 45 | Seki Onsen | Niigata |
| 46 | Ikenotaira Onsen | Niigata |
| 47 | Aomori Spring | Aomori |
| 48 | Hakkoda | Aomori |
| 49 | Yubari Mount Racey | Hokkaido |
| 50 | Tokachidake Onsen | Hokkaido |

## Git / Deployment

- Git identity: Jackie / haobo.chuang@gmail.com
- Remote: `origin` → https://github.com/haobochuang/japan-snowcast.git
- Branch: `master`
- Deployed via GitHub Pages (auto-deploys from master)
