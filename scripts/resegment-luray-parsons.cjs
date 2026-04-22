/**
 * One-time migration: Luray → Roanoke → Bristol (BRP) → Smokies/Dragon → Kingston → Parsons,
 * then Parsons → Little Rock (inserts one day; trip becomes 36 days).
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const tripPath = path.join(root, "data/trip.json");
const roPath = path.join(root, "data/route-overlays.json");
const ccPath = path.join(root, "data/content-creation.json");

const trip = JSON.parse(fs.readFileSync(tripPath, "utf8"));
const ro = JSON.parse(fs.readFileSync(roPath, "utf8"));
const cc = JSON.parse(fs.readFileSync(ccPath, "utf8"));

// --- trip.json: new days 4–7
const newTripDays = [
  {
    dayIndex: 4,
    date: "2026-05-23",
    title: "Luray → Roanoke (VA)",
    distanceKm: 0,
    difficulty: "MODERATE",
    routeLine:
      "Luray area → Roanoke metro via US-11 / US-460 or I-81 options — pick traffic vs scenery in Maps; aim Roanoke for resupply before NF overnight.",
    fuelNotes: "Fuel in Luray or before Roanoke; Roanoke has full services.",
    foodNotes: "Stock water/food before dispersed camp — no services on NF spurs.",
    weatherNotes: "Late May: pop-up thunderstorms — check radar; avoid ridges in lightning.",
    keyNotes: [
      "Dispersed camping only where Jefferson NF MVUM allows motor vehicles — verify same week.",
      "Pack out all waste; many sites have no water.",
    ],
    campingAccommodation: "Free dispersed (NF) — confirm road open and fire rules.",
    terrain: "Shenandoah approaches → Roanoke valley",
    highlights: ["Roanoke resupply", "Jefferson NF camping"],
    stops: [],
    lodging: {
      heading: "Free camping (dispersed)",
      name: "George Washington & Jefferson NF — near Roanoke (search MVUM)",
      notes:
        "Example search area ~37.5, -79.9 — use official Motor Vehicle Use Map for legal spur roads; iOverlander/FreeCampgrounds for user reports — verify. No amenities; 14-day limits common.",
      mapsUrl: "https://www.google.com/maps?q=37.50,-79.90",
    },
    risks: ["Deer dawn/dusk", "Gravel/mud on NF roads after rain"],
    planB: "Developed NF campground (fee) or Walmart parking urban last resort — not ideal.",
    babAlternateIds: [],
  },
  {
    dayIndex: 5,
    date: "2026-05-24",
    title: "Roanoke → Bristol (VA/TN) — Blue Ridge Parkway day",
    distanceKm: 0,
    difficulty: "MODERATE",
    routeLine:
      "Primary riding on Blue Ridge Parkway and short connectors — NOT I-81 as your main line. In Google Maps: set waypoints Roanoke → Rocky Knob / Mabry Mill (BRP) → Fancy Gap → Boone NC → secondary roads into Bristol TN/VA. Drag route off interstates; use ‘avoid highways’ if helpful. BRP max ~45 mph — full riding day.",
    fuelNotes: "BRP has limited fuel — tank in Roanoke; next reliable fuel often Boone or after BRP exit toward Bristol.",
    foodNotes: "Mabry Mill / visitor areas are limited — carry snacks.",
    weatherNotes: "Elevation changes quickly — carry rain layer; fog on BRP mornings.",
    keyNotes: [
      "BRP is NPS: federal speed limits, wildlife (bear/deer), no commercial trucks.",
      "Bristol sits on the TN/VA line — clocks and tax rules differ by side.",
    ],
    campingAccommodation: "Free dispersed — Cherokee NF or Holston / TVA shoreline (verify)",
    terrain: "Blue Ridge Parkway + Appalachian connectors",
    highlights: ["BRP mileposts", "Boone approach", "Bristol twin cities"],
    stops: [
      {
        label: "BRP landmark (optional)",
        place: "Mabry Mill (BRP milepost ~176)",
        type: "sight",
        notes: "Historic mill — short stop; parking fills weekends.",
        mapsUrl: "https://www.google.com/maps/search/Mabry+Mill+Blue+Ridge+Parkway",
      },
    ],
    lodging: {
      heading: "Free camping (dispersed)",
      name: "Cherokee NF / Holston Mountain area — verify MVUM",
      notes:
        "Eastern TN / southwest VA has NF dispersed sites — confirm motor-vehicle access on your exact spur. Example search: Cherokee National Forest dispersed near Damascus VA / Laurel Bloomery — verify closures. Pack out waste.",
      mapsUrl: "https://www.google.com/maps/search/Cherokee+National+Forest+TN+dispersed+camping",
    },
    risks: ["BRP: slow vehicles and sightseers", "Long day = fatigue before Bristol"],
    planB: "Paid campground or motel Bristol if weather or fatigue wins.",
    babAlternateIds: [],
  },
  {
    dayIndex: 6,
    date: "2026-05-25",
    title: "Bristol → Great Smoky Mountains → Tail of the Dragon → Kingston (TN)",
    distanceKm: 0,
    difficulty: "MODERATE",
    routeLine:
      "Bristol → Smokies gateway (Gatlinburg/Newfound Gap optional scenic) → US-129 Tail of the Dragon (Deals Gap) → Kingston TN (Loudon County). US-129 is enforcement-heavy — ride your own pace; crossing centerline is citation bait.",
    fuelNotes: "Fuel before Dragon (Deals Gap store) or Knoxville corridor — don’t start Dragon at reserve.",
    foodNotes: "Deals Gap / Tellico has limited options — eat before late push.",
    weatherNotes: "Mountain showers; Dragon surface can be slick from leaves or dew.",
    keyNotes: [
      "GSMNP: peak season may require parking/entry reservations — check NPS.gov.",
      "Dragon: 318 curves in 11 miles — fatigue kills; pull off often.",
    ],
    campingAccommodation: "Free dispersed near Tellico / Cherokee NF (verify)",
    terrain: "Smokies approaches · US-129 · TN river hills",
    highlights: ["Smokies overlook (optional)", "Tail of the Dragon", "Tennessee River hills"],
    stops: [
      {
        label: "Tail of the Dragon",
        place: "Deals Gap NC / TN",
        type: "sight",
        notes: "US-129 — photo enforcement; respect double-yellow.",
        mapsUrl: "https://www.google.com/maps/search/Deals+Gap+Motorcycle+Resort",
      },
    ],
    lodging: {
      heading: "Free camping (dispersed)",
      name: "Cherokee NF — Tellico Plains / Bald River corridor (MVUM)",
      notes:
        "Dispersed camping common on NF roads west of Dragon — verify MVUM, fire restrictions, and bear storage. Example pin area: Tellico River corridor — confirm road status.",
      mapsUrl: "https://www.google.com/maps?q=35.364,-84.292",
    },
    risks: ["Dragon traffic and LE", "Bear country — food storage", "Tourist traffic near Gatlinburg"],
    planB: "Paid campground Kingston / Loudon if dispersed full.",
    babAlternateIds: [],
  },
  {
    dayIndex: 7,
    date: "2026-05-26",
    title: "Kingston → Parsons (TN)",
    distanceKm: 0,
    difficulty: "EASY",
    routeLine:
      "Short west Tennessee day — US-70 / I-40 corridor options to Parsons (38363). Visit town, resupply, rest before Arkansas push.",
    fuelNotes: "Short leg — fuel optional.",
    foodNotes: "Parsons: small-town groceries — plan dinner.",
    weatherNotes: "Humid late spring — afternoon storms possible.",
    keyNotes: ["Light day — use for laundry, bike check, hydration recovery."],
    campingAccommodation: "Free camping — public land / river access (verify)",
    terrain: "West TN rolling / river valleys",
    highlights: ["Parsons TN", "Kentucky Lake / Tennessee River region nearby"],
    stops: [
      {
        label: "Destination",
        place: "Parsons, TN 38363",
        type: "other",
        notes: "Verify street parking and local overnight rules if urban edge.",
        mapsUrl: "https://www.google.com/maps/search/Parsons+TN+38363",
      },
    ],
    lodging: {
      heading: "Free camping (dispersed / primitive)",
      name: "Natchez Trace State Forest / Kentucky Lake USACE (verify free)",
      notes:
        "West TN: search iOverlander for free camps near Parsons / Decaturville — many are lake/river bank or WMA — confirm legal camping, fire rules, and flood line. USACE sometimes offers free primitive areas — read signage.",
      mapsUrl: "https://www.google.com/maps/search/free+camping+near+Parsons+TN",
    },
    risks: ["Ticks/chiggers in tall grass near water", "Limited cell in hollows"],
    planB: "County fairground or church parking with permission — ask locally.",
    babAlternateIds: [],
  },
];

const head = trip.days.slice(0, 3);
const tail = trip.days.slice(6).map((d) => {
  const oldIdx = d.dayIndex;
  const dt = new Date(`${d.date}T12:00:00`);
  dt.setDate(dt.getDate() + 1);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return {
    ...d,
    dayIndex: oldIdx + 1,
    date: `${y}-${m}-${day}`,
  };
});

trip.days = [...head, ...newTripDays, ...tail];

trip.meta.title = trip.meta.title.replace(/35-day/i, "36-day");
trip.trip.name = trip.trip.name.replace(/\(35 days\)/, "(36 days)");
trip.trip.statsChips = trip.trip.statsChips.map((c) => (c.includes("35 days") ? "36 days" : c));
trip.trip.endDate = "2026-06-24";
trip.trip.legs = {
  "1": "Toronto → Fort Worth · Days 1–9",
  "2": "Fort Worth → Seattle · Days 10–24",
  "3": "Seattle → Toronto · Days 25–36",
};
trip.trip.overviewLead = trip.trip.overviewLead.replace(
  "Luray",
  "Luray, then Roanoke, Blue Ridge Parkway to Bristol, Smokies and Tail of the Dragon to Kingston, Parsons"
);

fs.writeFileSync(tripPath, `${JSON.stringify(trip, null, 2)}\n`);

// --- route-overlays.json
const byDay = {};
for (let i = 1; i <= 3; i++) byDay[String(i)] = ro.byDay[String(i)];

byDay["4"] = {
  mapsDirectionsUrl:
    "https://www.google.com/maps/dir/?api=1&origin=Luray%2C+VA+22835&destination=Roanoke%2C+VA&travelmode=driving",
  distanceNote: "~150–180 km depending on I-81 vs US-460 routing — confirm scenic choice in Maps.",
  recommendations: [
    { text: "Shenandoah NP Skyline Dr is a fee detour — optional.", url: "https://www.nps.gov/shen/" },
    { text: "Roanoke: Blue Ridge Parkway access points south of town.", url: "https://www.nps.gov/blri/" },
  ],
};

byDay["5"] = {
  mapsDirectionsUrl:
    "https://www.google.com/maps/dir/?api=1&origin=Roanoke%2C+VA&waypoints=Rocky+Knob+Visitor+Center+Blue+Ridge+Parkway|Fancy+Gap%2C+VA|Boone%2C+NC&destination=Bristol%2C+TN&travelmode=driving",
  distanceNote:
    "BRP + connectors — Maps may suggest I-81; drag onto Blue Ridge Parkway and secondary roads. Full day at parkway speeds.",
  recommendations: [
    { text: "Blue Ridge Parkway — no trucks; plan fuel gaps.", url: "https://www.nps.gov/blri/" },
    { text: "In Maps: use ‘Avoid highways’ or add BRP waypoints to keep off interstates.", url: "" },
    { text: "Boone NC: food/fuel before final push to Bristol.", url: "https://www.google.com/maps/search/Boone+NC" },
  ],
};

byDay["6"] = {
  mapsDirectionsUrl:
    "https://www.google.com/maps/dir/?api=1&origin=Bristol%2C+TN&waypoints=Gatlinburg%2C+TN|Deals+Gap+NC&destination=Kingston%2C+TN&travelmode=driving",
  distanceNote:
    "Smokies gateway + US-129 Dragon + run to Kingston — long, technical day; verify GSMNP entry needs.",
  recommendations: [
    { text: "Tail of the Dragon — fuel at Deals Gap.", url: "https://www.google.com/maps/search/Deals+Gap" },
    { text: "GSMNP vehicle reservation (peak) — check NPS.", url: "https://www.nps.gov/grsm/planyourvisit/park-it-forward.htm" },
  ],
};

byDay["7"] = {
  mapsDirectionsUrl:
    "https://www.google.com/maps/dir/?api=1&origin=Kingston%2C+TN&destination=Parsons%2C+TN+38363&travelmode=driving",
  distanceNote: "~100–130 km short day — recovery before I-40 west.",
  recommendations: [
    { text: "Parsons — resupply before Arkansas leg tomorrow.", url: "" },
  ],
};

for (let old = 7; old <= 35; old++) {
  byDay[String(old + 1)] = ro.byDay[String(old)];
}

ro.byDay = byDay;
fs.writeFileSync(roPath, `${JSON.stringify(ro, null, 2)}\n`);

// --- content-creation.json: new episodes 4–7 + shift
cc.meta.seriesTitle = "36 Days Across North America";

const ccHead = cc.days.slice(0, 3);
const ccTail = cc.days.slice(6).map((d) => ({ ...d, dayIndex: d.dayIndex + 1 }));

const ccNew = [
  {
    dayIndex: 4,
    videoTitle: "Luray to Roanoke — Appalachia Transition | Day 4",
    hook: "You leave Shenandoah country for the ridge-and-valley chessboard — same mountains, different geometry.",
    storyArc: "Morning pack from Luray. Midday: choose slab vs scenic with honest ETA math. Evening: NF camp routine — water, bear hang, fatigue check.",
    shots: [
      "Leaving Luray — ridge in mirror",
      "Roanoke skyline or valley approach",
      "NF spur — tent and bike in frame",
      "Cook stove / hydration ritual",
    ],
    facts: [
      "Roanoke sits in Virginia’s Ridge and Valley province — long parallel ridges formed by folded Paleozoic rock.",
      "The Jefferson National Forest merges administratively with George Washington NF — one MVUM system for motor access.",
    ],
    culture:
      "Roanoke’s railroad and coal history shaped town layout; today’s outdoor economy (trail runners, MTB, moto tourism) sits on that infrastructure. Respect private land edges along NF boundaries — trespass disputes are common where suburbs meet forest.",
    talkingPoints: ["Ridge vs valley wind patterns — show flags or grass.", "NF camping ethics — fire rings vs create new."],
    cta: "Ever camped dispersed? What’s your leave-no-trace rule?",
    fieldGuide: [
      "1️⃣ Roanoke fuel as hub — film the decision: slab time vs scenic time.",
      "2️⃣ MVUM screen capture — on-camera proof you checked motor access.",
      "3️⃣ Audio: creek vs road noise — use for transition cuts.",
    ],
    roadRules: [
      "Virginia: helmet and equipment rules still apply leaving Shenandoah corridor.",
      "National Forest: OHV rules don’t make every dirt road legal — check MVUM.",
    ],
  },
  {
    dayIndex: 5,
    videoTitle: "Blue Ridge Parkway — Roanoke to Bristol the Long Way | Day 5",
    hook: "This isn’t a transit day. It’s a 45-mph thesis on American road design.",
    storyArc: "Act I: merge onto BRP clean. Act II: milepost discipline — fuel anxiety as honest B-roll. Act III: exit to Bristol — state line psychology.",
    shots: [
      "BRP entrance / milepost",
      "Mabry Mill or Rocky Knob pullout",
      "Tunnel or stone bridge — compression shot",
      "Boone approach — college town in mountains",
      "Bristol sign — TN/VA",
    ],
    facts: [
      "The Blue Ridge Parkway is 469 miles with no billboards and no commercial trucks — by federal design.",
      "Bristol is ‘Twin Cities’ — one downtown, two states.",
    ],
    culture:
      "BRP is Depression-era CCC legacy — interpret labor history briefly before ‘pretty road’ VO. Boone’s university economy contrasts with coal towns to the north — don’t flatten Appalachia into one accent or story.",
    talkingPoints: ["Why BRP bans trucks — engineering + sightlines.", "Bristol Speedway isn’t today’s ride — name it, skip it."],
    cta: "BRP or interstate — which would you pick? Comment.",
    fieldGuide: [
      "1️⃣ Shoot BRP curves from tripod — safe pullouts only.",
      "2️⃣ Fuel anxiety: show odometer + next town — teach planning.",
      "3️⃣ Fog layer — white balance shift is a free act break.",
    ],
    roadRules: [
      "Blue Ridge Parkway: NPS speed limits; wildlife has right of way on the road.",
      "Passing only where legal — double yellow is federal ticket territory.",
    ],
  },
  {
    dayIndex: 6,
    videoTitle: "Smokies Approach & Tail of the Dragon — Bristol to Kingston | Day 6",
    hook: "Tourism density spikes before the curves — then the road invoices ego in 318 installments.",
    storyArc: "Transit to Smokies gateway. Optional overlook. Dragon: segment into thirds, show pullouts. Exit to Kingston — leg fatigue as data.",
    shots: [
      "Bristol departure — two states behind",
      "Smokies haze wide shot",
      "Dragon entrance sign",
      "Tree of Shame — respectful frame",
      "Kingston / river light",
    ],
    facts: [
      "US-129 at Deals Gap: 318 curves in 11 miles — Tennessee and North Carolina share enforcement.",
      "Great Smoky Mountains NP is the most visited US national park.",
    ],
    culture:
      "Gatlinburg tourism is economic engine and traffic choke — narrate without sneering. Eastern Band Cherokee lands near the corridor use different jurisdiction — don’t conflate with NPS rules.",
    talkingPoints: ["Dragon crash statistics — cite public DOT data if at all.", "Smokies haze — VOC chemistry in one sentence."],
    cta: "Dragon: been there or hard pass?",
    fieldGuide: [
      "1️⃣ GoPro bitrate — curves need high motion settings.",
      "2️⃣ Load luggage — show tire pressures morning-of.",
      "3️⃣ Cherokee NF camp — bear hang on camera.",
    ],
    roadRules: [
      "Tennessee / North Carolina helmet and lane rules apply on US-129.",
      "GSMNP: reservations peak season — motorcycles pay same rules.",
    ],
  },
  {
    dayIndex: 7,
    videoTitle: "Short Miles — Kingston to Parsons | Day 7",
    hook: "Not every day is epic mileage — some days buy you admin and sleep debt recovery.",
    storyArc: "Slow morning. West TN roads as recovery spin. Parsons arrival — small-town logistics before the Mississippi crossing tomorrow.",
    shots: [
      "Kingston morning light",
      "Two-lane west TN",
      "Parsons welcome sign or main drag",
      "Map screenshot — short leg truth",
    ],
    facts: [
      "The Tennessee River’s Kentucky Lake is one of the largest man-made lakes in the world by surface area — TVA legacy.",
      "Parsons sits in Decatur County — named for Commodore Stephen Decatur.",
    ],
    culture:
      "West Tennessee agriculture and river economics differ from East Tennessee mountains — same state, different labor history. Keep church parking and private lot assumptions conservative — ask permission.",
    talkingPoints: ["Why a short leg before Arkansas slab — pacing philosophy.", "TVA lakes: public access vs private shoreline — don’t camp blind."],
    cta: "Do you schedule zero-hero days on tour?",
    fieldGuide: [
      "1️⃣ Film the ‘short day’ choice — audience thinks tours are nonstop heroics.",
      "2️⃣ Laundry / chain lube B-roll — maintenance is content.",
    ],
    roadRules: [
      "Tennessee: eye protection and insurance rules still apply on relaxed days.",
      "County roads: farm equipment and dogs — reduce speed in settlements.",
    ],
  },
];

cc.days = [...ccHead, ...ccNew, ...ccTail];

fs.writeFileSync(ccPath, `${JSON.stringify(cc, null, 2)}\n`);

console.log("Updated trip.json, route-overlays.json, content-creation.json (36 days).");
