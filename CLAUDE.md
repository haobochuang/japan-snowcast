# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Japan Snowcast is a single-page weather and ski conditions dashboard for 10 Japanese ski resorts. It is a **no-build, no-framework** application — plain HTML, CSS, and vanilla JavaScript that runs directly in the browser.

## Running the App

Open `index.html` directly in any modern browser. No build step, package manager, or server required. All dependencies (Leaflet.js, Google Fonts) are loaded from CDN.

## Architecture

All application logic lives in three files:
- `index.html` — markup and CDN script tags
- `style.css` — ~730 lines; uses CSS custom properties for theming
- `app.js` — ~880 lines; entirely functional (no classes, no modules)

### app.js structure (top to bottom)

1. **Constants & data** — `OPEN_METEO` endpoint, WMO weather code map, `RESORTS` array (10 resorts with static metadata, photos, and fallback forecast data hardcoded)
2. **Utility functions** — `wmoInfo()`, `deriveCondition()`, `formatDate()`, `nowJST()`, etc.
3. **API layer** — `fetchResortWeather()` / `fetchAllWeather()` fetch Open-Meteo in parallel; `processWeatherData()` mutates each resort object in the global `RESORTS` array
4. **Rendering** — `renderSummary()`, `buildCard()` (returns HTML string), `openModal()` / `closeModal()`, `applyFilter()`
5. **Map** — Leaflet initialisation in `initMap()`, `renderMapMarkers()`, `conditionColor()`
6. **Init & lifecycle** — `init()` runs on `DOMContentLoaded`; `scheduleRefresh()` re-fetches every 6 hours

### State model

Global mutable state is minimal:
- `RESORTS` array — enriched in-place by `processWeatherData()` after each API fetch
- Leaflet `map` / layer references held in module-level variables
- UI state is DOM-driven (CSS classes `hidden`, `active`)

### Data flow

```
init()
  → fetchAllWeather()  (parallel Open-Meteo calls)
  → processWeatherData() per resort  (mutates RESORTS)
  → renderSummary() + buildCard() × 10 + renderMapMarkers()
  → scheduleRefresh() every 6 h
```

### Fallback / offline behaviour

Every resort object contains hardcoded `forecast` and `weeklySnow` arrays. If the Open-Meteo API call fails, the card renders with this static data and shows a "Demo" badge instead of "Live".

## External APIs

- **Open-Meteo** (`https://api.open-meteo.com`) — free, no auth required; returns hourly and daily weather variables for a given lat/lon
- **Leaflet tiles** — CartoDB dark tiles via CDN
- **Resort photos** — Wikimedia Commons (CC-licensed), fetched at runtime

## Key domain logic

- `deriveCondition()` classifies snow quality (Powder / Packed Powder / Groomed / etc.) from snow depth and WMO code
- Powder day threshold: ≥ 30 cm base depth **or** ≥ 38 cm summit depth
- All timestamps use `Asia/Tokyo` (JST, UTC+9); `nowJST()` and `todayStrJST()` handle this
- 48-hour snowfall is aggregated from hourly `snowfall` values in `processWeatherData()`
