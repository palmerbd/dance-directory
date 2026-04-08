/**
 * GET /api/auth/google/callback
 *
 * Google OAuth 2.0 callback handler.
 * 1. Exchanges the authorization code for access + refresh tokens
 * 2. Fetches the studio owner's Google Business Profile location(s) to find rating
 * 3. Stores tokens + rating data in Supabase `gbp_connections` table
 * 4. Redirects the studio owner back to their listing with a success/error param
 *
 * Supabase table required (run once):
 *
 *   create table if not exists gbp_connections (
 *     id              uuid primary key default gen_random_uuid(),
 *     studio_slug     text not null unique,
 *     google_email    text,
 *     access_token    text,
 *     refresh_token   text,
 *     token_expiry    timestamptz,
 *     gbp_account_id  text,
 *     gbp_location_id text,
 *     rating          numeric(3,1),
 *     review_count    int,
 *     last_synced_at  timestamptz default now(),
 *     created_at      timestamptz default now()
 *   );
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const CLIENT_ID     = process.env.GOOGLE_CLIENT_ID     || "";
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const BASE_URL      = process.env.NEXT_PUBLIC_BASE_URL || "https://www.ballroomdancedirectory.com";
const REDIRECT_URI  = `${BASE_URL}/api/auth/google/callback`;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code  = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // ── Error from Google ──────────────────────────────────────────────────────
  if (error) {
    return NextResponse.redirect(`${BASE_URL}/claim?gbp=error&reason=${encodeURIComponent(error)}`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${BASE_URL}/claim?gbp=error&reason=missing_params`);
  }

  // ── Decode state ───────────────────────────────────────────────────────────
  let studioSlug: string;
  try {
    const decoded  = JSON.parse(Buffer.from(state, "base64url").toString());
    studioSlug = decoded.studioSlug;
  } catch {
    return NextResponse.redirect(`${BASE_URL}/claim?gbp=error&reason=invalid_state`);
  }

  // ── Exchange code for tokens ───────────────────────────────────────────────
  let tokens: {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    id_token?: string;
  };

  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id:     CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri:  REDIRECT_URI,
        grant_type:    "authorization_code",
      }).toString(),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error("Token exchange failed:", text);
      return NextResponse.redirect(`${BASE_URL}/studios/${studioSlug}?gbp=error&reason=token_exchange`);
    }
    tokens = await res.json();
  } catch {
    return NextResponse.redirect(`${BASE_URL}/studios/${studioSlug}?gbp=error&reason=token_fetch`);
  }

  const accessToken  = tokens.access_token;
  const refreshToken = tokens.refresh_token;
  const expiryTime   = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
    : null;

  // ── Get user email from ID token ───────────────────────────────────────────
  let googleEmail: string | null = null;
  if (tokens.id_token) {
    try {
      const payload   = tokens.id_token.split(".")[1];
      const decoded   = JSON.parse(Buffer.from(payload, "base64url").toString());
      googleEmail = decoded.email ?? null;
    } catch { /* non-fatal */ }
  }

  // ── Fetch GBP account + location (best-effort) ────────────────────────────
  let gbpAccountId:  string | null = null;
  let gbpLocationId: string | null = null;
  let rating:        number | null = null;
  let reviewCount:   number | null = null;

  try {
    // List accounts
    const acctRes = await fetch("https://mybusinessaccountmanagement.googleapis.com/v1/accounts", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (acctRes.ok) {
      const acctData = await acctRes.json();
      const account  = acctData.accounts?.[0];
      gbpAccountId   = account?.name ?? null; // e.g. "accounts/12345"

      if (gbpAccountId) {
        // List locations for this account
        const locRes = await fetch(
          `https://mybusinessbusinessinformation.googleapis.com/v1/${gbpAccountId}/locations?readMask=name,rating,userRatingCount`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (locRes.ok) {
          const locData = await locRes.json();
          const loc     = locData.locations?.[0];
          if (loc) {
            gbpLocationId = loc.name ?? null; // e.g. "accounts/12345/locations/67890"
            rating        = loc.rating         ? Number(loc.rating)         : null;
            reviewCount   = loc.userRatingCount ? Number(loc.userRatingCount) : null;
          }
        }
      }
    }
  } catch { /* non-fatal — we still save the tokens */ }

  // ── Upsert into Supabase ───────────────────────────────────────────────────
  try {
    const { error: dbError } = await supabaseAdmin
      .from("gbp_connections")
      .upsert(
        {
          studio_slug:     studioSlug,
          google_email:    googleEmail,
          access_token:    accessToken,
          refresh_token:   refreshToken ?? null,
          token_expiry:    expiryTime,
          gbp_account_id:  gbpAccountId,
          gbp_location_id: gbpLocationId,
          rating,
          review_count:    reviewCount,
          last_synced_at:  new Date().toISOString(),
        },
        { onConflict: "studio_slug" }
      );

    if (dbError) {
      console.error("Supabase upsert error:", dbError);
      return NextResponse.redirect(`${BASE_URL}/studios/${studioSlug}?gbp=error&reason=db`);
    }
  } catch {
    return NextResponse.redirect(`${BASE_URL}/studios/${studioSlug}?gbp=error&reason=db`);
  }

  // ── Success ────────────────────────────────────────────────────────────────
  const successParam = rating ? `&rating=${rating}` : "";
  return NextResponse.redirect(
    `${BASE_URL}/studios/${studioSlug}?gbp=connected${successParam}`
  );
}
