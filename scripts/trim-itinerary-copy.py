#!/usr/bin/env python3
"""
Trim verbose itinerary copy while keeping dates, routes, fees intent, and safety hooks.
Run from repo root: python3 scripts/trim-itinerary-copy.py
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

OLD_NPS_PASS = (
    "Non-U.S. citizens (2026): America the Beautiful annual pass for non-residents US$250 "
    "(digital: recreation.gov/pass) — covers standard entrance fees where accepted and waives "
    "the US$100/person non-resident surcharge at the 11 high-visitation parks when you show "
    "valid pass + photo ID (see nps.gov/aboutus/nonresident-fees.htm). U.S. resident pass remains US$80."
)
SHORT_NPS_PASS = (
    "Non-U.S. visitors: America the Beautiful annual pass US$250 (recreation.gov/pass) can waive "
    "add-on fees at busy NPS units with ID — confirm nps.gov/aboutus/nonresident-fees.htm before you go."
)


def clip_words(s: str, max_len: int) -> str:
    if len(s) <= max_len:
        return s
    cut = s[: max_len - 1]
    if " " in cut:
        return cut.rsplit(" ", 1)[0] + "…"
    return cut + "…"


def trim_trip(data: dict) -> None:
    trip = data["trip"]
    trip["statsChips"] = [c for c in trip.get("statsChips", []) if "One leg at a time" not in c]
    trip["planningChecklist"] = [
        "Confirm dates, host addresses, and camping bookings before you go.",
        "Lock each day’s Google Maps pins (especially TBD stays) so distances match your ride.",
        "Re-check smoke/AQI and dispersed-camping rules the week you stay — conditions change fast.",
    ]
    trip["overviewLead"] = (
        "36-day Canada–USA loop: northeast → Texas → west coast → Rockies → home through the plains."
    )
    trip["summary"] = (
        "Finger Lakes / NYC corridor, DC and Luray, Blue Ridge and Smokies, Tennessee to Texas, "
        "high plains to Four Corners, Utah parks, California coast, Oregon, Seattle, Yellowstone / Beartooth, "
        "then Great Lakes home to Ontario."
    )

    for day in data.get("days", []):
        ca = day.get("campingAccommodation")
        if isinstance(ca, str) and "Host contact (call" in ca:
            day["campingAccommodation"] = "Host contact is on the stay card below."

        if day.get("dayIndex") == 2:
            for alt in day.get("lodgingAlternatives") or []:
                if alt.get("name") == "Hither Hills State Park":
                    alt["notes"] = (
                        "Hither Hills SP (Montauk): book ReserveAmerica; non-resident rates higher; no pets; "
                        "21+ permit holder on site. Montauk is ~55–70 mi east of Southampton — "
                        "don’t combine with a west-LI host the same night."
                    )
            day["feesAndPasses"] = [
                "No federal park entrance on this routing.",
                "NYC / Hudson crossings: cashless tolls — register a plate or expect bill-by-mail.",
                "Hither Hills (optional): see parks.ny.gov/parks/hither-hills for rates, reservation fee, "
                "beach day-use, and generator/J-loop rules.",
                SHORT_NPS_PASS,
            ]

        fees = day.get("feesAndPasses")
        if not fees:
            continue
        new_fees = []
        for s in fees:
            if not isinstance(s, str):
                new_fees.append(s)
                continue
            if OLD_NPS_PASS in s or (
                s.startswith("Non-U.S. citizens (2026)") and len(s) > 180
            ):
                new_fees.append(SHORT_NPS_PASS)
            elif len(s) > 360:
                new_fees.append(clip_words(s, 340))
            else:
                new_fees.append(s)
        # De-dupe consecutive identical fee lines (after replacements)
        deduped = []
        for s in new_fees:
            if deduped and deduped[-1] == s:
                continue
            deduped.append(s)
        day["feesAndPasses"] = deduped

        rl = day.get("routeLine")
        if isinstance(rl, str) and len(rl) > 340:
            day["routeLine"] = clip_words(rl, 320)


def trim_content_creation(data: dict) -> None:
    meta = data.get("meta", {})
    meta["channelTheme"] = "DR650 road-trip documentary — accurate maps, verifiable facts, minimal filler."
    meta["tone"] = "Field-journal voice: what to film, what can go wrong, what the law actually says (verify at ride time)."

    for day in data.get("days", []):
        if day.get("hook"):
            day["hook"] = clip_words(day["hook"], 200)
        if day.get("storyArc"):
            day["storyArc"] = clip_words(day["storyArc"], 260)
        if day.get("culture"):
            day["culture"] = clip_words(day["culture"], 420)
        if day.get("cta"):
            day["cta"] = clip_words(day["cta"], 160)

        for key, nmax, smax in (
            ("shots", 6, None),
            ("facts", 5, 200),
            ("fieldGuide", 4, 200),
            ("talkingPoints", 3, 220),
            ("roadRules", 8, 240),
        ):
            arr = day.get(key)
            if not isinstance(arr, list):
                continue
            arr = arr[:nmax]
            if smax:
                arr = [clip_words(x, smax) if isinstance(x, str) else x for x in arr]
            day[key] = arr


def main() -> None:
    trip_path = ROOT / "data" / "trip.json"
    cc_path = ROOT / "data" / "content-creation.json"
    ro_path = ROOT / "data" / "route-overlays.json"

    trip = json.loads(trip_path.read_text(encoding="utf-8"))
    trim_trip(trip)
    trip_path.write_text(json.dumps(trip, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    cc = json.loads(cc_path.read_text(encoding="utf-8"))
    trim_content_creation(cc)
    cc_path.write_text(json.dumps(cc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    ro = json.loads(ro_path.read_text(encoding="utf-8"))
    ro["meta"]["disclaimer"] = (
        "Distances use Google Directions (no live traffic). Confirm each leg in Maps before you ride."
    )
    for _k, pack in (ro.get("byDay") or {}).items():
        if not isinstance(pack, dict):
            continue
        if isinstance(pack.get("distanceNote"), str) and len(pack["distanceNote"]) > 320:
            pack["distanceNote"] = clip_words(pack["distanceNote"], 300)
        recs = pack.get("recommendations")
        if isinstance(recs, list):
            pack["recommendations"] = recs[:3]
            for r in pack["recommendations"]:
                if isinstance(r, dict) and isinstance(r.get("text"), str) and len(r["text"]) > 140:
                    r["text"] = clip_words(r["text"], 130)
    ro_path.write_text(json.dumps(ro, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print("Wrote trimmed:", trip_path.relative_to(ROOT), cc_path.relative_to(ROOT), ro_path.relative_to(ROOT))


if __name__ == "__main__":
    main()
