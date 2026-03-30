// ─── ISR Revalidation Webhook ─────────────────────────────────────────────────
// WordPress fires this when a listing is published or updated
// Next.js regenerates that page within seconds — no full site rebuild needed
//
// WP hook (add to functions.php or a custom plugin):
//   add_action('publish_dance_studio', function($post_id) {
//     $slug = get_post_field('post_name', $post_id);
//     wp_remote_post('https://yourdomain.com/api/revalidate', [
//       'body' => json_encode(['secret' => WP_REVALIDATE_SECRET, 'slug' => $slug]),
//       'headers' => ['Content-Type' => 'application/json'],
//     ]);
//   });

import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { secret, slug, cityState, style } = body;

    // Validate secret token
    if (secret !== process.env.WP_REVALIDATE_SECRET) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const revalidated: string[] = [];

    // Revalidate the specific listing page
    if (slug && cityState) {
      const path = `/studios/${cityState}/${slug}`;
      revalidatePath(path);
      revalidated.push(path);
    }

    // Revalidate the city archive page
    if (cityState) {
      revalidatePath(`/studios/${cityState}`);
      revalidated.push(`/studios/${cityState}`);
    }

    // Revalidate the style+city archive if style provided
    if (style && cityState) {
      revalidatePath(`/${style}/${cityState}`);
      revalidated.push(`/${style}/${cityState}`);
    }

    // Always revalidate homepage
    revalidatePath("/");
    revalidated.push("/");

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
