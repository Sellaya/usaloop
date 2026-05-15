/**
 * Vercel / dev-server proxy: OpenWeatherMap → response shape expected by app.js
 * (same fields the old Google Weather adapter used).
 *
 * Query:
 *   - current=1 → current conditions only (normalized object).
 *   - else → { forecastDays[], timeZone } built from the free 5-day / 3-hour forecast
 *     (aggregated by local calendar day at the pin). `days` is capped at 5.
 *
 * Env: OPENWEATHER_API_KEY (https://openweathermap.org/api) — 2.5 Current weather + Forecast.
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

  function readOpenWeatherKey() {
    let k = (process.env.OPENWEATHER_API_KEY || "").trim();
    if ((k.startsWith('"') && k.endsWith('"')) || (k.startsWith("'") && k.endsWith("'"))) {
      k = k.slice(1, -1).trim();
    }
    return k;
  }

  const lat = req.query.lat;
  const lon = req.query.lon;
  const key = readOpenWeatherKey();

  if (lat == null || lon == null || !key) {
    res.status(400).json({
      error:
        "Missing lat, lon, or OPENWEATHER_API_KEY. Add the key to .env (local) or Vercel project env for api/weather.js.",
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

  const OW = "https://api.openweathermap.org/data/2.5";

  function titleCase(s) {
    if (!s) return "";
    return s
      .split(/\s+/)
      .map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : ""))
      .join(" ");
  }

  /** OWM wind is m/s; app expects km/h. */
  function msToKmh(ms) {
    if (ms == null || !Number.isFinite(ms)) return null;
    return ms * 3.6;
  }

  function mapOwmWeatherIdToType(id) {
    const n = Number(id);
    if (n >= 200 && n < 300) return "THUNDERSTORM";
    if (n >= 300 && n < 400) return "DRIZZLE";
    if (n >= 500 && n < 600) return "RAIN";
    if (n >= 600 && n < 700) return "SNOW";
    if (n >= 700 && n < 800) return "ATMOSPHERE";
    if (n === 800) return "CLEAR";
    if (n > 800) return "CLOUDS";
    return "UNKNOWN";
  }

  /** Local calendar key YYYY-MM-DD using OWM "shift in seconds from UTC". */
  function localDateKey(unixSec, tzShiftSec) {
    const ms = (Number(unixSec) + Number(tzShiftSec || 0)) * 1000;
    const d = new Date(ms);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function parseKeyToDisplayDate(key) {
    const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(key);
    if (!m) return { year: 0, month: 1, day: 1 };
    return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
  }

  function normalizeCurrent(j, tzShiftSec) {
    const w0 = j.weather?.[0];
    const id = w0?.id;
    const visM = j.visibility;
    const visKm = visM != null && Number.isFinite(visM) ? visM / 1000 : null;
    const dt = j.dt;
    const sr = j.sys?.sunrise;
    const ss = j.sys?.sunset;
    const isDay =
      dt != null && sr != null && ss != null ? dt > sr && dt < ss : true;
    const thunder = id >= 200 && id < 300;

    return {
      currentTime: dt ? new Date(dt * 1000).toISOString() : new Date().toISOString(),
      timeZone: { id: j.name ? String(j.name) : "" },
      temperature: { degrees: j.main?.temp },
      feelsLikeTemperature: { degrees: j.main?.feels_like },
      relativeHumidity: j.main?.humidity,
      weatherCondition: {
        type: mapOwmWeatherIdToType(id),
        description: { text: titleCase(w0?.description || "") },
      },
      wind: {
        speed: { value: msToKmh(j.wind?.speed) },
        gust: { value: msToKmh(j.wind?.gust) },
      },
      precipitation: {
        probability: { percent: j.pop != null ? Math.round(Number(j.pop) * 100) : 0 },
      },
      thunderstormProbability: thunder ? 45 : null,
      isDaytime: isDay,
      uvIndex: null,
      visibility: visKm != null ? { distance: visKm, unit: "KILOMETERS" } : null,
      /** Echo offset so the client could debug; not part of Google schema. */
      _owmTimezoneShiftSec: tzShiftSec,
    };
  }

  async function fetchJson(url) {
    const r = await fetch(url);
    const data = await r.json().catch(() => ({}));
    return { ok: r.ok, status: r.status, data };
  }

  function sendOwmHttpError(status, data) {
    const hint401 =
      status === 401
        ? " Create a Default API key at https://home.openweathermap.org/api_keys (Free plan → Current weather + 5 day / 3 hour forecast). Activation can take up to ~2 hours."
        : "";
    res.status(status >= 400 ? status : 502).json({
      ...(typeof data === "object" && data ? data : {}),
      message: (typeof data === "object" && data?.message) || "OpenWeather request failed",
      hint: hint401 || undefined,
    });
  }

  if (req.query.current === "1") {
    try {
      const u = new URL(`${OW}/weather`);
      u.searchParams.set("lat", String(latN));
      u.searchParams.set("lon", String(lonN));
      u.searchParams.set("units", "metric");
      u.searchParams.set("appid", key);
      const { ok, status, data } = await fetchJson(u.toString());
      if (!ok) {
        sendOwmHttpError(status, data);
        return;
      }
      if (data.cod != null && Number(data.cod) === 401) {
        sendOwmHttpError(401, data);
        return;
      }
      if (data.cod != null && Number(data.cod) !== 200) {
        res.status(502).json({ error: "OpenWeather error", message: data.message || JSON.stringify(data) });
        return;
      }
      const tz = Number(data.timezone) || 0;
      res.status(200).json(normalizeCurrent(data, tz));
    } catch (e) {
      res.status(502).json({ error: "Weather upstream failed", message: String(e?.message || e) });
    }
    return;
  }

  const requested = Math.min(5, Math.max(1, parseInt(req.query.days, 10) || 5));

  try {
    const curU = new URL(`${OW}/weather`);
    curU.searchParams.set("lat", String(latN));
    curU.searchParams.set("lon", String(lonN));
    curU.searchParams.set("units", "metric");
    curU.searchParams.set("appid", key);

    const fcU = new URL(`${OW}/forecast`);
    fcU.searchParams.set("lat", String(latN));
    fcU.searchParams.set("lon", String(lonN));
    fcU.searchParams.set("units", "metric");
    fcU.searchParams.set("appid", key);

    const [curR, fcR] = await Promise.all([fetchJson(curU.toString()), fetchJson(fcU.toString())]);

    if (!curR.ok) {
      sendOwmHttpError(curR.status, curR.data);
      return;
    }
    if (curR.data.cod != null && Number(curR.data.cod) === 401) {
      sendOwmHttpError(401, curR.data);
      return;
    }
    if (curR.data.cod != null && Number(curR.data.cod) !== 200) {
      res.status(502).json({ error: "OpenWeather error", message: curR.data.message || JSON.stringify(curR.data) });
      return;
    }

    const tzShiftSec = Number(curR.data.timezone) || 0;
    const cityName = curR.data.name || "";

    if (!fcR.ok) {
      sendOwmHttpError(fcR.status, fcR.data);
      return;
    }
    if (String(fcR.data.cod) !== "200" && Number(fcR.data.cod) !== 200) {
      if (Number(fcR.data.cod) === 401) {
        sendOwmHttpError(401, fcR.data);
        return;
      }
      res.status(502).json({ error: "OpenWeather forecast error", message: fcR.data.message || JSON.stringify(fcR.data) });
      return;
    }

    const list = fcR.data.list || [];
    const buckets = new Map();

    for (const item of list) {
      const key = localDateKey(item.dt, tzShiftSec);
      if (!key) continue;
      let b = buckets.get(key);
      if (!b) {
        b = {
          temps: [],
          pops: [],
          gusts: [],
          speeds: [],
          ids: [],
          descs: [],
          hasThunder: false,
        };
        buckets.set(key, b);
      }
      const tmin = item.main?.temp_min ?? item.main?.temp;
      const tmax = item.main?.temp_max ?? item.main?.temp;
      if (tmin != null) b.temps.push(tmin);
      if (tmax != null) b.temps.push(tmax);
      if (item.pop != null) b.pops.push(Number(item.pop));
      if (item.wind?.gust != null) b.gusts.push(Number(item.wind.gust));
      if (item.wind?.speed != null) b.speeds.push(Number(item.wind.speed));
      const wid = item.weather?.[0]?.id;
      if (wid != null) {
        b.ids.push(wid);
        if (wid >= 200 && wid < 300) b.hasThunder = true;
        b.descs.push(item.weather[0]?.description || "");
      }
    }

    const sortedKeys = [...buckets.keys()].sort();
    const forecastDays = sortedKeys.slice(0, requested).map((key) => {
      const b = buckets.get(key);
      const lo = Math.min(...b.temps);
      const hi = Math.max(...b.temps);
      const maxPop = b.pops.length ? Math.max(...b.pops) : 0;
      const maxGust = b.gusts.length ? Math.max(...b.gusts) : null;
      const maxSpeed = b.speeds.length ? Math.max(...b.speeds) : null;

      const idCounts = new Map();
      for (const id of b.ids) idCounts.set(id, (idCounts.get(id) || 0) + 1);
      let domId = b.ids[0] || 800;
      let bestC = 0;
      for (const [id, c] of idCounts) {
        if (c > bestC) {
          bestC = c;
          domId = id;
        }
      }
      const domIdx = b.ids.indexOf(domId);
      const domDesc = domIdx >= 0 ? b.descs[domIdx] : "";

      const rainPct = Math.min(100, Math.round(maxPop * 100));
      const tsPct = b.hasThunder ? Math.max(35, rainPct) : Math.min(rainPct, 20);

      const daytimeForecast = {
        weatherCondition: {
          type: mapOwmWeatherIdToType(domId),
          description: { text: titleCase(domDesc) },
        },
        precipitation: { probability: { percent: rainPct } },
        thunderstormProbability: b.hasThunder ? tsPct : rainPct >= 55 ? 22 : 0,
        wind: {
          speed: { value: msToKmh(maxSpeed) },
          gust: { value: maxGust != null ? msToKmh(maxGust) : null },
        },
      };

      const dd = parseKeyToDisplayDate(key);
      return {
        displayDate: dd,
        minTemperature: { degrees: lo },
        maxTemperature: { degrees: hi },
        daytimeForecast,
        nighttimeForecast: null,
      };
    });

    res.status(200).json({
      forecastDays,
      timeZone: { id: cityName || `UTC${tzShiftSec >= 0 ? "+" : ""}${tzShiftSec / 3600}` },
    });
  } catch (e) {
    res.status(502).json({ error: "Weather upstream failed", message: String(e?.message || e) });
  }
};
