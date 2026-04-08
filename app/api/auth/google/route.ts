/**
 * GET /api/auth/google?studio_slug=...
 *
 * Starts the Google OAuth 2.0 flow for a studio owner who wants to connect their
 * Google Business Profile so we can display live ratings and review counts.
 *
 * Required env vars:
 *   GOOGLE_CLIENT_ID         — from Google Cloud Console OAuth 2.0 credentials
 *   GOOGLE_CLIENT_SECRET     — same credential
 *   NEXT_PUBLIC_BASE_URL     — e.g. "https://www.ballroomdancedirectory.com"
 *
 * The callback URL must be added to the Google Cloud Console as an authorized
 * redirect URI: {NEXT_PUBLIC_BASE_URL}/api/auth/google/callback
 *
 * Scopes requested:
 *   - https://www.googleapis.com/auth/business.manage   (read GBP rating/reviews)
 */

import { NextRequest, NextResponse } from "next/server";

const CLIENT_ID    = process.env.GOOGLE_CLIENT_ID    || "";
const BASE_URL     = process.env.NEXT_PUBLIC_BASE_URL || "https://www.ballroomdancedirectory.com";
const REDIRECT_URI = `${BASE_URL}/api/auth/google/callback`;

// Google OAuth 2.0 authorization endpoint
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

// Scopes needed to read Google Business Profile ratings
const SCOPES = [
  "https://www.googleapis.com/auth/business.manage",
  "openid",
  "email",
].join(" ");

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const studioSlug = searchParams.get("studio_slug");

  if (!studioSlug) {
    return NextResponse.json({ error: "studio_slug is required" }, { status: 400 });
  }
  if (!CLIENT_ID) {
    return NextResponse.json({ error: "GOOGLE_CLIENT_ID not configured" }, { status: 500 });
  }

  // Encode studio_slug in state to retrieve it in the callback
  const state = Buffer.from(JSON.stringify({ studioSlug })).toString("base64url");

  const params = new URLSearchParams({
    client_id:     CLIENT_ID,
    redirect_uri:  REDIRECT_URI,
    response_type: "code",
    scope:         SCOPES,
    access_type:   "offline",   // request refresh_token
    prompt:        "consent",   // always show consent (needed to receive refresh_token)
    state,
  });

  return NextResponse.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`);
}
