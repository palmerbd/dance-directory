#!/usr/bin/env node
// ─── Google Places → WordPress Studio Pipeline ───────────────────────────────
// Queries Google Places API for dance studios in each target city,
// fetches full details per place, then posts them into WordPress
// via a custom pipeline endpoint (no HTTPS / Application Password required).
//
// Usage (run from the dance-directory project root):
//   node scripts/fetch-studios.mjs
//
// Requires Node 18+ (uses native fetch).
// PLACES_API_KEY and pipeline secret are read from .env.local automatically.
// ─────────────────────────────────────────────────────────────────────────────

import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Load .env.local ────────────────────────────────────────────────────────────
const envPath = resolve(__dirname, "../.env.local");
if (existsSync(envPath)) {
  const lines = readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
}

const PLACES_KEY     = process.env.PLACES_API_KEY;
const WP_API_URL     = process.env.WP_API_URL    || "http://5.78.144.42/wp-json";
const PIPELINE_SECRET = process.env.PIPELINE_SECRET || "dance_pipeline_2026";

if (!PLACES_KEY) {
  console.error("❌  PLACES_API_KEY is not set in .env.local");
  process.exit(1);
}

// ── Target cities ──────────────────────────────────────────────────────────────
const CITIES = [
  { name: "Los Angeles", state: "CA", lat: 34.0522,  lng: -118.2437 },
  { name: "Chicago",     state: "IL", lat: 41.8781,  lng: -87.6298  },
  { name: "Dallas",      state: "TX", lat: 32.7767,  lng:  -96.7970 },
  { name: "Miami",       state: "FL", lat: 25.7617,  lng:  -80.1918 },
  { name: "Houston",     state: "TX", lat: 29.7604,  lng:  -95.3698 },
];

const RADIUS_METERS = 30000;

// ── Helpers ────────────────────────────────────────────────────────────────────

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim()
            .replace(/\s+/g, "-").replace(/-+/g, "-");
}

function detectChain(name) {
  const n = name.toLowerCase();
  if (n.includes("fred astaire"))  return "fred_astaire";
  if (n.includes("arthur murray")) return "arthur_murray";
  if (n.includes("dance with me")) return "dance_with_me";
  return "independent";
}

function inferStyles(name) {
  const n = name.toLowerCase();
  const s = new Set();
  if (n.includes("ballroom"))                    s.add("ballroom");
  if (n.includes("latin"))                       s.add("latin");
  if (n.includes("salsa"))                       s.add("salsa");
  if (n.includes("tango"))                       s.add("tango");
  if (n.includes("swing"))                       s.add("swing");
  if (n.includes("waltz"))                       s.add("waltz");
  if (n.includes("foxtrot"))                     s.add("foxtrot");
  if (n.includes("cha cha") || n.includes("cha-cha")) s.add("cha_cha");
  if (n.includes("rumba"))                       s.add("rumba");
  if (n.includes("wedding"))                     s.add("wedding_dance");
  if (n.includes("compet"))                      s.add("competition");
  const chain = detectChain(name);
  if (chain === "fred_astaire" || chain === "arthur_murray") {
    ["ballroom","latin","wedding_dance","competition"].forEach(x => s.add(x));
  }
  if (chain === "dance_with_me") {
    ["ballroom","latin","salsa","tango","wedding_dance"].forEach(x => s.add(x));
  }
  if (s.size === 0) s.add("ballroom");
  return [...s];
}

function parseAddr(components = []) {
  const get = (type) => (components.find(c => c.types.includes(type)) || {}).long_name || "";
  return {
    street: [get("street_number"), get("route")].filter(Boolean).join(" "),
    city:   get("locality") || get("sublocality") || get("administrative_area_level_2"),
    state:  (components.find(c => c.types.includes("administrative_area_level_1")) || {}).short_name || "",
    zip:    get("postal_code"),
  };
}

function parseHours(weekdayText = []) {
  const days = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];
  const h = {};
  weekdayText.forEach((line, i) => {
    const val = line.split(": ").slice(1).join(": ").trim();
    if (val && val !== "Closed") h[days[i]] = val;
  });
  return h;
}

// ── Google Places API ──────────────────────────────────────────────────────────

async function nearbySearch(lat, lng, pageToken) {
  const p = new URLSearchParams({
    location: `${lat},${lng}`,
    radius: String(RADIUS_METERS),
    type: "dance_studio",
    key: PLACES_KEY,
  });
  if (pageToken) p.set("pagetoken", pageToken);
  const r = await fetch(`https://maps.googleapis.com/maps/api/place/nearbysearch/json?${p}`);
  return r.json();
}

async function placeDetails(placeId) {
  const fields = [
    "name","formatted_address","formatted_phone_number","website",
    "rating","user_ratings_total","url","opening_hours","address_components","business_status",
  ].join(",");
  const p = new URLSearchParams({ place_id: placeId, fields, key: PLACES_KEY });
  const r = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?${p}`);
  return r.json();
}

// ── WordPress pipeline endpoint ────────────────────────────────────────────────

async function wpImport(postData) {
  const res = await fetch(`${WP_API_URL}/pipeline/v1/import`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Pipeline-Secret": PIPELINE_SECRET,
    },
    body: JSON.stringify(postData),
  });
  const text = await res.text();
  try { return { ok: res.ok, status: res.status, data: JSON.parse(text) }; }
  catch { return { ok: res.ok, status: res.status, data: text }; }
}

function buildPost(place, cityMeta) {
  const addr  = parseAddr(place.address_components || []);
  const hours = parseHours((place.opening_hours || {}).weekday_text || []);
  const styles = inferStyles(place.name);
  const city  = addr.city  || cityMeta.name;
  const state = addr.state || cityMeta.state;

  return {
    title:   place.name,
    slug:    slugify(`${place.name}-${city}`),
    excerpt: `Private dance lessons in ${city}. ${styles.slice(0, 3).join(", ")}.`,
    acf: {
      studio_phone:           place.formatted_phone_number || "",
      studio_address_street:  addr.street,
      studio_address_city:    city,
      studio_address_state:   state,
      studio_address_zip:     addr.zip || "",
      studio_website:         place.website || "",
      studio_rating:          place.rating || null,
      studio_review_count:    place.user_ratings_total || null,
      studio_google_maps_url: place.url || "",
      studio_dance_styles:    styles,
      studio_hours_mon:       hours.monday    || "",
      studio_hours_tue:       hours.tuesday   || "",
      studio_hours_wed:       hours.wednesday || "",
      studio_hours_thu:       hours.thursday  || "",
      studio_hours_fri:       hours.friday    || "",
      studio_hours_sat:       hours.saturday  || "",
      studio_hours_sun:       hours.sunday    || "",
      studio_amenities:       ["private_lessons"],
    },
  };
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🎵  Dance Studio Pipeline\n");

  // 1. Collect all places
  const allPlaces = [];
  const seenIds   = new Set();

  for (const city of CITIES) {
    console.log(`📍  Searching ${city.name}, ${city.state}...`);
    const search = await nearbySearch(city.lat, city.lng);

    if (!["OK","ZERO_RESULTS"].includes(search.status)) {
      console.warn(`    ⚠️  API error: ${search.status} — ${search.error_message || ""}`);
      continue;
    }

    let count = 0;
    for (const place of (search.results || [])) {
      if (place.business_status === "CLOSED_PERMANENTLY") continue;
      if (seenIds.has(place.place_id)) continue;
      seenIds.add(place.place_id);
      allPlaces.push({ placeId: place.place_id, name: place.name, cityMeta: city });
      count++;
    }
    console.log(`    Found ${count} studios\n`);
    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`\n📦  ${allPlaces.length} unique places collected`);
  console.log(`⬆️   Fetching details and posting to WordPress...\n`);

  // 2. Fetch details + post to WP
  let created = 0;
  let failed  = 0;
  const seenSlugs = new Set();

  for (const { placeId, name, cityMeta } of allPlaces) {
    const detailRes = await placeDetails(placeId);
    if (detailRes.status !== "OK") {
      console.log(`   ⚠️  Details failed for ${name}: ${detailRes.status}`);
      failed++;
      continue;
    }

    const post = buildPost(detailRes.result, cityMeta);

    // Deduplicate slugs
    let slug = post.slug;
    if (seenSlugs.has(slug)) slug = `${slug}-${cityMeta.state.toLowerCase()}`;
    seenSlugs.add(slug);
    post.slug = slug;

    const res = await wpImport(post);
    if (res.ok) {
      console.log(`   ✅  ${post.title} (${cityMeta.name}) → ID ${res.data.id}`);
      created++;
    } else {
      console.log(`   ❌  ${post.title} — ${res.status}: ${JSON.stringify(res.data).slice(0, 100)}`);
      failed++;
    }

    await new Promise(r => setTimeout(r, 250));
  }

  console.log(`\n🎉  Done!  Created: ${created}  |  Failed: ${failed}`);
  if (created > 0) {
    console.log(`\n   ✅  Visit https://www.ballroomdancedirectory.com to see your real listings.`);
    console.log(`   💡  Remember to remove the pipeline endpoint from hello.php after import.`);
  }
}

main().catch(err => { console.error("💥 Pipeline error:", err); process.exit(1); });
