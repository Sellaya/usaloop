/**
 * Merges JSON layer files into data/content-creation.json.
 * Run from repo root: node scripts/apply-documentary-layer.cjs
 *
 * part1–3: Object.assign per day (documentary hooks, fieldGuide, etc.)
 * part5a–c: roadRules, culture (replace), facts (replace if key present), moreFacts (append)
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const target = path.join(root, "data/content-creation.json");
const data = JSON.parse(fs.readFileSync(target, "utf8"));
const dir = path.join(__dirname, "cc-documentary-data");

function mergeDocLayer(layer) {
  if (layer.meta) Object.assign(data.meta, layer.meta);
  const { days } = layer;
  if (!days) return;
  for (const d of data.days) {
    const add = days[String(d.dayIndex)];
    if (!add) continue;
    Object.assign(d, add);
  }
}

function mergeRoadCultureLayer(layer) {
  const { days } = layer;
  if (!days) return;
  for (const d of data.days) {
    const add = days[String(d.dayIndex)];
    if (!add) continue;
    if (add.roadRules) d.roadRules = add.roadRules;
    if (add.culture) d.culture = add.culture;
    if (Array.isArray(add.facts)) d.facts = add.facts;
    if (Array.isArray(add.moreFacts)) {
      d.facts = [...(d.facts || []), ...add.moreFacts];
    }
  }
}

for (const name of ["part1.json", "part2.json", "part3.json"]) {
  mergeDocLayer(JSON.parse(fs.readFileSync(path.join(dir, name), "utf8")));
}

for (const name of ["part5a.json", "part5b.json", "part5c.json"]) {
  const fp = path.join(dir, name);
  if (!fs.existsSync(fp)) continue;
  mergeRoadCultureLayer(JSON.parse(fs.readFileSync(fp, "utf8")));
}

fs.writeFileSync(target, JSON.stringify(data, null, 2) + "\n");
console.log("Merged layers into data/content-creation.json");
