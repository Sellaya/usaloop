# USA Loop trip app — how the repo maps to the product plan

This document ties **[`USA_Loop_Cursor_Project_Plan.md`](./USA_Loop_Cursor_Project_Plan.md)** (full product spec, copied from your Cursor plan) to **this static app** (`index.html`, `app.js`, `data/*.json`). Use it when editing the trip or extending features.

---

## Trip facts (canonical)

| Item | Source |
|------|--------|
| **Loop** | Toronto → Texas → West Coast → Rockies → home (see `data/trip.json` → `trip.name`, `trip.overviewLead`) |
| **Dates** | `2026-05-20` → `2026-06-24` (`trip.startDate`, `trip.endDate`) |
| **Length** | 36 days (`trip.statsChips`, `days.length`) |
| **Bike** | Suzuki DR650 (`trip.bike`) |
| **Legs** | 1: Days 1–9 Toronto → Fort Worth · 2: Days 10–24 Fort Worth → Seattle · 3: Days 25–36 Seattle → Toronto (`trip.legs`, `inferLeg()` in `app.js`) |
| **Total km** | ~14,400 km target; **live** total from Google Directions sum (`#overview-route-total`, glance footer) when `GOOGLE_MAPS_API_KEY` + `data/route-overlays.json` are set |

Rider contact placeholders: `trip.riderName`, `trip.riderEmail`, `trip.riderPhone` (fill for emergency / host comms).

---

## Plan section → this app (single page, jump nav)

The product plan lists **12** top-level areas. This app is **one long page** with anchors (not separate React routes). Mapping:

| # | Plan area | Where it lives here | Data / notes |
|---|-----------|---------------------|--------------|
| 1 | **Dashboard** | **Calendar at a glance** (`#glance`) + header title/date + optional **hero** (`#hero-root` when trip has tagline/chips) | Table: day, leg, route, km, highlight, sleep. **Today**: matching `day.date` opens that day’s `<details>` in **Daily plan** (`app.js`). |
| 2 | **Route overview** | **Route overview map** (`#map-embed`) directly under the hero (when shown), then **Route distance** (`#overview`) | Leg colours on map; full-route km; `trip.legs`, `trip.regionChips` (when overview card is not “distance-only”). |
| 3 | **Daily plan** | **Daily plan** (`#days`) | **`data/trip.json`** → `days[]`: `dayIndex`, `date`, `title`, `routeLine`, `highlights`, `lodging`, `lodgingAlternatives`, `feesAndPasses`, `stops`, `risks`, `planB`, notes fields, B.a.B. ids. Per-day **Google Directions** km from `data/route-overlays.json` + Maps JS. |
| 4 | **Weather** | **Today’s weather (dashboard)** (`#dashboard-weather`) uses the **device calendar date** at corridor pins; **Weather along the route** (`#route-weather`) is the full 5-day grid; **per-day** blocks inside each day match **that itinerary day’s date** when coords + API work | **OpenWeather** via **`/api/weather`** (`api/weather.js`), key `OPENWEATHER_API_KEY`. **5-day** rolling window at pins. Plan’s heat/wind/rain rules align with `scoreMotorcycleRidingRisks` / `collectHeroImportantNotes` in `app.js`. |
| 5 | **Hosts & sleep** | Inside **each day** — stay summary, **B.a.B.** contact cards | **`data/bab-hosts.json`** keyed by host id; `babAlternateIds` / merge ids on days. |
| 6 | **Motorcycle maintenance** | **Homework** (`#homework`) + **Parts** (`#parts-shops`) | **`data/homework.json`**, **`data/motorcycle-parts-shops.json`**. Plan’s “daily bike check” lists are not a separate UI yet — homework carries regional + bike risk narrative. |
| 7 | **Packing** | **Packing & prep** (`#checklists`) | Driven from **`data/trip.json`** `checklists` (or linked structure `app.js` reads). |
| 8 | **Budget** | *Not a dedicated section yet* | Plan §9 — could add `data/budget.json` later; no hardcoded budget UI today. |
| 9 | **Content plan** | **YouTube Content Guide** (`#content`) | **`data/content-creation.json`** (episode briefs, road rules, culture). |
| 10 | **Emergency** | *No dedicated page* | Embed in trip: `trip.riderName`, phone/email; consider expanding `trip.json` or homework for offline-first emergency block. |
| 11 | **Documents** | *No dedicated page* | Plan §12 — many reminders already live in `feesAndPasses`, `keyNotes`, day sections. |
| 12 | **Notes** | *No dedicated page* | Plan §13 — day `keyNotes`, `weatherNotes`, etc. serve partial role. |

**Quick links** (`#links`): GPX folder, weather.gov, etc. from `trip.links`.

---

## “What do I need right now?” (plan §21)

Suggested **on-trip flow** using this build:

1. **Route overview map** — chapter colours and tap pins for the day.  
2. Open **Calendar at a glance** — confirm date row and km.  
3. Open **Daily plan** — today’s `<details>` auto-opens on trip dates.  
4. Read **route line**, **fees**, **sleep / B.a.B.**, **risks**, **Maps** link.  
5. Check **Today’s weather (dashboard)** for the current calendar date, then **Weather along the route** for the 5-day grid; use the **day** weather strip for that itinerary day’s forecast if loaded.  
6. Skim **Homework** region if entering new terrain.  
7. **Packing** before departure days.

---

## Data files (edit these)

| File | Role |
|------|------|
| `data/trip.json` | Canonical 36-day itinerary, meta, legs, checklists, rider fields, links |
| `data/route-overlays.json` | Per-day Google Directions URLs, distance notes, recommendations |
| `data/bab-hosts.json` | Bunk-a-Biker hosts, contacts, route guidance |
| `data/content-creation.json` | YouTube / documentary briefs |
| `data/homework.json` | DR650 prep, tools, regional risks |
| `data/motorcycle-parts-shops.json` | Dealers / parts along corridor |
| `gpx/*.gpx` | GPX track(s); path in `trip.links.gpxFolder` |

Generated / env:

| Artifact | Role |
|----------|------|
| `google-maps-config.js` | Built by `npm run build` from `GOOGLE_MAPS_API_KEY` (+ optional OAuth client id) |
| `docs/AI-TRIP-HANDBOOK.md` | `npm run docs:handbook` — AI-oriented summary of the trip |

---

## Environment & servers

| Variable | Purpose |
|----------|---------|
| `GOOGLE_MAPS_API_KEY` | Browser: Maps JS, Directions, distances |
| `OPENWEATHER_API_KEY` | Server only: `api/weather.js` → OpenWeather 2.5 API |
| `GOOGLE_MAPS_SERVER_KEY` | Optional; not used for weather anymore |

**Local:** `npm run dev` → static files + `/api/weather` (see `scripts/dev-server.cjs`).  
**Static only:** `npm run serve:static` — no weather proxy.

---

## Scripts (maintenance)

| Script | Use |
|--------|-----|
| `scripts/trim-itinerary-copy.py` | Trim long copy in trip / overlays / content JSON |
| `scripts/generate-ai-handbook.cjs` | Regenerate `docs/AI-TRIP-HANDBOOK.md` |
| `scripts/inject-maps-key.js` | Write `google-maps-config.js` |

---

## Future work (from plan, not built)

- Dedicated **Budget**, **Emergency**, **Documents**, **Notes** sections (or `localStorage` notes).  
- **Bottom nav** / stronger mobile “Today” affordance (plan §18).  
- Migrate Google **DirectionsService** → **Routes API** when you tackle Maps deprecations (console warnings only today).

Keep **`USA_Loop_Cursor_Project_Plan.md`** as the north star; keep **this guide** updated when you add sections or data files.
