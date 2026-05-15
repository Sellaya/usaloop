/**
 * Vercel serverless proxy for Google Maps Platform Weather API.
 * Server-side key: GOOGLE_MAPS_SERVER_KEY if set, else GOOGLE_MAPS_API_KEY.
 * (HTTP-referrer–restricted browser keys often fail from Node; use a second key with no referrer restriction + API restrictions, or one unrestricted key.)
 *
 * Query:
 *   - current=1 → currentConditions:lookup (live conditions at lat/lon)
 *   - else → forecast days:lookup (days query, default 1, max 10; merges pages via nextPageToken)
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
  const days = req.query.days || "1";
  const key = (process.env.GOOGLE_MAPS_SERVER_KEY || process.env.GOOGLE_MAPS_API_KEY || "").trim();

  if (lat == null || lon == null || !key) {
    res.status(400).json({
      error:
        "Missing lat, lon, or server weather key. Set GOOGLE_MAPS_SERVER_KEY (recommended) or GOOGLE_MAPS_API_KEY for Vercel / local dev.",
    });
    return;
  }

  const latN = Number(lat);
  const lonN = Number(lon);
  if (
    !Number.isFinite(latN) ||
    !Number.isFinite(lonN) ||
    latN < -90 ||
    latN > 90 ||
    lonN < -180 ||
    lonN > 180
  ) {
    res.status(400).json({ error: "Invalid lat or lon (expected WGS84 numbers in range)" });
    return;
  }

  /** Google sometimes returns { error: { code, message, status } } with HTTP 200. */
  function isGoogleApiErrorBody(data) {
    return Boolean(data && typeof data === "object" && data.error != null);
  }

  if (req.query.current === "1") {
    try {
      const u = new URL("https://weather.googleapis.com/v1/currentConditions:lookup");
      u.searchParams.set("key", key);
      u.searchParams.set("location.latitude", String(latN));
      u.searchParams.set("location.longitude", String(lonN));
      const r = await fetch(u.toString());
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        res.status(r.status).json(data);
        return;
      }
      if (isGoogleApiErrorBody(data)) {
        res.status(502).json(data);
        return;
      }
      res.status(200).json(data);
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
      u.searchParams.set("location.latitude", String(latN));
      u.searchParams.set("location.longitude", String(lonN));
      u.searchParams.set("days", String(nDays));
      u.searchParams.set("pageSize", "10");
      if (pageToken) u.searchParams.set("pageToken", pageToken);

      const r = await fetch(u.toString());
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        res.status(r.status).json(data);
        return;
      }
      if (isGoogleApiErrorBody(data)) {
        res.status(502).json(data);
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
