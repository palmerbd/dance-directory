/**
 * GET /api/gbp/sync?secret=...
 *
 * Cron endpoint — call daily to refresh GBP ratings for all connected studios.
 * Secured by a shared secret (set CRON_SECRET in Vercel env vars).
 *
 * For each connected studio:
 *   1. Refresh the access token if expired
 *   2. Fetch current rating + review count from Google Business Profile API
 *   3. Update Supabase gbp_connections table
 *   4. Revalidate the studio's Next.js cache tag
 *
 * Vercel Cron (vercel.json):
 *   { "crons": [{ "path": "/api/gbp/sync", "schedule": "0 6 * * *" }] }
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";

const CLIENT_ID     = process.env.GOOGLE_CLIENT_ID     || "";
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const CRON_SECRET   = process.env.CRON_SECRET          || "";

// ── Token refresh ─────────────────────────────────────────────────────────────

async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in: number;
} | null> {
  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id:     CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type:    "refresh_token",
      }).toString(),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// ── Fetch GBP location rating ─────────────────────────────────────────────────

async function fetchGBPRating(
  accessToken: string,
  locationId: string
): Promise<{ rating: number | null; reviewCount: number | null }> {
  try {
    const res = await fetch(
      `https://mybusinessbusinessinformation.googleapis.com/v1/${locationId}?readMask=name,rating,userRatingCount`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!res.ok) return { rating: null, reviewCount: null };
    const data = await res.json();
    return {
      rating:      data.rating         ? Number(data.rating)         : null,
      reviewCount: data.userRatingCount ? Number(data.userRatingCount) : null,
    };
  } catch {
    return { rating: null, reviewCount: null };
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // Verify cron secret (also passes automatically from Vercel Cron via header)
  const secret   = searchParams.get("secret") || req.headers.get("x-cron-secret");
  const isVercel = req.headers.get("x-vercel-cron") === "1";

  if (!isVercel && CRON_SECRET && secret !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch all connected studios
  const { data: connections, error } = await supabaseAdmin
    .from("gbp_connections")
    .select("studio_slug, access_token, refresh_token, token_expiry, gbp_location_id")
    .not("gbp_location_id", "is", null);

  if (error || !connections?.length) {
    return NextResponse.json({ synced: 0, message: "No connected studios" });
  }

  let synced  = 0;
  let failed  = 0;
  const now   = new Date();

  for (const conn of connections) {
    try {
      let accessToken = conn.access_token;

      // Refresh token if expired (with 5-minute buffer)
      const expiry = conn.token_expiry ? new Date(conn.token_expiry) : null;
      if (expiry && expiry.getTime() - now.getTime() < 5 * 60 * 1000) {
        if (!conn.refresh_token) {
          failed++;
          continue;
        }
        const refreshed = await refreshAccessToken(conn.refresh_token);
        if (!refreshed) {
          failed++;
          continue;
        }
        accessToken = refreshed.access_token;

        // Update token in Supabase
        await supabaseAdmin
          .from("gbp_connections")
          .update({
            access_token: accessToken,
            token_expiry: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
          })
          .eq("studio_slug", conn.studio_slug);
      }

      // Fetch latest rating
      const { rating, reviewCount } = await fetchGBPRating(accessToken, conn.gbp_location_id!);

      // Update Supabase
      await supabaseAdmin
        .from("gbp_connections")
        .update({
          rating,
          review_count:   reviewCount,
          last_synced_at: now.toISOString(),
        })
        .eq("studio_slug", conn.studio_slug);

      // Revalidate the studio's cached page
      revalidatePath(`/studios/${conn.studio_slug}`);

      synced++;
    } catch {
      failed++;
    }
  }

  return NextResponse.json({
    synced,
    failed,
    total: connections.length,
    timestamp: now.toISOString(),
  });
}
