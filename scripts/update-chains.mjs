#!/usr/bin/env node
/**
 * update-chains.mjs
 *
 * Batch-updates the ACF `studio_type` field in WordPress for all dance studios
 * based on name-matching against the three major chains.
 *
 * Usage:
 *   node scripts/update-chains.mjs
 *   node scripts/update-chains.mjs --dry-run     (shows changes without saving)
 *
 * Requires WP_USER and WP_APP_PASSWORD in the environment (Application Password):
 *   WP_USER=danceadmin
 *   WP_APP_PASSWORD="xxxx xxxx xxxx xxxx xxxx xxxx"
 *
 * The WP REST API endpoint used:
 *   POST /wp-json/wp/v2/dance_studio/:id  { acf: { studio_type: "fred_astaire" } }
 */

const WP_BASE     = process.env.WP_API_URL     || "http://5.78.144.42/wp-json";
const WP_USER     = process.env.WP_USER        || "danceadmin";
const WP_PASS     = process.env.WP_APP_PASSWORD || "danceadmin2024";
const DRY_RUN     = process.argv.includes("--dry-run");
const PER_PAGE    = 100;

const AUTH = "Basic " + Buffer.from(`${WP_USER}:${WP_PASS}`).toString("base64");

// ── Chain detection (mirrors lib/wordpress.ts detectChain) ───────────────────

function detectChain(title) {
  const t = title.toLowerCase();
  if (t.includes("fred astaire"))  return "fred_astaire";
  if (t.includes("arthur murray")) return "arthur_murray";
  if (t.includes("dance with me")) return "dance_with_me";
  return "independent";
}

// ── Fetch all studio posts ───────────────────────────────────────────────────

async function fetchAllStudios() {
  let page  = 1;
  let total = Infinity;
  const all = [];

  while (all.length < total) {
    const url = `${WP_BASE}/wp/v2/dance_studio?per_page=${PER_PAGE}&page=${page}&status=publish&_fields=id,title,acf`;
    const res = await fetch(url, { headers: { Authorization: AUTH, "Content-Type": "application/json" } });

    if (!res.ok) {
      console.error(`Error fetching page ${page}: ${res.status}`);
      break;
    }

    total = Number(res.headers.get("X-WP-Total") || "0");
    const batch = await res.json();
    if (!batch.length) break;

    all.push(...batch);
    console.log(`  Fetched page ${page} (${all.length}/${total})`);
    page++;
  }

  return all;
}

// ── Update a single studio's studio_type field ───────────────────────────────

async function updateStudioType(id, chain) {
  if (DRY_RUN) return true;

  const url = `${WP_BASE}/wp/v2/dance_studio/${id}`;
  const res = await fetch(url, {
    method:  "POST",
    headers: { Authorization: AUTH, "Content-Type": "application/json" },
    body: JSON.stringify({ acf: { studio_type: chain } }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`  ✗ Failed to update ID ${id}: ${res.status} — ${text.slice(0, 200)}`);
    return false;
  }
  return true;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🕺 Chain Auto-Detection Script${DRY_RUN ? " [DRY RUN]" : ""}`);
  console.log(`   Target: ${WP_BASE}`);
  console.log(`   Auth:   ${WP_USER}\n`);

  console.log("📥 Fetching all studios...");
  const studios = await fetchAllStudios();
  console.log(`\n✅ Found ${studios.length} studios\n`);

  const counts = { fred_astaire: 0, arthur_murray: 0, dance_with_me: 0, independent: 0 };
  const updates = [];

  for (const studio of studios) {
    const title    = studio.title?.rendered || studio.title?.raw || "";
    const detected = detectChain(title);
    const current  = studio.acf?.studio_type || "independent";

    if (detected !== current) {
      updates.push({ id: studio.id, title, from: current, to: detected });
    }
    counts[detected]++;
  }

  // Report totals
  console.log("📊 Chain breakdown (from names):");
  console.log(`   Fred Astaire:  ${counts.fred_astaire}`);
  console.log(`   Arthur Murray: ${counts.arthur_murray}`);
  console.log(`   Dance With Me: ${counts.dance_with_me}`);
  console.log(`   Independent:   ${counts.independent}`);
  console.log(`\n🔄 Studios needing update: ${updates.length}`);

  if (!updates.length) {
    console.log("✅ All studio_type fields are already correct — nothing to do.\n");
    return;
  }

  // Preview first 10
  console.log("\nSample changes:");
  updates.slice(0, 10).forEach(({ id, title, from, to }) => {
    console.log(`  [${id}] "${title.slice(0, 60)}" : ${from} → ${to}`);
  });
  if (updates.length > 10) {
    console.log(`  ... and ${updates.length - 10} more`);
  }

  if (DRY_RUN) {
    console.log("\n[DRY RUN] No changes written. Remove --dry-run to apply.\n");
    return;
  }

  // Apply updates with a small delay between requests to avoid rate limits
  console.log("\n✍️  Applying updates...");
  let success = 0;
  let fail    = 0;

  for (let i = 0; i < updates.length; i++) {
    const { id, title, to } = updates[i];
    const ok = await updateStudioType(id, to);
    if (ok) {
      success++;
      process.stdout.write(`\r  ${success}/${updates.length} updated`);
    } else {
      fail++;
    }

    // Throttle: 5 requests/sec max
    if (i < updates.length - 1) await new Promise((r) => setTimeout(r, 200));
  }

  console.log(`\n\n✅ Done! ${success} updated, ${fail} failed.\n`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
