#!/usr/bin/env ts-node
/**
 * generate-taglines.ts
 * ────────────────────
 * Fetches all published dance studios from WordPress, finds those without a
 * tagline (studio_tagline ACF field), generates a punchy one-liner via the
 * Anthropic API, and POSTs it back to WordPress via the REST API.
 *
 * Usage (from project root):
 *   npx ts-node -e "require('./scripts/generate-taglines.ts')"
 * or:
 *   npx tsx scripts/generate-taglines.ts
 *
 * Env vars required (can be in .env.local):
 *   WP_API_URL          e.g. http://5.78.144.42/wp-json
 *   WP_APP_USER         e.g. danceadmin
 *   WP_APP_PASSWORD     e.g. KxIp Xqlw Q1ae cryw 3jb1 0fhO
 *   ANTHROPIC_API_KEY   your Anthropic API key
 *
 * Options (env vars):
 *   DRY_RUN=true        print generated taglines but don't POST to WP
 *   LIMIT=20            max studios to process per run (default 50)
 *   DELAY_MS=600        ms between API calls (default 600 to respect rate limits)
 */

import * as https from "https";
import * as http from "http";
import * as fs from "fs";
import * as path from "path";

// ── Load .env.local ───────────────────────────────────────────────────────────

function loadEnv() {
  const envPath = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnv();

// ── Config ────────────────────────────────────────────────────────────────────

const WP_API_URL     = process.env.WP_API_URL     || "http://5.78.144.42/wp-json";
const WP_APP_USER    = process.env.WP_APP_USER    || "";
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD || "";
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";
const DRY_RUN        = process.env.DRY_RUN === "true";
const LIMIT          = parseInt(process.env.LIMIT  || "50", 10);
const DELAY_MS       = parseInt(process.env.DELAY_MS || "600", 10);

if (!WP_APP_USER || !WP_APP_PASSWORD) {
  console.error("❌  WP_APP_USER and WP_APP_PASSWORD are required.");
  process.exit(1);
}
if (!ANTHROPIC_API_KEY) {
  console.error("❌  ANTHROPIC_API_KEY is required.");
  process.exit(1);
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────

function request(
  url: string,
  options: http.RequestOptions & { body?: string }
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const mod = parsed.protocol === "https:" ? https : http;
    const req = mod.request(
      {
        hostname: parsed.hostname,
        port:     parsed.port || (parsed.protocol === "https:" ? 443 : 80),
        path:     parsed.pathname + parsed.search,
        method:   options.method || "GET",
        headers:  options.headers || {},
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve({ status: res.statusCode || 0, body: data }));
      }
    );
    req.on("error", reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

function wpAuth(): string {
  return "Basic " + Buffer.from(`${WP_APP_USER}:${WP_APP_PASSWORD}`).toString("base64");
}

// ── Fetch all studios from WP ─────────────────────────────────────────────────

interface WPStudio {
  id:    number;
  slug:  string;
  title: { rendered: string };
  acf: {
    studio_tagline?:        string;
    studio_dance_styles?:   string[];
    studio_address_city?:   string;
    studio_address_state?:  string;
    studio_chain?:          string;
  };
}

async function fetchAllStudios(): Promise<WPStudio[]> {
  const all: WPStudio[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const url = `${WP_API_URL}/wp/v2/dance_studio?per_page=100&status=publish&page=${page}&_fields=id,slug,title,acf`;
    const res = await request(url, {
      method: "GET",
      headers: { Authorization: wpAuth(), "Content-Type": "application/json" },
    });

    if (res.status !== 200) {
      console.error(`WP API error ${res.status} on page ${page}`);
      break;
    }

    const studios = JSON.parse(res.body) as WPStudio[];
    all.push(...studios);

    if (page === 1) {
      // Parse X-WP-TotalPages from response — we don't have headers here.
      // Heuristic: if we got 100 studios, there may be more pages.
      if (studios.length === 100) totalPages = 10; // will break early when empty
      else totalPages = 1;
    }

    if (studios.length < 100) break;
    page++;
  } while (page <= totalPages);

  return all;
}

// ── Generate tagline via Anthropic API ────────────────────────────────────────

async function generateTagline(studio: WPStudio): Promise<string> {
  const title  = studio.title.rendered.replace(/&#\d+;|&[a-z]+;/g, "'");
  const city   = studio.acf.studio_address_city   || "";
  const state  = studio.acf.studio_address_state  || "";
  const styles = (studio.acf.studio_dance_styles  || []).join(", ") || "ballroom dance";
  const location = [city, state].filter(Boolean).join(", ");

  const prompt = `Write a single punchy tagline (under 12 words) for a private dance studio. Be specific and aspirational. No quotes, no period at the end.

Studio: ${title}
Location: ${location || "United States"}
Dance styles: ${styles}

Examples of good taglines:
- Where champions are made, one step at a time
- Ballroom mastery for every age and ability
- Latin rhythms come alive in the heart of Miami
- Timeless elegance, modern instruction

Tagline:`;

  const body = JSON.stringify({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 60,
    messages: [{ role: "user", content: prompt }],
  });

  const res = await request("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key":    ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body,
  });

  if (res.status !== 200) {
    throw new Error(`Anthropic API error ${res.status}: ${res.body.slice(0, 200)}`);
  }

  const json = JSON.parse(res.body);
  const text = (json.content?.[0]?.text || "").trim();
  // Strip leading/trailing quotes if present
  return text.replace(/^["']|["']$/g, "").trim();
}

// ── Post tagline back to WP ───────────────────────────────────────────────────

async function postTaglineToWP(studioId: number, tagline: string): Promise<void> {
  const url  = `${WP_API_URL}/wp/v2/dance_studio/${studioId}`;
  const body = JSON.stringify({ acf: { studio_tagline: tagline } });

  const res = await request(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization:  wpAuth(),
    },
    body,
  });

  if (res.status < 200 || res.status >= 300) {
    throw new Error(`WP POST failed ${res.status}: ${res.body.slice(0, 200)}`);
  }
}

// ── Sleep helper ──────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🎵 Dance Studio Tagline Generator`);
  console.log(`   WP: ${WP_API_URL}`);
  console.log(`   DRY_RUN: ${DRY_RUN}`);
  console.log(`   LIMIT: ${LIMIT}\n`);

  console.log("📋 Fetching all studios from WordPress...");
  const all = await fetchAllStudios();
  console.log(`   Found ${all.length} published studios`);

  const needsTagline = all.filter(
    (s) => !s.acf.studio_tagline || s.acf.studio_tagline.trim() === ""
  );
  console.log(`   ${needsTagline.length} studios need taglines\n`);

  const toProcess = needsTagline.slice(0, LIMIT);
  let success = 0, fail = 0;

  for (const studio of toProcess) {
    const title = studio.title.rendered.replace(/&#\d+;|&[a-z]+;/g, "'");
    process.stdout.write(`  ▸ ${title.slice(0, 50).padEnd(52)}`);

    try {
      const tagline = await generateTagline(studio);
      process.stdout.write(`"${tagline}"\n`);

      if (!DRY_RUN) {
        await postTaglineToWP(studio.id, tagline);
      }
      success++;
    } catch (err) {
      process.stdout.write(`ERROR: ${(err as Error).message.slice(0, 80)}\n`);
      fail++;
    }

    if (toProcess.indexOf(studio) < toProcess.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  console.log(`\n✅ Done — ${success} taglines generated${DRY_RUN ? " (dry run)" : " and saved"}, ${fail} failed.`);
  if (needsTagline.length > LIMIT) {
    console.log(`   ${needsTagline.length - LIMIT} studios remain — run again to continue.`);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
