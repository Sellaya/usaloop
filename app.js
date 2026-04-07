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

function setTripDisplayMeta(meta) {
  tripDisplayMeta = { units: meta?.units === "imperial" ? "imperial" : "metric" };
}

function formatIntLocale(n) {
  if (n == null || Number.isNaN(n)) return "";
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(Math.round(n));
}

/** Driving km from Google → locale-formatted km + mi (trip meta.units picks primary). */
function formatDistanceKmMi(km) {
  if (km == null || Number.isNaN(km)) return null;
  const kmR = Math.round(km);
  const miR = Math.round(km / KM_PER_MI);
  const kmText = formatIntLocale(kmR);
  const miText = formatIntLocale(miR);
  const metricFirst = tripDisplayMeta.units !== "imperial";
  return {
    kmRounded: kmR,
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

/** Parse google.com/maps/dir URL for DirectionsService (same endpoints as the share link). */
function parseGoogleMapsDirectionsUrl(href) {
  try {
    const u = new URL(href);
    if (!u.pathname.includes("maps/dir")) return null;
    const origin = u.searchParams.get("origin");
    const destination = u.searchParams.get("destination");
    if (!origin?.trim() || !destination?.trim()) return null;
    const tm = (u.searchParams.get("travelmode") || "driving").toUpperCase();
    return {
      origin: decodeMapsDirectionsParam(origin),
      destination: decodeMapsDirectionsParam(destination),
      travelModeKey: tm,
    };
  } catch {
    return null;
  }
}

/** Directions request aligned with Maps JS API: metric units, locale, Canada bias for this tour. */
function buildDirectionsRequest(parsed, travelMode) {
  const U = window.google.maps.UnitSystem;
  const lang = (navigator.language || "en-CA").replace(/_/g, "-");
  return {
    origin: parsed.origin,
    destination: parsed.destination,
    travelMode,
    unitSystem: U.METRIC,
    language: lang,
    region: "ca",
  };
}

function directionsRouteOnce(svc, request) {
  return new Promise((resolve, reject) => {
    svc.route(request, (result, status) => {
      const leg = result?.routes?.[0]?.legs?.[0];
      const meters = leg?.distance?.value;
      if (status === "OK" && leg && meters != null) {
        resolve({
          meters,
          durationText: leg.duration?.text || "",
          durationSeconds: leg.duration?.value ?? 0,
        });
      } else {
        reject(new Error(status));
      }
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
          " — Google Maps Platform, Directions (driving, metric). Same endpoints as the link below; typical car routing (close to touring)."
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
  for (const day of list) {
    const href = day.routeOverlay.mapsDirectionsUrl;
    day.googleDurationText = null;
    day.googleDurationSeconds = null;
    const parsed = parseGoogleMapsDirectionsUrl(href);
    if (!parsed) {
      day.googleDistanceKm = null;
      day.googleDistanceError = "Unrecognized Maps URL";
      applyDayDistanceToDom(day);
      continue;
    }
    const travelMode = googleTravelModeFromKey(parsed.travelModeKey);
    if (!travelMode) {
      day.googleDistanceError = "Maps API not ready";
      applyDayDistanceToDom(day);
      continue;
    }

    try {
      const request = buildDirectionsRequest(parsed, travelMode);
      const { meters, durationText, durationSeconds } = await directionsRouteWithRetry(svc, request);
      day.googleDistanceKm = Math.round(meters / 1000);
      day.googleDurationText = durationText;
      day.googleDurationSeconds = durationSeconds;
      day.googleDistanceError = null;
    } catch (e) {
      day.googleDistanceKm = null;
      day.googleDistanceError = e?.message || "REQUEST_DENIED";
    }
    applyDayDistanceToDom(day);
    await new Promise((r) => setTimeout(r, 180));
  }
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
      hero.classList.remove("hero-route-total--muted");
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
      hero.classList.add("hero-route-total--muted");
      hero.textContent =
        "Full-route total: set GOOGLE_MAPS_API_KEY in .env (or Vercel env), run npm run build, reload.";
    }
    if (overview) {
      overview.hidden = false;
      overview.className = "overview-route-total muted";
      overview.textContent =
        "Full route uses Google Maps Platform (Directions). Add GOOGLE_MAPS_API_KEY to .env or Vercel, then deploy / npm run build.";
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
    const err =
      "Google Maps returned no distances. Check API key, billing, and that Maps JavaScript API + Directions API are enabled.";
    if (hero) {
      hero.hidden = false;
      hero.classList.add("hero-route-total--muted");
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
    hero.classList.remove("hero-route-total--muted");
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

function scheduleGoogleDistanceFetch(days) {
  if (!hasGoogleMapsApiKey()) {
    initRouteTotalsUI("nokey");
    return;
  }
  initRouteTotalsUI("loading");

  let fetchStarted = false;
  const run = async () => {
    if (fetchStarted) return;
    fetchStarted = true;
    try {
      await fetchGoogleDistancesForDays(days);
    } catch (err) {
      console.error("Google distance fetch:", err);
    } finally {
      updateTotalRouteDistanceUI(days);
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
      if (++attempts > 80) {
        window.clearInterval(id);
        updateTotalRouteDistanceUI(days);
      }
    }, 50);
  };

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
  const chips = el("div", { class: "hero-chips" });
  if (trip.bike) chips.appendChild(el("span", { class: "hero-chip", text: trip.bike }));
  (trip.statsChips || []).forEach((c) => chips.appendChild(el("span", { class: "hero-chip", text: c })));
  if (chips.childNodes.length) inner.appendChild(chips);
  if (trip.legs && typeof trip.legs === "object") {
    const legs = el("div", { class: "hero-legs" });
    ["1", "2", "3"].forEach((k) => {
      if (trip.legs[k]) legs.appendChild(el("div", { class: "hero-leg", text: `Leg ${k}: ${trip.legs[k]}` }));
    });
    if (legs.childNodes.length) inner.appendChild(legs);
  }
  inner.appendChild(
    el("div", {
      class: "hero-route-total",
      id: "hero-route-total",
      hidden: true,
      "aria-live": "polite",
    })
  );
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
  const body = `Hi ${gn},

I’m ${rider}, riding a long Toronto → USA motorcycle loop (adventure bike). I’m aiming to be in your area around ${dateLong} (${routeHint}) and found you through Bunk a Biker.

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
      "Distances load only via Google Maps Platform (Directions). Add GOOGLE_MAPS_API_KEY to .env, run npm run build, or set that variable on Vercel — then enable Maps JavaScript API + Directions API for the key. You can still open the link below.";
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
    scheduleGoogleDistanceFetch(data.days);
    window.addEventListener("hashchange", syncDayDetailsFromHash);
    banner.hidden = true;
  } catch (e) {
    banner.hidden = false;
    banner.textContent =
      "Could not load data. Use a local server from the project folder (e.g. python3 -m http.server) so data/trip.json, data/bab-hosts.json, and data/route-overlays.json load.";
    console.error(e);
  }
}

main();
