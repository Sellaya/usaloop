const TYPE_LABEL = {
  fuel: "Fuel",
  coffee: "Coffee",
  food: "Food",
  sight: "Sight",
  camp: "Camp",
  motel: "Motel",
  other: "Stop",
};

/** @type {{ units: string }} */
let tripDisplayMeta = { units: "metric" };

const KM_PER_MI = 1.609344;

/** Google Weather API: only fetch this many daily forecast rows per location (plus current conditions). */
const WEATHER_FORECAST_DAY_COUNT = 1;

function setTripDisplayMeta(meta) {
  tripDisplayMeta = { units: meta?.units === "imperial" ? "imperial" : "metric" };
}

function formatIntLocale(n) {
  if (n == null || Number.isNaN(n)) return "";
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(Math.round(n));
}

/** Driving km from Google → locale-formatted km + mi (trip meta.units picks primary). Km shown to 0.1. */
function formatDistanceKmMi(km) {
  if (km == null || Number.isNaN(km)) return null;
  const kmNum = Math.round(km * 10) / 10;
  const miR = Math.round(kmNum / KM_PER_MI);
  const kmText = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(kmNum);
  const miText = formatIntLocale(miR);
  const metricFirst = tripDisplayMeta.units !== "imperial";
  return {
    kmRounded: kmNum,
    miRounded: miR,
    kmText,
    miText,
    primaryLine: metricFirst ? `${kmText} km (${miText} mi)` : `${miText} mi (${kmText} km)`,
    shortLine: metricFirst ? `${kmText} km` : `${miText} mi`,
  };
}

const CONTACT_HINTS = {
  email: "Contact: email works well.",
  text: "Contact: text/SMS preferred.",
  call: "Contact: phone call OK.",
  email_or_text: "Contact: email or text.",
  email_or_call: "Contact: email or call.",
  email_or_phone: "Contact: email or phone.",
  email_then_text: "Contact: email first (check spam); text if no reply.",
  call_or_text: "Contact: call or text — faster than email.",
  text_or_email: "Contact: text or email.",
  text_whatsapp: "Contact: text or WhatsApp.",
};

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === "class") node.className = v;
    else if (k === "text") node.textContent = v;
    else if (k.startsWith("data-") || k.startsWith("aria-")) node.setAttribute(k, v);
    else if (["href", "target", "rel", "title", "type"].includes(k)) node.setAttribute(k, v);
    else node[k] = v;
  });
  children.forEach((c) => {
    if (c != null) node.appendChild(c);
  });
  return node;
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatDateLong(iso) {
  if (!iso) return "dates TBD";
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function todayIsoLocal() {
  const n = new Date();
  const y = n.getFullYear();
  const m = String(n.getMonth() + 1).padStart(2, "0");
  const d = String(n.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function inferLeg(dayIndex) {
  if (dayIndex <= 8) return "1";
  if (dayIndex <= 23) return "2";
  return "3";
}

function hasGoogleMapsApiKey() {
  const k = window.__GOOGLE_MAPS_API_KEY__;
  return Boolean(k && String(k).trim());
}

/** Decode origin/destination the same way Google’s share URLs intend (handles %2C etc.). */
function decodeMapsDirectionsParam(raw) {
  if (raw == null) return "";
  const s = String(raw).replace(/\+/g, " ");
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

/** Waypoints from Maps `waypoints=` (pipe-separated; strips optional `via:` prefixes). */
function parseWaypointsFromMapsParam(raw) {
  if (raw == null || !String(raw).trim()) return [];
  return String(raw)
    .split("|")
    .map((w) => {
      let s = w.trim();
      if (!s) return null;
      if (/^via:/i.test(s)) s = s.replace(/^via:/i, "").trim();
      return s ? { location: decodeMapsDirectionsParam(s), stopover: true } : null;
    })
    .filter(Boolean);
}

/**
 * Path-style URLs: /maps/dir/Origin/Destination/ or /maps/dir/A/B/C/D with middle segments as waypoints.
 */
function parsePathStyleMapsDir(pathname) {
  const parts = pathname.split("/").filter(Boolean);
  const dirIdx = parts.indexOf("dir");
  if (dirIdx < 0) return null;
  const segs = parts.slice(dirIdx + 1);
  if (segs.length < 2) return null;
  const decoded = segs.map((s) => decodeMapsDirectionsParam(s));
  const origin = decoded[0];
  const destination = decoded[decoded.length - 1];
  const waypoints = decoded.slice(1, -1).map((location) => ({ location, stopover: true }));
  return { origin, destination, waypoints };
}

/** Parse google.com/maps/dir URL for DirectionsService (query or path form; includes waypoints). */
function parseGoogleMapsDirectionsUrl(href) {
  try {
    const u = new URL(href);
    const hostOk =
      u.hostname === "www.google.com" ||
      u.hostname === "google.com" ||
      u.hostname === "maps.google.com" ||
      u.hostname.endsWith(".google.com");
    if (!hostOk || !u.pathname.includes("/maps/dir")) return null;

    const tm = (u.searchParams.get("travelmode") || "driving").toUpperCase();
    let origin = u.searchParams.get("origin")?.trim();
    let destination = u.searchParams.get("destination")?.trim();
    let waypoints = parseWaypointsFromMapsParam(u.searchParams.get("waypoints"));

    if (origin && destination) {
      return {
        origin: decodeMapsDirectionsParam(origin),
        destination: decodeMapsDirectionsParam(destination),
        waypoints,
        travelModeKey: tm,
      };
    }

    const pathParsed = parsePathStyleMapsDir(u.pathname);
    if (!pathParsed) return null;
    return {
      origin: pathParsed.origin,
      destination: pathParsed.destination,
      waypoints: pathParsed.waypoints?.length ? pathParsed.waypoints : waypoints,
      travelModeKey: tm,
    };
  } catch {
    return null;
  }
}

/** Directions request: metric, browser language — no fixed region bias (avoids mismatches vs Maps web). */
function buildDirectionsRequest(parsed, travelMode) {
  const U = window.google.maps.UnitSystem;
  const lang = (navigator.language || "en").replace(/_/g, "-");
  const req = {
    origin: parsed.origin,
    destination: parsed.destination,
    travelMode,
    unitSystem: U.METRIC,
    language: lang,
  };
  if (parsed.waypoints?.length) {
    req.waypoints = parsed.waypoints;
  }
  return req;
}

function formatCombinedDurationSeconds(totalSec) {
  if (totalSec == null || totalSec <= 0) return "";
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  if (h >= 48) {
    const d = Math.floor(h / 24);
    const rh = h % 24;
    return `${d} d ${rh} h ${m} min`;
  }
  if (h > 0) return `${h} h ${m} min`;
  return `${m} min`;
}

const DIRECTIONS_CALL_TIMEOUT_MS = 20000;

function latLngFromEnd(end) {
  if (!end) return { endLat: null, endLng: null };
  const lat = typeof end.lat === "function" ? end.lat() : end.lat;
  const lng = typeof end.lng === "function" ? end.lng() : end.lng;
  const endLat = typeof lat === "number" && Number.isFinite(lat) ? lat : null;
  const endLng = typeof lng === "number" && Number.isFinite(lng) ? lng : null;
  return { endLat, endLng };
}

function directionsRouteOnce(svc, request) {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error("TIMEOUT"));
    }, DIRECTIONS_CALL_TIMEOUT_MS);
    svc.route(request, (result, status) => {
      window.clearTimeout(timer);
      const legs = result?.routes?.[0]?.legs;
      if (status !== "OK" || !legs?.length) {
        reject(new Error(status));
        return;
      }
      let meters = 0;
      let durationSeconds = 0;
      for (const leg of legs) {
        if (leg.distance?.value != null) meters += leg.distance.value;
        if (leg.duration?.value != null) durationSeconds += leg.duration.value;
      }
      const lastLeg = legs[legs.length - 1];
      if (lastLeg?.distance?.value == null) {
        reject(new Error(status));
        return;
      }
      const { endLat, endLng } = latLngFromEnd(lastLeg.end_location);
      resolve({
        meters,
        durationText: formatCombinedDurationSeconds(durationSeconds),
        durationSeconds,
        endLat,
        endLng,
      });
    });
  });
}

async function directionsRouteWithRetry(svc, request) {
  const retryable = new Set(["OVER_QUERY_LIMIT", "UNKNOWN_ERROR"]);
  let lastErr;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await directionsRouteOnce(svc, request);
    } catch (e) {
      lastErr = e;
      const code = e?.message || "";
      if (retryable.has(code) && attempt < 2) {
        await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
        continue;
      }
      throw e;
    }
  }
  throw lastErr;
}

function formatTotalDriveDuration(sumSec) {
  if (sumSec == null || sumSec <= 0) return null;
  const h = Math.floor(sumSec / 3600);
  const m = Math.floor((sumSec % 3600) / 60);
  if (h >= 48) {
    const d = Math.floor(h / 24);
    const rh = h % 24;
    return `~${d} d ${rh} h ${m} min combined driving (Google)`;
  }
  return `~${h} h ${m} min combined driving (Google)`;
}

function googleTravelModeFromKey(key) {
  const T = window.google?.maps?.TravelMode;
  if (!T) return null;
  const map = {
    DRIVING: T.DRIVING,
    BICYCLING: T.BICYCLING,
    WALKING: T.WALKING,
    TRANSIT: T.TRANSIT,
  };
  return map[key] || T.DRIVING;
}

function formatDayMetaLine(day) {
  const bits = [];
  if (day.date) bits.push(formatDate(day.date));
  if (day.googleDistanceKm != null) {
    const f = formatDistanceKmMi(day.googleDistanceKm);
    let bit = f ? `~${f.primaryLine} · Google` : `~${day.googleDistanceKm} km · Google`;
    if (day.googleDurationText) bit += ` · ${day.googleDurationText}`;
    bits.push(bit);
  }
  if (day.seatTimeHours != null) bits.push(`~${day.seatTimeHours} h seat`);
  if (day.terrain) bits.push(day.terrain);
  return bits.join(" · ");
}

function applyDayDistanceToDom(day) {
  const kmCell = document.querySelector(`td[data-glance-km="${day.dayIndex}"]`);
  if (kmCell && hasGoogleMapsApiKey()) {
    if (day.googleDistanceKm != null) {
      const f = formatDistanceKmMi(day.googleDistanceKm);
      kmCell.textContent = f ? f.shortLine : String(day.googleDistanceKm);
      const tip = f ? `${f.primaryLine}` : "";
      kmCell.title = [tip, day.googleDurationText, "Google Directions (driving)"].filter(Boolean).join(" · ");
    } else if (day.googleDistanceError) {
      kmCell.textContent = "—";
      kmCell.title = day.googleDistanceError;
    }
  }

  const meta = document.querySelector(`[data-day-meta="${day.dayIndex}"]`);
  if (meta) meta.textContent = formatDayMetaLine(day);

  const kmLine = document.querySelector(`p[data-route-km-line="${day.dayIndex}"]`);
  if (kmLine) {
    kmLine.classList.remove("muted");
    if (day.googleDistanceKm != null) {
      const f = formatDistanceKmMi(day.googleDistanceKm);
      kmLine.innerHTML = "";
      kmLine.appendChild(el("strong", { text: f ? `≈ ${f.primaryLine}` : `≈ ${day.googleDistanceKm} km` }));
      kmLine.appendChild(
        document.createTextNode(
          " — Google Directions (driving, metric): full route distance including all legs and waypoints in the link. Matches Maps when origin, destination, and stops are the same."
        )
      );
      if (day.googleDurationText) {
        kmLine.appendChild(
          el("span", {
            class: "route-duration-text",
            text: ` Typical duration (traffic not applied): ${day.googleDurationText}.`,
          })
        );
      }
    } else if (day.googleDistanceError) {
      kmLine.classList.add("muted");
      kmLine.textContent = `Google Maps could not route this leg (${day.googleDistanceError}). Use the link below.`;
    }
  }
}

async function fetchGoogleDistancesForDays(days) {
  if (!window.google?.maps?.DirectionsService) return;
  const svc = new google.maps.DirectionsService();
  const list = (days || []).filter((d) => d.routeOverlay?.mapsDirectionsUrl);
  const hero = document.getElementById("hero-route-total");
  let legIndex = 0;
  for (const day of list) {
    legIndex += 1;
    if (hero && !hero.hidden) {
      hero.classList.remove("hero-route-total--setup");
      hero.textContent = `Full route: fetching leg ${legIndex}/${list.length} from Google Maps…`;
    }
    const href = day.routeOverlay.mapsDirectionsUrl;
    day.googleDurationText = null;
    day.googleDurationSeconds = null;
    const parsed = parseGoogleMapsDirectionsUrl(href);
    if (!parsed) {
      day.googleDistanceKm = null;
      day.routeEndLat = null;
      day.routeEndLng = null;
      day.googleDistanceError = "Unrecognized Maps URL";
      applyDayDistanceToDom(day);
      continue;
    }
    const travelMode = googleTravelModeFromKey(parsed.travelModeKey);
    if (!travelMode) {
      day.routeEndLat = null;
      day.routeEndLng = null;
      day.googleDistanceError = "Maps API not ready";
      applyDayDistanceToDom(day);
      continue;
    }

    try {
      const request = buildDirectionsRequest(parsed, travelMode);
      const { meters, durationText, durationSeconds, endLat, endLng } = await directionsRouteWithRetry(
        svc,
        request
      );
      day.googleDistanceKm = Math.round(meters / 100) / 10;
      day.googleDurationText = durationText;
      day.googleDurationSeconds = durationSeconds;
      day.googleDistanceError = null;
      day.routeEndLat = endLat;
      day.routeEndLng = endLng;
    } catch (e) {
      day.googleDistanceKm = null;
      day.routeEndLat = null;
      day.routeEndLng = null;
      day.googleDistanceError = e?.message || "REQUEST_DENIED";
      if (list.indexOf(day) === 0) {
        console.warn(
          "[Directions] First leg failed:",
          day.googleDistanceError,
          "— Enable Directions API (Legacy) + Maps JavaScript API, billing, and HTTP referrer for this origin:",
          "https://console.cloud.google.com/apis/library/directions-backend.googleapis.com"
        );
      }
    }
    applyDayDistanceToDom(day);
    await new Promise((r) => setTimeout(r, 120));
  }
}

const WEATHER_DEDUPE_DECIMALS = 2;

function roundCoord(n) {
  if (n == null || !Number.isFinite(n)) return null;
  const f = 10 ** WEATHER_DEDUPE_DECIMALS;
  return Math.round(n * f) / f;
}

function coordCacheKey(lat, lng) {
  const a = roundCoord(lat);
  const b = roundCoord(lng);
  if (a == null || b == null) return null;
  return `${a},${b}`;
}

function forecastDayToIso(fd) {
  const d = fd?.displayDate;
  if (!d) return null;
  const y = d.year;
  const m = String(d.month).padStart(2, "0");
  const day = String(d.day).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function forecastDisplayDateKey(fd) {
  const d = fd?.displayDate;
  if (!d) return "";
  return `${d.year}-${d.month}-${d.day}`;
}

/**
 * Google’s days:lookup defaults pageSize to 5; follow nextPageToken until we have up to `nDays` rows.
 */
async function fetchWeatherForecastPages(buildUrl, nDaysIn) {
  const nDays = Math.min(10, Math.max(1, nDaysIn));
  const mergedDays = [];
  const seen = new Set();
  let timeZone = null;
  let pageToken = null;

  do {
    const u = buildUrl();
    u.searchParams.set("days", String(nDays));
    u.searchParams.set("pageSize", "10");
    if (pageToken) u.searchParams.set("pageToken", pageToken);

    const r = await fetch(u.toString(), { cache: "no-store" });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      throw new Error(
        data?.error?.message || data?.error || data?.message || `Weather HTTP ${r.status}`
      );
    }
    if (data.timeZone && !timeZone) timeZone = data.timeZone;
    for (const fd of data.forecastDays || []) {
      const k = forecastDisplayDateKey(fd);
      if (!k || seen.has(k)) continue;
      seen.add(k);
      mergedDays.push(fd);
    }
    pageToken = data.nextPageToken || null;
    if (mergedDays.length >= nDays) pageToken = null;
  } while (pageToken);

  return { forecastDays: mergedDays, timeZone: timeZone || {} };
}

async function fetchDailyForecastFromGoogle(lat, lng, dayCount) {
  const nDays = Math.min(10, Math.max(1, dayCount ?? WEATHER_FORECAST_DAY_COUNT));
  const proxyParams = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    days: String(nDays),
  });
  const proxyRes = await fetch(`/api/weather?${proxyParams}`, { cache: "no-store" });
  if (proxyRes.ok) return proxyRes.json();

  if (!hasGoogleMapsApiKey()) {
    const err = await proxyRes.json().catch(() => ({}));
    throw new Error(err?.error?.message || err?.error || `Weather HTTP ${proxyRes.status}`);
  }

  const k = String(window.__GOOGLE_MAPS_API_KEY__).trim();
  const buildUrl = () => {
    const u = new URL("https://weather.googleapis.com/v1/forecast/days:lookup");
    u.searchParams.set("key", k);
    u.searchParams.set("location.latitude", String(lat));
    u.searchParams.set("location.longitude", String(lng));
    return u;
  };
  return fetchWeatherForecastPages(buildUrl, nDays);
}

async function fetchCurrentConditionsFromGoogle(lat, lng) {
  const proxyParams = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    current: "1",
  });
  const proxyRes = await fetch(`/api/weather?${proxyParams}`, { cache: "no-store" });
  if (proxyRes.ok) return proxyRes.json();

  if (!hasGoogleMapsApiKey()) {
    const err = await proxyRes.json().catch(() => ({}));
    throw new Error(err?.error?.message || err?.error || `Weather HTTP ${proxyRes.status}`);
  }

  const k = String(window.__GOOGLE_MAPS_API_KEY__).trim();
  const u = new URL("https://weather.googleapis.com/v1/currentConditions:lookup");
  u.searchParams.set("key", k);
  u.searchParams.set("location.latitude", String(lat));
  u.searchParams.set("location.longitude", String(lng));
  const r = await fetch(u.toString(), { cache: "no-store" });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    throw new Error(
      data?.error?.message || data?.error || data?.message || `Current weather HTTP ${r.status}`
    );
  }
  return data;
}

function formatCurrentObservedAt(cc) {
  if (!cc?.currentTime) return "";
  try {
    const d = new Date(cc.currentTime);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
  } catch {
    return "";
  }
}

function formatCurrentConditionsSummary(cc) {
  if (!cc) return "";
  const bits = [];
  const cond = cc.weatherCondition?.description?.text;
  if (cond) bits.push(cond);
  const t = cc.temperature?.degrees;
  if (t != null && Number.isFinite(t)) bits.push(`${Math.round(t)}°C`);
  const fl = cc.feelsLikeTemperature?.degrees;
  if (fl != null && Number.isFinite(fl) && (t == null || Math.abs(fl - t) >= 2)) {
    bits.push(`feels like ${Math.round(fl)}°C`);
  }
  const pp = cc.precipitation?.probability?.percent;
  if (pp != null) bits.push(`${pp}% rain chance`);
  const gust = cc.wind?.gust?.value;
  const ws = cc.wind?.speed?.value;
  if (gust != null && Number.isFinite(gust)) bits.push(`gusts to ${Math.round(gust)} km/h`);
  else if (ws != null && Number.isFinite(ws)) bits.push(`wind ${Math.round(ws)} km/h`);
  if (cc.relativeHumidity != null) bits.push(`${cc.relativeHumidity}% humidity`);
  if (cc.isDaytime === false) bits.push("night at destination");
  return bits.join(" · ");
}

/** Riding concerns from live current conditions (DR650 / touring, metric). */
function scoreCurrentConditionsRisks(cc) {
  if (!cc) return null;
  const lines = [];
  const pp = cc.precipitation?.probability?.percent;
  const ts = cc.thunderstormProbability;
  const gust = cc.wind?.gust?.value;
  const wind = cc.wind?.speed?.value;
  const temp = cc.temperature?.degrees;
  const wchill = cc.windChill?.degrees;
  const feels = cc.feelsLikeTemperature?.degrees;
  const type = (cc.weatherCondition?.type || "").toUpperCase();
  const desc = cc.weatherCondition?.description?.text;
  const vis = cc.visibility;
  let visKm = null;
  if (vis?.distance != null && Number.isFinite(vis.distance)) {
    const u = (vis.unit || "").toString();
    visKm = u.includes("MILE") ? vis.distance * 1.609344 : vis.distance;
  }

  if (pp != null && pp >= 55) lines.push(`precipitation ~${pp}%`);
  if (ts != null && ts >= 25) lines.push(`thunderstorms ~${ts}%`);
  if (gust != null && gust >= 45) lines.push(`wind gusts to ${Math.round(gust)} km/h`);
  else if (wind != null && wind >= 38) lines.push(`sustained wind ~${Math.round(wind)} km/h`);
  const cold = [temp, wchill, feels].filter((n) => n != null && Number.isFinite(n));
  if (cold.length && Math.min(...cold) <= 2) {
    lines.push(`cold / wind chill ~${Math.round(Math.min(...cold))}°C`);
  }
  if (visKm != null && visKm < 1.5) {
    lines.push(
      visKm < 1
        ? `low visibility ~${Math.round(visKm * 1000)} m`
        : `low visibility ~${visKm.toFixed(1)} km`
    );
  }
  if (cc.uvIndex != null && cc.uvIndex >= 8) lines.push(`high UV index ${cc.uvIndex}`);
  if (/SNOW|ICE|HAIL|THUNDER|BLIZZARD|FREEZING/i.test(type)) lines.push(desc || type);

  return lines.length ? lines : null;
}

function mergeRidingRiskLines(currentCc, forecastDay) {
  const a = scoreCurrentConditionsRisks(currentCc);
  const b = forecastDay ? scoreMotorcycleRidingRisks(forecastDay) : null;
  const out = [];
  const seen = new Set();
  for (const line of [...(a || []), ...(b || [])]) {
    if (seen.has(line)) continue;
    seen.add(line);
    out.push(line);
  }
  return out.length ? out : null;
}

/** Riding concerns for a Suzuki DR650 / light adventure bike (metric). */
function scoreMotorcycleRidingRisks(forecastDay) {
  if (!forecastDay) return null;
  const d = forecastDay.daytimeForecast;
  if (!d) return null;
  const lines = [];
  const pp = d.precipitation?.probability?.percent;
  const ts = d.thunderstormProbability;
  const gust = d.wind?.gust?.value;
  const wind = d.wind?.speed?.value;
  const tmin = forecastDay.minTemperature?.degrees;
  const type = (d.weatherCondition?.type || "").toUpperCase();
  const desc = d.weatherCondition?.description?.text;

  if (pp != null && pp >= 55) lines.push(`precipitation ~${pp}%`);
  if (ts != null && ts >= 25) lines.push(`thunderstorms ~${ts}%`);
  if (gust != null && gust >= 45) lines.push(`wind gusts to ${Math.round(gust)} km/h`);
  else if (wind != null && wind >= 38) lines.push(`sustained wind ~${Math.round(wind)} km/h`);
  if (tmin != null && tmin <= 2) lines.push(`overnight low ~${Math.round(tmin)}°C (ice risk)`);
  if (forecastDay.iceThickness?.thickness > 0) lines.push("ice thickness reported");
  if (/SNOW|ICE|HAIL|THUNDER|BLIZZARD|FREEZING/i.test(type)) lines.push(desc || type);

  return lines.length ? lines : null;
}

function attachWeatherToDay(day, cache) {
  day.googleWeather = null;
  if (day.routeEndLat == null || day.routeEndLng == null || !day.date) return;
  const key = coordCacheKey(day.routeEndLat, day.routeEndLng);
  if (!key) return;
  const payload = cache.get(key);
  if (!payload) return;

  const tz =
    payload.timeZone?.id ||
    payload.current?.timeZone?.id ||
    "";

  const gw = {
    current: payload.current || null,
    forecastDay: null,
    rideDateMatched: false,
    timeZoneId: tz,
  };

  if (payload.forecastDays?.length) {
    const exact = payload.forecastDays.find((fd) => forecastDayToIso(fd) === day.date);
    if (exact) {
      gw.forecastDay = exact;
      gw.rideDateMatched = true;
    } else {
      gw.forecastDay = payload.forecastDays[0];
      gw.rideDateMatched = false;
    }
  }

  if (!gw.current && !gw.forecastDay) return;
  day.googleWeather = gw;
}

async function fetchAndRenderRouteWeather(days, trip) {
  if (!hasGoogleMapsApiKey()) return;

  const unique = new Map();
  for (const day of days || []) {
    if (day.routeEndLat == null || day.routeEndLng == null) continue;
    const key = coordCacheKey(day.routeEndLat, day.routeEndLng);
    if (!key || unique.has(key)) continue;
    unique.set(key, { lat: day.routeEndLat, lng: day.routeEndLng });
  }

  const cache = new Map();
  for (const { lat, lng } of unique.values()) {
    const key = coordCacheKey(lat, lng);
    let current = null;
    let forecast = { forecastDays: [], timeZone: {} };

    try {
      current = await fetchCurrentConditionsFromGoogle(lat, lng);
    } catch (e) {
      console.warn("[Weather] current conditions failed for", lat, lng, e?.message || e);
    }
    await new Promise((r) => setTimeout(r, 120));

    try {
      forecast = await fetchDailyForecastFromGoogle(lat, lng, WEATHER_FORECAST_DAY_COUNT);
    } catch (e) {
      console.warn("[Weather] forecast failed for", lat, lng, e?.message || e);
      forecast = { forecastDays: [], timeZone: {}, error: String(e?.message || e) };
    }

    cache.set(key, {
      current,
      forecastDays: forecast.forecastDays || [],
      timeZone: forecast.timeZone || current?.timeZone || {},
    });
    await new Promise((r) => setTimeout(r, 120));
  }

  for (const day of days || []) {
    attachWeatherToDay(day, cache);
    applyDayWeatherToDom(day);
  }

  renderHeroWeatherAlerts(days, trip);
  renderOverviewLegWeather(days, trip);
}

function scheduleRouteWeatherFetch(days, trip) {
  if (!hasGoogleMapsApiKey()) return;
  fetchAndRenderRouteWeather(days, trip || {}).catch((e) => console.error("[Weather]", e));
}

function applyDayWeatherToDom(day) {
  const slot = document.querySelector(`[data-day-weather="${day.dayIndex}"]`);
  if (!slot) return;
  const gw = day.googleWeather;
  if (!gw?.current && !gw?.forecastDay) {
    slot.hidden = true;
    slot.innerHTML = "";
    return;
  }

  slot.hidden = false;
  slot.innerHTML = "";
  const wrap = el("div", { class: "day-weather-google" });
  wrap.appendChild(
    el("h4", {
      class: "day-section-title",
      text: "🌤 Google Weather — route destination",
    })
  );
  wrap.appendChild(
    el("p", {
      class: "day-weather-google__window muted",
      text: `Tour calendar: ride day ${formatDate(day.date)}. Below is live and/or outlook data at this leg’s end coordinates (not tied to that date).`,
    })
  );

  const cc = gw.current;
  if (cc) {
    const obs = formatCurrentObservedAt(cc);
    const tz = gw.timeZoneId || cc.timeZone?.id || "";
    wrap.appendChild(
      el("p", {
        class: "day-weather-google__label",
        text: `Now${obs ? ` · observed ${obs}` : ""}${tz ? ` · ${tz}` : ""}`,
      })
    );
    wrap.appendChild(
      el("p", {
        class: "day-weather-google__body day-weather-google__body--current",
        text: formatCurrentConditionsSummary(cc) || "Current conditions loaded — see raw details in Google Weather if needed.",
      })
    );
  }

  const fd = gw.forecastDay;
  if (fd) {
    const d = fd.daytimeForecast;
    const rideMatched = gw.rideDateMatched === true;
    const fcIso = forecastDayToIso(fd);
    const fcLabel = fcIso ? formatDate(fcIso) : "near-term";
    const desc = d?.weatherCondition?.description?.text || "—";
    const hi = fd.maxTemperature?.degrees;
    const lo = fd.minTemperature?.degrees;
    const rain = d?.precipitation?.probability?.percent;
    const gust = d?.wind?.gust?.value;
    const parts = [desc];
    if (hi != null || lo != null) {
      parts.push(
        `High ${hi != null ? Math.round(hi) : "—"}°C · Low ${lo != null ? Math.round(lo) : "—"}°C`
      );
    }
    if (rain != null) parts.push(`daytime rain chance ${rain}%`);
    if (gust != null) parts.push(`gusts to ${Math.round(gust)} km/h`);

    wrap.appendChild(
      el("p", {
        class: "day-weather-google__label",
        text: rideMatched
          ? `Next-day outlook · ${fcLabel} (matches your ride day)`
          : `Next-day outlook · ${fcLabel} (at destination; tour calendar may differ)`,
      })
    );
    wrap.appendChild(el("p", { class: "day-weather-google__body", text: parts.join(" · ") }));
  }

  const merged = mergeRidingRiskLines(cc, fd);
  if (merged?.length) {
    wrap.appendChild(
      el("p", {
        class: "day-weather-google__risk",
        text: `DR650 / touring — watch: ${merged.join(" · ")}`,
      })
    );
  }

  slot.appendChild(wrap);
}

function renderHeroWeatherAlerts(days, trip) {
  const box = document.getElementById("hero-weather");
  if (!box) return;
  const bikeLabel = trip?.bike || "Suzuki DR650";

  const withCoords = (days || []).filter((d) => d.routeEndLat != null && d.routeEndLng != null);
  const withWeather = (days || []).filter((d) => d.googleWeather?.current || d.googleWeather?.forecastDay);

  const alerts = [];
  for (const day of days || []) {
    const gw = day.googleWeather;
    if (!gw) continue;
    const risks = mergeRidingRiskLines(gw.current, gw.forecastDay);
    if (!risks) continue;
    alerts.push({ day, risks });
  }

  box.hidden = false;
  box.innerHTML = "";
  box.classList.remove("hero-weather--alert", "hero-weather--muted", "hero-weather--ok");

  if (!hasGoogleMapsApiKey()) {
    box.hidden = true;
    return;
  }

  if (!withCoords.length) {
    box.classList.add("hero-weather--muted");
    box.appendChild(
      el("p", {
        class: "hero-weather__text",
        text: `Weather: after each leg resolves in Directions, we load current conditions plus the next 1-day outlook at that leg’s destination (${bikeLabel}). Tour dates do not change the live read.`,
      })
    );
    return;
  }

  if (!withWeather.length) {
    box.classList.add("hero-weather--muted");
    box.appendChild(
      el("p", {
        class: "hero-weather__text",
        text: `Could not load Google Weather for route ends (check Weather API + billing on your key, use Vercel or vercel dev for /api/weather, or watch the browser console).`,
      })
    );
    return;
  }

  box.appendChild(
    el("p", {
      class: "hero-weather__text",
      text: `Live conditions at each day’s route destination (${bikeLabel}) — reload for a fresh read. Below: rough riding flags from “now” + next-day outlook; open each day for details.`,
    })
  );

  if (alerts.length) {
    box.classList.add("hero-weather--alert");
    box.appendChild(
      el("p", {
        class: "hero-weather__title",
        text: `⚠ Riding weather watch (${bikeLabel})`,
      })
    );
    const ul = el("ul", { class: "hero-weather__list" });
    for (const { day, risks } of alerts.slice(0, 8)) {
      ul.appendChild(
        el("li", {
          text: `Day ${day.dayIndex} (destination now / outlook): ${risks.join(" · ")}`,
        })
      );
    }
    if (alerts.length > 8) {
      ul.appendChild(el("li", { text: `+${alerts.length - 8} more day(s) — see daily sections.` }));
    }
    box.appendChild(ul);
    box.appendChild(
      el("p", {
        class: "hero-weather__sub",
        text: "Current = Google currentConditions at route-end coordinates; outlook = next 1 day only. Re-check before you roll.",
      })
    );
    return;
  }

  box.classList.add("hero-weather--ok");
  box.appendChild(
    el("p", {
      class: "hero-weather__text",
      text: `No high-priority riding flags in current + next-day outlook at route destinations (${bikeLabel}) — still verify wind, precip, and temperature yourself.`,
    })
  );
}

function renderOverviewLegWeather(days, trip) {
  const mount = document.getElementById("overview-weather-mount");
  if (!mount) return;
  mount.innerHTML = "";
  const bikeLabel = trip?.bike || "Suzuki DR650";

  const byLeg = { 1: [], 2: [], 3: [] };
  for (const day of days || []) {
    const gw = day.googleWeather;
    if (!gw?.current && !gw?.forecastDay) continue;
    const risks = mergeRidingRiskLines(gw.current, gw.forecastDay) || [];
    const leg = inferLeg(day.dayIndex);
    const nowLine = gw.current ? formatCurrentConditionsSummary(gw.current) : "";
    byLeg[leg].push({ day, risks, nowLine });
  }

  const any = Object.values(byLeg).some((a) => a.length);
  if (!any) {
    mount.hidden = true;
    return;
  }

  mount.hidden = false;
  mount.appendChild(
    el("h3", { class: "overview-weather-heading", text: "Weather along legs (Google · DR650 notes)" })
  );
  const sub = el("p", {
    class: "overview-weather-sub muted",
    text: "Same route-end coordinates as driving distances. “Now” is currentConditions; concerns merge current + next 1-day outlook. Tour dates do not change the live read.",
  });
  mount.appendChild(sub);

  ["1", "2", "3"].forEach((k) => {
    const rows = byLeg[k];
    if (!rows.length) return;
    const card = el("div", { class: "overview-leg-weather" });
    const title = trip?.legs?.[k] || `Leg ${k}`;
    card.appendChild(el("h4", { class: "overview-leg-weather__title", text: `Leg ${k}: ${title}` }));
    const ul = el("ul", { class: "overview-leg-weather__list" });
    for (const { day, risks, nowLine } of rows) {
      const bits = [`Day ${day.dayIndex}`];
      if (nowLine) bits.push(`Now: ${nowLine}`);
      if (risks.length) bits.push(`Watch: ${risks.join(" · ")}`);
      else bits.push("No major riding flags in merged current + outlook");
      ul.appendChild(el("li", { text: bits.join(" — ") }));
    }
    card.appendChild(ul);
    mount.appendChild(card);
  });

  mount.appendChild(
    el("p", {
      class: "overview-weather-foot muted",
      text: `${bikeLabel}: reduce exposure in strong gusts, heavy precip, and near-freezing temps; gear for visibility and traction.`,
    })
  );
}

function computeGoogleRouteTotals(days) {
  let sumKm = 0;
  let sumDurationSec = 0;
  let legsWithUrl = 0;
  let legsOk = 0;
  let legsFailed = 0;
  for (const d of days || []) {
    if (!d.routeOverlay?.mapsDirectionsUrl) continue;
    legsWithUrl++;
    if (d.googleDistanceKm != null) {
      sumKm += d.googleDistanceKm;
      legsOk++;
      if (d.googleDurationSeconds != null) sumDurationSec += d.googleDurationSeconds;
    } else if (d.googleDistanceError) legsFailed++;
  }
  return {
    sumKm,
    sumDurationSec,
    legsWithUrl,
    legsOk,
    legsFailed,
    allOk: legsWithUrl > 0 && legsOk === legsWithUrl,
  };
}

function initRouteTotalsUI(phase) {
  const hero = document.getElementById("hero-route-total");
  const overview = document.getElementById("overview-route-total");
  const tfoot = document.getElementById("glance-tfoot");
  const tkm = document.getElementById("glance-tfoot-km");
  const tnote = document.getElementById("glance-tfoot-note");

  if (phase === "loading") {
    if (hero) {
      hero.hidden = false;
      hero.classList.remove("hero-route-total--muted", "hero-route-total--setup");
      hero.textContent = "Full route: calculating from Google Maps (sum of daily legs)…";
    }
    if (overview) {
      overview.hidden = false;
      overview.className = "overview-route-total overview-route-total--loading muted";
      overview.textContent =
        "Calculating full route distance from Google Maps (adding each day’s driving leg)…";
    }
    if (tfoot) tfoot.hidden = false;
    if (tkm) {
      tkm.textContent = "…";
      tkm.title = "";
    }
    if (tnote) tnote.textContent = "Segments run in sequence; this row updates when all finish.";
    return;
  }

  if (phase === "nokey") {
    if (hero) {
      hero.hidden = false;
      hero.classList.add("hero-route-total--muted", "hero-route-total--setup");
      hero.innerHTML = "";
      hero.appendChild(el("strong", { text: "Route totals load from Google Directions" }));
      const hint = el("div", { class: "hero-route-total-setup" });
      hint.appendChild(
        el("p", {
          class: "hero-route-total-setup__line",
          text: "Local: add GOOGLE_MAPS_API_KEY to .env, then run npm run dev (builds config + serves on :8765).",
        })
      );
      hint.appendChild(
        el("p", {
          class: "hero-route-total-setup__line",
          text: "Vercel: set GOOGLE_MAPS_API_KEY for Production → Redeploy. Cloud Console: Maps JavaScript API + Directions API (Legacy) + Weather API + billing (one key).",
        })
      );
      hero.appendChild(hint);
    }
    if (overview) {
      overview.hidden = false;
      overview.className = "overview-route-total muted";
      overview.innerHTML = "";
      overview.appendChild(
        el("p", {
          text: "Per-day km and weather use the same GOOGLE_MAPS_API_KEY. After the key is live, reload — totals and forecasts appear here and in the table footer.",
        })
      );
    }
    if (tfoot) tfoot.hidden = true;
  }
}

function updateTotalRouteDistanceUI(days) {
  const hero = document.getElementById("hero-route-total");
  const overview = document.getElementById("overview-route-total");
  const tfoot = document.getElementById("glance-tfoot");
  const tkm = document.getElementById("glance-tfoot-km");
  const tnote = document.getElementById("glance-tfoot-note");

  if (!hasGoogleMapsApiKey()) {
    initRouteTotalsUI("nokey");
    return;
  }

  const { sumKm, sumDurationSec, legsWithUrl, legsOk, legsFailed, allOk } = computeGoogleRouteTotals(days);
  const totalDurationLabel = formatTotalDriveDuration(sumDurationSec);

  if (legsWithUrl === 0) {
    if (overview) {
      overview.hidden = false;
      overview.className = "overview-route-total muted";
      overview.textContent = "No Directions URLs in route-overlays — nothing to sum.";
    }
    if (hero) hero.hidden = true;
    if (tfoot) tfoot.hidden = true;
    return;
  }

  if (legsOk === 0) {
    const issue = window.__googleMapsLoadIssue;
    const err =
      issue === "script_error"
        ? "Google Maps script did not load (blocked or network). Allow maps.googleapis.com and reload."
        : issue === "load_timeout"
          ? "Google Maps loaded too slowly. Check connection and ad blockers; ensure your API key allows this site’s referrer."
          : !window.google?.maps?.DirectionsService
            ? "Maps JavaScript API did not initialize. Verify the API key and HTTP referrer restrictions (127.0.0.1, localhost, your deploy URL)."
            : "No driving distances returned. In Google Cloud enable Directions API (Legacy) for this project — same key as Maps JS — plus billing. See browser console for the first leg’s status.";
    if (hero) {
      hero.hidden = false;
      hero.classList.add("hero-route-total--muted");
      hero.classList.remove("hero-route-total--setup");
      hero.textContent = err;
    }
    if (overview) {
      overview.hidden = false;
      overview.className = "overview-route-total muted";
      overview.textContent = err;
    }
    if (tfoot) tfoot.hidden = false;
    if (tkm) {
      tkm.textContent = "—";
      tkm.title = "";
    }
    if (tnote) tnote.textContent = `${legsFailed} leg(s) failed.`;
    return;
  }

  const fmt = formatDistanceKmMi(sumKm);
  const coverage = allOk
    ? `All ${legsOk} segments with Directions links included.`
    : `${legsOk} of ${legsWithUrl} segments summed${legsFailed ? `; ${legsFailed} failed` : ""} — open failed days in Maps.`;

  if (hero && fmt) {
    hero.hidden = false;
    hero.classList.remove("hero-route-total--muted", "hero-route-total--setup");
    hero.innerHTML = "";
    hero.appendChild(el("strong", { text: `Full route (Google Maps): ${fmt.primaryLine}` }));
    if (totalDurationLabel) {
      hero.appendChild(
        el("span", { class: "hero-route-total-duration", text: ` ${totalDurationLabel}` })
      );
    }
    hero.appendChild(
      el("span", {
        class: "hero-route-total-note",
        text: ` ${coverage} Sum of metric driving distance per leg (Directions API, no live traffic).`,
      })
    );
  }

  if (overview && fmt) {
    overview.hidden = false;
    overview.className = "overview-route-total";
    overview.innerHTML = "";
    overview.appendChild(el("div", { class: "overview-route-total-title", text: "Full route distance" }));
    const line = el("p", { class: "overview-route-total-km" });
    line.appendChild(el("strong", { text: fmt.primaryLine }));
    line.appendChild(
      document.createTextNode(
        " — total of each day’s Google driving distance for that day’s origin and destination. If you change a stop mid-trip, re-open Directions for affected days; a single continuous path can differ slightly from this sum."
      )
    );
    overview.appendChild(line);
    if (totalDurationLabel) {
      overview.appendChild(
        el("p", { class: "overview-route-total-duration", text: totalDurationLabel })
      );
    }
    overview.appendChild(el("p", { class: "overview-route-total-sub muted", text: coverage }));
  }

  if (tfoot && tkm) {
    tfoot.hidden = false;
    tkm.textContent = fmt ? fmt.shortLine : "—";
    tkm.title = fmt ? `${fmt.primaryLine} — sum of Google legs` : "";
    if (tnote) {
      tnote.textContent = totalDurationLabel ? `${coverage} ${totalDurationLabel}` : coverage;
    }
  }
}

function scheduleGoogleDistanceFetch(days, trip) {
  if (!hasGoogleMapsApiKey()) {
    initRouteTotalsUI("nokey");
    return;
  }
  initRouteTotalsUI("loading");

  let fetchStarted = false;
  let fetchFinished = false;
  const run = async () => {
    if (fetchStarted) return;
    fetchStarted = true;
    try {
      await fetchGoogleDistancesForDays(days);
    } catch (err) {
      console.error("Google distance fetch:", err);
    } finally {
      fetchFinished = true;
      updateTotalRouteDistanceUI(days);
      scheduleRouteWeatherFetch(days, trip);
    }
  };

  const tryStart = () => {
    if (window.google?.maps?.DirectionsService) {
      run();
      return true;
    }
    return false;
  };

  /** Maps often finishes loading before trip.json fetch + render complete — event can fire with no listener yet. */
  const startWhenMapsReady = () => {
    if (tryStart()) return;
    let attempts = 0;
    const id = window.setInterval(() => {
      if (tryStart()) {
        window.clearInterval(id);
        return;
      }
      if (++attempts > 300) {
        window.clearInterval(id);
        updateTotalRouteDistanceUI(days);
        scheduleRouteWeatherFetch(days, trip);
      }
    }, 50);
  };

  window.setTimeout(() => {
    if (!fetchFinished && fetchStarted) {
      console.warn("[Directions] Safety timeout — forcing UI refresh (some requests may still be pending).");
      updateTotalRouteDistanceUI(days);
    }
  }, 120000);

  if (tryStart()) return;
  if (window.__googleMapsJsReady) {
    startWhenMapsReady();
    return;
  }
  window.addEventListener("googlemapsjsready", startWhenMapsReady, { once: true });
}

function parseRouteEndpoints(title) {
  if (!title) return { from: "", to: "" };
  const parts = title.split("→").map((s) => s.replace(/\s+/g, " ").trim());
  if (parts.length < 2) return { from: title.trim(), to: "" };
  return { from: parts[0], to: parts.slice(1).join(" → ") };
}

function primarySleepName(day) {
  if (day.lodging?.name) return day.lodging.name;
  const a = day.lodgingAlternatives?.[0];
  return a?.name || "—";
}

function primaryHighlight(day) {
  if (day.highlights?.length) return day.highlights[0];
  const st = day.stops?.[0];
  if (st) return st.place || st.label || "";
  return "—";
}

function appendDayDetailSection(body, emojiLabel, title, content) {
  if (content == null || content === "") return;
  const lines = Array.isArray(content) ? content.filter(Boolean) : [content].filter(Boolean);
  if (!lines.length) return;
  const wrap = el("div", { class: "day-section" });
  wrap.appendChild(el("h4", { class: "day-section-title", text: `${emojiLabel} ${title}` }));
  if (Array.isArray(content) && content.length > 1) {
    const ul = document.createElement("ul");
    lines.forEach((t) => ul.appendChild(el("li", { text: t })));
    wrap.appendChild(ul);
  } else {
    wrap.appendChild(el("p", { class: "day-section-body", text: lines[0] }));
  }
  body.appendChild(wrap);
}

function difficultyPillClass(d) {
  const u = (d || "").toUpperCase();
  if (u.includes("EPIC")) return "pill-diff pill-diff-epic";
  if (u.includes("REST")) return "pill-diff pill-diff-rest";
  if (u.includes("EASY")) return "pill-diff pill-diff-easy";
  if (u.includes("SCENIC")) return "pill-diff pill-diff-scenic";
  if (u.includes("MODERATE")) return "pill-diff pill-diff-mod";
  return "pill-diff";
}

function renderHero(trip) {
  const root = document.getElementById("hero-root");
  if (!trip?.tagline && !trip?.bike && !(trip?.statsChips?.length)) {
    root.innerHTML = "";
    root.hidden = true;
    return;
  }
  root.hidden = false;
  root.innerHTML = "";
  const inner = el("div", { class: "hero-doc-inner" });

  inner.appendChild(el("p", { class: "hero-kicker", text: `🏍 ${trip.tagline || "Ride plan"}` }));

  const chips = el("div", { class: "hero-chips", "aria-label": "Trip summary tags" });
  let chipIndex = 0;
  function appendHeroChip(node) {
    node.style.setProperty("--chip-i", String(chipIndex));
    chipIndex += 1;
    chips.appendChild(node);
  }
  if (trip.bike) {
    appendHeroChip(el("span", { class: "hero-chip hero-chip--bike", text: trip.bike }));
  }
  const rawChips = trip.statsChips || [];
  rawChips.forEach((c, i) => {
    const isLast = i === rawChips.length - 1;
    appendHeroChip(
      el("span", {
        class: isLast && rawChips.length > 0 ? "hero-chip hero-chip--motivate" : "hero-chip",
        text: c,
      })
    );
  });
  if (chips.childNodes.length) inner.appendChild(chips);

  if (trip.legs && typeof trip.legs === "object") {
    const legs = el("div", { class: "hero-legs", "aria-label": "Trip legs" });
    let anyLeg = false;
    ["1", "2", "3"].forEach((k) => {
      const title = trip.legs[k];
      if (!title) return;
      anyLeg = true;
      const row = el("div", { class: "hero-leg" });
      row.appendChild(el("span", { class: "hero-leg__bar", "aria-hidden": "true" }));
      const text = el("p", { class: "hero-leg__text" });
      text.appendChild(el("strong", { class: "hero-leg__label", text: `Leg ${k}: ` }));
      text.appendChild(document.createTextNode(title));
      row.appendChild(text);
      legs.appendChild(row);
    });
    if (anyLeg) {
      inner.appendChild(el("div", { class: "hero-doc__divider", "aria-hidden": "true" }));
      inner.appendChild(legs);
    }
  }

  const foot = el("footer", { class: "hero-doc__footer" });
  foot.appendChild(
    el("div", {
      class: "hero-route-total",
      id: "hero-route-total",
      hidden: true,
      "aria-live": "polite",
    })
  );
  foot.appendChild(
    el("div", {
      class: "hero-weather",
      id: "hero-weather",
      hidden: true,
      "aria-live": "polite",
    })
  );
  inner.appendChild(foot);

  root.appendChild(inner);
}

function renderGlanceTable(days, trip) {
  const tbody = document.getElementById("glance-body");
  tbody.innerHTML = "";
  (days || []).forEach((day) => {
    const leg = day.leg || inferLeg(day.dayIndex);
    const { from, to } =
      day.routeFrom || day.routeTo
        ? { from: day.routeFrom || "—", to: day.routeTo || "—" }
        : parseRouteEndpoints(day.title);
    const tr = document.createElement("tr");
    const legTitle = trip?.legs?.[leg] || `Leg ${leg}`;
    tr.appendChild(el("td", { text: String(day.dayIndex) }));
    tr.appendChild(el("td", { class: "leg-cell", text: leg, title: legTitle }));
    tr.appendChild(el("td", { class: "route-cell", text: `${from} → ${to}`.trim() }));
    const tdKm = document.createElement("td");
    tdKm.className = "num glance-km";
    tdKm.setAttribute("data-glance-km", String(day.dayIndex));
    if (day.routeOverlay?.mapsDirectionsUrl) {
      if (hasGoogleMapsApiKey()) tdKm.textContent = "…";
      else {
        tdKm.appendChild(
          el("a", {
            class: "glance-maps-link",
            href: day.routeOverlay.mapsDirectionsUrl,
            text: "Maps",
            target: "_blank",
            rel: "noopener noreferrer",
          })
        );
      }
    } else tdKm.textContent = "—";
    tr.appendChild(tdKm);
    tr.appendChild(el("td", { class: "hint-cell", text: primaryHighlight(day) }));
    tr.appendChild(el("td", { class: "hint-cell", text: primarySleepName(day) }));
    tbody.appendChild(tr);
  });
}

function stayHasContent(L) {
  return (
    L &&
    (L.name ||
      L.address ||
      L.phone ||
      L.email ||
      L.notes ||
      L.profileNotes ||
      L.confirmation ||
      L.checkIn ||
      L.url)
  );
}

function normalizeLodgingWithBab(L, babHostsMap) {
  if (!L) return null;
  const out = { ...L, profileNotes: null, contactPref: null, greetingName: null };
  if (L.babMergeId && babHostsMap && babHostsMap[L.babMergeId]) {
    const b = babHostsMap[L.babMergeId];
    out.phone = L.phone || b.phone;
    out.email = L.email || b.email;
    out.mapsUrl = L.mapsUrl || b.mapsUrl;
    out.address = L.address || b.address;
    out.profileNotes = b.notes;
    out.contactPref = b.contact;
    out.greetingName = b.greetingName;
  }
  if (!out.mapsUrl && out.address) {
    out.mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(out.address)}`;
  }
  return out;
}

function lodgingToContact(L, babHostsMap, primary) {
  const n = normalizeLodgingWithBab(L, babHostsMap);
  if (!stayHasContent(n)) return null;
  const source = L.babMergeId && babHostsMap?.[L.babMergeId] ? "bab_merged" : "personal";
  return {
    ...n,
    source,
    primary,
    heading: L.heading,
    priorityStar: L.priority,
    babMergeId: L.babMergeId,
  };
}

function buildOrderedContacts(day, babHostsMap) {
  const contacts = [];
  const seenEmails = new Set();

  if (day.lodging) {
    const c = lodgingToContact(day.lodging, babHostsMap, true);
    if (c) {
      contacts.push(c);
      if (c.email) seenEmails.add(c.email.toLowerCase());
    }
  }
  for (const alt of day.lodgingAlternatives || []) {
    const c = lodgingToContact(alt, babHostsMap, false);
    if (!c) continue;
    if (c.email && seenEmails.has(c.email.toLowerCase())) continue;
    contacts.push(c);
    if (c.email) seenEmails.add(c.email.toLowerCase());
  }
  for (const bid of day.babAlternateIds || []) {
    if (bid === day.lodging?.babMergeId) continue;
    const b = babHostsMap[bid];
    if (!b) continue;
    if (b.email && seenEmails.has(b.email.toLowerCase())) continue;
    contacts.push({
      name: b.name,
      address: b.address,
      mapsUrl: b.mapsUrl,
      phone: b.phone,
      email: b.email,
      profileNotes: b.notes,
      contactPref: b.contact,
      greetingName: b.greetingName,
      source: "bab",
      primary: false,
      babId: bid,
      infoOnly: Boolean(b.infoOnly),
    });
    if (b.email) seenEmails.add(b.email.toLowerCase());
  }
  return contacts;
}

function digitsE164ish(phone) {
  if (!phone) return "";
  const d = phone.replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("1")) return d;
  if (d.length === 10) return `1${d}`;
  return d;
}

function buildOutreach(contact, day, trip) {
  const rider = trip.riderName || "Ali";
  const gn = contact.greetingName || (contact.name || "there").split(/\s+/)[0];
  const dateLong = formatDateLong(day.date);
  const routeHint = day.title || "my motorcycle tour";

  if (contact.infoOnly) {
    const body = `Hi ${gn},

I'm ${rider}, on a motorcycle trip near your area around ${dateLong} (${routeHint}). Your Bunk a Biker listing mentions local info and rides rather than overnight hosting — I'm not assuming a bed, but if you're ever free for a quick tip, a short ride, or pointers on the Shore / NJ routes, I'd really appreciate it.

Thanks,
${rider}`;
    const subject = `Bunk a Biker — ${rider} — NJ / local rider question`;
    return { subject, body };
  }

  let extra = "";
  const notes = `${contact.profileNotes || ""} ${contact.notes || ""}`;
  if (/24[-\s]?hour|24h notice/i.test(notes)) {
    extra += "\n\nI’m happy to give you at least 24 hours’ notice once my ETA firms up.";
  }
  if (/register first|don’t just show up|do not just show up/i.test(notes)) {
    extra += "\n\nI’ll follow your registration / check-in process before arriving.";
  }
  if (/text (is )?better|text preferred|text fastest/i.test(notes)) {
    extra += "\n\nText is fine on my side if that’s easiest for you.";
  }
  const bikeMention = trip?.bike || "Suzuki DR650";
  const body = `Hi ${gn},

I’m ${rider}, riding a long Toronto → USA motorcycle loop (${bikeMention}). I’m aiming to be in your area around ${dateLong} (${routeHint}) and found you through Bunk a Biker.

Would you have space for one rider for a night? I’m flexible—tent, couch, or whatever you usually host—and I’ll share a tighter ETA as the day gets closer.${extra}

Thanks for supporting riders,
${rider}`;
  const shortDate = day.date ? formatDate(day.date) : "ride window";
  const subject = `Bunk a Biker — ${rider} — overnight ~${shortDate}`;
  return { subject, body };
}

function contactHintLine(contactPref) {
  if (!contactPref) return "";
  return CONTACT_HINTS[contactPref] || `Host preference: ${contactPref.replace(/_/g, " ")}.`;
}

function renderContactCard(contact, day, trip, container) {
  const card = el("div", {
    class: `contact-card${contact.primary ? " contact-card--primary" : ""}`,
  });
  const head = el("div", { class: "contact-card__head" });
  const title = contact.priorityStar ? `★ ${contact.name}` : contact.name;
  head.appendChild(el("h3", { class: "contact-card__name", text: title || "Stay" }));

  const badges = el("div", { class: "contact-badges" });
  if (contact.primary) badges.appendChild(el("span", { class: "badge badge-primary", text: "Primary stay" }));
  if (contact.source === "bab") badges.appendChild(el("span", { class: "badge badge-bab", text: "Bunk a Biker" }));
  else if (contact.source === "bab_merged")
    badges.appendChild(el("span", { class: "badge badge-bab", text: "B.a.B. profile merged" }));
  else if (contact.source === "personal")
    badges.appendChild(el("span", { class: "badge badge-personal", text: "Your contact" }));
  if (contact.url && !contact.email && !contact.phone)
    badges.appendChild(el("span", { class: "badge badge-camp", text: "Book / link" }));
  if (badges.childNodes.length) head.appendChild(badges);
  card.appendChild(head);

  if (contact.address) {
    const p = el("p", { class: "contact-card__address" });
    p.appendChild(document.createTextNode(`${contact.address} `));
    if (contact.mapsUrl) {
      p.appendChild(
        el("a", {
          href: contact.mapsUrl,
          text: "Open in Google Maps",
          target: "_blank",
          rel: "noopener noreferrer",
        })
      );
    }
    card.appendChild(p);
  } else if (contact.mapsUrl) {
    card.appendChild(
      el("p", {
        class: "contact-card__address",
      })
    );
    const p = card.lastChild;
    p.appendChild(
      el("a", {
        href: contact.mapsUrl,
        text: "Open in Google Maps",
        target: "_blank",
        rel: "noopener noreferrer",
      })
    );
  }

  const pref = contact.contactPref || (contact.email && contact.phone ? "email_or_text" : null);
  if (pref) {
    card.appendChild(el("p", { class: "contact-pref", text: contactHintLine(pref) }));
  }

  const notesParts = [];
  if (contact.notes) notesParts.push(["Your note", contact.notes]);
  if (contact.profileNotes && contact.profileNotes !== contact.notes)
    notesParts.push(["Host profile (B.a.B.)", contact.profileNotes]);
  for (const [label, text] of notesParts) {
    const p = el("p", { class: "contact-notes" });
    const s = el("strong", { text: `${label}: ` });
    p.appendChild(s);
    p.appendChild(document.createTextNode(text));
    card.appendChild(p);
  }

  const actions = el("div", { class: "contact-actions" });
  const d = digitsE164ish(contact.phone);
  if (d) {
    actions.appendChild(
      el("a", { class: "btn-action btn-action--primary", href: `tel:+${d}`, text: "Call" })
    );
    actions.appendChild(el("a", { class: "btn-action", href: `sms:+${d}`, text: "Text" }));
  }
  if (contact.email) {
    const { subject, body } = buildOutreach(contact, day, trip);
    const mail = `mailto:${contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    actions.appendChild(el("a", { class: "btn-action", href: mail, text: "Email (prefilled)" }));
  }
  if (contact.url) {
    actions.appendChild(
      el("a", {
        class: "btn-action",
        href: contact.url,
        text: "Website / book",
        target: "_blank",
        rel: "noopener noreferrer",
      })
    );
  }
  if (contact.contactPref === "text_whatsapp" && d) {
    actions.appendChild(
      el("a", {
        class: "btn-action",
        href: `https://wa.me/${d}`,
        text: "WhatsApp",
        target: "_blank",
        rel: "noopener noreferrer",
      })
    );
  }
  if (actions.childNodes.length) card.appendChild(actions);

  if (contact.infoOnly) {
    card.appendChild(
      el("p", {
        class: "contact-notes",
        text: "Profile: may be info / guided rides only — read their notes; don’t assume overnight space.",
      })
    );
  }

  if (contact.email || contact.phone) {
    const { subject, body } = buildOutreach(contact, day, trip);
    const od = el("details", { class: "outreach" });
    od.appendChild(el("summary", { text: "Draft message to send" }));
    od.appendChild(el("p", { class: "outreach__subject", text: `Subject: ${subject}` }));
    od.appendChild(el("pre", { class: "outreach__body", text: body }));
    const row = el("div", { class: "contact-actions" });
    const copyBtn = el("button", { class: "btn-copy", type: "button", text: "Copy message" });
    const toast = el("span", { class: "copy-toast", text: "", style: "display:none" });
    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(`${subject}\n\n${body}`);
        toast.textContent = "Copied";
        toast.style.display = "inline";
        setTimeout(() => {
          toast.textContent = "";
          toast.style.display = "none";
        }, 2000);
      } catch {
        toast.textContent = "Copy failed";
        toast.style.display = "inline";
      }
    });
    row.appendChild(copyBtn);
    row.appendChild(toast);
    od.appendChild(row);
    card.appendChild(od);
  }

  container.appendChild(card);
}

function renderOverviewSection(trip, dayCount) {
  const lead = document.getElementById("overview-lead");
  if (lead) lead.textContent = trip?.overviewLead || trip?.tagline || "";

  const stats = document.getElementById("overview-stats");
  if (stats) {
    stats.innerHTML = "";
    const start = trip?.startDate ? formatDate(trip.startDate) : "";
    const end = trip?.endDate ? formatDate(trip.endDate) : "";
    const dateLine = start && end ? `${start} → ${end}` : start || end;
    const daysLabel =
      typeof dayCount === "number" && dayCount > 0 ? `${dayCount} days` : "";
    [trip?.homeBase, dateLine, daysLabel].filter(Boolean).forEach((t) => {
      stats.appendChild(el("div", { class: "overview-stat-pill", text: t }));
    });
  }

  const legsEl = document.getElementById("overview-legs");
  if (legsEl && trip?.legs) {
    legsEl.innerHTML = "";
    [
      { key: "1", anchor: "day-1" },
      { key: "2", anchor: "day-9" },
      { key: "3", anchor: "day-24" },
    ].forEach(({ key, anchor }) => {
      const title = trip.legs[key];
      if (!title) return;
      const card = el("a", {
        class: "overview-leg-card",
        href: `#${anchor}`,
        title: "Jump to the first day of this leg",
      });
      card.appendChild(el("span", { class: "overview-leg-kicker", text: `Leg ${key}` }));
      card.appendChild(el("span", { class: "overview-leg-title", text: title }));
      card.appendChild(el("span", { class: "overview-leg-action", text: "Jump to daily plan ↓" }));
      legsEl.appendChild(card);
    });
  }

  const chipsBlock = document.getElementById("overview-chips-block");
  const chipsScroll = document.getElementById("overview-chips");
  if (chipsScroll && chipsBlock) {
    chipsScroll.innerHTML = "";
    (trip?.regionChips || []).forEach((label) => {
      chipsScroll.appendChild(el("span", { class: "region-chip", text: label }));
    });
    chipsBlock.hidden = !(trip.regionChips && trip.regionChips.length);
  }

  const plan = document.getElementById("overview-planning");
  if (plan) {
    plan.innerHTML = "";
    (trip?.planningChecklist || []).forEach((t) => plan.appendChild(el("li", { text: t })));
  }

  const summaryEl = document.getElementById("summary-text");
  if (summaryEl) summaryEl.textContent = trip?.summary || "";

  const ridersEl = document.getElementById("riders");
  if (ridersEl) {
    ridersEl.innerHTML = "";
    (trip?.riders || []).forEach((r) => {
      const card = el("div", { class: "rider-card" });
      card.appendChild(el("span", { class: "rider-card-ico", text: "🏍" }));
      const txt = el("div", { class: "rider-card-body" });
      txt.appendChild(el("strong", { class: "rider-card-name", text: r.name || "Rider" }));
      const sub = [r.bike, r.plate].filter(Boolean).join(" · ");
      if (sub) txt.appendChild(el("span", { class: "rider-card-meta", text: sub }));
      else txt.appendChild(el("span", { class: "rider-card-meta", text: "Add bike & plate in trip.json" }));
      card.appendChild(txt);
      ridersEl.appendChild(card);
    });
  }
}

function renderStayContacts(body, day, trip, babHostsMap) {
  const list = buildOrderedContacts(day, babHostsMap);
  if (!list.length) return;
  body.appendChild(el("h4", { class: "day-section-title day-stops-heading", text: "🏠 Stay & Bunk a Biker contacts" }));
  const wrap = el("div", { class: "contact-cards" });
  list.forEach((c) => renderContactCard(c, day, trip, wrap));
  body.appendChild(wrap);
}

function applyRouteOverlays(days, overlayPack) {
  if (!overlayPack?.byDay) return null;
  (days || []).forEach((day) => {
    const o = overlayPack.byDay[String(day.dayIndex)];
    if (!o) return;
    day.routeOverlay = o;
  });
  return overlayPack.meta || null;
}

function appendRouteMetrics(body, day) {
  const o = day.routeOverlay;
  if (!o?.mapsDirectionsUrl) return;
  const wrap = el("div", { class: "route-metrics" });
  const row = el("p", {
    class: "route-km-line",
    "data-route-km-line": String(day.dayIndex),
  });
  if (hasGoogleMapsApiKey()) {
    row.textContent = window.google?.maps?.DirectionsService
      ? "Loading distance from Google Maps…"
      : "Waiting for Google Maps…";
  } else {
    row.classList.add("muted");
    row.textContent =
      "Distances and weather load via Google Maps Platform (same GOOGLE_MAPS_API_KEY). Add the key to .env, run npm run build, or set it on Vercel — enable Maps JavaScript API + Directions API (Legacy) + Weather API. You can still open the link below.";
  }
  wrap.appendChild(row);
  wrap.appendChild(
    el("a", {
      class: "route-maps-link",
      href: o.mapsDirectionsUrl,
      target: "_blank",
      rel: "noopener noreferrer",
      text: "Open this leg in Google Maps (verify route, distance & time)",
    })
  );
  if (o.distanceNote) wrap.appendChild(el("p", { class: "route-distance-note", text: o.distanceNote }));
  const attrib = el("p", { class: "maps-platform-attribution" });
  attrib.appendChild(document.createTextNode("Route metrics from "));
  attrib.appendChild(
    el("a", {
      href: "https://developers.google.com/maps/documentation/javascript/directions",
      target: "_blank",
      rel: "noopener noreferrer",
      text: "Google Maps Platform — Directions",
    })
  );
  attrib.appendChild(document.createTextNode("."));
  wrap.appendChild(attrib);
  body.appendChild(wrap);
}

function appendDayRecommendations(body, day) {
  const recs = day.routeOverlay?.recommendations;
  if (!recs?.length) return;
  const sec = el("div", { class: "day-section day-recs" });
  sec.appendChild(
    el("h4", {
      class: "day-section-title",
      text: "💡 Nearby / same-day ideas (optional)",
    })
  );
  const ul = el("ul", { class: "rec-list" });
  recs.forEach((r) => {
    const li = document.createElement("li");
    if (r.url) {
      li.appendChild(
        el("a", {
          href: r.url,
          target: "_blank",
          rel: "noopener noreferrer",
          text: r.text,
        })
      );
    } else {
      li.textContent = r.text;
    }
    ul.appendChild(li);
  });
  sec.appendChild(ul);
  body.appendChild(sec);
}

function renderTrip(data, babHostsMap, routeMeta) {
  const { meta, trip, links, days, checklists, emergency, beforeYouGo } = data;
  setTripDisplayMeta(meta);

  document.title = meta?.title || trip?.name || "Trip";

  const h1 = document.getElementById("trip-name");
  const sub = document.getElementById("trip-sub");
  h1.textContent = trip?.name || "Trip";
  const start = trip?.startDate ? formatDate(trip.startDate) : "";
  const end = trip?.endDate ? formatDate(trip.endDate) : "";
  sub.textContent = [start && end ? `${start} — ${end}` : start || end, trip?.homeBase]
    .filter(Boolean)
    .join(" · ");

  renderHero(trip);

  renderOverviewSection(trip, days?.length);

  const discEl = document.getElementById("distance-disclaimer");
  if (discEl) {
    if (routeMeta?.disclaimer) {
      discEl.hidden = false;
      discEl.textContent = routeMeta.disclaimer;
    } else {
      discEl.hidden = true;
      discEl.textContent = "";
    }
  }

  const linksEl = document.getElementById("quick-links");
  linksEl.innerHTML = "";
  const linkDefs = [
    ["GPX / tracks", links?.gpxFolder],
    ["Shared map", links?.sharedMap],
    ["Weather", links?.weather],
    ["Bookings", links?.bookingFolder],
  ];
  linkDefs.forEach(([label, url]) => {
    const row = el("div", { class: "link-row" });
    row.appendChild(el("span", { text: label }));
    if (url) {
      row.appendChild(
        el("a", { href: url, text: "Open", target: "_blank", rel: "noopener noreferrer" })
      );
    } else {
      row.appendChild(el("a", { class: "empty", text: "Add URL in trip.json" }));
    }
    linksEl.appendChild(row);
  });

  renderGlanceTable(days, trip);

  const today = todayIsoLocal();
  const daysEl = document.getElementById("day-list");
  daysEl.innerHTML = "";
  (days || []).forEach((day) => {
    const isToday = day.date === today;
    const details = el("details", { class: "day", id: `day-${day.dayIndex}` });
    if (isToday) details.open = true;

    const summary = el("summary");
    summary.appendChild(el("span", { class: "day-title", text: `Day ${day.dayIndex}: ${day.title}` }));
    if (isToday) summary.appendChild(el("span", { class: "pill today", text: "Today" }));
    summary.appendChild(
      el("div", {
        class: "day-meta",
        "data-day-meta": String(day.dayIndex),
        text: formatDayMetaLine(day),
      })
    );

    const b = el("div", { class: "day-body" });

    const leg = day.leg || inferLeg(day.dayIndex);
    const legTitle = trip?.legs?.[leg] || "";
    const routeRow = el("div", { class: "day-route-row" });
    routeRow.appendChild(
      el("span", { class: "pill pill-leg", text: `Leg ${leg}`, title: legTitle })
    );
    if (day.difficulty) {
      routeRow.appendChild(el("span", { class: difficultyPillClass(day.difficulty), text: day.difficulty }));
    }
    b.appendChild(routeRow);
    if (day.routeLine) b.appendChild(el("div", { class: "day-route-line muted", text: day.routeLine }));
    appendRouteMetrics(b, day);
    if (hasGoogleMapsApiKey() && day.routeOverlay?.mapsDirectionsUrl) {
      b.appendChild(
        el("div", {
          class: "day-weather-slot",
          "data-day-weather": String(day.dayIndex),
          hidden: true,
        })
      );
    }
    appendDayRecommendations(b, day);

    if (day.highlights?.length) {
      const hlContent = day.highlights.length > 1 ? day.highlights : day.highlights[0];
      appendDayDetailSection(b, "✨", "Highlights", hlContent);
    }
    appendDayDetailSection(b, "⛽", "Fuel", day.fuelNotes);
    appendDayDetailSection(b, "🥘", "Food", day.foodNotes);
    appendDayDetailSection(b, "🌤", "Weather", day.weatherNotes);
    appendDayDetailSection(b, "📌", "Key notes", day.keyNotes);
    appendDayDetailSection(b, "⛺", "Camping & accommodation", day.campingAccommodation);
    if (day.terrain) appendDayDetailSection(b, "🛣", "Road / terrain", day.terrain);

    const stopList = day.stops || [];
    if (stopList.length) {
      b.appendChild(el("h4", { class: "day-section-title day-stops-heading", text: "📍 Stops & waypoints" }));
    }
    stopList.forEach((s) => {
      const type = TYPE_LABEL[s.type] || TYPE_LABEL.other;
      const stop = el("div", { class: "stop" });
      const head = el("div", { class: "stop-head" });
      head.appendChild(el("span", { class: "stop-type", text: type }));
      head.appendChild(el("span", { class: "stop-place", text: s.place || s.label || "Stop" }));
      if (s.time) head.appendChild(el("span", { class: "stop-time", text: s.time }));
      stop.appendChild(head);
      if (s.label && s.place && s.label !== s.place) {
        stop.appendChild(el("div", { class: "stop-notes", text: s.label }));
      }
      if (s.notes) stop.appendChild(el("div", { class: "stop-notes", text: s.notes }));
      if (s.mapsUrl) {
        stop.appendChild(
          el("a", {
            href: s.mapsUrl,
            text: "Maps",
            target: "_blank",
            rel: "noopener noreferrer",
          })
        );
      }
      b.appendChild(stop);
    });

    renderStayContacts(b, day, trip, babHostsMap);

    if (day.risks?.length) {
      const a = el("div", { class: "alert risk" });
      a.appendChild(document.createTextNode("Risks: "));
      a.appendChild(document.createTextNode(day.risks.join(" · ")));
      b.appendChild(a);
    }
    if (day.planB) {
      b.appendChild(el("div", { class: "alert planb", text: `Plan B: ${day.planB}` }));
    }

    details.appendChild(summary);
    details.appendChild(b);
    daysEl.appendChild(details);
  });

  const checkEl = document.getElementById("checklist-root");
  checkEl.innerHTML = "";
  const grid = el("div", { class: "check-grid" });
  const cols = [
    ["Documents", checklists?.documents],
    ["Bike", checklists?.bike],
    ["Riding gear", checklists?.ridingGear],
    ["Camp", checklists?.camp],
  ];
  cols.forEach(([title, items]) => {
    if (!items?.length) return;
    const col = el("div", { class: "check-col" });
    col.appendChild(el("h3", { text: title }));
    const ul = document.createElement("ul");
    items.forEach((t) => ul.appendChild(el("li", { text: t })));
    col.appendChild(ul);
    grid.appendChild(col);
  });
  checkEl.appendChild(grid);

  const beforeEl = document.getElementById("before-you-go");
  beforeEl.innerHTML = "";
  (beforeYouGo || []).forEach((t) => beforeEl.appendChild(el("li", { text: t })));

  const emergEl = document.getElementById("emergency-root");
  emergEl.innerHTML = "";
  const ec = el("div", { class: "card" });
  const lines = [
    emergency?.insurancePhone && `Insurance: ${emergency.insurancePhone}`,
    emergency?.roadside && `Roadside: ${emergency.roadside}`,
    emergency?.embassy && `Embassy / consulate: ${emergency.embassy}`,
    emergency?.bloodTypes && `Blood types: ${emergency.bloodTypes}`,
    emergency?.notes,
  ].filter(Boolean);
  lines.forEach((t) => ec.appendChild(el("p", { text: t })));
  if (emergency?.contacts?.length) {
    const ul = el("ul", { class: "contacts" });
    emergency.contacts.forEach((c) => {
      const bit = [c.name, c.relation, c.phone].filter(Boolean).join(" — ");
      ul.appendChild(el("li", { text: bit }));
    });
    ec.appendChild(ul);
  }
  emergEl.appendChild(ec);

  syncDayDetailsFromHash();
}

function syncDayDetailsFromHash() {
  const id = window.location.hash.slice(1);
  if (!id.startsWith("day-")) return;
  const node = document.getElementById(id);
  if (node && node.tagName === "DETAILS") node.open = true;
}

/** Highlights jump nav to match current section hash (falls back to Overview). */
function syncJumpNav() {
  const raw = window.location.hash.slice(1);
  const sectionIds = new Set(["overview", "glance", "days", "checklists", "before", "emergency", "links"]);
  const active = raw && sectionIds.has(raw) ? raw : "overview";
  document.querySelectorAll("nav.jump a").forEach((a) => {
    const href = a.getAttribute("href") || "";
    const id = href.startsWith("#") ? href.slice(1) : "";
    a.classList.toggle("is-active", id === active);
  });
}

async function main() {
  const banner = document.getElementById("load-error");
  try {
    const [tripRes, babRes, routeRes] = await Promise.all([
      fetch("data/trip.json", { cache: "no-store" }),
      fetch("data/bab-hosts.json", { cache: "no-store" }),
      fetch("data/route-overlays.json", { cache: "no-store" }),
    ]);
    if (!tripRes.ok) throw new Error(`trip.json HTTP ${tripRes.status}`);
    const data = await tripRes.json();
    let babHostsMap = {};
    if (babRes.ok) {
      const bab = await babRes.json();
      babHostsMap = bab.hosts || {};
    }
    let routeMeta = null;
    if (routeRes.ok) {
      const pack = await routeRes.json();
      routeMeta = applyRouteOverlays(data.days, pack);
    }
    renderTrip(data, babHostsMap, routeMeta);
    scheduleGoogleDistanceFetch(data.days, data.trip);
    syncJumpNav();
    window.addEventListener("hashchange", () => {
      syncDayDetailsFromHash();
      syncJumpNav();
    });
    banner.hidden = true;
  } catch (e) {
    banner.hidden = false;
    banner.textContent =
      "Could not load data. Use a local server from the project folder (e.g. python3 -m http.server) so data/trip.json, data/bab-hosts.json, and data/route-overlays.json load.";
    console.error(e);
  }
}

main();
