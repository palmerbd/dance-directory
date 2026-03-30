import { Metadata } from "next";
import Link from "next/link";
import { getAllStudios } from "@/lib/wordpress";
import { StudioCard, CHAIN_CONFIG, STYLE_LABELS, DanceStyle } from "@/types/studio";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Find Private Dance Studios Near You",
  description:
    "Browse all private dance studios in our directory. Fred Astaire, Arthur Murray, Dance With Me, and elite independent studios offering ballroom, Latin, tango, and wedding dance lessons.",
};

// ── Star rating display ───────────────────────────────────────────────────────

function Stars({ rating }: { rating: number }) {
  const full  = Math.floor(rating);
  const half  = rating % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <span className="flex items-center gap-0.5 text-sm" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: full  }).map((_, i) => <span key={`f${i}`} style={{ color: "#e8c560" }}>★</span>)}
      {half && <span style={{ color: "#e8c560" }}>½</span>}
      {Array.from({ length: empty }).map((_, i) => <span key={`e${i}`} className="text-gray-300">★</span>)}
      <span className="ml-1 text-gray-500 text-xs">{rating.toFixed(1)}</span>
    </span>
  );
}

// ── Studio card component ─────────────────────────────────────────────────────

function StudioListCard({ studio }: { studio: StudioCard }) {
  const chain  = CHAIN_CONFIG[studio.studioChain];
  const styles = studio.danceStyles.slice(0, 4);

  return (
    <Link
      href={`/studios/${studio.slug}`}
      className="group block bg-white rounded-2xl border border-gray-200 hover:border-yellow-400
                 hover:shadow-xl transition-all duration-200 overflow-hidden"
    >
      {/* Color bar top */}
      <div className="h-1.5" style={{ background: "linear-gradient(90deg, #b8922a, #e8c560)" }} />

      <div className="p-6">
        {/* Chain badge + tier */}
        <div className="flex items-center justify-between mb-3">
          <span
            className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide"
            style={{ color: chain.color, background: chain.bg }}
          >
            {chain.label}
          </span>
          {studio.tier === "paid" && (
            <span className="text-xs font-bold text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded-full border border-yellow-200">
              Featured
            </span>
          )}
        </div>

        {/* Title */}
        <h2 className="font-display font-bold text-gray-900 text-xl leading-snug mb-1
                       group-hover:text-yellow-800 transition-colors">
          {studio.title}
        </h2>

        {/* Tagline or description */}
        {studio.tagline ? (
          <p className="text-sm text-gray-500 italic mb-3">{studio.tagline}</p>
        ) : studio.description ? (
          <p className="text-sm text-gray-500 mb-3 line-clamp-2">{studio.description}</p>
        ) : null}

        {/* Rating */}
        {studio.rating && (
          <div className="flex items-center gap-2 mb-3">
            <Stars rating={studio.rating} />
            {studio.reviewCount && (
              <span className="text-xs text-gray-400">({studio.reviewCount} reviews)</span>
            )}
          </div>
        )}

        {/* Location + phone */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 mb-4">
          {(studio.city || studio.state) && (
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {studio.city}{studio.city && studio.state ? ", " : ""}{studio.state}
            </span>
          )}
          {studio.phone && (
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 7V5z" />
              </svg>
              {studio.phone}
            </span>
          )}
          {studio.privateLessonRate && (
            <span className="flex items-center gap-1 font-medium" style={{ color: "#b8922a" }}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              From {studio.privateLessonRate}
            </span>
          )}
        </div>

        {/* Dance style tags */}
        {styles.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {styles.map((style) => (
              <span key={style}
                className="px-2.5 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                {STYLE_LABELS[style as DanceStyle]}
              </span>
            ))}
            {studio.danceStyles.length > 4 && (
              <span className="px-2.5 py-0.5 bg-gray-100 text-gray-400 text-xs rounded-full">
                +{studio.danceStyles.length - 4} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="px-6 pb-5 pt-0">
        <span className="text-sm font-bold tracking-wide transition-colors"
          style={{ color: "#b8922a" }}>
          View Studio Details →
        </span>
      </div>
    </Link>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function StudiosPage() {
  const studios = await getAllStudios(100);

  return (
    <main>
      {/* Header */}
      <section
        className="py-16 px-6"
        style={{ background: "linear-gradient(135deg, #0c1428 0%, #1a2d5a 100%)" }}
      >
        <div className="max-w-6xl mx-auto">
          <nav className="text-sm mb-6">
            <Link href="/" className="text-white/50 hover:text-white transition-colors">Home</Link>
            <span className="text-white/30 mx-2">/</span>
            <span className="text-white/80">Studios</span>
          </nav>
          <p className="text-xs font-bold tracking-[0.2em] uppercase mb-3" style={{ color: "#e8c560" }}>
            The Directory
          </p>
          <h1 className="font-display text-white font-bold mb-4"
            style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}>
            Private Dance Studios
          </h1>
          <p className="text-white/60 text-lg max-w-2xl">
            {studios.length > 0
              ? `${studios.length} elite studio${studios.length !== 1 ? "s" : ""} listed — from national chains to boutique independents.`
              : "Discover elite private dance studios offering instruction in ballroom, Latin, tango, and more."}
          </p>
        </div>
      </section>

      {/* Studio Grid */}
      <section className="py-12 px-6" style={{ background: "#f9f6f0" }}>
        <div className="max-w-6xl mx-auto">
          {studios.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-400 text-lg">No studios found. Check back soon.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {studios.map((studio) => (
                <StudioListCard key={studio.id} studio={studio} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-16 px-6 bg-white border-t border-gray-200">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display font-bold text-gray-900 text-2xl mb-3">
            Own a Dance Studio?
          </h2>
          <p className="text-gray-500 mb-6">
            List your studio in our directory and connect with students actively searching for private lessons.
          </p>
          <Link href="/contact"
            className="inline-block px-8 py-3 rounded-lg font-bold text-gray-900 transition-all hover:brightness-110"
            style={{ background: "linear-gradient(135deg, #b8922a, #e8c560)" }}>
            Get Listed
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 bg-white border-t border-gray-100">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <div className="font-display font-bold text-gray-900">Private Dance Directory</div>
            <p className="text-gray-400 text-sm mt-1">America&apos;s premier resource for private dance instruction</p>
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
