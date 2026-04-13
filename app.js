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
  const list = Array.isArray(children) ? children : children == null ? [] : [children];
  list.forEach((c) => {
    if (c == null) return;
    if (typeof c === "string") node.appendChild(document.createTextNode(c));
    else node.appendChild(c);
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

/** Drop Maps path junk (data=… blob, @lat,lng zoom, etc.) — not place names. */
function isMapsDirPathJunkSegment(decoded) {
  if (decoded == null || !String(decoded).trim()) return true;
  const s = String(decoded).trim();
  if (/^data=/i.test(s)) return true;
  if (/^@\s*[\d.,\-]+/.test(s)) return true;
  return false;
}

/**
 * Human place segments after /maps/dir/… in order (A/B/C → 3 stops).
 * Google often puts every stop in the path while also duplicating endpoints in ?origin=&destination=;
 * we must not return early on query only or we drop middle path stops.
 */
function extractMapsDirPathPlaces(pathname) {
  const parts = pathname.split("/").filter(Boolean);
  const dirIdx = parts.indexOf("dir");
  if (dirIdx < 0) return [];
  return parts
    .slice(dirIdx + 1)
    .map((s) => decodeMapsDirectionsParam(s))
    .filter((seg) => !isMapsDirPathJunkSegment(seg));
}

/** Parse google.com/maps/dir URL for DirectionsService (query + path; full multi-stop chain). */
function parseGoogleMapsDirectionsUrl(href) {
  try {
    const u = new URL(href);
    const h = u.hostname.toLowerCase();
    const hostOk =
      h === "google.com" ||
      h === "maps.google.com" ||
      h.endsWith(".google.com") ||
      /^maps\.google\./.test(h);
    if (!hostOk || !u.pathname.includes("/maps/dir")) return null;

    const tm = (u.searchParams.get("travelmode") || "driving").toUpperCase();
    const originQ = u.searchParams.get("origin")?.trim();
    const destQ = u.searchParams.get("destination")?.trim();
    const wpFromQuery = parseWaypointsFromMapsParam(u.searchParams.get("waypoints"));
    const pathPlaces = extractMapsDirPathPlaces(u.pathname);

    if (pathPlaces.length >= 3) {
      return {
        origin: pathPlaces[0],
        destination: pathPlaces[pathPlaces.length - 1],
        waypoints: pathPlaces.slice(1, -1).map((location) => ({ location, stopover: true })),
        travelModeKey: tm,
      };
    }

    if (pathPlaces.length === 2) {
      return {
        origin: pathPlaces[0],
        destination: pathPlaces[1],
        waypoints: wpFromQuery,
        travelModeKey: tm,
      };
    }

    if (originQ && destQ) {
      return {
        origin: decodeMapsDirectionsParam(originQ),
        destination: decodeMapsDirectionsParam(destQ),
        waypoints: wpFromQuery,
        travelModeKey: tm,
      };
    }

    return null;
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
        legCount: legs.length,
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

/** Fills the summary meta row with wrap-friendly chips (mobile-first). */
function renderDayMetaChips(container, day) {
  if (!container) return;
  container.replaceChildren();
  if (day.date) {
    container.appendChild(
      el("span", { class: "day-meta-chip day-meta-chip--date", text: formatDate(day.date) })
    );
  }
  if (day.googleDistanceKm != null) {
    const f = formatDistanceKmMi(day.googleDistanceKm);
    let t = f ? `~${f.shortLine}` : `~${day.googleDistanceKm} km`;
    if (day.googleDurationText) t += ` · ~${day.googleDurationText}`;
    container.appendChild(el("span", { class: "day-meta-chip day-meta-chip--route", text: t }));
  }
  if (day.seatTimeHours != null) {
    container.appendChild(
      el("span", { class: "day-meta-chip day-meta-chip--seat", text: `~${day.seatTimeHours} h seat` })
    );
  }
  if (day.terrain) {
    container.appendChild(el("span", { class: "day-meta-chip day-meta-chip--terrain", text: day.terrain }));
  }
  if (!container.childElementCount) {
    container.appendChild(
      el("span", { class: "day-meta-chip day-meta-chip--placeholder", text: "Open for route & notes" })
    );
  }
}

function applyDayDistanceToDom(day) {
  const kmCell = document.querySelector(`td[data-glance-km="${day.dayIndex}"]`);
  if (kmCell && hasGoogleMapsApiKey()) {
    if (day.googleDistanceKm != null) {
      const f = formatDistanceKmMi(day.googleDistanceKm);
      kmCell.textContent = f ? f.shortLine : String(day.googleDistanceKm);
      const tip = f ? `${f.primaryLine}` : "";
      const legHint =
        day.googleDirectionsLegCount != null && day.googleDirectionsLegCount > 1
          ? `${day.googleDirectionsLegCount} legs (${day.googleDirectionsLegCount + 1} stops)`
          : "";
      kmCell.title = [tip, legHint, day.googleDurationText ? `~${day.googleDurationText}` : ""]
        .filter(Boolean)
        .join(" · ");
    } else if (day.googleDistanceError) {
      kmCell.textContent = "—";
      kmCell.title = day.googleDistanceError;
    }
  }

  const meta = document.querySelector(`[data-day-meta="${day.dayIndex}"]`);
  if (meta) renderDayMetaChips(meta, day);

  const kmLine = document.querySelector(`p[data-route-km-line="${day.dayIndex}"]`);
  if (kmLine) {
    kmLine.classList.remove("muted");
    if (day.googleDistanceKm != null) {
      const f = formatDistanceKmMi(day.googleDistanceKm);
      kmLine.innerHTML = "";
      kmLine.appendChild(el("strong", { text: f ? `≈ ${f.primaryLine}` : `≈ ${day.googleDistanceKm} km` }));
      if (day.googleDurationText) {
        kmLine.appendChild(
          el("span", { class: "muted", text: ` · ~${day.googleDurationText}` })
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
      day.googleDirectionsLegCount = null;
      day.routeEndLat = null;
      day.routeEndLng = null;
      day.googleDistanceError = "Unrecognized Maps URL";
      applyDayDistanceToDom(day);
      continue;
    }
    const travelMode = googleTravelModeFromKey(parsed.travelModeKey);
    if (!travelMode) {
      day.googleDirectionsLegCount = null;
      day.routeEndLat = null;
      day.routeEndLng = null;
      day.googleDistanceError = "Maps API not ready";
      applyDayDistanceToDom(day);
      continue;
    }

    try {
      const request = buildDirectionsRequest(parsed, travelMode);
      const { meters, durationText, durationSeconds, endLat, endLng, legCount } = await directionsRouteWithRetry(
        svc,
        request
      );
      day.googleDistanceKm = Math.round(meters / 100) / 10;
      day.googleDurationText = durationText;
      day.googleDurationSeconds = durationSeconds;
      day.googleDistanceError = null;
      day.routeEndLat = endLat;
      day.routeEndLng = endLng;
      day.googleDirectionsLegCount = legCount ?? null;
    } catch (e) {
      day.googleDistanceKm = null;
      day.googleDirectionsLegCount = null;
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

/** Daily low / high for hero checkpoints (forecast day preferred; folds in current temp when helpful). */
function formatHeroCheckpointTempLine(cc, forecastDay) {
  const tmin = forecastDay?.minTemperature?.degrees;
  const tmax = forecastDay?.maxTemperature?.degrees;
  const tnow = cc?.temperature?.degrees;
  const hasMin = tmin != null && Number.isFinite(tmin);
  const hasMax = tmax != null && Number.isFinite(tmax);
  if (hasMin && hasMax) {
    let lo = Math.min(tmin, tmax);
    let hi = Math.max(tmin, tmax);
    if (tnow != null && Number.isFinite(tnow)) {
      lo = Math.min(lo, tnow);
      hi = Math.max(hi, tnow);
    }
    return `Low ${Math.round(lo)}°C · High ${Math.round(hi)}°C`;
  }
  if (tnow != null && Number.isFinite(tnow)) {
    return `Now ~${Math.round(tnow)}°C`;
  }
  if (hasMin || hasMax) {
    const a = hasMin ? Math.round(tmin) : "—";
    const b = hasMax ? Math.round(tmax) : "—";
    return `Low ${a}°C · High ${b}°C`;
  }
  return null;
}

const HERO_SEVERE_WEATHER_RE =
  /TORNADO|HURRICANE|TROPICAL|SEVERE|FUNNEL|WATERSPOUT|DUST\s*STORM|SMOKE|VOLCANIC|ASH|FLOOD|FLASH|BLIZZARD|ICE\s*STORM|EXTREME|THUNDERSTORM|LIGHTNING/i;

/** Storms, tornado-class conditions, and other high-salience hazards (plus merged riding-risk lines). */
function collectHeroImportantNotes(cc, forecastDay) {
  const out = [];
  const seen = new Set();
  const push = (line) => {
    const t = String(line || "").trim();
    if (!t || seen.has(t)) return;
    seen.add(t);
    out.push(t);
  };

  const considerCond = (wc) => {
    if (!wc) return;
    const type = (wc.type || "").toUpperCase();
    const desc = (wc.description?.text || "").trim();
    if (HERO_SEVERE_WEATHER_RE.test(type) || HERO_SEVERE_WEATHER_RE.test(desc)) {
      push(desc || type.replace(/_/g, " "));
      return;
    }
    if (/SNOW|ICE|HAIL|FREEZING|FOG|HAZE|MIST|SQUALL/i.test(type)) {
      push(desc || type.replace(/_/g, " "));
    }
  };

  if (cc) {
    considerCond(cc.weatherCondition);
  }

  if (forecastDay?.daytimeForecast) {
    considerCond(forecastDay.daytimeForecast.weatherCondition);
  }

  const riding = mergeRidingRiskLines(cc, forecastDay) || [];
  riding.forEach(push);

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
    applyDayWeatherToDom(day, trip || {});
  }

  applyHeroRouteWeather(days);
}

function scheduleRouteWeatherFetch(days, trip) {
  if (!hasGoogleMapsApiKey()) return;
  fetchAndRenderRouteWeather(days, trip || {}).catch((e) => {
    console.error("[Weather]", e);
    applyHeroRouteWeather(days);
  });
}

/** Up to three spread checkpoints: end of leg 1, mid-loop desert/west, end of leg 2 (PNW). */
function pickHeroWeatherAnchorDays(days) {
  const d = days || [];
  const lastOfLeg = (leg) => {
    const inLeg = d.filter((x) => inferLeg(x.dayIndex) === leg);
    return inLeg.reduce((best, x) => (!best || x.dayIndex > best.dayIndex ? x : best), null);
  };
  const leg1 = lastOfLeg("1");
  const leg2 = lastOfLeg("2");
  const mid =
    d.find((x) => x.dayIndex === 17) ||
    d.find((x) => x.dayIndex === 16) ||
    d.find((x) => x.dayIndex === Math.ceil(d.length / 2));
  const ordered = [leg1, mid, leg2].filter(Boolean);
  const seen = new Set();
  const out = [];
  for (const x of ordered) {
    if (seen.has(x.dayIndex)) continue;
    seen.add(x.dayIndex);
    out.push(x);
    if (out.length >= 3) break;
  }
  return out;
}

/** Hero strip: 3 checkpoints — always show low/high (or current); important hazards when present. */
function applyHeroRouteWeather(days) {
  const slot = document.getElementById("hero-route-weather");
  if (!slot) return;
  if (!hasGoogleMapsApiKey()) {
    slot.hidden = true;
    slot.replaceChildren();
    slot.removeAttribute("role");
    slot.removeAttribute("aria-label");
    return;
  }

  const anchors = pickHeroWeatherAnchorDays(days);
  slot.replaceChildren();

  if (!anchors.length) {
    slot.hidden = true;
    return;
  }

  slot.hidden = false;
  slot.setAttribute("role", "region");
  slot.setAttribute("aria-label", "Route checkpoint weather");

  slot.appendChild(
    el("p", {
      class: "hero-route-weather__label",
      text: "Route weather · 3 checkpoints",
    })
  );
  slot.appendChild(
    el("p", {
      class: "hero-route-weather__sub",
      text: "Low / high from forecast (or current temp if range missing). Important hazards called out below when reported.",
    })
  );

  const ul = el("ul", { class: "hero-route-weather__alerts" });
  const linkPlaces = [];

  for (const day of anchors) {
    const place = legDestinationPlaceLabel(day);
    linkPlaces.push(place);
    const gw = day.googleWeather;
    const li = el("li", { class: "hero-route-weather__alert" });
    const head = el("div", { class: "hero-route-weather__row-head" });
    head.appendChild(el("span", { class: "hero-route-weather__where", text: `${place} · Day ${day.dayIndex}` }));
    li.appendChild(head);

    if (!gw?.current && !gw?.forecastDay) {
      li.appendChild(
        el("p", {
          class: "hero-route-weather__temps hero-route-weather__temps--missing",
          text:
            day.routeEndLat == null
              ? "Temps: — (route still loading)"
              : "Temps: — (no snapshot — reload or check key)",
        })
      );
      ul.appendChild(li);
      continue;
    }

    const tempLine = formatHeroCheckpointTempLine(gw.current, gw.forecastDay);
    li.appendChild(
      el("p", {
        class: "hero-route-weather__temps",
        text: tempLine || "Temps: —",
      })
    );

    const notes = collectHeroImportantNotes(gw.current, gw.forecastDay);
    if (notes?.length) {
      const imp = el("ul", { class: "hero-route-weather__important" });
      notes.forEach((line) => imp.appendChild(el("li", { text: line })));
      li.appendChild(imp);
    }

    ul.appendChild(li);
  }

  slot.appendChild(ul);

  const linkRow = el("p", { class: "hero-route-weather__links" });
  linkRow.appendChild(document.createTextNode("Forecasts: "));
  linkPlaces.forEach((p, i) => {
    if (i > 0) linkRow.appendChild(document.createTextNode(" · "));
    linkRow.appendChild(
      el("a", {
        class: "hero-route-weather__link",
        href: tenDayWeatherForecastSearchUrl(p),
        target: "_blank",
        rel: "noopener noreferrer",
        text: p,
      })
    );
  });
  slot.appendChild(linkRow);
}

function applyDayWeatherToDom(day, trip) {
  const slot = document.querySelector(`[data-day-weather="${day.dayIndex}"]`);
  if (!slot) return;
  const gw = day.googleWeather;
  if (!gw?.current && !gw?.forecastDay) {
    slot.hidden = true;
    slot.innerHTML = "";
    return;
  }

  const place = legDestinationPlaceLabel(day);
  const bikeLabel = trip?.bike || "Suzuki DR650";

  slot.hidden = false;
  slot.innerHTML = "";
  const wrap = el("div", { class: "day-weather-google" });
  wrap.appendChild(
    el("h4", {
      class: "day-section-title",
      text: `🌤 Weather at ${place}`,
    })
  );
  wrap.appendChild(
    el("p", {
      class: "day-weather-google__subhead muted",
      text: `${place} · ${formatDate(day.date)}`,
    })
  );

  const cc = gw.current;
  if (cc) {
    const obs = formatCurrentObservedAt(cc);
    const tz = gw.timeZoneId || cc.timeZone?.id || "";
    wrap.appendChild(
      el("p", {
        class: "day-weather-google__label",
        text: `Current · ${place}`,
      })
    );
    wrap.appendChild(
      el("p", {
        class: "day-weather-google__meta muted",
        text: [obs ? `Observed ${obs}` : null, tz || null].filter(Boolean).join(" · "),
      })
    );
    wrap.appendChild(
      el("p", {
        class: "day-weather-google__body day-weather-google__body--current",
        text: formatCurrentConditionsSummary(cc) || "—",
      })
    );
  }

  const fd = gw.forecastDay;
  if (fd) {
    const d = fd.daytimeForecast;
    const rideMatched = gw.rideDateMatched === true;
    const fcIso = forecastDayToIso(fd);
    const fcLabel = fcIso ? formatDate(fcIso) : "next day";
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
        text: `Next-day outlook · ${place}`,
      })
    );
    wrap.appendChild(
      el("p", {
        class: "day-weather-google__meta muted",
        text: rideMatched ? `Forecast ${fcLabel} (ride day)` : `Forecast ${fcLabel}`,
      })
    );
    wrap.appendChild(el("p", { class: "day-weather-google__body", text: parts.join(" · ") }));
  }

  const merged = mergeRidingRiskLines(cc, fd);
  if (merged?.length) {
    const warn = el("div", {
      class: "day-weather-warnings",
      role: "region",
      "aria-label": `Riding weather watch for ${place}`,
    });
    warn.appendChild(
      el("p", {
        class: "day-weather-warnings__title",
        text: `⚠ When riding near ${place} (${bikeLabel})`,
      })
    );
    warn.appendChild(
      el("p", {
        class: "day-weather-warnings__intro muted",
        text: "Check wind, rain, and temperature before you ride.",
      })
    );
    const ul = el("ul", { class: "day-weather-warnings__list" });
    merged.forEach((line) => {
      ul.appendChild(el("li", { class: "day-weather-warnings__item", text: line }));
    });
    warn.appendChild(ul);
    wrap.appendChild(warn);
  }

  slot.appendChild(wrap);
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
      hero.textContent = "Full route: loading from Google Maps…";
    }
    if (overview) {
      overview.hidden = false;
      overview.className = "overview-route-total overview-route-total--loading muted";
      overview.textContent = "Loading route totals…";
    }
    if (tfoot) tfoot.hidden = false;
    if (tkm) {
      tkm.textContent = "…";
      tkm.title = "";
    }
    if (tnote) tnote.textContent = "Updates when all legs finish.";
    return;
  }

  if (phase === "nokey") {
    const heroWx = document.getElementById("hero-route-weather");
    if (heroWx) {
      heroWx.hidden = true;
      heroWx.replaceChildren();
    }
    if (hero) {
      hero.hidden = false;
      hero.classList.add("hero-route-total--muted", "hero-route-total--setup");
      hero.innerHTML = "";
      hero.appendChild(el("strong", { text: "Route totals need GOOGLE_MAPS_API_KEY" }));
      const hint = el("div", { class: "hero-route-total-setup" });
      hint.appendChild(
        el("p", {
          class: "hero-route-total-setup__line",
          text: "Add the key in .env (npm run dev) or Vercel env. Enable Maps JavaScript, Directions (Legacy), and Weather; billing on.",
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
          text: "Set GOOGLE_MAPS_API_KEY and reload for distances, totals, and weather.",
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
    const heroWx = document.getElementById("hero-route-weather");
    if (heroWx) {
      heroWx.hidden = true;
      heroWx.replaceChildren();
    }
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
    hero.appendChild(el("span", { class: "hero-route-total-note", text: ` ${coverage}` }));
  }

  if (overview && fmt) {
    overview.hidden = false;
    overview.className = "overview-route-total";
    overview.innerHTML = "";
    overview.appendChild(el("div", { class: "overview-route-total-title", text: "Full route distance" }));
    const line = el("p", { class: "overview-route-total-km" });
    line.appendChild(el("strong", { text: fmt.primaryLine }));
    line.appendChild(
      document.createTextNode(" — sum of each day’s driving distance (no live traffic).")
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
    tkm.title = fmt ? fmt.primaryLine : "";
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

/** Final stop name for this day’s title (weather applies to route end there). */
function legDestinationPlaceLabel(day) {
  if (!day?.title) return "this leg’s destination";
  const parts = day.title
    .split("→")
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  if (!parts.length) return "this leg’s destination";
  return parts[parts.length - 1];
}

/** Opens a Google results page with a 10-day-style weather panel for the place. */
function tenDayWeatherForecastSearchUrl(place) {
  const q = `10 day weather forecast ${place}`;
  return `https://www.google.com/search?q=${encodeURIComponent(q)}`;
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
      id: "hero-route-weather",
      class: "hero-route-weather",
      hidden: true,
      "aria-live": "polite",
    })
  );
  foot.appendChild(
    el("div", {
      class: "hero-route-total",
      id: "hero-route-total",
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

/** Long mailto: URLs often fail silently in Chrome/Arc/macOS (handler / length limits). */
const MAILTO_SAFE_MAX_LEN = 1800;

function buildMailtoHref(email, subject, body) {
  const q = new URLSearchParams();
  q.set("subject", subject);
  q.set("body", body);
  const withQuery = `mailto:${email}?${q.toString()}`;
  if (withQuery.length <= MAILTO_SAFE_MAX_LEN) return withQuery;
  const subOnly = `mailto:${email}?${new URLSearchParams({ subject }).toString()}`;
  return subOnly;
}

/** Opens Gmail in the browser; truncates body if the URL would exceed a safe length. */
function buildGmailComposeUrl(email, subject, body) {
  const prefix = "https://mail.google.com/mail/?view=cm&fs=1&";
  const suffix = "\n\n[… truncated — use “Copy message” below for the full draft.]";
  let slice = body;
  for (let i = 0; i < 24; i++) {
    const p = new URLSearchParams();
    p.set("to", email);
    p.set("su", subject);
    p.set("body", slice);
    const url = prefix + p.toString();
    if (url.length <= 2000) return url;
    slice = slice.slice(0, Math.max(0, Math.floor(slice.length * 0.75))) + suffix;
  }
  const p = new URLSearchParams();
  p.set("to", email);
  p.set("su", subject);
  p.set("body", suffix.trim());
  return prefix + p.toString();
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
    const mailHref = buildMailtoHref(contact.email, subject, body);
    const mailBtn = el("a", {
      class: "btn-action",
      href: mailHref,
      text: mailHref.includes("&body=") ? "Email app (prefilled)" : "Email app (subject only)",
      title:
        mailHref.includes("&body=")
          ? "Opens your default mail app with subject and body"
          : "Opens your default mail app with subject only — full draft is in “Draft message” below (use Copy message)",
    });
    actions.appendChild(mailBtn);
    actions.appendChild(
      el("a", {
        class: "btn-action btn-action--webmail",
        href: buildGmailComposeUrl(contact.email, subject, body),
        text: "Gmail (browser)",
        target: "_blank",
        rel: "noopener noreferrer",
        title: "Compose in Gmail in this browser (Google account)",
      })
    );
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
    row.textContent = "Add GOOGLE_MAPS_API_KEY to load distance and weather. You can still open Maps below.";
  }
  wrap.appendChild(row);
  wrap.appendChild(
    el("a", {
      class: "route-maps-link",
      href: o.mapsDirectionsUrl,
      target: "_blank",
      rel: "noopener noreferrer",
      text: "Open in Google Maps",
    })
  );
  const destPlace = legDestinationPlaceLabel(day);
  wrap.appendChild(
    el("p", { class: "route-forecast-row" }, [
      el("a", {
        class: "route-maps-link",
        href: tenDayWeatherForecastSearchUrl(destPlace),
        target: "_blank",
        rel: "noopener noreferrer",
        text: `10-day forecast: ${destPlace}`,
      }),
    ])
  );
  if (o.distanceNote) wrap.appendChild(el("p", { class: "route-distance-note", text: o.distanceNote }));
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
  const { meta, trip, links, days, checklists } = data;
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
  if (linksEl) linksEl.innerHTML = "";
  const linkDefs = [
    ["GPX / tracks", links?.gpxFolder],
    ["Weather", links?.weather],
  ];
  if (linksEl) {
    linkDefs.forEach(([label, url]) => {
      const row = el("div", { class: "link-row" });
      row.appendChild(el("span", { text: label }));
      const href = typeof url === "string" ? url.trim() : "";
      if (href) {
        row.appendChild(
          el("a", { href, text: "Open", target: "_blank", rel: "noopener noreferrer" })
        );
      } else {
        row.appendChild(el("span", { class: "link-row-missing muted", text: "Add URL in trip.json (links)" }));
      }
      linksEl.appendChild(row);
    });
  }

  renderGlanceTable(days, trip);

  const today = todayIsoLocal();
  const daysEl = document.getElementById("day-list");
  daysEl.innerHTML = "";
  (days || []).forEach((day) => {
    const isToday = day.date === today;
    const details = el("details", { class: "day", id: `day-${day.dayIndex}` });
    if (isToday) details.open = true;

    const leg = day.leg || inferLeg(day.dayIndex);
    const legTitle = trip?.legs?.[leg] || "";

    const summary = el("summary", { class: "day-summary" });
    const main = el("div", { class: "day-summary-main" });
    const titleRow = el("div", { class: "day-summary-title-row" });
    titleRow.appendChild(el("span", { class: "day-index-badge", text: String(day.dayIndex) }));
    titleRow.appendChild(el("span", { class: "day-title", text: day.title }));
    if (isToday) titleRow.appendChild(el("span", { class: "pill today", text: "Today" }));
    main.appendChild(titleRow);
    main.appendChild(
      el("div", { class: "day-summary-meta-row" }, [
        el("span", { class: "pill pill-leg pill-leg--compact", text: `Leg ${leg}`, title: legTitle }),
      ])
    );
    const metaChips = el("div", {
      class: "day-meta-chips",
      "data-day-meta": String(day.dayIndex),
    });
    renderDayMetaChips(metaChips, day);
    main.appendChild(metaChips);
    summary.appendChild(main);
    summary.appendChild(el("span", { class: "day-summary-chevron", "aria-hidden": "true" }));

    const b = el("div", { class: "day-body" });

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

  syncDayDetailsFromHash();
}

function syncDayDetailsFromHash() {
  const id = window.location.hash.slice(1);
  if (!id.startsWith("day-")) return;
  const node = document.getElementById(id);
  if (node && node.tagName === "DETAILS") node.open = true;
}

/** Render the YouTube content-creation guide section. */
function renderContentCreation(ccData) {
  const root = document.getElementById("content-list");
  if (!root || !ccData?.days?.length) return;
  root.innerHTML = "";

  ccData.days.forEach((day) => {
    const card = el("details", { class: "cc-card" });

    // Summary row
    const sum = el("summary");
    sum.appendChild(el("span", { class: "cc-day-badge", text: `Day\n${day.dayIndex}` }));
    const sumText = el("div", { class: "cc-summary-text" });
    sumText.appendChild(el("div", { class: "cc-video-title", text: day.videoTitle || `Day ${day.dayIndex}` }));
    const previewLine = day.fieldGuide?.[0] || day.hook || "";
    if (previewLine) {
      sumText.appendChild(el("div", { class: "cc-hook-preview", text: previewLine }));
    }
    sum.appendChild(sumText);
    sum.appendChild(el("span", { class: "cc-chevron", text: "›" }));
    card.appendChild(sum);

    const body = el("div", { class: "cc-body" });

    // Helper to create a labelled section
    const addSection = (modClass, label, contentFn) => {
      const s = el("div", { class: `cc-section cc-section--${modClass}` });
      s.appendChild(el("div", { class: "cc-section-label", text: label }));
      contentFn(s);
      body.appendChild(s);
    };

    if (day.fieldGuide?.length) {
      addSection("fieldguide", "Field notes — technique & story spine", (s) => {
        const ul = el("ul", { class: "cc-field-guide" });
        day.fieldGuide.forEach((item) => ul.appendChild(el("li", { text: item })));
        s.appendChild(ul);
      });
    }

    if (day.hook) {
      addSection("hook", "Cold open (VO)", (s) => {
        s.appendChild(el("p", { class: "cc-hook-text", text: day.hook }));
      });
    }

    if (day.storyArc) {
      addSection("arc", "Episode structure (acts)", (s) => {
        s.appendChild(el("p", { class: "cc-arc-text", text: day.storyArc }));
      });
    }

    if (day.roadRules?.length) {
      addSection("roadrules", "Road & legal awareness (this day)", (s) => {
        const ul = el("ul", { class: "cc-list cc-road-rules" });
        day.roadRules.forEach((item) => ul.appendChild(el("li", { text: item })));
        s.appendChild(ul);
      });
    }

    // Grid: shots + talking points
    const grid = el("div", { class: "cc-grid" });

    if (day.shots?.length) {
      const s = el("div", { class: "cc-section cc-section--shots" });
      s.appendChild(el("div", { class: "cc-section-label", text: "Camera & sound coverage" }));
      const ul = el("ul", { class: "cc-list" });
      day.shots.forEach((item) => ul.appendChild(el("li", { text: item })));
      s.appendChild(ul);
      grid.appendChild(s);
    }

    if (day.talkingPoints?.length) {
      const s = el("div", { class: "cc-section cc-section--talk" });
      s.appendChild(el("div", { class: "cc-section-label", text: "VO & narration beats" }));
      const ul = el("ul", { class: "cc-list" });
      day.talkingPoints.forEach((item) => ul.appendChild(el("li", { text: item })));
      s.appendChild(ul);
      grid.appendChild(s);
    }

    if (grid.children.length) body.appendChild(grid);

    // Facts
    if (day.facts?.length) {
      addSection("facts", "Verified facts (say dates & units)", (s) => {
        const ul = el("ul", { class: "cc-list" });
        day.facts.forEach((item) => ul.appendChild(el("li", { text: item })));
        s.appendChild(ul);
      });
    }

    // Culture
    if (day.culture) {
      addSection("culture", "Place, land & politics", (s) => {
        s.appendChild(el("p", { class: "cc-culture-text", text: day.culture }));
      });
    }

    // CTA
    if (day.cta) {
      addSection("cta", "Outro / audience beat", (s) => {
        s.appendChild(el("div", { class: "cc-cta-box", text: day.cta }));
      });
    }

    card.appendChild(body);
    root.appendChild(card);
  });
}

/** Homework tab: mechanics resources, trip toolkit, regional risk briefing. */
function renderHomework(data) {
  const root = document.getElementById("homework-root");
  if (!root || !data) return;
  root.innerHTML = "";

  const meta = data.meta || {};
  const mech = data.mechanics || {};
  const risks = data.routeRisks || {};

  root.appendChild(
    el("div", { class: "homework-disclaimer", role: "note" }, [
      el("p", {}, [el("strong", { text: "Important. " }), meta.disclaimer || ""]),
    ])
  );

  root.appendChild(el("h3", { class: "homework-part-title", text: "Part 1 — Your bike, the internet, and this trip" }));
  root.appendChild(el("p", { class: "muted homework-lead", text: mech.introduction || "" }));

  const seqWrap = el("div", { class: "homework-seq" });
  (mech.maintenanceSequence || []).forEach((step) => {
    const card = el("article", { class: "homework-step" });
    card.appendChild(el("h4", { class: "homework-step-title", text: `${step.order}. ${step.title}` }));
    card.appendChild(el("p", { text: step.detail || "" }));
    if (step.dr650Notes) {
      card.appendChild(el("p", { class: "homework-dr-note", text: `DR650 focus: ${step.dr650Notes}` }));
    }
    seqWrap.appendChild(card);
  });
  root.appendChild(seqWrap);

  root.appendChild(el("h4", { class: "homework-subh", text: "Online manuals, forums, and networks" }));
  const resUl = el("ul", { class: "homework-link-list" });
  (mech.onlineResources || []).forEach((r) => {
    const li = document.createElement("li");
    li.appendChild(el("a", { href: r.url, target: "_blank", rel: "noopener noreferrer", text: r.name || r.url }));
    li.appendChild(document.createTextNode(` — ${r.useFor || ""}`));
    resUl.appendChild(li);
  });
  root.appendChild(resUl);

  root.appendChild(el("h4", { class: "homework-subh", text: "Finding a mechanic along your corridor" }));
  root.appendChild(
    el("p", {
      class: "muted",
      text: "No public database lists every independent shop; combine search, phone calls, and rider forums.",
    })
  );
  const acUl = el("ul", { class: "homework-anchors" });
  (mech.routeAnchorCities || []).forEach((a) => {
    acUl.appendChild(
      el("li", {}, [el("strong", { text: `${a.area}: ` }), document.createTextNode(a.hint || "")])
    );
  });
  root.appendChild(acUl);

  const tt = mech.tripToolkit || {};
  root.appendChild(el("h4", { class: "homework-subh", text: "Trip toolkit & spares (this route)" }));
  root.appendChild(el("p", { class: "muted", text: tt.intro || "" }));
  (tt.categories || []).forEach((cat) => {
    const det = el("details", { class: "homework-toolkit" });
    det.appendChild(el("summary", { text: cat.name || "Kit" }));
    const ul = el("ul", { class: "homework-bullets" });
    (cat.items || []).forEach((item) => ul.appendChild(el("li", { text: item })));
    det.appendChild(ul);
    root.appendChild(det);
  });

  root.appendChild(
    el("h3", {
      class: "homework-part-title",
      text: "Part 2 — Region by region: people, weather, bike, wildlife, gaps",
    })
  );
  root.appendChild(el("p", { class: "muted homework-lead", text: risks.introduction || "" }));

  (risks.regions || []).forEach((reg) => {
    const det = el("details", { class: "homework-region" });
    det.appendChild(el("summary", { class: "homework-region-sum", text: reg.name || "Region" }));
    const body = el("div", { class: "homework-region-body" });

    function sub(label, items) {
      if (!items?.length) return;
      body.appendChild(el("h5", { class: "homework-risk-h", text: label }));
      const ul = el("ul", { class: "homework-bullets" });
      items.forEach((t) => ul.appendChild(el("li", { text: t })));
      body.appendChild(ul);
    }

    sub("People & social friction", reg.people);
    sub("Weather & environment", reg.weather);
    sub("Motorbike / machine", reg.bike);
    sub("Wildlife & animals", reg.wildlife);
    sub("Easily overlooked", reg.other);

    det.appendChild(body);
    root.appendChild(det);
  });

  root.appendChild(
    el("p", {
      class: "muted homework-foot",
      text: `Last content review: ${meta.lastReviewed || "—"}. Layer in host advice, NPS alerts, and local news the week you ride.`,
    })
  );
}

/** Highlights jump nav to match current section hash (falls back to Overview). */
function syncJumpNav() {
  const raw = window.location.hash.slice(1);
  const sectionIds = new Set([
    "overview",
    "glance",
    "days",
    "content",
    "homework",
    "checklists",
    "links",
  ]);
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
    const [tripRes, babRes, routeRes, ccRes, hwRes] = await Promise.all([
      fetch("data/trip.json", { cache: "no-store" }),
      fetch("data/bab-hosts.json", { cache: "no-store" }),
      fetch("data/route-overlays.json", { cache: "no-store" }),
      fetch("data/content-creation.json", { cache: "no-store" }),
      fetch("data/homework.json", { cache: "no-store" }),
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
    if (ccRes.ok) {
      const ccData = await ccRes.json();
      renderContentCreation(ccData);
    }
    if (hwRes.ok) {
      try {
        const hwData = await hwRes.json();
        renderHomework(hwData);
      } catch (hwErr) {
        console.warn("homework.json parse failed", hwErr);
        const hr = document.getElementById("homework-root");
        if (hr) hr.appendChild(el("p", { class: "muted", text: "Homework data could not be read." }));
      }
    } else {
      const hr = document.getElementById("homework-root");
      if (hr) hr.appendChild(el("p", { class: "muted", text: "Homework data did not load (check data/homework.json)." }));
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
