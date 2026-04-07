#!/usr/bin/env node
/**
 * Build gpx/toronto-southwest-loop-2026.gpx from data/trip.json.
 * Uses GPS pins from trip.json where present; otherwise approximate centroids
 * (verify in your nav app — not turn-by-turn).
 *
 * Run: node scripts/build-trip-gpx.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const tripPath = path.join(root, "data", "trip.json");
const outPath = path.join(root, "gpx", "toronto-southwest-loop-2026.gpx");

const reMapsQ = /[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/;

/** Centroids / city centers — verify against your final bookings. */
const STATIC = {
  1: [42.5962, -75.9182, "McGraw, NY (Finger Lakes host area)"],
  2: [40.8843, -72.3895, "Southampton, NY"],
  3: [38.6651, -78.4594, "Luray, VA"],
  4: [37.0479, -80.7798, "Pulaski, VA"],
  5: [35.8681, -83.5618, "Sevierville, TN"],
  6: [35.7679, -88.7896, "Beech Bluff / Jackson, TN area"],
  7: [34.8662, -92.1101, "Jacksonville, AR"],
  8: [32.7555, -97.3308, "Fort Worth, TX"],
  9: [35.2742, -102.6682, "Adrian, TX (Route 66)"],
  10: [35.192, -101.831, "Amarillo, TX (I-40 corridor)"],
  11: [37.82022, -107.71362, "Silverton / San Juan NF dispersed (iOverlander pin)"],
  12: [37.1631, -109.8859, "Mexican Hat, UT (campground area)"],
  13: [37.65553, -112.17089, "Dispersed near Bryce (trip GPS)"],
  14: [38.5733, -109.5498, "Moab, UT (town — confirm host)"],
  15: [38.5733, -109.5498, "Moab, UT (rest day — same base)"],
  16: [37.12891, -113.66331, "St. George area BLM (Cove Wash pin)"],
  17: [34.5008, -117.1859, "Apple Valley, CA"],
  18: [36.204, -121.82, "Prewitt Ridge / Big Sur area (approximate — confirm road open)"],
  19: [35.87322, -121.4185, "Mendocino coast dispersed (trip GPS)"],
  20: [38.9817, -123.70057, "Redwood area camp (trip GPS)"],
  21: [43.7584, -122.5001, "Westfir, OR"],
  22: [45.8207, -120.8215, "Goldendale, WA"],
  23: [47.4957, -121.7868, "North Bend, WA"],
  24: [48.4779, -120.1866, "Winthrop, WA (North Cascades hub — TBD booking)"],
  25: [47.6733, -117.2394, "Spokane Valley, WA"],
  26: [46.997, -114.248, "Frenchtown, MT"],
  27: [45.329, -111.195, "Gallatin Gateway, MT"],
  28: [44.4605, -110.8281, "Yellowstone (Old Faithful area — in-park day)"],
  29: [44.8792, -108.4678, "Cowley, WY (town center)"],
  30: [44.2911, -105.5022, "Gillette, WY"],
  31: [43.7667, -103.5988, "Custer, SD (Black Hills — TBD camp)"],
  32: [44.0328, -92.6458, "Byron, MN"],
  33: [43.1114, -88.4993, "Oconomowoc, WI"],
  34: [42.9849, -81.2453, "London, ON"],
  35: [43.6532, -79.3832, "Toronto, ON"],
};

function coordsFromMapsUrl(url) {
  if (!url || typeof url !== "string") return null;
  const m = url.match(reMapsQ);
  if (!m) return null;
  return { lat: parseFloat(m[1]), lon: parseFloat(m[2]) };
}

function coordsFromLodgingTree(lodging, alts) {
  const c = coordsFromMapsUrl(lodging?.mapsUrl);
  if (c) return c;
  for (const a of alts || []) {
    const c2 = coordsFromMapsUrl(a?.mapsUrl);
    if (c2) return c2;
  }
  return null;
}

/**
 * Use embedded pins only when they match the overnight intent (not a day-only stop list).
 * Moab nights 14–15: prefer town center over camp alt. Day 10: motel, not iOverlander stop.
 */
function coordsForDay(day) {
  const idx = day.dayIndex;
  const lodging = day.lodging;
  const alts = day.lodgingAlternatives;

  if (idx === 14 || idx === 15) {
    return { lat: STATIC[idx][0], lon: STATIC[idx][1], source: STATIC[idx][2] };
  }
  if (idx === 10) {
    return { lat: STATIC[10][0], lon: STATIC[10][1], source: STATIC[10][2] };
  }

  const fromTree = coordsFromLodgingTree(lodging, alts);
  if (fromTree) {
    return { lat: fromTree.lat, lon: fromTree.lon, source: "trip.json lodging / alt mapsUrl (GPS pin)" };
  }

  const s = STATIC[idx];
  if (!s) throw new Error(`Missing STATIC for day ${idx}`);
  return { lat: s[0], lon: s[1], source: `${s[2]} (approximate)` };
}

function escapeXml(s) {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function isoDate(d) {
  return `${d}T12:00:00Z`;
}

function main() {
  const trip = JSON.parse(fs.readFileSync(tripPath, "utf8"));
  const days = trip.days || [];
  const metaTitle = trip.meta?.title || "Motorcycle trip";
  const points = [];

  for (const day of days) {
    const { lat, lon, source } = coordsForDay(day);
    const lodging = day.lodging;
    const wptName = `Day ${day.dayIndex}: ${day.title}`;
    const descParts = [
      `Date: ${day.date}`,
      lodging?.name ? `Stay: ${lodging.name}` : "",
      lodging?.address ? `Address: ${lodging.address}` : "",
      `Waypoint note: ${source}`,
    ].filter(Boolean);

    points.push({
      dayIndex: day.dayIndex,
      date: day.date,
      lat,
      lon,
      name: wptName,
      desc: descParts.join("\n"),
    });
  }

  const wptXml = points
    .map(
      (p) => `  <wpt lat="${p.lat}" lon="${p.lon}">
    <name>${escapeXml(p.name)}</name>
    <desc>${escapeXml(p.desc)}</desc>
    <type>overnight</type>
    <time>${isoDate(p.date)}</time>
  </wpt>`
    )
    .join("\n");

  const rteptXml = points
    .map(
      (p) => `    <rtept lat="${p.lat}" lon="${p.lon}">
      <name>${escapeXml(`D${p.dayIndex}`)}</name>
      <desc>${escapeXml(p.name)}</desc>
    </rtept>`
    )
    .join("\n");

  const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="moto-trip-itinerary (build-trip-gpx.mjs)"
  xmlns="http://www.topografix.com/GPX/1/1"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>${escapeXml(metaTitle)}</name>
    <desc>35 overnight waypoints from trip.json. Straight-line route is NOT the riding route — import into Garmin, Gaia, or Google Earth and plan roads separately.</desc>
    <time>${new Date().toISOString()}</time>
  </metadata>
${wptXml}
  <rte>
    <name>${escapeXml(metaTitle)}</name>
    <desc>Ordered overnight stops only.</desc>
${rteptXml}
  </rte>
</gpx>
`;

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, gpx, "utf8");
  console.log(`Wrote ${outPath} (${points.length} waypoints)`);
}

main();
