#!/usr/bin/env node
/**
 * Historical one-off (do not run blindly): inserted Day 2 and renumbered to 36 days.
 * Live itinerary: 36 days in data/trip.json (start 2026-05-20, end 2026-06-24 as of last edit).
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const tripPath = path.join(root, "data", "trip.json");
const overlayPath = path.join(root, "data", "route-overlays.json");

function isoAdd(baseIso, deltaDays) {
  const d = new Date(`${baseIso}T12:00:00`);
  d.setDate(d.getDate() + deltaDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const TITLE_BY_NEW_INDEX = {
  5: "Pulaski → Smoky Mountains (TN)",
  6: "Smoky Mountains → Nashville → Memphis (TN)",
  7: "Memphis / Parsons → Little Rock (AR)",
  8: "Little Rock → Fort Worth (TX)",
  9: "Fort Worth → Amarillo (TX)",
  10: "Amarillo → Albuquerque (NM)",
  11: "Albuquerque → Million Dollar Highway (Silverton, CO)",
  12: "Silverton → Mexican Hat (UT)",
  13: "Mexican Hat → Page → Bryce Canyon (~500 km)",
  14: "Bryce Canyon → Arches National Park (Moab, UT)",
  15: "Arches → St. George (UT)",
  16: "St. George → Barstow (CA)",
  17: "Barstow → Hollywood → Los Angeles",
  18: "Leo Carrillo → Prewitt Ridge Campground",
  19: "Prewitt Ridge → Point Arena Lighthouse",
  20: "Point Arena → Redwood National Park",
  21: "Redwood → Crater Lake (Westfir, OR)",
  22: "Westfir → Goldendale / Mosier",
  23: "Mosier → Seattle (WA)",
  24: "Seattle → US-20 (~400 km)",
  25: "US-20 → Spokane",
  26: "Spokane → Kooskia → Lolo Pass",
  27: "Lolo Pass → Yellowstone",
  28: "Yellowstone National Park — full day",
  29: "Yellowstone → Beartooth Highway",
  30: "Beartooth Highway → Gillette (WY)",
  31: "Gillette → Needles Highway → border camping",
  32: "Oacoma → Rochester (MN) (~600 km)",
  33: "Rochester → Oconomowoc (WI)",
  34: "Oconomowoc → Benton Harbor (MI)",
  35: "Benton Harbor → London (ON)",
  36: "Return home (London, ON → Toronto)",
};

// --- trip.json ---
const data = JSON.parse(fs.readFileSync(tripPath, "utf8"));
const oldDays = data.days;
const out = [];

out.push({
  ...oldDays[0],
  dayIndex: 1,
  date: isoAdd("2026-05-20", 0),
});

out.push({
  dayIndex: 2,
  date: isoAdd("2026-05-20", 1),
  title: "Finger Lakes → New York",
  distanceKm: 0,
  terrain: "NY Thruway / Hudson Valley approaches",
  highlights: ["Shorter leg before DC → Luray segment"],
  stops: [],
  lodging: {
    heading: "Stay option",
    name: "Dan",
    address: "Southampton, NY 11968",
    notes: "Long Island — confirm full address and bike parking.",
  },
  lodgingAlternatives: [
    {
      heading: "Stay option",
      name: "Courtney Schrader",
      address: "Washington, DC 20016",
      notes: "DC metro — useful if you route toward Luray via I-95.",
    },
  ],
  risks: ["Metro traffic near NYC / Long Island"],
  planB: "",
  babAlternateIds: [],
});

const d3 = JSON.parse(JSON.stringify(oldDays[1]));
d3.dayIndex = 3;
d3.date = isoAdd("2026-05-20", 2);
d3.title = "New York → Washington, DC → Luray (VA)";
d3.lodging = {
  heading: "Stay",
  name: "Frank Allen Pence",
  address: "Luray, VA 22835",
  notes: "Confirm full street address before arrival.",
};
delete d3.lodgingAlternatives;
out.push(d3);

for (let i = 2; i < oldDays.length; i++) {
  const nd = JSON.parse(JSON.stringify(oldDays[i]));
  nd.dayIndex = oldDays[i].dayIndex + 1;
  nd.date = isoAdd("2026-05-20", nd.dayIndex - 1);
  if (TITLE_BY_NEW_INDEX[nd.dayIndex]) {
    nd.title = TITLE_BY_NEW_INDEX[nd.dayIndex];
  }
  if (nd.dayIndex === 8 && nd.lodging) {
    nd.lodging.name = "HOME — Fort Worth, TX";
    nd.lodging.notes = "Garage tools, laundry, bike check before western push.";
  }
  if (nd.dayIndex === 36 && nd.lodging) {
    nd.lodging.name = "HOME — Toronto, ON";
    nd.lodging.notes = "Final leg from London — debrief, service bike, archive receipts.";
  }
  out.push(nd);
}

data.days = out;
data.trip.name = "Toronto → Texas → West Coast → Rockies → Home (36 days)";
data.trip.endDate = "2026-06-24";
data.trip.statsChips = [
  "36 riding days",
  "Km + Maps links in route-overlays.json",
  "Tap Google Maps each leg to confirm before riding",
];
data.trip.legs = {
  "1": "Toronto → Fort Worth · Days 1–8",
  "2": "Fort Worth → Seattle · Days 9–23",
  "3": "Seattle → Toronto · Days 24–36",
};
data.trip.overviewLead =
  "36-day Canada ↔ USA motorcycle loop in three chapters: east → Texas home → west coast, Cascades, Yellowstone, and home through the plains. Includes a Finger Lakes → New York segment before DC and Luray.";
data.trip.summary =
  "The ride strings together the Finger Lakes, a New York metro stop, Washington DC and Luray, southwest Virginia, Great Smoky approaches, Nashville–Memphis, Arkansas, a Fort Worth home stop, then the high plains and I-40 toward New Mexico. From there: San Juan Mountains and Million Dollar Highway, Utah (Mexican Hat, Page, Bryce, Moab, Arches, St. George), the California coast to the redwoods, Oregon and the Columbia River Gorge, Seattle, US-20 and Spokane, Lolo Pass, Yellowstone and the Beartooth corridor, and a long return through the Dakotas and Great Lakes to Ontario, with a final night in London before Toronto.";

fs.writeFileSync(tripPath, `${JSON.stringify(data, null, 2)}\n`);

// --- route-overlays.json ---
const ov = JSON.parse(fs.readFileSync(overlayPath, "utf8"));
const oldBy = ov.byDay;
const newBy = {};

newBy["1"] = oldBy["1"];

newBy["2"] = {
  mapsDirectionsUrl:
    "https://www.google.com/maps/dir/?api=1&origin=Clyde%2C+NY+14433&destination=New+York%2C+NY&travelmode=driving",
  distanceNote:
    "Finger Lakes to NYC metro — pick Southampton vs DC pacing in Maps after you choose host; tolls on Thruway/I-95 possible.",
  recommendations: [
    { text: "If staying Southampton: adjust destination pin in Google Maps.", url: "" },
    {
      text: "George Washington Bridge / Hudson crossings — peak traffic.",
      url: "https://www.google.com/maps/search/George+Washington+Bridge",
    },
  ],
};

newBy["3"] = {
  mapsDirectionsUrl:
    "https://www.google.com/maps/dir/?api=1&origin=Washington%2C+DC&destination=Luray%2C+VA&travelmode=driving",
  distanceNote:
    "Core mid-Atlantic segment (DC → Luray). If starting from NY/LI, chain origin in Maps to match your Day 2 end pin.",
  recommendations: [
    {
      text: "Shenandoah approaches — Skyline Dr is a detour with fee.",
      url: "https://www.nps.gov/shen/",
    },
    { text: "I-95 / Beltway congestion — avoid rush if possible.", url: "" },
  ],
};

for (let k = 3; k <= 35; k++) {
  newBy[String(k + 1)] = oldBy[String(k)];
}

ov.byDay = newBy;
fs.writeFileSync(overlayPath, `${JSON.stringify(ov, null, 2)}\n`);

console.log("Updated trip.json (36 days) and route-overlays.json (byDay 1–36).");
