/**
 * One-off / maintenance: regenerate docs/AI-TRIP-HANDBOOK.md from data/trip.json + data/bab-hosts.json
 * Run: node scripts/generate-ai-handbook.cjs
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const trip = JSON.parse(fs.readFileSync(path.join(root, "data/trip.json"), "utf8"));
const bab = JSON.parse(fs.readFileSync(path.join(root, "data/bab-hosts.json"), "utf8"));

function esc(s) {
  return String(s || "")
    .replace(/\|/g, "\\|")
    .replace(/\r?\n/g, " ")
    .trim();
}

let md = "";
md += "# AI handoff: Toronto ↔ Southwest USA motorcycle loop (36 days)\n\n";
md +=
  "**Purpose.** This document gives any AI or human collaborator enough context to work on the **moto-trip-itinerary** project: route intent, nightly plan, data files, tooling, and Bunk a Biker contacts — without guessing.\n\n";
md +=
  "**Privacy.** Contains real names, phones, and emails from your planning data. Do not paste publicly; share only with trusted tools or people.\n\n";
md += "---\n\n";

md += "## 1. Trip identity\n\n";
md += "| Field | Value |\n| --- | --- |\n";
md += `| Trip name | ${esc(trip.trip?.name)} |\n`;
md += `| Rider | ${esc(trip.trip?.riderName)} (from trip.json) |\n`;
md += `| Bike | ${esc(trip.trip?.bike)} |\n`;
md += `| Home base | ${esc(trip.trip?.homeBase)} |\n`;
md += `| Start date | ${esc(trip.trip?.startDate)} |\n`;
md += `| End date | ${esc(trip.trip?.endDate)} |\n`;
md += `| Timezone (app) | ${esc(trip.meta?.timezone)} |\n`;
md += `| Units | ${esc(trip.meta?.units)} |\n`;
md += `| Currency (metadata) | ${esc(trip.meta?.currency)} |\n\n`;

md += "### Three legs\n\n";
Object.entries(trip.trip?.legs || {}).forEach(([k, v]) => {
  md += `- **Leg ${k}:** ${esc(v)}\n`;
});
md += "\n";

md += "### Regions (chips)\n\n";
(trip.trip?.regionChips || []).forEach((r) => {
  md += `- ${esc(r)}\n`;
});
md += "\n";

md += "### Narrative summary\n\n";
md += (trip.trip?.summary || "") + "\n\n";

md += "### Planning checklist (from trip.json)\n\n";
(trip.trip?.planningChecklist || []).forEach((t) => {
  md += `- ${t}\n`;
});
md += "\n";

md += "---\n\n## 2. Repository & how the app works\n\n";
md += "- **Stack:** Static HTML/CSS/JS (`index.html`, `app.js`, `styles.css`). No React.\n";
md +=
  "- **Data:** JSON files under `data/` are loaded at runtime via `fetch()` — you need a local server (`npm run dev` or any static server).\n";
md +=
  "- **Maps:** `npm run build` runs `scripts/inject-maps-key.js` and writes `google-maps-config.js` from `GOOGLE_MAPS_API_KEY` and optional `GOOGLE_CLIENT_ID` (see `.env.example`). **Weather** uses OpenWeatherMap via `api/weather.js` with `OPENWEATHER_API_KEY` (server-side only). Distances use Google Maps JS when the browser key is set.\n";
md +=
  "- **Product layout:** `docs/TRIP-APP-GUIDE.md` maps the USA Loop plan to this static app; full spec: `docs/USA_Loop_Cursor_Project_Plan.md`.\n";
md += '- **Deploy:** `vercel.json` — build command `npm run build`, output is project root.\n';
md += `- **GPX:** \`${esc(trip.links?.gpxFolder)}\`\n`;
md += `- **Weather link:** \`${esc(trip.links?.weather)}\`\n\n`;

md += "### Data files (edit these to change the trip)\n\n";
md += "| File | Role |\n| --- | --- |\n";
md +=
  "| `data/trip.json` | **Canonical itinerary:** meta, trip overview, **36 days** (title, date, route, lodging, stops, risks, `feesAndPasses`, `babAlternateIds`, etc.) |\n";
md +=
  "| `data/bab-hosts.json` | **Bunk a Biker directory:** full contact + `routeGuidance` per host id |\n";
md +=
  "| `data/route-overlays.json` | Per-day Google Directions URLs, distance notes, optional recommendations |\n";
md += "| `data/content-creation.json` | YouTube / documentary episode briefs per day |\n";
md += "| `data/homework.json` | DR650 mechanics, toolkit, regional risk notes |\n";
md += "| `data/motorcycle-parts-shops.json` | Parts dealers along the corridor (Parts section in UI) |\n";
md += "| `scripts/inject-fees-and-passes.cjs` | Optional: regenerate `feesAndPasses` arrays in trip.json |\n\n";

md += "---\n\n## 3. Daily plan (36 days)\n\n";
md +=
  "Distances are driven by Google when API + overlays are loaded; `distanceKm: 0` in JSON means “use live Maps.” Stays marked **B.a.B.** resolve to `bab-hosts.json` via `babMergeId` or alternate ids.\n\n";

for (const d of trip.days || []) {
  md += `### Day ${d.dayIndex} — ${d.date} — ${esc(d.title)}\n\n`;
  if (d.difficulty) md += `- **Difficulty:** ${esc(d.difficulty)}\n`;
  if (d.routeLine) md += `- **Route line:** ${esc(d.routeLine)}\n`;
  if (d.terrain) md += `- **Terrain:** ${esc(d.terrain)}\n`;
  if (d.fuelNotes) md += `- **Fuel:** ${esc(d.fuelNotes)}\n`;
  if (d.foodNotes) md += `- **Food:** ${esc(d.foodNotes)}\n`;
  if (d.weatherNotes) md += `- **Weather:** ${esc(d.weatherNotes)}\n`;
  const lod = d.lodging;
  if (lod) {
    md += `- **Lodging:** ${esc(lod.heading)} — **${esc(lod.name)}**`;
    if (lod.address) md += ` — ${esc(lod.address)}`;
    else if (lod.notes) md += ` — ${esc(lod.notes)}`;
    md += "\n";
    if (lod.babMergeId) md += `  - \`babMergeId:\` \`${lod.babMergeId}\`\n`;
    if (lod.phone) md += `  - Phone (day card): ${esc(lod.phone)}\n`;
  }
  if (d.lodgingAlternatives?.length) {
    md += `- **Lodging alts:** ${d.lodgingAlternatives.map((x) => esc(x.name)).join("; ")}\n`;
  }
  if (d.highlights?.length) md += `- **Highlights:** ${d.highlights.map(esc).join("; ")}\n`;
  if (d.keyNotes?.length) md += `- **Key notes:** ${d.keyNotes.map(esc).join(" | ")}\n`;
  if (d.stops?.length) {
    md += "- **Stops:**\n";
    d.stops.forEach((s) => {
      md += `  - **${esc(s.label)}** (${esc(s.type || "stop")}): ${esc(s.place)} — ${esc(s.notes)}\n`;
    });
  }
  if (d.risks?.length) md += `- **Risks:** ${d.risks.map(esc).join("; ")}\n`;
  if (d.planB) md += `- **Plan B:** ${esc(d.planB)}\n`;
  if (d.babAlternateIds?.length) {
    md += `- **B.a.B. alternates:** ${d.babAlternateIds.map((x) => "`" + x + "`").join(", ")}\n`;
  }
  if (d.feesAndPasses?.length) {
    md += `- **Fees / passes (${d.feesAndPasses.length} lines):**\n`;
    d.feesAndPasses.forEach((line) => {
      md += `  - ${esc(line)}\n`;
    });
  }
  md += "\n";
}

md += "---\n\n## 4. Bunk a Biker host directory (full index)\n\n";
md +=
  "Canonical JSON: `data/bab-hosts.json`. Each **host id** keys one object. Daily cards reference `babMergeId` and `babAlternateIds`.\n\n";
md += "| Host ID | Name | Address | Phone | Email | Contact prefs | Notes |\n";
md += "| --- | --- | --- | --- | --- | --- | --- |\n";
for (const [id, h] of Object.entries(bab.hosts || {})) {
  md += `| \`${esc(id)}\` | ${esc(h.name)} | ${esc(h.address)} | ${esc(h.phone || "—")} | ${esc(h.email || "—")} | ${esc(h.contact)} | ${esc(h.notes)}${h.infoOnly ? " **(INFO ONLY)**" : ""} |\n`;
}
md += "\n";

md += "### routeGuidance (per host)\n\n";
md +=
  "Each host in JSON also has a multi-line `routeGuidance` string (corridor, distance, Maps caveats). **Open `data/bab-hosts.json` in an editor** for the full text — it is too long to duplicate here line-for-line.\n\n";

md += "---\n\n## 5. Packing, emergency, and prep notes\n\n";
md += "### Checklists (from trip.json)\n\n";
for (const [cat, items] of Object.entries(trip.checklists || {})) {
  md += `**${cat}**\n`;
  (items || []).forEach((i) => {
    md += `- ${i}\n`;
  });
  md += "\n";
}

md += "### Emergency block\n\n";
md += "```json\n";
md += JSON.stringify(trip.emergency, null, 2);
md += "\n```\n\n";

md += "### beforeYouGo (maintenance reminders for the project)\n\n";
(trip.beforeYouGo || []).forEach((t) => {
  md += `- ${t}\n`;
});
md += "\n";
md +=
  "> **Note for AI:** Arches National Park timed-entry rules have changed over time. For 2026 travel, **verify current entry rules on [nps.gov/arch](https://www.nps.gov/arch)** — do not rely only on older checklist lines.\n\n";

md += "---\n\n## 6. Related resources in the repo\n\n";
md += "- **Homework / DR650:** `data/homework.json` — maintenance sequence, forums, regional risks.\n";
md += "- **Parts & dealers:** `data/motorcycle-parts-shops.json` — corridor-organized Suzuki/parts references.\n";
md += "- **Route overlays:** `data/route-overlays.json` — `meta.disclaimer` explains Google distance behavior.\n";
md += "- **Content creation:** `data/content-creation.json` — filming and legal-notes briefs per day.\n\n";

const hostIds = new Set(Object.keys(bab.hosts || {}));
const missing = new Set();
function collectIds(arr) {
  (arr || []).forEach((id) => {
    if (id && !hostIds.has(id)) missing.add(id);
  });
}
for (const d of trip.days || []) {
  if (d.lodging?.babMergeId) collectIds([d.lodging.babMergeId]);
  collectIds(d.babAlternateIds);
}
if (missing.size) {
  md += "---\n\n## 7. Host IDs referenced in trip.json but missing from bab-hosts.json\n\n";
  md +=
    "Fix by adding these keys to `data/bab-hosts.json` or removing the references from the relevant days.\n\n";
  [...missing].sort().forEach((id) => {
    md += `- \`${id}\`\n`;
  });
  md += "\n";
}

md += "---\n\n## 8. How an AI should use this\n\n";
md += "1. **Prefer editing JSON** over hardcoding in `app.js` for itinerary changes.\n";
md += "2. **Keep `babMergeId` / `babAlternateIds`** in sync with real keys in `bab-hosts.json`.\n";
md += "3. **Never invent** host phone numbers; only use values from `bab-hosts.json` or explicit user input.\n";
md += "4. For **fees and park rules**, cite official NPS/land-manager pages for the rider’s date — the app text is advisory.\n";
md += "5. **Day indices** run **1–36** (`dayIndex` in `trip.json`).\n";
md += "6. Regenerate this handbook after major itinerary edits: `node scripts/generate-ai-handbook.cjs`.\n\n";

md +=
  "---\n\n*Generated by `scripts/generate-ai-handbook.cjs` from `data/trip.json` and `data/bab-hosts.json`. Re-run after those files change:*\n\n";
md += "```bash\nnode scripts/generate-ai-handbook.cjs\n```\n";

const out = path.join(root, "docs", "AI-TRIP-HANDBOOK.md");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, md, "utf8");
console.log("Wrote", out, "(" + md.length + " chars)");
