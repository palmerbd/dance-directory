#!/usr/bin/env node
// ─── Tier 5 Google Places → WordPress Studio Pipeline ────────────────────────
// Targets: Chicago metro suburbs, Wisconsin, Nebraska/Iowa, Mississippi, Arkansas
//
// Usage (run from the dance-directory project root):
//   node scripts/fetch-studios-tier5.mjs
//
// Requires Node 18+. PLACES_API_KEY read from .env.local automatically.
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

const PLACES_KEY      = process.env.PLACES_API_KEY;
const WP_API_URL      = process.env.WP_API_URL     || "http://5.78.144.42/wp-json";
const PIPELINE_SECRET = process.env.PIPELINE_SECRET || "dance_pipeline_2026";

if (!PLACES_KEY) {
  console.error("❌  PLACES_API_KEY is not set in .env.local");
  process.exit(1);
}

// ── Tier 5 target cities ───────────────────────────────────────────────────────
// Chicago metro: multiple search centres to cover 150+ studios across the metro
// (downtown was already scraped at Tier 1 but only returned ~38 due to no pagination)
const CITIES = [
  // ── Chicago metro ────────────────────────────────────────────────────────────
  { name: "Chicago",           state: "IL", lat: 41.8781,  lng: -87.6298  },
  { name: "Chicago North",     state: "IL", lat: 41.9742,  lng: -87.6773  },  // Lincoln Square / Lakeview
  { name: "Evanston",          state: "IL", lat: 42.0451,  lng: -87.6877  },
  { name: "Schaumburg",        state: "IL", lat: 42.0334,  lng: -88.0834  },
  { name: "Naperville",        state: "IL", lat: 41.7508,  lng: -88.1535  },
  { name: "Joliet",            state: "IL", lat: 41.5250,  lng: -88.0817  },
  { name: "Oak Lawn",          state: "IL", lat: 41.7142,  lng: -87.7541  },
  { name: "Arlington Heights", state: "IL", lat: 42.0884,  lng: -87.9806  },
  { name: "Aurora",            state: "IL", lat: 41.7606,  lng: -88.3201  },
  { name: "Waukegan",          state: "IL", lat: 42.3636,  lng: -87.8448  },

  // ── Wisconsin ────────────────────────────────────────────────────────────────
  { name: "Milwaukee",         state: "WI", lat: 43.0389,  lng: -87.9065  },
  { name: "Madison",           state: "WI", lat: 43.0731,  lng: -89.4012  },
  { name: "Green Bay",         state: "WI", lat: 44.5133,  lng: -88.0133  },
  { name: "Racine",            state: "WI", lat: 42.7261,  lng: -87.7829  },
  { name: "Appleton",          state: "WI", lat: 44.2619,  lng: -88.4154  },

  // ── Nebraska + Iowa ──────────────────────────────────────────────────────────
  { name: "Omaha",             state: "NE", lat: 41.2565,  lng: -95.9345  },
  { name: "Lincoln",           state: "NE", lat: 40.8136,  lng: -96.7026  },
  { name: "Des Moines",        state: "IA", lat: 41.5868,  lng: -93.6250  },
  { name: "Cedar Rapids",      state: "IA", lat: 41.9779,  lng: -91.6656  },
  { name: "Iowa City",         state: "IA", lat: 41.6611,  lng: -91.5302  },
  { name: "Davenport",         state: "IA", lat: 41.5236,  lng: -90.5776  },

  // ── Mississippi ──────────────────────────────────────────────────────────────
  { name: "Jackson",           state: "MS", lat: 32.2988,  lng: -90.1848  },
  { name: "Hattiesburg",       state: "MS", lat: 31.3271,  lng: -89.2903  },
  { name: "Biloxi",            state: "MS", lat: 30.3960,  lng: -88.8853  },

  // ── Arkansas ─────────────────────────────────────────────────────────────────
  { name: "Fayetteville",      state: "AR", lat: 36.0626,  lng: -94.1574  },
  { name: "Rogers",            state: "AR", lat: 36.3320,  lng: -94.1185  },
  { name: "Little Rock",       state: "AR", lat: 34.7465,  lng: -92.2896  },
  { name: "Fort Smith",        state: "AR", lat: 35.3859,  lng: -94.3985  },
  { name: "Jonesboro",         state: "AR", lat: 35.8423,  lng: -90.7043  },
];

const RADIUS_METERS = 25000;   // tighter radius — more search points, less overlap

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
  if (n.includes("ballroom"))                       s.add("ballroom");
  if (n.includes("latin"))                          s.add("latin");
  if (n.includes("salsa"))                          s.add("salsa");
  if (n.includes("tango"))                          s.add("tango");
  if (n.includes("swing"))                          s.add("swing");
  if (n.includes("waltz"))                          s.add("waltz");
  if (n.includes("foxtrot"))                        s.add("foxtrot");
  if (n.includes("wedding"))                        s.add("wedding");
  if (n.includes("compet"))                         s.add("competitive");
  const chain = detectChain(name);
  if (chain === "fred_astaire" || chain === "arthur_murray") {
    ["ballroom","latin","wedding","competitive"].forEach(x => s.add(x));
  }
  if (chain === "dance_with_me") {
    ["ballroom","latin","salsa","tango","wedding"].forEach(x => s.add(x));
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

// ── Google Places API — with full pagination ───────────────────────────────────

async function nearbySearch(lat, lng, pageToken) {
  const p = new URLSearchParams({
    location: `${lat},${lng}`,
    radius:   String(RADIUS_METERS),
    type:     "dance_studio",
    key:      PLACES_KEY,
  });
  if (pageToken) p.set("pagetoken", pageToken);
  const r = await fetch(`https://maps.googleapis.com/maps/api/place/nearbysearch/json?${p}`);
  return r.json();
}

async function allNearby(lat, lng) {
  const results = [];
  let pageToken = null;
  let page = 1;

  do {
    if (pageToken) {
      // Google requires a 2-second delay before using next_page_token
      await new Promise(r => setTimeout(r, 2200));
    }
    const res = await nearbySearch(lat, lng, pageToken);
    if (!["OK","ZERO_RESULTS"].includes(res.status)) {
      console.warn(`      ⚠️  API status: ${res.status} — ${res.error_message || ""}`);
      break;
    }
    const batch = (res.results || []).filter(p => p.business_status !== "CLOSED_PERMANENTLY");
    results.push(...batch);
    console.log(`      page ${page}: ${batch.length} results`);
    pageToken = res.next_page_token || null;
    page++;
  } while (pageToken);

  return results;
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
  const addr   = parseAddr(place.address_components || []);
  const hours  = parseHours((place.opening_hours || {}).weekday_text || []);
  const styles = inferStyles(place.name);
  const city   = addr.city  || cityMeta.name;
  const state  = addr.state || cityMeta.state;

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
  console.log("🎵  Dance Studio Pipeline — Tier 5\n");
  console.log(`🗺️   Targets: Chicago metro (10 pts), Wisconsin, Nebraska/Iowa, Mississippi, Arkansas`);
  console.log(`📡  Radius: ${RADIUS_METERS / 1000}km per search point | Full 3-page pagination enabled\n`);

  // 1. Collect all places across all cities
  const allPlaces = [];
  const seenIds   = new Set();
  const regionTotals = {};

  for (const city of CITIES) {
    const region = city.state;
    console.log(`📍  Searching ${city.name}, ${city.state}...`);
    const places = await allNearby(city.lat, city.lng);

    let newCount = 0;
    for (const place of places) {
      if (seenIds.has(place.place_id)) continue;
      seenIds.add(place.place_id);
      allPlaces.push({ placeId: place.place_id, name: place.name, cityMeta: city });
      newCount++;
    }
    regionTotals[region] = (regionTotals[region] || 0) + newCount;
    console.log(`    ✓ ${newCount} new unique studios\n`);
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\n📦  ${allPlaces.length} unique places collected across all targets`);
  console.log("   By region:", Object.entries(regionTotals).map(([s, n]) => `${s}: ${n}`).join(" | "));
  console.log(`\n⬆️   Fetching details and posting to WordPress...\n`);

  // 2. Fetch details + post to WP
  let created = 0;
  let skipped = 0;
  let failed  = 0;
  const seenSlugs = new Set();

  for (const { placeId, name, cityMeta } of allPlaces) {
    const detailRes = await placeDetails(placeId);
    if (detailRes.status !== "OK") {
      console.log(`   ⚠️  Details failed for ${name}: ${detailRes.status}`);
      failed++;
      await new Promise(r => setTimeout(r, 300));
      continue;
    }

    const post = buildPost(detailRes.result, cityMeta);

    // Local slug dedup (WP pipeline also deduplicates by slug server-side)
    let slug = post.slug;
    if (seenSlugs.has(slug)) slug = `${slug}-${cityMeta.state.toLowerCase()}`;
    seenSlugs.add(slug);
    post.slug = slug;

    const res = await wpImport(post);
    if (res.ok) {
      const action = res.data?.status === "existing" ? "⏭️  exists" : "✅  created";
      console.log(`   ${action}: ${post.title} (${cityMeta.name}, ${cityMeta.state}) → ID ${res.data?.id}`);
      if (res.data?.status === "existing") skipped++; else created++;
    } else {
      console.log(`   ❌  ${post.title} — ${res.status}: ${JSON.stringify(res.data).slice(0, 120)}`);
      failed++;
    }

    await new Promise(r => setTimeout(r, 250));
  }

  console.log(`\n${"─".repeat(60)}`);
  console.log(`🎉  Tier 5 complete!`);
  console.log(`   Created : ${created}`);
  console.log(`   Skipped (existing): ${skipped}`);
  console.log(`   Failed  : ${failed}`);
  console.log(`   Total processed: ${created + skipped + failed}`);
  console.log(`\n💡  Next: run generate-taglines.ts on new studios, then update coverage-analysis.html`);
}

main().catch(err => { console.error("💥 Pipeline error:", err); process.exit(1); });
