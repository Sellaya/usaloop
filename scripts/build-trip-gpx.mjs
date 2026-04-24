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
  1: [42.2017, -76.7921, "Horseheads, NY (34 W Sullivanville Rd area — verify pin)"],
  2: [40.8843, -72.3895, "Southampton, NY"],
  3: [38.6651, -78.4594, "Luray, VA"],
  4: [37.229, -79.811, "Hardy, VA (359 Shortridge Ln area — verify pin)"],
  5: [36.5951, -82.1887, "Bristol VA/TN (approximate)"],
  6: [35.8809, -84.1316, "Kingston, TN (approximate)"],
  7: [35.6773, -88.0337, "Parsons, TN (approximate)"],
  8: [34.8662, -92.1101, "Jacksonville, AR"],
  9: [32.7555, -97.3308, "Fort Worth, TX"],
  10: [35.2742, -102.6682, "Adrian, TX (Route 66)"],
  11: [35.192, -101.831, "Amarillo, TX (I-40 corridor)"],
  12: [37.82022, -107.71362, "Silverton / San Juan NF dispersed (iOverlander pin)"],
  13: [37.1631, -109.8859, "Mexican Hat, UT (campground area)"],
  14: [37.65553, -112.17089, "Dispersed near Bryce (trip GPS)"],
  15: [38.5733, -109.5498, "Moab, UT (town — confirm host)"],
  16: [38.5733, -109.5498, "Moab, UT (rest day — same base)"],
  17: [37.12891, -113.66331, "St. George area BLM (Cove Wash pin)"],
  18: [34.5008, -117.1859, "Apple Valley, CA"],
  19: [36.204, -121.82, "Prewitt Ridge / Big Sur area (approximate — confirm road open)"],
  20: [35.87322, -121.4185, "Mendocino coast dispersed (trip GPS)"],
  21: [38.9817, -123.70057, "Redwood area camp (trip GPS)"],
  22: [43.7584, -122.5001, "Westfir, OR"],
  23: [45.8207, -120.8215, "Goldendale, WA"],
  24: [47.4957, -121.7868, "North Bend, WA"],
  25: [48.4779, -120.1866, "Winthrop, WA (North Cascades hub — TBD booking)"],
  26: [47.6733, -117.2394, "Spokane Valley, WA"],
  27: [46.997, -114.248, "Frenchtown, MT"],
  28: [45.329, -111.195, "Gallatin Gateway, MT"],
  29: [44.4605, -110.8281, "Yellowstone (Old Faithful area — in-park day)"],
  30: [44.7589, -108.7573, "Powell, WY (town center)"],
  31: [44.2911, -105.5022, "Gillette, WY"],
  32: [43.7667, -103.5988, "Custer, SD (Black Hills — TBD camp)"],
  33: [44.0328, -92.6458, "Byron, MN"],
  34: [43.1114, -88.4993, "Oconomowoc, WI"],
  35: [42.9849, -81.2453, "London, ON (approximate)"],
  36: [43.6532, -79.3832, "Toronto, ON"],
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

  if (idx === 15 || idx === 16) {
    return { lat: STATIC[idx][0], lon: STATIC[idx][1], source: STATIC[idx][2] };
  }
  if (idx === 10) {
    return { lat: STATIC[10][0], lon: STATIC[10][1], source: STATIC[10][2] };
  }
  // B.a.B. primary + NF backup alt with a pin — prefer host centroid over alt mapsUrl.
  if (idx === 4 && lodging?.babMergeId === "vicky-cawley") {
    return { lat: STATIC[4][0], lon: STATIC[4][1], source: STATIC[4][2] };
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
    <desc>36 overnight waypoints from trip.json. Straight-line route is NOT the riding route — import into Garmin, Gaia, or Google Earth and plan roads separately.</desc>
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
