/**
 * One-time / idempotent: merges routeGuidance strings into data/bab-hosts.json.
 * Distances are approximate road-trip km from your loop’s main corridors (verify in Maps at ride time).
 * Only includes hosts present in bab-hosts.json (primary B.a.B. stays).
 */
const fs = require("fs");
const path = require("path");

const p = path.join(__dirname, "../data/bab-hosts.json");
const j = JSON.parse(fs.readFileSync(p, "utf8"));

/** @type {Record<string, string>} */
const G = {
  "jimmy-kaylee-comfort": `Corridor: Leg 1 · Day 1 primary — Horseheads is in the Southern Tier / Elmira area (Chemung County), typical routing after I-90 entry then toward I-86 and Finger Lakes approaches.
Distance: Confirm last miles and gate/parking by text — rural Sullivanville Rd.
Early stop: Text ahead; respect host rules on drinking, 420 outside only, and no hard drugs (see profile notes).`,

  "frank-allen-pence": `Corridor: Leg 1 · Day 3 primary — Luray is your Shenandoah gateway after the NYC / DC transit day.
Distance: Listing is town/ZIP-level — host will give the full address by text; pin the house in Maps the day you ride.
Early stop: Beltway fatigue or storms — text ahead (preferred contact).`,

  "vicky-cawley": `Corridor: Leg 1 · Day 4 primary — Hardy sits southwest of Roanoke with fast access to the BRP (~7 mi from MP 112 per host).
Distance: Plan last miles from Luray/Roanoke corridor in Maps — rural driveway; confirm gate/parking for bikes.
Early stop: Weather on the ridge or you want tools/garage before the next BRP day.`,

  "dan-southampton": `Corridor: Leg 1 · Day 2 (Horseheads / Southern Tier → NY / LI). Southampton is a town-only pin — not a full street address.
Distance: Large detour from I-90 Thruway if you stay upstate first; natural if you’re sweeping south/east toward NYC that day.
Maps: You must confirm the exact street + bike parking by email before navigating — don’t rely on town-center routing alone.`,

  "kelly-snyder": `Corridor: Leg 2 · Days 10–11 (Fort Worth → Amarillo → ABQ). Adrian TX midpoint is ON I-40 / Route 66 — your Day 10 primary merged stay.
Distance: At or beside your corridor — minimal extra km if timed right.
Early stop: Wind fatigue on plains — text ahead (24h notice required per profile).`,

  "robert-vandenbroeke": `Corridor: Leg 2 · Days 15–16 primary (Moab). Moab is ON your Bryce → Arches → rest itinerary.
Distance: Destination town — confirm exact house pin; desert heat — aim for morning arrival.
Early stop: Second night only if host agrees — your plan already uses 2 nights; text/WhatsApp per profile.`,

  "montana-shaffer": `Corridor: Leg 2 · Day 18 primary (St. George → Mojave → Apple Valley). Apple Valley is Victorville/Barstow basin — ON I-15 desert approach to LA.
Distance: ~15–35 km from I-15 depending on route — good late-day Mojave arrival.
Maps: Full Wren St — confirm gate/parking.`,
};

for (const [id, text] of Object.entries(G)) {
  if (!j.hosts[id]) {
    console.warn("missing host id:", id);
    continue;
  }
  j.hosts[id].routeGuidance = text.trim();
}

fs.writeFileSync(p, JSON.stringify(j, null, 2) + "\n");
console.log("Wrote routeGuidance for", Object.keys(G).length, "hosts to", p);
