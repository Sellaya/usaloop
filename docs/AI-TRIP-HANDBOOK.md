# AI handoff: Toronto ↔ Southwest USA motorcycle loop (36 days)

**Purpose.** This document gives any AI or human collaborator enough context to work on the **moto-trip-itinerary** project: route intent, nightly plan, data files, tooling, and Bunk a Biker contacts — without guessing.

**Privacy.** Contains real names, phones, and emails from your planning data. Do not paste publicly; share only with trusted tools or people.

---

## 1. Trip identity

| Field | Value |
| --- | --- |
| Trip name | Toronto → Texas → West Coast → Rockies → Home (36 days) |
| Rider | Ali (from trip.json) |
| Bike | Suzuki DR650 |
| Home base | Toronto, ON |
| Start date | 2026-05-20 |
| End date | 2026-06-24 |
| Timezone (app) | America/Toronto |
| Units | metric |
| Currency (metadata) | USD |

### Three legs

- **Leg 1:** Toronto → Fort Worth · Days 1–9
- **Leg 2:** Fort Worth → Seattle · Days 10–24
- **Leg 3:** Seattle → Toronto · Days 25–36

### Regions (chips)

- Finger Lakes
- New York / DC
- Virginia / Appalachia
- Smoky Mountains
- Tennessee
- Texas
- Route 66
- New Mexico
- San Juan Mtn / Silverton
- Four Corners / Utah
- California coast
- Redwoods
- PNW & Gorge
- Yellowstone
- Beartooth
- Plains run
- Ontario home

### Narrative summary

36-day ride stringing together the Finger Lakes, a New York metro stop, Washington DC and Luray, then Roanoke, Blue Ridge Parkway to Bristol, Great Smoky approaches with Tail of the Dragon and a Kingston night, Parsons TN, then Nashville–Memphis–Arkansas, a Fort Worth home stop, then the high plains and I-40 toward New Mexico. From there: San Juan Mountains and Million Dollar Highway, Utah (Mexican Hat, Page, Bryce, Moab with a full rest day at Arches, St. George), the California coast (Leo Carrillo day stop, Big Sur, redwoods), Oregon and the Columbia River Gorge, Seattle, US-20 and Spokane, Lolo Pass, Yellowstone and the Beartooth corridor, and a long return through the Dakotas and Great Lakes to Ontario, with a final night in London before Toronto.

### Planning checklist (from trip.json)

- Confirm dates, host addresses, and camping fees before you roll.
- Days marked TBD still need pins — use each day’s Google Maps link to lock distance.
- Fill fuel / weather / key notes per day as you research (same idea as your Word plan).
- Summer wildfire smoke can hit NorCal, PNW, Rockies, and high plains on short notice — check AQI/smoke maps for your corridor the morning you ride; shorten or reroute when air is unhealthy.
- Every iOverlander / BLM / dispersed GPS pin: confirm land status, MVUM, and fire closures the same week you stay — crowdsourced pins are not permission to camp.

---

## 2. Repository & how the app works

- **Stack:** Static HTML/CSS/JS (`index.html`, `app.js`, `styles.css`). No React.
- **Data:** JSON files under `data/` are loaded at runtime via `fetch()` — you need a local server (`npm run dev` or any static server).
- **Maps:** `npm run build` runs `scripts/inject-maps-key.js` and writes `google-maps-config.js` from `GOOGLE_MAPS_API_KEY` (see `.env.example`). Distances/weather use Google Maps JS when the key is present.
- **Deploy:** `vercel.json` — build command `npm run build`, output is project root.
- **GPX:** `gpx/toronto-southwest-loop-2026.gpx`
- **Weather link:** `https://www.weather.gov/`

### Data files (edit these to change the trip)

| File | Role |
| --- | --- |
| `data/trip.json` | **Canonical itinerary:** meta, trip overview, **36 days** (title, date, route, lodging, stops, risks, `feesAndPasses`, `babAlternateIds`, etc.) |
| `data/bab-hosts.json` | **Bunk a Biker directory:** full contact + `routeGuidance` per host id |
| `data/route-overlays.json` | Per-day Google Directions URLs, distance notes, optional recommendations |
| `data/content-creation.json` | YouTube / documentary episode briefs per day |
| `data/homework.json` | DR650 mechanics, toolkit, regional risk notes |
| `data/motorcycle-parts-shops.json` | Parts dealers along the corridor (Parts section in UI) |
| `scripts/inject-fees-and-passes.cjs` | Optional: regenerate `feesAndPasses` arrays in trip.json |

---

## 3. Daily plan (36 days)

Distances are driven by Google when API + overlays are loaded; `distanceKm: 0` in JSON means “use live Maps.” Stays marked **B.a.B.** resolve to `bab-hosts.json` via `babMergeId` or alternate ids.

### Day 1 — 2026-05-20 — Toronto → Finger Lakes (NY)

- **Difficulty:** MODERATE
- **Route line:** Plan in your mapping app — typical: GTA → Niagara/Lewiston or Peace Bridge corridor → I-90 east into NY → Finger Lakes roads (verify crossing and tolls).
- **Terrain:** Highway / border crossing
- **Fuel:** Fill in Ontario before the border if convenient; I-90 NY has frequent fuel after entry.
- **Food:** Pack snacks for border queue; rural Finger Lakes — know dinner plan with hosts or town stop.
- **Weather:** Lake breeze and frontal weather near Ontario / Erie — check wind on bridge approaches.
- **Lodging:** Stay options — **Greg & Chris** — 4177 Syrian Hill Road, McGraw, NY 13101
  - `babMergeId:` `greg-chris-mcgraw`
- **Highlights:** US entry documentation ready; Evening in McGraw area
- **Key notes:** Border: registration, insurance, declare tools/spares as needed; keep answers simple (touring). | Save offline maps for NY Thruway and last-mile to McGraw.
- **Risks:** Border wait times; Weather over Lake Ontario corridor
- **B.a.B. alternates:** `wayne-lawler`, `richard-honchar`, `mike-miller`
- **Fees / passes (3 lines):**
  - No U.S. national park entrance on this day.
  - Canada: no outbound park fee. U.S. entry: CBP inspection has no park-style fee.
  - NY Thruway (I-90) / crossings: tolls apply — E-ZPass or Tolls By Mail (plate billing); Peace Bridge / Lewiston–Queenston bridge tolls vary — set up payment before trip if needed.

### Day 2 — 2026-05-21 — Finger Lakes → New York

- **Terrain:** NY Thruway / Hudson Valley approaches
- **Weather:** Approaching NYC / Long Island in summer: heat + humidity in full gear — plan water, shade, and rest; don’t rely on “not thirsty yet.”
- **Lodging:** Stay options — **Dan** — Southampton, NY 11968
  - `babMergeId:` `dan-southampton`
- **Lodging alts:** Courtney Schrader
- **Highlights:** Shorter leg before DC → Luray segment
- **Risks:** Metro traffic near NYC / Long Island
- **B.a.B. alternates:** `robert-baldwin`, `jay-massapequa`, `wayne-lawler`, `richard-honchar`
- **Fees / passes (2 lines):**
  - No federal park entrance fee on routing described.
  - NYC / Hudson crossings (if used): many bridges/tunnels are cashless tolling to a registered plate or bill-by-mail — budget tolls; motorcycles follow posted rules per crossing.

### Day 3 — 2026-05-22 — New York → Washington, DC → Luray (VA)

- **Terrain:** Interstate / Appalachian approaches
- **Weather:** Mid-Atlantic late May: humid air and slow traffic can overheat you in protective gear — hydrate on a schedule through the I-95 / Beltway grind.
- **Lodging:** Stay — **Frank Allen Pence** — Luray, VA 22835
- **Highlights:** Shenandoah approaches near Luray
- **Risks:** East Coast traffic corridors
- **B.a.B. alternates:** `fred-christie-huger`, `arnab-sinha`, `mark-sabrina-catlett`, `robert-baldwin`, `jay-massapequa`, `genie-cane`, `jim-manchester-nj`
- **Fees / passes (3 lines):**
  - District of Columbia: no NPS entrance fee to ride public roads past monuments (no timed NPS entry ticket required just to transit).
  - If you enter a specific fee-charging NPS unit as a visitor attraction, pay that site’s fee — not required for through-riding to Luray.
  - Virginia: no Shenandoah NP fee unless you enter the Skyline Drive corridor (fee applies at entrance stations). Your Luray routing may stay outside park gates — confirm map.

### Day 4 — 2026-05-23 — Luray → Roanoke (VA)

- **Difficulty:** MODERATE
- **Route line:** Luray area → Roanoke metro via US-11 / US-460 or I-81 options — pick traffic vs scenery in Maps; aim Roanoke for resupply before NF overnight.
- **Terrain:** Shenandoah approaches → Roanoke valley
- **Fuel:** Fuel in Luray or before Roanoke; Roanoke has full services.
- **Food:** Stock water/food before dispersed camp — no services on NF spurs.
- **Weather:** Late May: pop-up thunderstorms — check radar; avoid ridges in lightning.
- **Lodging:** Free camping (dispersed) — **George Washington & Jefferson NF — near Roanoke (search MVUM)** — Example search area ~37.5, -79.9 — use official Motor Vehicle Use Map for legal spur roads; iOverlander/FreeCampgrounds for user reports — verify. No amenities; 14-day limits common.
- **Highlights:** Roanoke resupply; Jefferson NF camping
- **Key notes:** Dispersed camping only where Jefferson NF MVUM allows motor vehicles — verify same week. | Pack out all waste; many sites have no water.
- **Risks:** Deer dawn/dusk; Gravel/mud on NF roads after rain
- **Plan B:** Developed NF campground (fee) or Walmart parking urban last resort — not ideal.
- **Fees / passes (1 lines):**
  - George Washington & Jefferson National Forests: no NPS entrance fee; dispersed camping is generally free where MVUM allows — developed NF campgrounds charge site fees if you use them.

### Day 5 — 2026-05-24 — Roanoke → Bristol (VA/TN) — Blue Ridge Parkway day

- **Difficulty:** MODERATE
- **Route line:** Primary riding on Blue Ridge Parkway and short connectors — NOT I-81 as your main line. In Google Maps: set waypoints Roanoke → Rocky Knob / Mabry Mill (BRP) → Fancy Gap → Boone NC → secondary roads into Bristol TN/VA. Drag route off interstates; use ‘avoid highways’ if helpful. BRP max ~45 mph — full riding day.
- **Terrain:** Blue Ridge Parkway + Appalachian connectors
- **Fuel:** BRP has limited fuel — tank in Roanoke; next reliable fuel often Boone or after BRP exit toward Bristol.
- **Food:** Mabry Mill / visitor areas are limited — carry snacks.
- **Weather:** Elevation changes quickly — carry rain layer; fog on BRP mornings.
- **Lodging:** Free camping (dispersed) — **Cherokee NF / Holston Mountain area — verify MVUM** — Eastern TN / southwest VA has NF dispersed sites — confirm motor-vehicle access on your exact spur. Example search: Cherokee National Forest dispersed near Damascus VA / Laurel Bloomery — verify closures. Pack out waste.
- **Highlights:** BRP mileposts; Boone approach; Bristol twin cities
- **Key notes:** BRP is NPS: federal speed limits, wildlife (bear/deer), no commercial trucks. | Bristol sits on the TN/VA line — clocks and tax rules differ by side.
- **Stops:**
  - **BRP landmark (optional)** (sight): Mabry Mill (BRP milepost ~176) — Historic mill — short stop; parking fills weekends.
- **Risks:** BRP: slow vehicles and sightseers; Long day = fatigue before Bristol
- **Plan B:** Paid campground or motel Bristol if weather or fatigue wins.
- **Fees / passes (2 lines):**
  - Blue Ridge Parkway (NPS): no entrance fee for the parkway itself; standard NPS rules apply (speed, wildlife).
  - Optional stops (e.g. Mabry Mill): parking may fill — no separate park ‘ticket’ beyond your time.

### Day 6 — 2026-05-25 — Bristol → Great Smoky Mountains → Tail of the Dragon → Kingston (TN)

- **Difficulty:** MODERATE
- **Route line:** Bristol → Smokies gateway (Gatlinburg/Newfound Gap optional scenic) → US-129 Tail of the Dragon (Deals Gap) → Kingston TN (Loudon County). US-129 is enforcement-heavy — ride your own pace; crossing centerline is citation bait.
- **Terrain:** Smokies approaches · US-129 · TN river hills
- **Fuel:** Fuel before Dragon (Deals Gap store) or Knoxville corridor — don’t start Dragon at reserve.
- **Food:** Deals Gap / Tellico has limited options — eat before late push.
- **Weather:** Mountain showers; Dragon surface can be slick from leaves or dew.
- **Lodging:** Free camping (dispersed) — **Cherokee NF — Tellico Plains / Bald River corridor (MVUM)** — Dispersed camping common on NF roads west of Dragon — verify MVUM, fire restrictions, and bear storage. Example pin area: Tellico River corridor — confirm road status.
- **Highlights:** Smokies overlook (optional); Tail of the Dragon; Tennessee River hills
- **Key notes:** GSMNP: peak season may require parking/entry reservations — check NPS.gov. | Dragon: 318 curves in 11 miles — fatigue kills; pull off often.
- **Stops:**
  - **Tail of the Dragon** (sight): Deals Gap NC / TN — US-129 — photo enforcement; respect double-yellow.
- **Risks:** Dragon traffic and LE; Bear country — food storage; Tourist traffic near Gatlinburg
- **Plan B:** Paid campground Kingston / Loudon if dispersed full.
- **Fees / passes (4 lines):**
  - Great Smoky Mountains NP: no entrance fee, but a parking tag is required for any vehicle parked >15 minutes (2026: daily US$5, weekly US$15, annual US$40 — purchase/print via recreation.gov activity pass or in-park; display physical tag per nps.gov/grsm).
  - Smokies is not on the 2026 US$100 non-resident surcharge list — that applies only to the 11 parks listed on nps.gov/aboutus/nonresident-fees.htm.
  - Tail of the Dragon (US-129): public highway — no park entrance; obey enforcement and lane rules.
  - Non-U.S. citizens (2026): America the Beautiful annual pass for non-residents US$250 (digital: recreation.gov/pass) — covers standard entrance fees where accepted and waives the US$100/person non-resident surcharge at the 11 high-visitation parks when you show valid pass + photo ID (see nps.gov/aboutus/nonresident-fees.htm). U.S. resident pass remains US$80.

### Day 7 — 2026-05-26 — Kingston → Parsons (TN)

- **Difficulty:** EASY
- **Route line:** Short west Tennessee day — US-70 / I-40 corridor options to Parsons (38363). Visit town, resupply, rest before Arkansas push.
- **Terrain:** West TN rolling / river valleys
- **Fuel:** Short leg — fuel optional.
- **Food:** Parsons: small-town groceries — plan dinner.
- **Weather:** Humid late spring — afternoon storms possible.
- **Lodging:** Free camping (dispersed / primitive) — **Natchez Trace State Forest / Kentucky Lake USACE (verify free)** — West TN: search iOverlander for free camps near Parsons / Decaturville — many are lake/river bank or WMA — confirm legal camping, fire rules, and flood line. USACE sometimes offers free primitive areas — read signage.
- **Highlights:** Parsons TN; Kentucky Lake / Tennessee River region nearby
- **Key notes:** Light day — use for laundry, bike check, hydration recovery.
- **Stops:**
  - **Destination** (other): Parsons, TN 38363 — Verify street parking and local overnight rules if urban edge.
- **Risks:** Ticks/chiggers in tall grass near water; Limited cell in hollows
- **Plan B:** County fairground or church parking with permission — ask locally.
- **Fees / passes (1 lines):**
  - No major national-park entrance on this short west-TN day. Natchez Trace State Forest / USACE / WMA: follow posted day-use or camping fees if you use a fee area — many dispersed options are free if legally allowed.

### Day 8 — 2026-05-27 — Parsons → Little Rock (AR)

- **Terrain:** MS River plain / AR
- **Lodging:** Stay option — **Joe Maglie** — John Harden Drive, Jacksonville, AR 72076
- **Lodging alts:** Marci Livingston
- **Highlights:** Crossing into central Arkansas
- **Risks:** Heat / humidity — hydrate
- **B.a.B. alternates:** `jeff-roberts-ozark`, `brian-cooper`, `connie-jeff-lackey`
- **Fees / passes (2 lines):**
  - Hot Springs National Park (optional detour near Garland County): no entrance fee to enter the park (per NPS). Bathhouse row services are separate commercial fees if you use them.
  - Arkansas state highways: no park pass required for slab transit.

### Day 9 — 2026-05-28 — Little Rock → Fort Worth (TX)

- **Terrain:** TX highways
- **Lodging:**  — **HOME — Fort Worth, TX** — Garage tools, laundry, bike check before western push.
- **Highlights:** Home stop: rest, maintenance, repack
- **Risks:** Fast TX highways: cattle guards, expansion joints, and bridge transitions — ease up and square the bike before hitting them leaned over.
- **Fees / passes (2 lines):**
  - Texas: possible toll roads on some I-30/I-20 routings — TxTag / toll-by-plate; budget if your GPS uses toll lanes.
  - No NPS entrance on this home-stop day as written.

### Day 10 — 2026-05-29 — Fort Worth → Amarillo (TX)

- **Terrain:** North Texas plains
- **Lodging:** Stay option — **Kelly Snyder** — 307 W Historic Route 66, Adrian, TX 79001
  - `babMergeId:` `kelly-snyder`
- **Lodging alts:** Matt Moore
- **Highlights:** Route 66 flavor toward Panhandle
- **Risks:** Wind exposure on plains; Grooved pavement and metal bridge decks at highway speeds — reduce lean and avoid hard braking on seams.
- **Fees / passes (2 lines):**
  - Texas plains / Route 66 stops: roadside attractions may charge their own small admission — optional.
  - No federal park entrance fee for the driving day as written.

### Day 11 — 2026-05-30 — Amarillo → Albuquerque (NM)

- **Terrain:** High plains → NM high desert
- **Lodging:** Camping / motel options — **Motel (I-40 frontage)** — 6030 W Interstate 40 Frontage Rd, Amarillo, TX area (~$50 CAD — verify)
- **Lodging alts:** iOverlander — Adrian TX area
- **Highlights:** I-40 / 66 corridor
- **Stops:**
  - **iOverlander — tent** (camp): GPS camp (TX) — ~$10 tenting; verify current use rules.
  - **Route 66 reference** (other): 100 U.S. Route 66, Adrian, TX — Landmark from your notes — verify pin.
- **Risks:** Desert temperature swing
- **Plan B:** Motel in Amarillo or Albuquerque if weather turns.
- **B.a.B. alternates:** `kelly-snyder`
- **Fees / passes (2 lines):**
  - iOverlander / private camp pins (~US$10 tenting in your notes): pay the host/landowner; not an NPS fee.
  - I-40 / Amarillo: no NPS fee for driving; motel/camp is commercial pricing.

### Day 12 — 2026-05-31 — Albuquerque → Million Dollar Highway (Silverton, CO)

- **Terrain:** Climb into San Juan Mountains — snow/ice risk off-season
- **Lodging:** Camping — **iOverlander (FREE)** — GPS 37.82022, -107.71362 — confirm MVUM / fire rules. Additional free dispersed camping along the route is possible — verify land status.
- **Highlights:** Silverton area; Million Dollar Hwy when conditions allow
- **Risks:** Altitude; Afternoon storms; Mud on forest roads; Mountain chip seal and tar patches — traction drops fast when wet; treat painted lines and metal grates as low-grip.
- **Plan B:** Paid campground or Silverton lodging if dispersed full or weather bad.
- **B.a.B. alternates:** `derek-duncan-denver`, `jim-wendy-conifer`, `cc-golden`, `travis-georgetown`
- **Fees / passes (2 lines):**
  - San Juan NF / Silverton area: USFS — no NPS entrance; dispersed camping usually free where allowed — verify MVUM. Developed USFS or county sites may charge.
  - Colorado state highways: no park pass for through-riding.

### Day 13 — 2026-06-01 — Silverton → Mexican Hat (UT)

- **Terrain:** Four Corners high desert
- **Lodging:** Camping (~$22 + tax) — **Mexican Hat Rocks** — Reserve or confirm same-day availability in season.
- **Highlights:** Monument Valley approaches; San Juan River corridor
- **Risks:** Heat; Limited services
- **B.a.B. alternates:** `good-adv-cortez`, `matt-burton-seligman`
- **Fees / passes (2 lines):**
  - Mexican Hat Rocks campground (private): ~US$22+ tax in your plan — reserve/confirm on their site (seasonal).
  - Navajo Nation / Monument Valley (if you enter tribal park): separate tribal permit/fees — not included in America the Beautiful.

### Day 14 — 2026-06-02 — Mexican Hat → Page → Bryce Canyon (~500 km)

- **Difficulty:** EPIC
- **Route line:** US-163 toward Page → US-89 toward Kanab/Bryce corridor — pin exact path and breaks in your GPS (long mileage day).
- **Terrain:** UT scenic highways — long day
- **Fuel:** Do not pass fuel under half tank; top off leaving Page or Kanab before climbing toward Bryce.
- **Food:** Page has services; carry water — long hot segments possible.
- **Weather:** Desert heat + isolated afternoon storms — start early; watch crosswinds on open mesas.
- **Lodging:** iOverlander camping — **Dispersed near Bryce (option A)** — GPS 37.65553, -112.17089 — verify fees and road conditions.
- **Lodging alts:** Dispersed near Bryce (option B — scenic / fire pit)
- **Highlights:** Page area icons; Escalante–Bryce transition
- **Key notes:** Antelope Canyon: guided tours sell out — book ahead. | Horseshoe Bend: paid parking, short hike, brutal midday sun. | End goal: confirm dispersed pin is still legal same week.
- **Stops:**
  - **Horseshoe Bend** (sight): Horseshoe Bend (Page, AZ) — Parking fee / short hike — heat and crowds.
  - **Antelope Canyon** (sight): Antelope Canyon (tour required) — Book Navajo-guided tour slots in advance.
- **Risks:** Very long mileage day; Deer at dawn/dusk
- **Plan B:** Shorten: skip one sight or book paid campground inside Bryce area.
- **B.a.B. alternates:** `matt-burton-seligman`, `good-adv-cortez`
- **Fees / passes (5 lines):**
  - Bryce Canyon NP (NPS): motorcycle 7-day entrance US$30 (cashless at park — nps.gov/brca); private vehicle US$35. Bryce is on the 2026 non-resident surcharge list — without an America the Beautiful pass, ages 16+ non-U.S. residents pay an additional US$100/person at entry (with valid non-resident annual pass, entrance + surcharge covered for passholder per NPS rules — verify ID).
  - Horseshoe Bend overlook (City of Page): parking fee ~US$5 motorcycle / ~US$10 private vehicle (Page, AZ — not covered by federal passes; verify current rate at visitpage.com / city site).
  - Antelope Canyon: Navajo Nation guided tours — commercial pricing (often US$50–100+); book slots in advance; separate from NPS.
  - Glen Canyon NRA (Lake Powell area): if you use NRA fee areas, Glen Canyon has its own fee schedule — America the Beautiful applies to NPS-managed standard entrance (see nps.gov/glca).
  - Non-U.S. citizens (2026): America the Beautiful annual pass for non-residents US$250 (digital: recreation.gov/pass) — covers standard entrance fees where accepted and waives the US$100/person non-resident surcharge at the 11 high-visitation parks when you show valid pass + photo ID (see nps.gov/aboutus/nonresident-fees.htm). U.S. resident pass remains US$80.

### Day 15 — 2026-06-03 — Bryce Canyon → Arches National Park (Moab, UT)

- **Terrain:** UT-12 / scenic byways — traffic in season
- **Lodging:** Stay (Moab) — **Robert VandenBroeke** — Moab, UT 84532
  - `babMergeId:` `robert-vandenbroeke`
  - Phone (day card): +1-435-220-0576
- **Lodging alts:** Camp area (GPS)
- **Highlights:** Capitol Reef optional detour; Colorado River into Moab
- **Risks:** Moab heat; Crowds at Arches — arrive early; lots can temporarily close when full
- **Fees / passes (2 lines):**
  - Driving UT-12 toward Moab: if you enter Capitol Reef NP, pay NPS entrance (motorcycle rate on nps.gov/care) or use America the Beautiful — optional detour only.
  - Canyonlands / Arches not yet visited this day as written — no Arches fee until you enter.

### Day 16 — 2026-06-04 — Moab — Arches & Dead Horse Point (Rest/Exploration Day)

- **Difficulty:** EASY
- **Route line:** Zero riding day. Base: Moab, UT. Arches NP is 8 km from town — drive or ride out early before the heat and tourist crowds build.
- **Terrain:** Paved park roads and short walking trails. No challenging riding.
- **Fuel:** No fuel needed — day ride within Moab area only.
- **Weather:** June temperatures in Moab regularly exceed 38 °C (100 °F) by midday. All outdoor activity should be done before 10–11 am or after 5 pm.
- **Lodging:** Stay (Moab — second night) — **Robert VandenBroeke** — Moab, UT 84532
  - `babMergeId:` `robert-vandenbroeke`
  - Phone (day card): +1-435-220-0576
- **Lodging alts:** Camp area (GPS); Any Moab motel (book ahead)
- **Highlights:** Arches National Park — Delicate Arch hike (5 km round trip, start by 7 am); Dead Horse Point State Park — 600 m canyon rim overlook above the Colorado River; Canyonlands NP Island in the Sky (optional 30-min drive from Dead Horse Point); Moab town: gear shops, resupply, laundry, bike check
- **Stops:**
  - **Arches NP entrance** (sight): Arches National Park Entrance — Pay NPS entrance (motorcycle or vehicle rate) or use America the Beautiful. As of 2026, timed-entry reservations for Arches were discontinued — check nps.gov/arch for any parking/closure updates before you go.
  - **Dead Horse Point SP** (sight): Dead Horse Point State Park, UT — 600 m above the Colorado River — one of the most photographed overlooks in the USA. Entry fee ~$20.
- **Risks:** Moab summer heat — Arches by 7 am, off trail by 11 am; Arches parking — popular trailheads fill early; carry park map offline; Dehydration risk on Delicate Arch hike — carry 2 L minimum
- **Plan B:** If Arches is too crowded or lots are closed, Dead Horse Point + Canyonlands Island in the Sky is an equally spectacular full day.
- **B.a.B. alternates:** `robert-vandenbroeke`
- **Fees / passes (5 lines):**
  - Arches NP: motorcycle 7-day entrance US$25; private vehicle US$30 (nps.gov/arch, credit/debit at entrance). America the Beautiful covers standard entrance. 2026: timed-entry reservation for Arches was discontinued — verify current status on nps.gov/arch before travel (parking may still temporarily limit entry when lots are full).
  - Fiery Furnace hikes: separate permit/ranger fees if you do those activities (nps.gov/arch).
  - Dead Horse Point State Park (Utah state): separate from NPS — motorcycle day-use ~US$10, private vehicle ~US$20 (stateparks.utah.gov — verify 2026). Not covered by federal annual pass.
  - Canyonlands Island in the Sky (optional): NPS entrance fee if you enter — motorcycle rate on nps.gov/cany.
  - Non-U.S. citizens (2026): America the Beautiful annual pass for non-residents US$250 (digital: recreation.gov/pass) — covers standard entrance fees where accepted and waives the US$100/person non-resident surcharge at the 11 high-visitation parks when you show valid pass + photo ID (see nps.gov/aboutus/nonresident-fees.htm). U.S. resident pass remains US$80.

### Day 17 — 2026-06-05 — Moab → St. George (UT)

- **Terrain:** I-15 south — desert
- **Lodging:** BLM / dispersed — **Sheep Bridge Park (BLM)** — Confirm road suitability for your bike loadout.
- **Lodging alts:** GPS dispersed
- **Highlights:** Zion outer approaches possible if time
- **Stops:**
  - **Free camping ideas** (camp): St. George area — Treks With Beks — Roundup of free camps near St. George.
- **Risks:** Soft sand on BLM spurs
- **Plan B:** Paid RV park or hotel in St. George.
- **Fees / passes (2 lines):**
  - BLM dispersed (Sheep Bridge / Cove Wash): typically no entrance fee; follow BLM posted rules.
  - Zion NP (if you enter the park): Zion is on the 2026 non-resident surcharge list — motorcycle entrance fee + possible US$100/person without annual pass; check nps.gov/zion + tunnel restrictions for large vehicles.

### Day 18 — 2026-06-06 — St. George → Barstow (CA)

- **Terrain:** Mojave Desert — heat and wind
- **Lodging:**  — **Montana Shaffer** — 22060 Wren Street, Apple Valley, CA 92308
  - `babMergeId:` `montana-shaffer`
- **Highlights:** I-15 into California low desert
- **Risks:** Extreme heat mid-summer
- **B.a.B. alternates:** `anais-redlands`, `layla-sisney`
- **Fees / passes (2 lines):**
  - I-15: possible toll lanes in some segments — account for toll-by-plate.
  - No park entrance fee for Mojave transit to Apple Valley as written.

### Day 19 — 2026-06-07 — Barstow → Hollywood → Leo Carrillo (Day Stop) → Big Sur / Prewitt Ridge

- **Difficulty:** EPIC
- **Route line:** Barstow → I-15 S → CA-14 → LA basin → PCH (Hwy 1) north through Malibu → Leo Carrillo State Park (2-3 hr day stop) → PCH north through Big Sur → Prewitt Ridge Campground. ~590 km total — longest riding day of the California leg. Start by 6:30 am to clear LA traffic.
- **Terrain:** CA freeways to coast — read current California DMV / CHP lane-splitting guidance; only allowed in specific situations. PCH curves, tar snakes, patch pavement, damp fog — reduced grip even when dry. Prewitt Ridge final climb: rough dirt road.
- **Fuel:** Fuel in Barstow before departure. Next reliable fuel: Cambria or San Simeon (before Big Sur no-services stretch). Fill there.
- **Lodging:**  — **Prewitt Ridge Campground** — Confirm road conditions for loaded DR650; carry 4 L water. Final climb is rough BLM dirt. Arrive before dark.
- **Highlights:** First sight of the Pacific Ocean after 17 days inland — emotional milestone for video; Leo Carrillo State Park (Malibu) — 2-3 hr stop: swim, beach content, food; PCH north through Ventura, Santa Barbara, and San Luis Obispo county; Bixby Creek Bridge — iconic Big Sur arch bridge photo stop; McWay Falls / Julia Pfeiffer Burns SP — short walk, waterfall into the ocean; Prewitt Ridge — BLM dispersed camp with Pacific view
- **Stops:**
  - **Day stop — Leo Carrillo** (sight): Leo Carrillo State Park, Malibu, CA — 2-3 hour stop. Beach, swim, content creation — this is your Pacific arrival moment. No overnight here.
  - **Food / fuel resupply** (food): Cambria or San Simeon, CA — Last reliable fuel before Big Sur. Fill tank and carry extra food — limited services on Hwy 1 north.
  - **Photo stop — Bixby Creek Bridge** (sight): Bixby Creek Bridge, Big Sur, CA — Pull over on north side for the classic arch-over-coast shot.
- **Risks:** LA traffic — depart Barstow by 6:30 am to beat morning rush; PCH weekend parking pressure at Malibu; Big Sur: Coastal Hwy 1 tar snakes, patch pavement, damp fog — reduced grip in corners; Prewitt Ridge: cliff exposure on approach road, private gate policies — verify access; Long day (~590 km) — monitor fatigue; Cambria is a bail-out overnight if needed
- **Plan B:** If fatigued by Cambria: stay at state park camp (Hwy 1 corridor) and ride Prewitt Ridge the next morning before continuing north.
- **B.a.B. alternates:** `layla-sisney`, `anais-redlands`, `darlene-morro`, `jeff-rothman`
- **Fees / passes (3 lines):**
  - Leo Carrillo State Park (CA): vehicle day-use fee required (California State Parks — 2026 pricing on parks.ca.gov; online day-use reservation recommended weekends/holidays).
  - PCH / Big Sur: Julia Pfeiffer Burns SP and other CA state parks charge day-use or parking fees — check parks.ca.gov for each stop.
  - Prewitt Ridge BLM: usually no fee; confirm BLM Los Padres info for your exact spur.

### Day 20 — 2026-06-08 — Prewitt Ridge → Point Arena Lighthouse

- **Terrain:** Northern CA coast
- **Lodging:** Camping (verify fees) — **Dispersed / listed GPS** — GPS 35.87322, -121.41850 — confirm land status and fees before paying/staying.
- **Highlights:** Mendocino coast
- **Risks:** Fog; Cold marine layer; Regional wildfire smoke can drop visibility and AQI with little warning — check smoke/air maps along the coast that morning.
- **B.a.B. alternates:** `darlene-morro`, `jeff-rothman`
- **Fees / passes (1 lines):**
  - CA Hwy 1 / dispersed pin: confirm land manager (private / county / state) and any day-use or camping fee before paying or camping.

### Day 21 — 2026-06-09 — Point Arena → Redwood National Park

- **Terrain:** US-101 redwood corridor
- **Lodging:** Camping (paid) — **Redwood area camp (GPS)** — GPS 38.98170, -123.70057 — verify campground name and reservation rules.
- **Highlights:** Redwoods NP / state parks
- **Risks:** Elk on roadway; NorCal / redwoods corridor: summer wildfire smoke and poor AQI — have a shorter-day or inland detour mindset if maps go red.
- **B.a.B. alternates:** `jeff-rothman`, `jim-haines-shasta`
- **Fees / passes (1 lines):**
  - Redwood National and State Parks: NPS units — no entrance fee for the federal Redwood areas (nps.gov/redw). Adjacent California state park units may charge day-use — pay if you enter those units.

### Day 22 — 2026-06-10 — Redwood → Crater Lake (Westfir, OR)

- **Terrain:** OR coastal range / I-5 or 199 options
- **Lodging:**  — **Deb & Dave B** — Westfir, OR 97492
- **Highlights:** Crater Lake possible as detour if open and time allows
- **Risks:** Wildfire smoke and AQI — not only “late summer”; June can see regional haze from distant fires. Check AQI and visibility each morning across OR / PNW / Rockies legs.; Heavy smoke: favor shorter riding, more breaks, and indoor air when AQI is unhealthy — especially at altitude.
- **B.a.B. alternates:** `lisa-blue-bend`, `suze-riley-maupin`
- **Fees / passes (1 lines):**
  - Crater Lake NP (optional detour): NPS entrance applies if you enter — motorcycle rate on nps.gov/crla; America the Beautiful accepted. Not on the 11-park US$100 surcharge list as published Jan 2026 (verify if policy updates).

### Day 23 — 2026-06-11 — Westfir → Goldendale / Mosier

- **Terrain:** Columbia River Gorge — wind
- **Lodging:** Stay option — **Greg Wagner** — 303 Fish Hatchery Road, Goldendale, WA 98620
- **Lodging alts:** Darin
- **Highlights:** Gorge vistas; WSR-84 options
- **Risks:** Gorge crosswinds
- **B.a.B. alternates:** `mosko-moto`, `david-kishpaugh`, `dave-katherine-cashmere`, `angela-east-wenatchee`
- **Fees / passes (1 lines):**
  - Columbia River Gorge NSA / OR & WA state parks: some trailheads require Northwest Forest Pass or state day-use — check fs.usda.gov and Oregon/Washington park sites for the exact stop.

### Day 24 — 2026-06-12 — Mosier → Seattle (WA)

- **Terrain:** Cascade approaches to Puget Sound
- **Lodging:** Pre-Seattle — **Bob Combs** — North Bend, WA
- **Lodging alts:** Dave; Jennifer Long & Brian Forsyth
- **Highlights:** Three host segments around Seattle metro
- **Risks:** Seattle traffic; Splitting stays — pack light for moving between hosts
- **Plan B:** Single hotel hub if multi-host logistics are tight.
- **B.a.B. alternates:** `bob-combs`, `christe-smith-rainier`, `ob-graham`, `julie-lake-tapps`, `bill-darrington`
- **Fees / passes (1 lines):**
  - Seattle metro: no NPS entrance for urban riding; paid parking garages may apply downtown.

### Day 25 — 2026-06-13 — Seattle → US-20 (~400 km)

- **Terrain:** North Cascades Highway (if open) vs. I-90 fallback
- **Lodging:**  — **TBD — book after route pinned** — Options: Winthrop, Twisp, Omak, or I-90 corridor motels.
- **Highlights:** North Cascades if seasonal opening aligns
- **Stops:**
  - **TBD** (other): Overnight / stop location — Pick town based on North Cascades opening and weather.
- **Risks:** Mountain pass closures / construction; PNW / interior BC smoke can funnel into mountain valleys — if AQI spikes, SR-20 vs I-90 isn’t just a snow decision; air quality matters for long climb days.
- **Plan B:** I-90 direct to eastern WA if SR-20 closed.
- **B.a.B. alternates:** `bob-combs`, `dave-katherine-cashmere`, `mosko-moto`, `jeff-carrie-bob`, `david-rs-washougal`
- **Fees / passes (2 lines):**
  - North Cascades National Park complex: no entrance fee to drive WA SR-20 (nps.gov/noca).
  - If you use a fee trailhead or Sno-Park in season, Washington Sno-Park permit may apply in winter — June usually not applicable.

### Day 26 — 2026-06-14 — US-20 → Spokane

- **Terrain:** Eastern WA / ID panhandle
- **Lodging:** Stay option — **David & Pita Ettenberg** — Spokane Valley, WA
- **Lodging alts:** Rathdrum, ID
- **Highlights:** Columbia plateau riding
- **B.a.B. alternates:** `randy-rathdrum`, `betty-chewelah`, `dave-katherine-cashmere`
- **Fees / passes (1 lines):**
  - Eastern WA / Spokane: no NPS fee for routing as written.

### Day 27 — 2026-06-15 — Spokane → Kooskia → Lolo Pass

- **Terrain:** ID panhandle — forested passes
- **Lodging:** Stay option — **Dustin Patton** — Frenchtown, MT
- **Lodging alts:** Karl & Angie
- **Highlights:** Clearwater / Lochsa River approaches to Lolo
- **Risks:** Wildlife; Loose gravel on forest roads
- **Plan B:** US-12 services thin — fuel when you can.
- **B.a.B. alternates:** `dustin-patton`, `karl-angie-stevensville`, `phyl-corvallis-mt`
- **Fees / passes (1 lines):**
  - Lolo Pass / US-12: scenic highway — no national-park entrance fee for the pass transit itself.

### Day 28 — 2026-06-16 — Lolo Pass → Yellowstone

- **Terrain:** MT high country into Greater Yellowstone
- **Lodging:**  — **Deryk Hagey** — Gallatin Gateway, MT
- **Highlights:** West Yellowstone or north entrance options depending on route
- **Risks:** Bison / elk on roadway; Altitude fatigue; Greater Yellowstone: wildfire smoke and park-wide haze can persist for days — watch NPS alerts and AQI before committing to long high-elevation legs.
- **B.a.B. alternates:** `kevin-island-park`, `daryn-engesser`
- **Fees / passes (3 lines):**
  - Yellowstone NP: motorcycle 7-day entrance US$30 (nps.gov/yell). Yellowstone is on the 2026 non-resident surcharge list — without America the Beautiful, ages 16+ non-U.S. residents pay US$100/person in addition to entrance; valid America the Beautiful (including non-resident US$250 pass) covers entrance and surcharge for passholder presentation with ID per NPS.
  - Keep receipt — 7-day Yellowstone entrance valid for re-entry.
  - Non-U.S. citizens (2026): America the Beautiful annual pass for non-residents US$250 (digital: recreation.gov/pass) — covers standard entrance fees where accepted and waives the US$100/person non-resident surcharge at the 11 high-visitation parks when you show valid pass + photo ID (see nps.gov/aboutus/nonresident-fees.htm). U.S. resident pass remains US$80.

### Day 29 — 2026-06-17 — Yellowstone National Park — full day

- **Terrain:** NP roads — congestion, wildlife jams
- **Lodging:**  — **Same as Day 26 or move closer to NE exit** — Book inside-park or Gardiner/Cooke if pushing toward Beartooth next day.
- **Highlights:** Geysers, canyon, Lamar or Hayden if routing allows
- **Stops:**
  - **Plan** (sight): Yellowstone loop — prioritize north or south loop — Check NPS.gov for road closures and construction same season.
- **Risks:** Sudden weather; Thermal area foot traffic; Smoke from regional fires can cut views and air quality inside the park — adjust expectations and rest if you feel tight-chested at altitude.
- **B.a.B. alternates:** `kevin-island-park`, `jolene-casper`
- **Fees / passes (2 lines):**
  - Yellowstone NP: same 7-day entrance window if within validity from purchase — carry pass/receipt.
  - Non-U.S. citizens (2026): America the Beautiful annual pass for non-residents US$250 (digital: recreation.gov/pass) — covers standard entrance fees where accepted and waives the US$100/person non-resident surcharge at the 11 high-visitation parks when you show valid pass + photo ID (see nps.gov/aboutus/nonresident-fees.htm). U.S. resident pass remains US$80.

### Day 30 — 2026-06-18 — Yellowstone → Beartooth Highway → Powell, WY

- **Route line:** Morning: ride Yellowstone’s Grand Loop toward the Northeast Entrance (from wherever you stayed — e.g. Old Faithful area). At Cooke City, MT, pick up US-212 (Beartooth Highway) over the pass to Red Lodge — not WY-310 (Chief Joseph toward Cody) unless 212 is closed. Continue into the Bighorn Basin to Powell, WY for the night. The app’s Maps distance (~316 km) is the Cooke City → Red Lodge → Powell leg only; add your in-park miles separately.
- **Terrain:** US-212 high alpine — snow/ice possible early season; do not confuse with lower WY-310 corridor
- **Fuel:** Fill before leaving the park interior; top up in Cooke City or Red Lodge; Powell has services before overnight.
- **Lodging:** Stay option — **Daryn Engesser** — Powell, WY
- **Lodging alts:** Jerry Bellmyer
- **Highlights:** Beartooth Pass — one of the great US motorcycle roads
- **Risks:** Ice / closure early season — verify pass status; Google Maps often prefers WY-310 / Cody corridor from the park — manually select US-212 via Cooke City and Red Lodge for the Beartooth
- **Plan B:** If US-212 is closed, use NPS/MDT detour guidance (may include lower basin roads — not the same ride as the Beartooth).
- **B.a.B. alternates:** `daryn-engesser`, `jolene-casper`, `dave-van-gorkom`
- **Fees / passes (2 lines):**
  - Yellowstone NP: still inside 7-day window if continuous from prior entries — confirm dates on your pass stub.
  - Beartooth Highway (US-212): scenic corridor — no separate ‘Beartooth pass’ beyond any NPS Yellowstone re-entry if you dip back in.

### Day 31 — 2026-06-19 — Powell → Gillette (WY)

- **Route line:** Bighorn Basin crossing after the night in Powell — slab and wind typical toward Gillette (Powder River Basin).
- **Terrain:** WY plains — wind
- **Lodging:**  — **Sherry Smith** — Gillette, WY
- **Highlights:** Powder River Basin
- **Risks:** Crosswinds
- **B.a.B. alternates:** `jolene-casper`
- **Fees / passes (1 lines):**
  - Wyoming plains: no NPS fee for routing as written.

### Day 32 — 2026-06-20 — Gillette → Needles Highway → border camping

- **Terrain:** Black Hills — Needles / Iron Mountain Road traffic
- **Lodging:** Free camping — **TBD — border / Black Hills dispersed** — Pick legal dispersed or USFS after confirming MVUM; next leg starts Oacoma SD area.
- **Highlights:** Custer State Park / Needles Highway — fees and traffic
- **Risks:** Bison herds on park roads; Tourist congestion
- **Plan B:** Paid campground in Black Hills NF or Custer area.
- **B.a.B. alternates:** `michelle-custer`, `dave-van-gorkom`, `lisa-redfield`
- **Fees / passes (3 lines):**
  - Custer State Park (SD): park entrance license required for Wildlife Loop etc. — 2026: 7-day temporary license ~US$25/private vehicle or ~US$20/motorcycle (verify gfp.sd.gov/pel). Non-stop through-travel on designated US-16A through-route may be exempt — read posted rules.
  - Black Hills National Forest: generally no entrance fee; amenity sites may charge.
  - Mount Rushmore NM: parking is a private concession fee (not covered by America the Beautiful for the parking structure) — budget separately if you visit.

### Day 33 — 2026-06-21 — Oacoma → Rochester (MN) (~600 km)

- **Terrain:** Great Plains long haul — services spacing
- **Lodging:** Stay option — **Laurie Calhoon** — Byron, MN
- **Lodging alts:** Carol B
- **Highlights:** Missouri River crossing near Oacoma corridor
- **Stops:**
  - **Fuel strategy** (fuel): I-90 / US-14 corridor — Long day — top off whenever under half tank.
- **Risks:** Fatigue on 600 km slab; Crosswinds; Great Plains: persistent wind grooves and open-deck bridges — relax grip, don’t fight the bars, and plan hand breaks.
- **Plan B:** Split into two shorter days if weather or energy is poor.
- **B.a.B. alternates:** `lisa-redfield`
- **Fees / passes (1 lines):**
  - I-90 Great Plains: possible toll segments (e.g. Illinois/Iowa depending on route) — verify GPS toll settings.

### Day 34 — 2026-06-22 — Rochester → Oconomowoc (WI)

- **Terrain:** Upper Midwest freeways
- **Lodging:** Stay option — **Jane Thompson** — Oconomowoc, WI
- **Lodging alts:** Jeff Van Ark
- **Highlights:** Driftless optional detour if time
- **Fees / passes (1 lines):**
  - Upper Midwest freeways: tolls possible (e.g. Illinois Tollway if routed) — I-Pass or pay-by-plate.

### Day 35 — 2026-06-23 — Oconomowoc → Benton Harbor (Day Stop, John Cody Smith) → London, ON

- **Difficulty:** LONG
- **Route line:** Oconomowoc, WI → I-94 E → Benton Harbor, MI (visit John Cody Smith, 2 hr lunch stop) → US-12 or I-94 E → Port Huron, MI → Blue Water Bridge → Sarnia, ON → Hwy 402 E → London, ON. ~530 km total. Border crossing same day (late June) — check CBSA wait times; summer weekday traffic on I-94 can be heavy.
- **Terrain:** I-94 corridor — flat Midwest freeway. Blue Water Bridge (Port Huron–Sarnia): active CBSA crossing. Highway 402 to London: Ontario freeway, smooth.
- **Fuel:** Fuel in Oconomowoc before departure. Fill again at Port Huron before the border — Canadian fuel is priced in litres and typically higher. Cross with a full tank.
- **Weather:** Late June in the Great Lakes region: typically warm (25–32 °C), possible afternoon thunderstorms. Check radar before departure.
- **Lodging:**  — **TBD — book London, ON** — Any central London motel — book in advance. Last night before home leg tomorrow.
- **Highlights:** John Cody Smith visit (Benton Harbor area) — 2 hr lunch + content stop; Lake Michigan shoreline approach on I-94; Blue Water Bridge at Port Huron/Sarnia — re-entering Canada; Canadian border crossing: note CBSA declaration requirements (duty-free limits after 48 hrs); London, ON overnight — final Canadian city before Toronto
- **Stops:**
  - **Day stop — John Cody Smith** (host): Coloma, MI (near Benton Harbor / St. Joseph) — 2 hr lunch and content stop. Confirm arrival window with John. No overnight — continuing to London, ON same day.
  - **Border crossing** (border): Blue Water Bridge, Port Huron, MI → Sarnia, ON — Have passport/NEXUS ready for the crossing. Declare all items accurately to CBSA.
- **Risks:** Long day (~530 km) — US-side traffic heavy mid-day; plan Benton Harbor stop early (11 am–1 pm) and border crossing with buffer; Blue Water Bridge border wait — check CBSA wait times that morning; have all documents ready; Michigan I-94 summer traffic — allow extra time around Chicago-to-Detroit corridor; Canadian CBSA: strict about alcohol, firearms, and food items — declare everything
- **Plan B:** If John Cody Smith visit runs long or traffic is severe, skip London and stay in Sarnia/Windsor area instead.
- **B.a.B. alternates:** `john-cody-smith`
- **Fees / passes (3 lines):**
  - U.S. side: no national park entrance for I-94 day as written.
  - Blue Water Bridge (Port Huron → Sarnia): toll per bridge authority — check current motorcycle/car rate and payment method.
  - Canada (CBSA): no park fee; declare goods per CBSA rules; possible duties on purchases.

### Day 36 — 2026-06-24 — Return home (London, ON → Toronto)

- **Terrain:** ON 401 — heavy traffic possible
- **Lodging:**  — **HOME — Toronto, ON** — Final leg from London — debrief, service bike, archive receipts.
- **Highlights:** Final leg home
- **Risks:** 401 construction zones
- **Fees / passes (2 lines):**
  - Ontario 401: 407 ETR if used is all-electronic toll to plate — avoid or register.
  - Home — no park fee.

---

## 4. Bunk a Biker host directory (full index)

Canonical JSON: `data/bab-hosts.json`. Each **host id** keys one object. Daily cards reference `babMergeId` and `babAlternateIds`.

| Host ID | Name | Address | Phone | Email | Contact prefs | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `wayne-lawler` | Wayne "Chip" Lawler | 2659 Cool Lea Camp Road, Alpine, NY 14805 | +19782651984 | wclawler@aol.com | email_or_text | Tent space and a dry RV (no shower/toilet in the RV). You are welcome to use the house facilities when the host is home. Garage with basic tools. Email or text is fine. |
| `greg-chris-mcgraw` | Greg & Chris | 4177 Syrian Hill Road, McGraw, NY 13101 | +13154276327 | Chrissowles@gmail.com | text | Tenting/camping; water available; power available; tools/work space; good meal. Best to text Greg’s number. |
| `dan-southampton` | Dan | Southampton, NY 11968 | — | danielprelato@yahoo.com | email | Access to garage, tools, local info. Confirm full street address and bike parking before arrival. |
| `richard-honchar` | Richard Honchar | 3100 Franklin Street Road, Auburn, NY 13021 | +17205602679 | rbhcmh2018@gmail.com | email | Spare room, outdoor room, tools and jack for repairs. |
| `mike-miller` | Mike Miller | 414 Dublin Road, Clyde, NY 14433 | +13159757240 | Millertude2006@gmail.com | email_or_text | Second bedroom with queen-size bed; about an acre of land if you want to camp. |
| `robert-baldwin` | Robert | Van Buren Street, Baldwin, NY 11510 | +15165872022 | cycleoption@gmail.com | email | Listing had no extra description in your Bunk a Biker export — email to confirm what they offer (suburban home/yard). |
| `jay-massapequa` | Jay | North Massapequa, NY 11758 | +12508950800 | Painterboy67@hotmail.com | email | Tent trailer use; ~45 min from Manhattan. |
| `genie-cane` | Genie Cane | North Cape May, NJ 08204 | +19084215506 | Geniecane@aol.com | email | Bedroom + bath or driveway. No garage. |
| `jim-manchester-nj` | Jim C | Manchester Township, NJ 08759 | +16097090400 | jimcee66383@gmail.com | email | INFO ONLY: may not host — NJ/Shore info & guided runs with lead time. Email preferred; phone checked rarely. **(INFO ONLY)** |
| `arnab-sinha` | Arnab Sinha | Manassas, VA 20109 | +17742851612 | aksinhas@gmail.com | email_or_call | Pickup/tow options; garage 1 bike; guest beds/couch/tent; food & draft beer. No indoor smoking/drugs — family home. |
| `mark-sabrina-catlett` | Mark & Sabrina Catlett | 3328 Catlett Rd, Catlett, VA 20119 | +18126645070 | mark.w.bruce@gmail.com | email | Tent/hammock on gravel; business space — respect neighbors. Tools, garage, driveway. Wife +1-270-860-0865. |
| `fred-christie-huger` | Fred & Christie Huger | Fairfield, VA 24435 | +15404604161 | drnkmlk2@yahoo.com | email | Couch, air mattress, acreage camping; hot shower; ~1 mi off I-81. |
| `katherine-sharpe` | Katherine Sharpe | 1444 Chapman Highway, Sevierville, TN 37876 | +16156635280 | sharpe.katherine@icloud.com | text | Guest room often available; sunroom/couches/air mattress; tent. Kids & pets. Text preferred. Near Dragon/Smokies. |
| `scott-middleton` | Scott David Middleton | Knoxville, TN 37917 | +15132232157 | scott.middleton@rocketmail.com | email_or_text | Garage sometimes; bedroom/couches; kitchen/patio. Heads-up for key if away. |
| `shane-mt-juliet` | Shane (Mt. Juliet) | Mt. Juliet, TN | +12178419348 | Chevy791979@hotmail.com | email | Outside space, possible bedroom; covered parking; few mi off I-40 E of Nashville. |
| `daniel-fucella` | Daniel Fucella | 173 W. Concord Drive, Clarksville, TN 37040 | +19312570578 | cruisin4ever1@yahoo.com | email | 2 guest rooms; garage; tent space. |
| `harrison-hickok` | Harrison Hickok | 6269 Memphis Arlington Rd, Bartlett, TN 38135 | +12697195893 | harrynama@gmail.com | email_or_text | Flower farm ~3 ac; dogs/fosters; shared kitchen/bath; RV sometimes; garage/tools/welder. 24h notice preferred. Smoke/alcohol/420 outside only. |
| `dj-suter` | DJ Suter | Arlington, TN 38002 | +17575828490 | djsuter@gmail.com | email | Farm; tent/barn/RV camping setup. |
| `jeff-roberts-ozark` | Jeff Roberts | 1803 West Philpot Road, Ozark, AR 72949 | +14798577752 | jc3rob@yahoo.com | email | 3 acres tents; trailers/tools/lift/workshop. Map pin ~1 mi off — confirm directions. |
| `brian-cooper` | Brian Cooper | 6712 McClure Road, Van Buren, AR 72956 | +14792624977 | max.burnside8@gmail.com | email | Queen bed inside; outside space; power; 1 bike inside building. |
| `connie-jeff-lackey` | Connie & Jeff Lackey | 720 North Evergreen Street, Greenwood, AR 72936 | +13072755977 | Pweestorekeeper@gmail.com | email | House with carport. |
| `kelly-snyder` | Kelly Snyder (Route 66 Midpoint) | 307 W Historic Route 66, Adrian, TX 79001 | +19379352204 | dreammakerstationroute66@yahoo.com | text | Souvenir shop property; food/drinks donation; BYO alcohol. **24-hour notice via text.** Many riders possible; confirm seasonal hours. |
| `derek-duncan-denver` | Derek Duncan | 55 Hazel Court, Denver, CO 80219 | +17202206266 | derekduncan1973@gmail.com | email | Front/back yard camping; pets OK if traveling with pets. |
| `jim-wendy-conifer` | Jim & Wendy S | Conifer, CO 80433 | +16784642386 | seetheworld@mindspring.com | email | 9,100 ft; woods or balcony camping; towel/shower; up to 4 bikers; wildlife; fire/smoking rules — high fire risk area. |
| `cc-golden` | CC | 975 Xenophon Court, Golden, CO 80401 | +17209859851 | ccsiedlarz@gmail.com | email | Bed, couch, camping, food; 4 dogs; smoking outside; cul-de-sac. |
| `travis-georgetown` | Travis Gilbertson | Georgetown, CO | +19704713865 | gilbertsontravis@gmail.com | email | King bed + private bath; mountain riding; walk to bars; pet-friendly if pets behave. |
| `robert-vandenbroeke` | Robert VandenBroeke | Moab, UT 84532 | +14352200576 | rjvandenbroeke@gmail.com | text_whatsapp | Queen bed basement + sink/toilet. Text/WhatsApp. Jeep tour possible — you provide gas. |
| `good-adv-cortez` | Good ADV | 22812 County Road G, Cortez, CO 81321 | +19707390568 | goodadv@icloud.com | email | Tent; tools; tire gear; possible trailer; paid Airbnbs on site optional. |
| `matt-burton-seligman` | Matt Burton | Seligman, AZ 86337 | +19289254381 | mybroskpr73@gmail.com | email | Off-grid S of Seligman; gravel; ADV-oriented; shop/lift; read full BAB profile. |
| `montana-shaffer` | Montana Shaffer | 22060 Wren Street, Apple Valley, CA 92308 | +15623249109 | jandme24@hotmail.com | email | Home; outside space for trailers or inside. |
| `anais-redlands` | Anais | Redlands, CA | +19512022797 | anaisfan05@gmail.com | call | Tent patio or guest room; pool/jacuzzi by arrangement; garage/tools. **Phone call required** to align. |
| `layla-sisney` | Layla Sisney | 1621 Diego Way, Oxnard, CA 93030 | +18058613411 | lvsisney@gmail.com | email_or_phone | Couch or small backyard; tools/truck/trailer. Advance contact; pet policy; quiet 10p–7a; max 2 nights/2 people; valid ID. |
| `darlene-morro` | Darlene Bennett | California 1, Morro Bay, CA 93442 | +18059060643 | oshnbby@yahoo.com | text | Cottage; driveway; local intel. Limited hosting — text for date fit. |
| `jeff-rothman` | Jeff Rothman | 314 Hewett St, Santa Rosa, CA 95401 | +14157134511 | dravnx@novato.net | email_then_text | Room + couch; garage/tools; wants name/route/bike/social; notice preferred; no pets; M–F away 7–7. |
| `scott-taggart` | Scott Taggart | 8112 Fort Collins Way, Roseville, CA 95747 | +19167160028 | taggart@taggarts.org | email | Backyard camping; shop/lift/tire; garage 2 bikes; laundry. **Pin approximate — confirm address.** |
| `jim-haines-shasta` | Jim Haines | 24451 Creamery Lane, Edgewood, CA 96094 | +15302610100 | shastajim@gmail.com | email | Mt. Shasta area; lawn; bath; tools/trailer; cats. |
| `lisa-blue-bend` | Lisa Blue | Bend, OR 97701 | +17072235953 | 1lisabluesky@gmail.com | email | Bedroom; gated parking; garage tools/lift; 24h notice + ETA; max 2 nights preferred; LGBTQ+ friendly. |
| `suze-riley-maupin` | Suze Riley | Maupin, OR 97037 | +15038169640 | suze@suzeriley.com | email | Large yard camping; maybe inside; best odds Sat–Wed. |
| `mosko-moto` | Mosko Moto / Bates Mototel | 186 East Jewett Blvd, White Salmon, WA 98672 | +15092813211 | moskomoto@moskomoto.com | email | **Register first** — Mototel N of HQ; gravel access; moto-oriented. Office weekday or IG @batesmototel. |
| `david-kishpaugh` | David Kishpaugh | 29820 SE Eagle Creek Road, Estacada, OR 97023 | +15039578063 | jeep.west.dave@gmail.com | call_or_text | Room/camping; full shop/lift; trailer help. **Phone/text fastest.** |
| `jeff-carrie-bob` | Jeff and Carrie Bob | 11885 SW Edgewood St, Portland, OR 97225 | +15038630230 | carrie@carriebob.com | email | Camping; garage/tools/lift; pets; often same-day OK. |
| `david-rs-washougal` | David R S | 4232 Canyon Creek Rd, Washougal, WA 98671 | +13602163192 | drsanchez1114@gmail.com | email | Tent + shop; inside if available. No call after 9pm. |
| `christe-smith-rainier` | Christe Smith (Stewart Ranch) | 800 Tipsoo Loop South, Rainier, WA 98576 | +13604818196 | Trainerchriste@yahoo.com | email | Tent/RV; water/power; moto shop evenings. |
| `ob-graham` | O.B. | 30323 Meridian Ave E, Graham, WA 98338 | +12539510979 | cascadianrogue@gmail.com | email | Camping; tools; food tips. |
| `bob-combs` | Bob Combs | 12832 464th Ave SE, North Bend, WA 98045 | +14258912329 | bob@combshouse.com | email | Mt Si area; shower; shop lifts. **No pets.** |
| `julie-lake-tapps` | Julie C Cardenas | 3609 Lakeridge Dr E, Lake Tapps, WA 98391 | +12535695531 | medassistnurse@gmail.com | email | Spare room + tent space. |
| `bill-darrington` | Bill | Darrington, WA 98241 | +14253308861 | Bhart1601@gmail.com | email | Tent; tools; views. |
| `dave-katherine-cashmere` | Dave & Katherine D | Cashmere, WA 98815 | +12063564288 | Kjdegel@nwi.net | text | Guest room, basement couch, yard camping; laundry; meals if timing works. Text preferred. |
| `angela-east-wenatchee` | Angela Parkison | East Wenatchee, WA 98802 | +15097411918 | streetglidequeen@hotmail.com | email | Dirt road; rooms or camping; big dogs. |
| `betty-chewelah` | Betty (Kenny's place) | 303 East King Ave, Chewelah, WA 99109 | +15096752844 | Okiesmack@gmail.com | email | Posting for brother Kenny — tent; tools. |
| `randy-rathdrum` | Randy Dominicak | 17405 N Wilkinson Rd, Rathdrum, ID 83858 | +12084572828 | radnpad@gmail.com | text | Forest camping. **Text first; call only after text.** |
| `karl-angie-stevensville` | Karl & Angie | Stevensville, MT 59870 (confirm by text) | +14067771230 | itomt@hotmail.com | text | Bitterroot valley; camping common; text full name/FB, group size, dates. |
| `phyl-corvallis-mt` | Phyl | Corvallis, MT 59828 | +14063706668 | Missimont@gmail.com | text | Tent pasture/pines; well water; Bitterroot views. Text fastest. |
| `dustin-patton` | Dustin Patton | 20800 Twin Lakes Road, Frenchtown, MT 59834 | +14063603174 | dspatton44@gmail.com | text | RV/tent w/ power & water; shop; 1 mi gravel; advance notice. |
| `kevin-island-park` | Kevin | Island Park, ID 83429 | +12089401919 | 2005misc@gmail.com | text_or_email | Camping; **1 night max** without prior OK; text preferred. |
| `daryn-engesser` | Daryn Engesser | Powell, WY 82435 | +14066601765 | darynengesser@gmail.com | email | Bedroom; tent yard; garage/tools. |
| `jolene-casper` | Jolene Beiswenger | Casper, WY | +12182807277 | beis0011@gmail.com | text_or_email | Family + dog; laundry; may cook; flexible timing. |
| `michelle-custer` | Michelle Lamphere | Custer, SD 57730 | +16056732393 | michellelamphere@icloud.com | email | **Not during Sturgis rally** — tent or possible guest room. |
| `dave-van-gorkom` | Dave van Gorkom | 609 Triple L Loop, Spearfish, SD 57783 | +17012690560 | davevangorkom@yahoo.com | email | 1 bedroom + bath; food/help. |
| `lisa-redfield` | Lisa | Redfield, SD 57469 | +13173799621 | lisam_38122@yahoo.com | email | Tent; shower/laundry/food; pets inside; smoking outside. |

### routeGuidance (per host)

Each host in JSON also has a multi-line `routeGuidance` string (corridor, distance, Maps caveats). **Open `data/bab-hosts.json` in an editor** for the full text — it is too long to duplicate here line-for-line.

---

## 5. Packing, emergency, and prep notes

### Checklists (from trip.json)

**documents**
- Passport / NEXUS
- Driver license + motorcycle endorsement
- Vehicle registration + proof of insurance (CA/US)
- E111 or travel medical / evacuation (confirm coverage in US)

**bike**
- Tool kit, tire repair, pump/CO2, spare tubes if applicable
- Chain lube, zip ties, electrical tape, spare fuses
- Phone mount + USB power, offline maps downloaded

**ridingGear**
- Rain suit
- Cold layer for mountains
- Hydration
- Moisture-wicking base layers for humid Southeast / Mississippi valley legs (easier than cooking in cotton under armor)
- Earplugs

**camp**
- Tent / sleep system for high-altitude cold nights
- Headlamp, stove/fuel rules per jurisdiction
- Water capacity for UT/AZ/CA desert legs

### Emergency block

```json
{
  "insurancePhone": "",
  "roadside": "",
  "embassy": "Canadian citizen services: travel.gc.ca",
  "bloodTypes": "",
  "notes": "ICE: add contacts and any allergies. Yellowstone: nearest care may be far — carry first aid. If regional wildfire smoke drives AQI into unhealthy ranges, shorten the riding day and seek clean indoor air — especially at altitude or with any respiratory history.",
  "contacts": [
    {
      "name": "ICE — primary",
      "relation": "",
      "phone": ""
    }
  ]
}
```

### beforeYouGo (maintenance reminders for the project)

- Trip window in this file: 2026-05-20 → 2026-06-24. If you move departure, update trip.startDate, trip.endDate, and every days[].date in sync (or regenerate from your spreadsheet).
- Maps: set GOOGLE_MAPS_API_KEY in .env (see .env.example), run npm run build, then serve. On Vercel, add the same variable under Environment Variables — build generates google-maps-config.js. Restrict the key by HTTP referrer (localhost + your Vercel URL). Re-check each leg in Maps after you set exact pins.
- Daily plan lists stay name/address only; phone, email, and all Bunk a Biker backups are in the B.a.B. directory. Edit babAlternateIds per day in data/bab-hosts.json / trip.json if you trim the list.
- Confirm each host address, gate codes, and bike parking before arrival day.
- Arches NP: verify current entry and parking rules on nps.gov/arch for your dates (timed-entry reservations were discontinued as of 2026 research — lots can still fill).
- Yellowstone / Beartooth: verify pass opening and NPS alerts.
- Every other national park or monument you actually enter on this loop (e.g. Zion tunnel / vehicle size rules, Smokies parking, timed shuttles, Navajo Nation tour permits): open NPS.gov or the managing tribe/agency site for **your** entry dates — rules and reservations change by season.
- Surface hazards common on US Interstates and plains: grooved pavement, tar snakes, steel bridge decks, expansion joints, and cattle guards — scan ahead, reduce lean, and avoid hard throttle or braking on transitions.
- Download offline maps for the full loop and share location with one trusted contact.

> **Note for AI:** Arches National Park timed-entry rules have changed over time. For 2026 travel, **verify current entry rules on [nps.gov/arch](https://www.nps.gov/arch)** — do not rely only on older checklist lines.

---

## 6. Related resources in the repo

- **Homework / DR650:** `data/homework.json` — maintenance sequence, forums, regional risks.
- **Parts & dealers:** `data/motorcycle-parts-shops.json` — corridor-organized Suzuki/parts references.
- **Route overlays:** `data/route-overlays.json` — `meta.disclaimer` explains Google distance behavior.
- **Content creation:** `data/content-creation.json` — filming and legal-notes briefs per day.

---

## 7. Host IDs referenced in trip.json but missing from bab-hosts.json

Fix by adding these keys to `data/bab-hosts.json` or removing the references from the relevant days.

- `john-cody-smith`

---

## 8. How an AI should use this

1. **Prefer editing JSON** over hardcoding in `app.js` for itinerary changes.
2. **Keep `babMergeId` / `babAlternateIds`** in sync with real keys in `bab-hosts.json`.
3. **Never invent** host phone numbers; only use values from `bab-hosts.json` or explicit user input.
4. For **fees and park rules**, cite official NPS/land-manager pages for the rider’s date — the app text is advisory.
5. **Day indices** run **1–36** (`dayIndex` in `trip.json`).
6. Regenerate this handbook after major itinerary edits: `node scripts/generate-ai-handbook.cjs`.

---

*Generated by `scripts/generate-ai-handbook.cjs` from `data/trip.json` and `data/bab-hosts.json`. Re-run after those files change:*

```bash
node scripts/generate-ai-handbook.cjs
```
