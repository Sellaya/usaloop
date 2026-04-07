/**
 * Merges JSON layer files into data/content-creation.json.
 * Run from repo root: node scripts/apply-documentary-layer.cjs
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const target = path.join(root, "data/content-creation.json");
const data = JSON.parse(fs.readFileSync(target, "utf8"));

const dir = path.join(__dirname, "cc-documentary-data");
for (const name of ["part1.json", "part2.json", "part3.json"]) {
  const layer = JSON.parse(fs.readFileSync(path.join(dir, name), "utf8"));
  if (layer.meta) Object.assign(data.meta, layer.meta);
  const { days } = layer;
  if (!days) continue;
  for (const d of data.days) {
    const add = days[String(d.dayIndex)];
    if (!add) continue;
    Object.assign(d, add);
  }
}

fs.writeFileSync(target, JSON.stringify(data, null, 2) + "\n");
console.log("Merged documentary layer into data/content-creation.json");
