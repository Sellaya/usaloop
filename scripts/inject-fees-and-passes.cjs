/**
 * Injects feesAndPasses[] on each day in data/trip.json.
 * Sources: nps.gov fee pages (2025–2026), nps.gov/aboutus/nonresident-fees.htm (Mar 2026),
 * Utah State Parks, SD GFP, City of Page (Horseshoe Bend). Re-verify at ride time.
 */
const fs = require("fs");
const path = require("path");

const p = path.join(__dirname, "../data/trip.json");
const j = JSON.parse(fs.readFileSync(p, "utf8"));

const NONRES_PASS =
  "Non-U.S. citizens (2026): America the Beautiful annual pass for non-residents US$250 (digital: recreation.gov/pass) — covers standard entrance fees where accepted and waives the US$100/person non-resident surcharge at the 11 high-visitation parks when you show valid pass + photo ID (see nps.gov/aboutus/nonresident-fees.htm). U.S. resident pass remains US$80.";

/** @type {Record<number, string[]>} */
const BY_DAY = {
  1: [
    "No U.S. national park entrance on this day.",
    "Canada: no outbound park fee. U.S. entry: CBP inspection has no park-style fee.",
    "NY Thruway (I-90) / crossings: tolls apply — E-ZPass or Tolls By Mail (plate billing); Peace Bridge / Lewiston–Queenston bridge tolls vary — set up payment before trip if needed.",
  ],
  2: [
    "No federal park entrance fee on routing described.",
    "NYC / Hudson crossings (if used): many bridges/tunnels are cashless tolling to a registered plate or bill-by-mail — budget tolls; motorcycles follow posted rules per crossing.",
  ],
  3: [
    "District of Columbia: no NPS entrance fee to ride public roads past monuments (no timed NPS entry ticket required just to transit).",
    "If you enter a specific fee-charging NPS unit as a visitor attraction, pay that site’s fee — not required for through-riding to Luray.",
    "Virginia: no Shenandoah NP fee unless you enter the Skyline Drive corridor (fee applies at entrance stations). Your Luray routing may stay outside park gates — confirm map.",
  ],
  4: [
    "George Washington & Jefferson National Forests: no NPS entrance fee; dispersed camping is generally free where MVUM allows — developed NF campgrounds charge site fees if you use them.",
  ],
  5: [
    "Blue Ridge Parkway (NPS): no entrance fee for the parkway itself; standard NPS rules apply (speed, wildlife).",
    "Optional stops (e.g. Mabry Mill): parking may fill — no separate park ‘ticket’ beyond your time.",
  ],
  6: [
    "Great Smoky Mountains NP: no entrance fee, but a parking tag is required for any vehicle parked >15 minutes (2026: daily US$5, weekly US$15, annual US$40 — purchase/print via recreation.gov activity pass or in-park; display physical tag per nps.gov/grsm).",
    "Smokies is not on the 2026 US$100 non-resident surcharge list — that applies only to the 11 parks listed on nps.gov/aboutus/nonresident-fees.htm.",
    "Tail of the Dragon (US-129): public highway — no park entrance; obey enforcement and lane rules.",
    NONRES_PASS,
  ],
  7: [
    "No major national-park entrance on this short west-TN day. Natchez Trace State Forest / USACE / WMA: follow posted day-use or camping fees if you use a fee area — many dispersed options are free if legally allowed.",
  ],
  8: [
    "Hot Springs National Park (optional detour near Garland County): no entrance fee to enter the park (per NPS). Bathhouse row services are separate commercial fees if you use them.",
    "Arkansas state highways: no park pass required for slab transit.",
  ],
  9: [
    "Texas: possible toll roads on some I-30/I-20 routings — TxTag / toll-by-plate; budget if your GPS uses toll lanes.",
    "No NPS entrance on this home-stop day as written.",
  ],
  10: [
    "Texas plains / Route 66 stops: roadside attractions may charge their own small admission — optional.",
    "No federal park entrance fee for the driving day as written.",
  ],
  11: [
    "iOverlander / private camp pins (~US$10 tenting in your notes): pay the host/landowner; not an NPS fee.",
    "I-40 / Amarillo: no NPS fee for driving; motel/camp is commercial pricing.",
  ],
  12: [
    "San Juan NF / Silverton area: USFS — no NPS entrance; dispersed camping usually free where allowed — verify MVUM. Developed USFS or county sites may charge.",
    "Colorado state highways: no park pass for through-riding.",
  ],
  13: [
    "Mexican Hat Rocks campground (private): ~US$22+ tax in your plan — reserve/confirm on their site (seasonal).",
    "Navajo Nation / Monument Valley (if you enter tribal park): separate tribal permit/fees — not included in America the Beautiful.",
  ],
  14: [
    "Bryce Canyon NP (NPS): motorcycle 7-day entrance US$30 (cashless at park — nps.gov/brca); private vehicle US$35. Bryce is on the 2026 non-resident surcharge list — without an America the Beautiful pass, ages 16+ non-U.S. residents pay an additional US$100/person at entry (with valid non-resident annual pass, entrance + surcharge covered for passholder per NPS rules — verify ID).",
    "Horseshoe Bend overlook (City of Page): parking fee ~US$5 motorcycle / ~US$10 private vehicle (Page, AZ — not covered by federal passes; verify current rate at visitpage.com / city site).",
    "Antelope Canyon: Navajo Nation guided tours — commercial pricing (often US$50–100+); book slots in advance; separate from NPS.",
    "Glen Canyon NRA (Lake Powell area): if you use NRA fee areas, Glen Canyon has its own fee schedule — America the Beautiful applies to NPS-managed standard entrance (see nps.gov/glca).",
    NONRES_PASS,
  ],
  15: [
    "Driving UT-12 toward Moab: if you enter Capitol Reef NP, pay NPS entrance (motorcycle rate on nps.gov/care) or use America the Beautiful — optional detour only.",
    "Canyonlands / Arches not yet visited this day as written — no Arches fee until you enter.",
  ],
  16: [
    "Arches NP: motorcycle 7-day entrance US$25; private vehicle US$30 (nps.gov/arch, credit/debit at entrance). America the Beautiful covers standard entrance. 2026: timed-entry reservation for Arches was discontinued — verify current status on nps.gov/arch before travel (parking may still temporarily limit entry when lots are full).",
    "Fiery Furnace hikes: separate permit/ranger fees if you do those activities (nps.gov/arch).",
    "Dead Horse Point State Park (Utah state): separate from NPS — motorcycle day-use ~US$10, private vehicle ~US$20 (stateparks.utah.gov — verify 2026). Not covered by federal annual pass.",
    "Canyonlands Island in the Sky (optional): NPS entrance fee if you enter — motorcycle rate on nps.gov/cany.",
    NONRES_PASS,
  ],
  17: [
    "BLM dispersed (Sheep Bridge / Cove Wash): typically no entrance fee; follow BLM posted rules.",
    "Zion NP (if you enter the park): Zion is on the 2026 non-resident surcharge list — motorcycle entrance fee + possible US$100/person without annual pass; check nps.gov/zion + tunnel restrictions for large vehicles.",
  ],
  18: [
    "I-15: possible toll lanes in some segments — account for toll-by-plate.",
    "No park entrance fee for Mojave transit to Apple Valley as written.",
  ],
  19: [
    "Leo Carrillo State Park (CA): vehicle day-use fee required (California State Parks — 2026 pricing on parks.ca.gov; online day-use reservation recommended weekends/holidays).",
    "PCH / Big Sur: Julia Pfeiffer Burns SP and other CA state parks charge day-use or parking fees — check parks.ca.gov for each stop.",
    "Prewitt Ridge BLM: usually no fee; confirm BLM Los Padres info for your exact spur.",
  ],
  20: [
    "CA Hwy 1 / dispersed pin: confirm land manager (private / county / state) and any day-use or camping fee before paying or camping.",
  ],
  21: [
    "Redwood National and State Parks: NPS units — no entrance fee for the federal Redwood areas (nps.gov/redw). Adjacent California state park units may charge day-use — pay if you enter those units.",
  ],
  22: [
    "Crater Lake NP (optional detour): NPS entrance applies if you enter — motorcycle rate on nps.gov/crla; America the Beautiful accepted. Not on the 11-park US$100 surcharge list as published Jan 2026 (verify if policy updates).",
  ],
  23: [
    "Columbia River Gorge NSA / OR & WA state parks: some trailheads require Northwest Forest Pass or state day-use — check fs.usda.gov and Oregon/Washington park sites for the exact stop.",
  ],
  24: [
    "Seattle metro: no NPS entrance for urban riding; paid parking garages may apply downtown.",
  ],
  25: [
    "North Cascades National Park complex: no entrance fee to drive WA SR-20 (nps.gov/noca).",
    "If you use a fee trailhead or Sno-Park in season, Washington Sno-Park permit may apply in winter — June usually not applicable.",
  ],
  26: [
    "Eastern WA / Spokane: no NPS fee for routing as written.",
  ],
  27: [
    "Lolo Pass / US-12: scenic highway — no national-park entrance fee for the pass transit itself.",
  ],
  28: [
    "Yellowstone NP: motorcycle 7-day entrance US$30 (nps.gov/yell). Yellowstone is on the 2026 non-resident surcharge list — without America the Beautiful, ages 16+ non-U.S. residents pay US$100/person in addition to entrance; valid America the Beautiful (including non-resident US$250 pass) covers entrance and surcharge for passholder presentation with ID per NPS.",
    "Keep receipt — 7-day Yellowstone entrance valid for re-entry.",
    NONRES_PASS,
  ],
  29: [
    "Yellowstone NP: same 7-day entrance window if within validity from purchase — carry pass/receipt.",
    NONRES_PASS,
  ],
  30: [
    "Yellowstone NP: still inside 7-day window if continuous from prior entries — confirm dates on your pass stub.",
    "Beartooth Highway (US-212): scenic corridor — no separate ‘Beartooth pass’ beyond any NPS Yellowstone re-entry if you dip back in.",
  ],
  31: [
    "Wyoming plains: no NPS fee for routing as written.",
  ],
  32: [
    "Custer State Park (SD): park entrance license required for Wildlife Loop etc. — 2026: 7-day temporary license ~US$25/private vehicle or ~US$20/motorcycle (verify gfp.sd.gov/pel). Non-stop through-travel on designated US-16A through-route may be exempt — read posted rules.",
    "Black Hills National Forest: generally no entrance fee; amenity sites may charge.",
    "Mount Rushmore NM: parking is a private concession fee (not covered by America the Beautiful for the parking structure) — budget separately if you visit.",
  ],
  33: [
    "I-90 Great Plains: possible toll segments (e.g. Illinois/Iowa depending on route) — verify GPS toll settings.",
  ],
  34: [
    "Upper Midwest freeways: tolls possible (e.g. Illinois Tollway if routed) — I-Pass or pay-by-plate.",
  ],
  35: [
    "U.S. side: no national park entrance for I-94 day as written.",
    "Blue Water Bridge (Port Huron → Sarnia): toll per bridge authority — check current motorcycle/car rate and payment method.",
    "Canada (CBSA): no park fee; declare goods per CBSA rules; possible duties on purchases.",
  ],
  36: [
    "Ontario 401: 407 ETR if used is all-electronic toll to plate — avoid or register.",
    "Home — no park fee.",
  ],
};

for (const day of j.days) {
  const lines = BY_DAY[day.dayIndex];
  if (!lines) {
    console.warn("missing fees for day", day.dayIndex);
    continue;
  }
  day.feesAndPasses = lines;
}

fs.writeFileSync(p, JSON.stringify(j, null, 2) + "\n");
console.log("Injected feesAndPasses for", j.days.length, "days");
