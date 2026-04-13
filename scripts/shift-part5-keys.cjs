/**
 * After inserting 4 days in the Luray–Parsons segment: shift part5 keys 7→8 … 35→36,
 * replace keys 4–7 with route-matched road/culture, add key 36 from old 35.
 */
const fs = require("fs");
const path = require("path");
const dir = path.join(__dirname, "cc-documentary-data");

const a = JSON.parse(fs.readFileSync(path.join(dir, "part5a.json"), "utf8")).days;
const b = JSON.parse(fs.readFileSync(path.join(dir, "part5b.json"), "utf8")).days;
const c = JSON.parse(fs.readFileSync(path.join(dir, "part5c.json"), "utf8")).days;

const merged = { ...a, ...b, ...c };

const next = {};

const insert4 = {
  roadRules: [
    "Virginia: helmets required for operators and passengers (§46.2-910); Jefferson NF falls under USFS motor-vehicle rules — MVUM dictates where wheels may leave pavement.",
    "George Washington & Jefferson National Forests: dispersed camping is allowed only in designated zones on the MVUM — random bushwhacking can be trespass.",
    "Roanoke-area two-lanes: deer strikes peak dawn/dusk; agricultural equipment uses full lane width on blind curves.",
    "Virginia reckless-driving thresholds can treat high speed as misdemeanor — verify statutory mph vs. ‘simple speeding’ before narrating.",
    "NF roads: seasonal gates — snow or mud can close spurs without advance notice on apps.",
  ],
  culture:
    "Roanoke’s railroad and coal history shaped town layout; today’s outdoor economy (trail runners, MTB, moto tourism) sits on that infrastructure. The Ridge and Valley province west of Shenandoah reads as ‘more Appalachia’ to outsiders but politically and acoustically differs from SWVA coalfields. Respect private land edges along NF boundaries — trespass disputes are common where suburbs meet forest.",
  moreFacts: [
    "The Roanoke Valley sits in the Roanoke River watershed — flash floods in mountain creeks arrive faster than radar suggests to valley riders.",
    "Jefferson NF merges administratively with GWNF — one Motor Vehicle Use Map system for legal OHV/dispersed access.",
  ],
};

const insert5 = {
  roadRules: [
    "Blue Ridge Parkway: federal NPS road — 45 mph typical max; commercial vehicles prohibited; wildlife (bear, deer) have right-of-way morally and practically.",
    "North Carolina: helmet required for all operators and passengers (G.S. 20-140.4); Tennessee shares enforcement on state-line routes.",
    "BRP: passing only on dashed yellow where sight distance allows — tourists stop in travel lanes for photos.",
    "Boone NC approaches: college-town traffic + mountain tourism — short tempers in parking lots.",
    "Bristol TN/VA: state line splits sales tax and traffic laws — verify which side of State Street you cite.",
  ],
  culture:
    "The Blue Ridge Parkway is Depression-era CCC legacy — interpret labor history before ‘pretty road’ VO. Boone’s university economy contrasts with coal towns to the north — don’t flatten Appalachia into one accent. Bristol’s ‘Twin Cities’ marketing straddles two states — music history (Bristol sessions) is asset; NASCAR adjacent culture is not every rider’s taste.",
  moreFacts: [
    "The BRP’s 469 miles connect Shenandoah to Great Smoky Mountains — no billboards by federal policy.",
    "Mabry Mill is among the most photographed BRP stops — parking fills on summer weekends.",
  ],
};

const insert6 = {
  roadRules: [
    "Tennessee / North Carolina: US-129 Tail of the Dragon — heavy THP and sheriff enforcement; crossing double-yellow is citation-grade.",
    "North Carolina: helmet required for all riders (G.S. 20-140.4); Tennessee adult helmet rules changed in 2022 — verify TCA §55-9-305 before ‘no helmet’ narration.",
    "Great Smoky Mountains NP: peak season vehicle reservations may apply — motorcycles pay same rules as cars; wildlife distance regulations are federal.",
    "Cherokee NF: dispersed camping only on MVUM — bear country food storage; fines for feeding wildlife.",
    "Gatlinburg/Pigeon Forge tourism corridors: distracted drivers and lane changes — treat as urban core.",
  ],
  culture:
    "Sevier County tourism runs on Dollywood economics; the Smokies’ ‘blue smoke’ is VOC chemistry from vegetation — not romantic mist. The Dragon draws international riders; EMS burden is real. Eastern Band Cherokee lands near the corridor use different jurisdiction — don’t conflate with NPS rules.",
  moreFacts: [
    "US-129 at Deals Gap: 318 curves in 11 miles — public crash statistics are cited by TN/NC DOT.",
    "GSMNP is the most-visited US national park — traffic congestion is management science.",
  ],
};

const insert7 = {
  roadRules: [
    "Tennessee: carry registration and proof of financial responsibility; implied consent applies to DUI stops involving motorcycles.",
    "West Tennessee: farm equipment on US-70 corridors; dogs in roadways — reduce speed through settlements.",
    "Kentucky Lake / Tennessee River public lands: camping only where posted — USACE and TVA have different rules; flood lines move.",
    "Ticks and chiggers in tall grass — permethrin gear vs. DEET on skin is a tradeoff; Lyme is less common in west TN than mid-Atlantic but still possible.",
    "Parsons (Decatur County): small-town ordinances on overnight parking — verify before stealth camping.",
  ],
  culture:
    "West Tennessee agriculture and river economics differ from East Tennessee mountains — same state, different labor history. Natchez Trace State Forest and TVA lands carry separate histories of displacement and flood control. Ask permission before filming on church lots or private river access.",
  moreFacts: [
    "The Tennessee River’s Kentucky Lake is one of the largest man-made lakes in the US by surface area — TVA legacy.",
    "Parsons sits in Decatur County — named for Commodore Stephen Decatur.",
  ],
};

for (let k = 1; k <= 3; k++) next[String(k)] = merged[String(k)];
next["4"] = insert4;
next["5"] = insert5;
next["6"] = insert6;
next["7"] = insert7;

for (let old = 7; old <= 35; old++) {
  next[String(old + 1)] = merged[String(old)];
}

function split() {
  const outA = {};
  const outB = {};
  const outC = {};
  for (let i = 1; i <= 12; i++) outA[String(i)] = next[String(i)];
  for (let i = 13; i <= 24; i++) outB[String(i)] = next[String(i)];
  for (let i = 25; i <= 36; i++) outC[String(i)] = next[String(i)];
  fs.writeFileSync(path.join(dir, "part5a.json"), JSON.stringify({ days: outA }, null, 2) + "\n");
  fs.writeFileSync(path.join(dir, "part5b.json"), JSON.stringify({ days: outB }, null, 2) + "\n");
  fs.writeFileSync(path.join(dir, "part5c.json"), JSON.stringify({ days: outC }, null, 2) + "\n");
}

split();
console.log("part5a/b/c rekeyed for 36 days.");
