#!/usr/bin/env node
/**
 * Fix GPX <wpt> Date: lines and <time> from data/trip.json (by "Day N:" in <name>).
 * Run after date changes or a bad partial shift. Does not change lat/lon.
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const trip = JSON.parse(fs.readFileSync(path.join(root, "data", "trip.json"), "utf8"));
const byIndex = {};
for (const d of trip.days || []) {
  byIndex[d.dayIndex] = d.date;
}

const gpxPath = path.join(root, "gpx", "toronto-southwest-loop-2026.gpx");
let gpx = fs.readFileSync(gpxPath, "utf8");

const wptRe = /<wpt[^>]*>[\s\S]*?<\/wpt>/g;
gpx = gpx.replace(wptRe, (block) => {
  const nameM = block.match(/<name>\s*Day\s+(\d+):/);
  if (!nameM) return block;
  const idx = parseInt(nameM[1], 10);
  const date = byIndex[idx];
  if (!date) return block;
  let next = block;
  next = next.replace(/Date:\s*\d{4}-\d{2}-\d{2}/, `Date: ${date}`);
  next = next.replace(/<time>\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z<\/time>/, `<time>${date}T12:00:00Z</time>`);
  return next;
});

fs.writeFileSync(gpxPath, gpx);
console.log("Synced GPX dates from trip.json for", Object.keys(byIndex).length, "days");
