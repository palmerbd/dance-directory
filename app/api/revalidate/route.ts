// ISR Revalidation Webhook
// WordPress calls this via save_post_dance_studio hook (Hello Dolly plugin).
// Next.js regenerates only the affected pages on publish/update.

import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { secret, slug, city } = body;

    if (!secret || secret !== process.env.WP_REVALIDATE_SECRET) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const revalidated: string[] = [];

    if (slug) {
      revalidatePath(`/studios/${slug}`);
      revalidated.push(`/studios/${slug}`);
    }

    if (city) {
      const citySlug = (city as string).toLowerCase().replace(/\s+/g, "-");
      revalidatePath(`/studios/city/${citySlug}`);
      revalidated.push(`/studios/city/${citySlug}`);
    }

    revalidatePath("/studios");
    revalidatePath("/");
    revalidated.push("/studios", "/");

    console.log(`[revalidate] slug=${slug ?? "-"} city=${city ?? "-"} paths=${revalidated.join(", ")}`);

    return NextResponse.json({
      revalidated: true,
      paths: revalidated,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Revalidation failed", detail: String(err) },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, endpoint: "/api/revalidate" });
}
