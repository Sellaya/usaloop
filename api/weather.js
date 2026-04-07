/**
 * Vercel serverless proxy for Google Maps Platform Weather API.
 * Uses the same GOOGLE_MAPS_API_KEY as Maps JavaScript + Directions (one key in .env / Vercel).
 *
 * Query:
 *   - current=1 → currentConditions:lookup (live conditions at lat/lon)
 *   - else → forecast days:lookup (merges pages; default pageSize is 5 upstream)
 *
 * @see https://developers.google.com/maps/documentation/weather/current-conditions
 * @see https://developers.google.com/maps/documentation/weather/daily-forecast
 */
module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const lat = req.query.lat;
  const lon = req.query.lon;
  const days = req.query.days || "10";
  const key = process.env.GOOGLE_MAPS_API_KEY;

  if (lat == null || lon == null || !key) {
    res.status(400).json({ error: "Missing lat, lon, or server GOOGLE_MAPS_API_KEY" });
    return;
  }

  if (req.query.current === "1") {
    try {
      const u = new URL("https://weather.googleapis.com/v1/currentConditions:lookup");
      u.searchParams.set("key", key);
      u.searchParams.set("location.latitude", String(lat));
      u.searchParams.set("location.longitude", String(lon));
      const r = await fetch(u.toString());
      const data = await r.json().catch(() => ({}));
      res.status(r.ok ? 200 : r.status).json(data);
    } catch (e) {
      res.status(502).json({ error: "Weather upstream failed", message: String(e?.message || e) });
    }
    return;
  }

  const nDays = Math.min(10, Math.max(1, parseInt(days, 10) || 10));

  function displayDateKey(fd) {
    const d = fd?.displayDate;
    if (!d) return "";
    return `${d.year}-${d.month}-${d.day}`;
  }

  try {
    const mergedDays = [];
    const seen = new Set();
    let timeZone = null;
    let pageToken = null;

    do {
      const u = new URL("https://weather.googleapis.com/v1/forecast/days:lookup");
      u.searchParams.set("key", key);
      u.searchParams.set("location.latitude", String(lat));
      u.searchParams.set("location.longitude", String(lon));
      u.searchParams.set("days", String(nDays));
      u.searchParams.set("pageSize", "10");
      if (pageToken) u.searchParams.set("pageToken", pageToken);

      const r = await fetch(u.toString());
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        res.status(r.status).json(data);
        return;
      }
      if (data.timeZone && !timeZone) timeZone = data.timeZone;
      for (const fd of data.forecastDays || []) {
        const k = displayDateKey(fd);
        if (!k || seen.has(k)) continue;
        seen.add(k);
        mergedDays.push(fd);
      }
      pageToken = data.nextPageToken || null;
      if (mergedDays.length >= nDays) pageToken = null;
    } while (pageToken);

    res.status(200).json({
      forecastDays: mergedDays,
      timeZone: timeZone || {},
    });
  } catch (e) {
    res.status(502).json({ error: "Weather upstream failed", message: String(e?.message || e) });
  }
};
