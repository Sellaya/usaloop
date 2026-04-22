#!/usr/bin/env node
/**
 * Shift GPX waypoint <time> and desc "Date: YYYY-MM-DD" in the trip window
 * Shifts YYYY-MM-DD inside [t0..t1] by deltaDays (inclusive, noon UTC anchors).
 * Default window matches this repo’s 2026 loop (2026-05-20 .. 2026-06-24) — edit t0/t1 if your anchor dates change.
 * Usage: node scripts/shift-gpx-trip-dates.cjs [deltaDays]
 * Example: node scripts/shift-gpx-trip-dates.cjs -7
 */
const fs = require("fs");
const path = require("path");

const delta = Number(process.argv[2] || -12);
const gpxPath = path.join(__dirname, "..", "gpx", "toronto-southwest-loop-2026.gpx");
const t0 = new Date("2026-05-20T12:00:00Z");
const t1 = new Date("2026-06-24T12:00:00Z");

function shiftDateStr(y, mo, d) {
  const dt = new Date(`${y}-${mo}-${d}T12:00:00Z`);
  if (dt < t0 || dt > t1) return null;
  dt.setUTCDate(dt.getUTCDate() + delta);
  return dt.toISOString().slice(0, 10);
}

let text = fs.readFileSync(gpxPath, "utf8");
// Dates followed by "T" (GPX timestamps) have no \b between day and "T" — use lookahead.
text = text.replace(/(\d{4})-(\d{2})-(\d{2})(?=T)/g, (m, y, mo, d) => {
  const n = shiftDateStr(y, mo, d);
  return n || m;
});
// Standalone YYYY-MM-DD in prose (e.g. "Date: 2026-05-20" newline) — word boundaries work.
text = text.replace(/\b(\d{4})-(\d{2})-(\d{2})\b/g, (m, y, mo, d) => {
  const n = shiftDateStr(y, mo, d);
  return n || m;
});
fs.writeFileSync(gpxPath, text);
console.log("Updated", gpxPath, "delta", delta);
