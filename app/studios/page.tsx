import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getStudiosPage, getStudiosByStyle, getAllStudios } from "@/lib/wordpress";
import { DANCE_STYLES, STYLE_LABELS, DanceStyle } from "@/types/studio";
import { StudioSearch } from "./StudioSearch";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Find Private Dance Studios Near You",
  description:
    "Browse 3,400+ private dance studios across America. Filter by city, dance style, and rating. Fred Astaire, Arthur Murray, Dance With Me, and elite independent studios offering ballroom, Latin, tango, and wedding dance lessons.",
};

// ── Loading skeleton shown while useSearchParams resolves ─────────────────────

function StudioSearchFallback() {
  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 space-y-3">
        <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-9 w-28 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function StudiosPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string; style?: string; q?: string;
    city?: string; chain?: string; rating?: string; sort?: string;
  }>;
}) {
  const params     = await searchParams;
  const pageNum    = Math.max(1, Number(params.page ?? "1"));
  const styleParam = (params.style ?? "") as DanceStyle | "";

  // Detect any client-side filter params present in the URL.
  // When these are set (e.g. from a bookmarked URL or page refresh), we must load
  // the full studio dataset server-side so the client filter can search everything —
  // not just the 48 studios on the current page.
  const qParam      = (params.q      ?? "").trim();
  const cityParam   = (params.city   ?? "").trim();
  const chainParam  = (params.chain  ?? "").trim();
  const ratingParam = (params.rating ?? "").trim();

  const isStyleFiltered  = styleParam !== "" && DANCE_STYLES.includes(styleParam as DanceStyle);
  const isClientFiltered = !!(qParam || cityParam || chainParam || ratingParam);

  let studios, total, totalPages;
  if (isStyleFiltered) {
    // Style filter → fetch all studios for that style
    const all = await getStudiosByStyle(styleParam);
    studios    = all;
    total      = all.length;
    totalPages = 1;
  } else if (isClientFiltered) {
    // Any other filter in URL → load full directory so client search covers everything
    const all = await getAllStudios(100);
    studios    = all;
    total      = all.length;
    totalPages = 1;
  } else {
    // No filters → paginated browse (48 per page)
    ({ studios, total, totalPages } = await getStudiosPage(pageNum, 48));
  }

  const styleLabel = isStyleFiltered ? STYLE_LABELS[styleParam as DanceStyle] : "";

  return (
    <main>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <section
        className="py-16 px-6"
        style={{ background: "linear-gradient(135deg, #0c1428 0%, #1a2d5a 100%)" }}
      >
        <div className="max-w-6xl mx-auto">
          <nav className="text-sm mb-6">
            <Link href="/" className="text-white/50 hover:text-white transition-colors">
              Home
            </Link>
            <span className="text-white/30 mx-2">/</span>
            {isStyleFiltered ? (
              <>
                <Link href="/studios" className="text-white/50 hover:text-white transition-colors">Studios</Link>
                <span className="text-white/30 mx-2">/</span>
                <span className="text-white/80">{styleLabel}</span>
              </>
            ) : (
              <span className="text-white/80">Studios</span>
            )}
          </nav>
          <p className="text-xs font-bold tracking-[0.2em] uppercase mb-3" style={{ color: "#e8c560" }}>
            The Directory
          </p>
          <h1
            className="font-display text-white font-bold mb-4"
            style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}
          >
            {isStyleFiltered ? `${styleLabel} Dance Studios` : "Private Dance Studios"}
          </h1>
          <p className="text-white/60 text-lg max-w-2xl">
            {total > 0
              ? `${total.toLocaleString()} ${isStyleFiltered ? styleLabel.toLowerCase() : "elite"} studios listed — search and filter to find the perfect fit.`
              : "Discover elite private dance studios offering instruction in ballroom, Latin, tango, and more."}
          </p>
        </div>
      </section>

      {/* ── Search + filter + grid (Suspense required for useSearchParams) ── */}
      <Suspense fallback={<StudioSearchFallback />}>
        <StudioSearch
          studios={studios}
          currentPage={pageNum}
          totalPages={totalPages}
          totalStudios={total}
        />
      </Suspense>

      {/* ── CTA banner ──────────────────────────────────────────────────── */}
      <section className="py-16 px-6 bg-white border-t border-gray-200">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display font-bold text-gray-900 text-2xl mb-3">
            Own a Dance Studio?
          </h2>
          <p className="text-gray-500 mb-6">
            List your studio in our directory and connect with students actively searching for private lessons.
          </p>
          <Link
            href="/contact"
            className="inline-block px-8 py-3 rounded-lg font-bold text-gray-900 transition-all hover:brightness-110"
            style={{ background: "linear-gradient(135deg, #b8922a, #e8c560)" }}
          >
            Get Listed
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="py-10 px-6 bg-white border-t border-gray-100">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <div className="font-display font-bold text-gray-900">Ballroom Dance Directory</div>
            <p className="text-gray-400 text-sm mt-1">
              America&apos;s premier resource for private dance instruction
            </p>
          </div>
          <div className="flex gap-6 text-sm text-gray-400">
            <Link href="/" className="hover:text-gray-900 transition-colors">Home</Link>
            <Link href="/studios" className="hover:text-gray-900 transition-colors">All Studios</Link>
            <Link href="/ballroom-dance-lessons" className="hover:text-gray-900 transition-colors">Ballroom</Link>
            <Link href="/wedding-dance-lessons" className="hover:text-gray-900 transition-colors">Wedding Dance</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
