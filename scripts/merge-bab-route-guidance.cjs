/**
 * One-time / idempotent: merges routeGuidance strings into data/bab-hosts.json.
 * Distances are approximate road-trip km from your loop’s main corridors (verify in Maps at ride time).
 */
const fs = require("fs");
const path = require("path");

const p = path.join(__dirname, "../data/bab-hosts.json");
const j = JSON.parse(fs.readFileSync(p, "utf8"));

/** @type {Record<string, string>} */
const G = {
  "wayne-lawler": `Corridor: Leg 1 · Days 1–2 (Finger Lakes / NY Thruway approaches). ~35–45 km from I-86 / Corning–Elmira depending on your entry — not on the direct McGraw zip line but close to Finger Lakes wine roads.
Early stop: Weather on the lake belt, late border day, or you want a quieter night before McGraw.
Maps: Full street + ZIP — pin before you ride.`,

  "greg-chris-mcgraw": `Corridor: Leg 1 · Day 1 primary — McGraw is ON your Toronto → Finger Lakes day.
Distance: Destination address — use as your planned night zero in the US after border.
Early stop: Only if you’re hours early — text Greg first (host prefers text).`,

  "dan-southampton": `Corridor: Leg 1 · Day 2 (Finger Lakes → NY / LI). Southampton is a town-only pin — not a full street address.
Distance: Large detour from I-90 Thruway if you stay upstate first; natural if you’re sweeping south/east toward NYC that day.
Maps: You must confirm the exact street + bike parking by email before navigating — don’t rely on town-center routing alone.`,

  "richard-honchar": `Corridor: Leg 1 · Days 1–2 alternates. Auburn sits between Syracuse and I-90 Finger Lakes exits — ~40–55 km side trip from a McGraw/I-90 routing depending on path.
Early stop: Backup if Greg’s place isn’t available or you’re delayed near Auburn.
Maps: Full address — verify pin matches house entrance.`,

  "mike-miller": `Corridor: Leg 1 · Days 1–2 alternates. Clyde is just north of I-90 between Rochester and Syracuse (~10–20 km off Thruway exits).
Early stop: Easy bail-out if you’re tired on Day 1–2 and want a shorter last leg vs pushing to McGraw/LI.
Maps: Full address on Dublin Rd — good pin quality.`,

  "robert-baldwin": `Corridor: Leg 1 · Day 2 alternates (Long Island). Baldwin vs “Robert” is the town name — listing may lack a street number.
Distance: Expect ~40–70 km from major NYC crossings depending on route — heavy traffic last miles.
Maps: Open in Maps then confirm full house number and parking with host by email — don’t navigate to a street-only pin blindly.`,

  "jay-massapequa": `Corridor: Leg 1 · Day 2 alternates. North Massapequa is Long Island — same “LI day” bucket as Dan/Robert.
Distance: Far from upstate Thruway; use when your routing already drops to the LI / NYC outer belt.
Early stop: Good if you’re splitting the NYC approach across two shorter days.`,

  "genie-cane": `Corridor: Leg 1 · Day 3 alternate (NJ). Cape May is far south — ~150+ km off a direct I-95 toward DC/Luray unless you’re deliberately sweeping the Jersey shore.
Early stop: Only if you’re taking a coastal detour or escaping I-95 traffic with a big southern swing — otherwise burns time/energy.
Maps: Town-level — confirm exact street before committing.`,

  "jim-manchester-nj": `Corridor: Leg 1 · Day 3 — info / local rider contact; not assumed overnight.
Use: Shore routing, tolls, and traffic intel — email first (phone rarely checked per profile).`,

  "arnab-sinha": `Corridor: Leg 1 · Day 3 (toward Luray). Manassas sits west of DC on I-66 / US-29 approaches — ~80–110 km from Luray depending on route, useful NOVA side stop.
Early stop: Beltway fatigue, storms, or you want a garage/tools night before Shenandoah.
Maps: ZIP-level — confirm exact pin with host; tow/pickup options per profile — clarify expectations.`,

  "mark-sabrina-catlett": `Corridor: Leg 1 · Day 3 alternate. Catlett is southwest of DC — useful if you’re on US-17 / I-95 western approaches to Virginia.
Distance: ~50–90 km offset from a straight I-95 to Luray — check live traffic before detouring.
Maps: Full rural address — verify gravel/driveway with a loaded bike.`,

  "fred-christie-huger": `Corridor: Leg 1 · Days 3–4 bridge. Fairfield is ~1 mi off I-81 (profile note) — strong “weather / fatigue” stop between Luray and Roanoke.
Distance: ~25–45 km from typical Luray–I-81 links depending on exit — short recovery vs pushing to NF dispersed.
Early stop: Thunderstorms on the ridge or you’re done with interstate droning.
Maps: Town + “~1 mi off I-81” — pin the exact house in Maps the day you ride.`,

  "katherine-sharpe": `Corridor: Leg 1 · Day 6 (Bristol → Smokies → Dragon → Kingston). Sevierville / Chapman Hwy is Smokies gateway — on-path for Gatlinburg/Pigeon Forge traffic.
Distance: Near your Smokies + Dragon day — use if you bail off dispersed camp for a shower night or storm rolls in.
Maps: Full highway address — expect tourist traffic; text host (preferred).`,

  "scott-middleton": `Corridor: Leg 1 · Day 6–8 (east TN / west TN). Knoxville is ~35–50 km from Kingston on I-40 — easy same-region backup.
Early stop: Mechanical issue, heat, or you want a garage/couch instead of another NF night.
Maps: ZIP-level city — confirm street pin with host.`,

  "shane-mt-juliet": `Corridor: Leg 1 · Days 7–9 (TN / AR via I-40). Mt. Juliet is east of Nashville on I-40 — best when your westbound I-40 day passes Nashville metro.
Distance: ~25–35 km off I-40 east side — don’t use if you’re routing far south/west of Nashville without crossing I-40.
Early stop: Evening traffic, storms, or split Nashville into two days.`,

  "daniel-fucella": `Corridor: Leg 1 · Days 7–9. Clarksville is NW of Nashville — ~80–120 km off a pure I-40 run Memphis–Little Rock unless you dip north.
Early stop: Useful if you reroute for weather, bridge closures, or want a quiet night off the interstate drag.
Maps: Street address without ZIP in listing — search “173 W Concord Dr, Clarksville, TN 37040” in Maps to verify.`,

  "harrison-hickok": `Corridor: Leg 1 · Days 7–9. Bartlett is northeast Memphis metro — ~15–35 km from I-40 depending on approach.
Early stop: Heat, fatigue, or mechanical — strong shop/tools profile; 24h notice preferred.
Maps: Full street address — confirm farm gate / dogs with host.`,

  "dj-suter": `Corridor: Leg 1 · Days 7–9. Arlington TN is east of Memphis — similar “Memphis metro” bucket as Bartlett; check I-40 vs I-55 routing for your day.
Early stop: Long plains day bailout before Arkansas.
Maps: Town-level — confirm exact road with host (farm property).`,

  "jeff-roberts-ozark": `Corridor: Leg 1 · Day 8 alternate (Parsons → Little Rock). Ozark AR is near your Arkansas push — profile says map pin ~1 mi off; workshop/tools.
Distance: Roughly on-path for central/southern AR approaches — verify driving minutes from your I-40/US-167 choice in Maps.
Early stop: Need lift/tools or a yard night vs pushing to Jacksonville/Little Rock.
Maps: Confirm directions on Philpot Rd — don’t trust pin alone.`,

  "brian-cooper": `Corridor: Leg 1 · Day 8 alternate. Van Buren (AR) is Fort Smith metro / I-40 western Arkansas — strong if your routing uses I-40 W toward OK/TX.
Distance: ~25–45 km from I-40 depending on exit — quick motel alternative energy-saver.
Maps: Full McClure Rd address — verify.`,

  "connie-jeff-lackey": `Corridor: Leg 1 · Day 8 alternate. Greenwood is south of Fort Smith — similar western AR bucket as Van Buren.
Early stop: Heat or you’re stopping before Little Rock segment.
Maps: Full Evergreen St — verify.`,

  "kelly-snyder": `Corridor: Leg 2 · Days 10–11 (Fort Worth → Amarillo → ABQ). Adrian TX midpoint is ON I-40 / Route 66 — your Day 10 primary merged stay.
Distance: At or beside your corridor — minimal extra km if timed right.
Early stop: Wind fatigue on plains — text ahead (24h notice required per profile).`,

  "derek-duncan-denver": `Corridor: Leg 2 · Day 12 alternate (ABQ → San Juans) — Colorado Front Range is a major detour from I-40/I-25 unless you’re cutting north early.
Distance: Hundreds of km off a direct ABQ → Silverton line — use only for weather closure of mountain passes or intentional rest route.
Maps: Full Hazel Court — Denver metro traffic/heat — plan arrival off-peak.`,

  "jim-wendy-conifer": `Corridor: Leg 2 · Day 12 alternate. Conifer is Front Range foothills SW of Denver — same “big detour north” caveat as Denver host; 9,100 ft — weather and fatigue matter.
Early stop: Altitude headache or you’re aborting a mountain day — not for saving km on the direct SW route.
Maps: Town-level — confirm driveway/access for heavy bike.`,

  "cc-golden": `Corridor: Leg 2 · Day 12 alternate. Golden CO is also a northern detour from the direct NM→Silverton run — use for social/recovery nights, not corridor efficiency.
Maps: Full Xenophon Ct — residential cul-de-sac; confirm parking.`,

  "travis-georgetown": `Corridor: Leg 2 · Day 12 alternate. Georgetown (I-70 mountain) — still north of your direct Four Corners line from ABQ — detour logic same as other CO hosts.
Early stop: Pass weather or you want a mountain-town shower night.
Maps: Town only — must confirm address by email.`,

  "robert-vandenbroeke": `Corridor: Leg 2 · Days 15–16 primary (Moab). Moab is ON your Bryce → Arches → rest itinerary.
Distance: Destination town — confirm exact house pin; desert heat — aim for morning arrival.
Early stop: Second night only if host agrees — your plan already uses 2 nights; text/WhatsApp per profile.`,

  "good-adv-cortez": `Corridor: Leg 2 · Days 13–14 alternate (Four Corners). Cortez CO is near US-491 / Mesa Verde side — reasonable if you’re sweeping north from NM toward Utah.
Distance: ~50–80 km off US-163 depending on path — worth it for tools/tire help vs limping into Page.
Maps: Full County Rd G — gravel possible; ADV-oriented.`,

  "matt-burton-seligman": `Corridor: Leg 2 · Days 11–14 alternate (AZ I-40 / 66). Seligman is ON historic 66 west of Flagstaff — great if your day follows I-40 west.
Distance: Minimal lateral offset if you’re already on 66 — off-grid S of town per profile; confirm gravel.
Early stop: Heat or mechanical on the long AZ crossing.
Maps: Town-level — read full BAB profile before committing.`,

  "montana-shaffer": `Corridor: Leg 2 · Day 18 primary (St. George → Mojave → Apple Valley). Apple Valley is Victorville/Barstow basin — ON I-15 desert approach to LA.
Distance: ~15–35 km from I-15 depending on route — good late-day Mojave arrival.
Maps: Full Wren St — confirm gate/parking.`,

  "anais-redlands": `Corridor: Leg 2 · Day 18–19 alternates. Redlands is inland Empire east of LA — use if you’re splitting LA basin across a shorter day before PCH.
Distance: Detour from pure I-15 to Barstow — plan extra time in heat/traffic.
Maps: Town-level — phone call required per profile — align before navigating.`,

  "layla-sisney": `Corridor: Leg 2 · Day 18–19 alternates. Oxnard is coastal Ventura County — natural if you’re already on US-101 / PCH north from LA.
Distance: On-path for coastal routing; heavy traffic possible — arrive before dark.
Maps: Full Diego Way — rules/ID per profile.`,

  "darlene-morro": `Corridor: Leg 2 · Days 19–20 alternates. Morro Bay is ON Hwy 1 central coast — strong if you’re short of Prewitt or fogged out.
Early stop: Bail-out from long Big Sur day — text host (limited hosting).
Maps: Hwy 1 address vague — confirm exact driveway/parking.`,

  "jeff-rothman": `Corridor: Leg 2 · Days 19–21 alternates. Santa Rosa is inland North Bay — ~30–80 km from Hwy 1 depending on your coastal choice.
Early stop: NorCal fog fatigue or you leave the coast for warmth/services.
Maps: Full Hewett St — weekday away hours per profile.`,

  "scott-taggart": `Corridor: Leg 2 · Day 21+ alternates. Roseville is Sacramento metro east — useful if you’re cutting inland on US-50/I-80 toward Tahoe/redwoods.
Maps: Pin approximate per profile — must confirm exact Fort Collins Way address.`,

  "jim-haines-shasta": `Corridor: Leg 2 · Day 21–22 (redwoods / N. CA). Edgewood is south of Mt Shasta on I-5 corridor — ON north–south coastal return to OR.
Early stop: Smoke, cold marine layer, or long US-101 day — shop/tools per profile.
Maps: Full Creamery Lane — verify.`,

  "lisa-blue-bend": `Corridor: Leg 2 · Day 22–24 (Oregon). Bend is central OR — use if your route crosses US-97 (common for Cascades).
Distance: Detour if you’re purely on US-101 coast — hundreds of km — don’t use for “on the way” unless routing inland.
Maps: Town-level — 24h notice per profile.`,

  "suze-riley-maupin": `Corridor: Leg 2 · Day 22–24. Maupin is on US-197 / Deschutes — good if you’re on the east side of the Cascades toward the Gorge.
Early stop: Gorge wind day bailout — Sat–Wed best odds per profile.
Maps: Town-level — confirm.`,

  "mosko-moto": `Corridor: Leg 2 · Day 23–24 (Columbia Gorge). White Salmon / Bates Mototel is ON common Portland–Gorge motorcycle routes (WA-14 / Hood River area).
Distance: Near your PNW crossing — register first per profile; gravel access.
Maps: Full Jewett Blvd — office hours for check-in.`,

  "david-kishpaugh": `Corridor: Leg 2 · Day 23–24. Estacada SE of Portland — ~40–70 km from I-5 depending on path — good tools/trailer help if you’re routing through Portland metro.
Maps: Full Eagle Creek Rd — call/text fastest per profile.`,

  "jeff-carrie-bob": `Corridor: Leg 2 · Day 23–24. Portland west side — metro traffic; use for rest/tools if you’re stopping in PDX.
Maps: Full Edgewood St — pets OK per profile.`,

  "david-rs-washougal": `Corridor: Leg 2 · Day 23–24. Washougal is east of Vancouver WA — Gorge / Portland outer belt — good last stop before heading east on US-12.
Maps: Full Canyon Creek Rd — no calls after 9pm.`,

  "christe-smith-rainier": `Corridor: Leg 2 · Day 24–25. Rainier WA is south toward Mt Rainier — detour from I-5 unless you’re touring the volcano side.
Early stop: If you want rural camp + shop evenings per profile.
Maps: Full Tipsoo Loop — verify.`,

  "ob-graham": `Corridor: Leg 2 · Day 24–25. Graham WA is south Puget Sound — similar “south of Seattle” bucket; I-5 / SR-512 corridor.
Maps: Full Meridian Ave — verify rural driveway.`,

  "bob-combs": `Corridor: Leg 2 · Day 25 (Seattle area). North Bend is I-90 east of Seattle — ON-path if you’re crossing Snoqualmie Pass eastbound same day or next.
Early stop: Pass weather or you want Seattle tools without downtown parking pain.
Maps: Full 464th Ave SE — no pets per profile.`,

  "julie-lake-tapps": `Corridor: Leg 2 · Day 25. Lake Tapps is Auburn/Puyallup south sound — suburban backup if Seattle hosts are full.
Maps: Full Lakeridge Dr — verify.`,

  "bill-darrington": `Corridor: Leg 3 · Day 25+ (north Cascades return). Darrington is US-2 mountain corridor — strong if you’re on the scenic loop toward Spokane.
Early stop: Rain/wind on North Cascades Hwy — shorter day to recover.
Maps: Town-level — confirm.`,

  "dave-katherine-cashmere": `Corridor: Leg 3 · US-2 / central WA. Cashmere–Wenatchee fruit belt — good inland-heat rest night.
Maps: Town-level — text preferred.`,

  "angela-east-wenatchee": `Corridor: Leg 3 · US-2 / Columbia River. East Wenatchee — same region as Cashmere; dirt road per profile — verify bike access.`,

  "betty-chewelah": `Corridor: Leg 3 · northeastern WA toward ID/MT. Chewelah is north of Spokane — use on US-395 / Colville corridor legs.
Maps: Full King Ave — verify.`,

  "randy-rathdrum": `Corridor: Leg 3 · northern ID. Rathdrum is north of Coeur d’Alene — ~15–30 km off I-90 depending on route — forest camping per profile.
Maps: Full Wilkinson Rd — text before call per profile.`,

  "karl-angie-stevensville": `Corridor: Leg 3 · Bitterroot MT (US-93). Stevensville is S of Missoula — ON common Lolo Pass approaches from the south.
Early stop: Smoke, pass fatigue, or you want Bitterroot valley rest.
Maps: Confirm by text — town in listing.`,

  "phyl-corvallis-mt": `Corridor: Leg 3 · Bitterroot MT. Corvallis MT (not OR) — same US-93 valley as Stevensville — alternate in same region.
Maps: Town-level — text fastest.`,

  "dustin-patton": `Corridor: Leg 3 · Missoula area. Frenchtown is W of Missoula — ~10–20 km off I-90 — good gravel-aware stop with power/water per profile.
Maps: Full Twin Lakes Rd — 1 mi gravel per profile.`,

  "kevin-island-park": `Corridor: Leg 3 · ID/MT (Yellowstone approaches). Island Park is west of Yellowstone — ON US-20 if that’s your entry — 1 night max without OK per profile.
Early stop: Yellowstone traffic/smoke bailout — text first.
Maps: Town-level — confirm.`,

  "daryn-engesser": `Corridor: Leg 3 · northwest WY. Powell is east of Yellowstone — useful Cody/Powell US-14/16 approaches.
Maps: Town-level — verify.`,

  "jolene-casper": `Corridor: Leg 3 · central WY. Casper is I-25 US route — good plains crossing stop if your return uses Wyoming.
Maps: Town only — flexible timing per profile.`,

  "michelle-custer": `Corridor: Leg 3 · Black Hills SD. Custer is near I-90 / US-16 — NOT during Sturgis rally per profile — check your travel dates vs Sturgis (early Aug) per profile.
Early stop: Hills fatigue or storm on plains approach.
Maps: Town-level — email.`,

  "dave-van-gorkom": `Corridor: Leg 3 · western SD. Spearfish is I-90 Black Hills north — good if you’re on northern plains return.
Maps: Full Triple L Loop — verify.`,

  "lisa-redfield": `Corridor: Leg 3 · eastern SD plains. Redfield is off I-29 / US-212 corridor — use for long plains day recovery toward MN.
Maps: Town-level — pets inside per profile — confirm if you have gear animals.`,
};

for (const [id, text] of Object.entries(G)) {
  if (!j.hosts[id]) {
    console.warn("missing host id:", id);
    continue;
  }
  j.hosts[id].routeGuidance = text.trim();
}

// Maps accuracy: tighten a few search queries
if (j.hosts["daniel-fucella"]) {
  j.hosts["daniel-fucella"].mapsUrl =
    "https://www.google.com/maps/search/?api=1&query=173+W+Concord+Dr%2C+Clarksville%2C+TN+37040";
}

fs.writeFileSync(p, JSON.stringify(j, null, 2) + "\n");
console.log("Wrote routeGuidance for", Object.keys(G).length, "hosts to", p);
