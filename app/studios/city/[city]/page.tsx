import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStudiosByCity, citySlugToName, getAllStudios } from "@/lib/wordpress";
import { StudioCard, CHAIN_CONFIG, STYLE_LABELS, DanceStyle } from "@/types/studio";

export const revalidate = 3600;

// ── Static params ─────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  const all = await getAllStudios(500);
  const cities = [...new Set(all.map((s) => s.city.toLowerCase().replace(/\s+/g, "-")))];
  return cities.map((city) => ({ city }));
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city } = await params;
  const cityName = citySlugToName(city);
  const studios = await getStudiosByCity(city);
  if (!studios.length) return { title: "City Not Found" };

  return {
    title: `Private Dance Studios in ${cityName} | Private Dance Directory`,
    description: `Find the best private dance studios in ${cityName}. ${studios.length} top-rated ${cityName} studios offering ballroom, Latin, tango, wedding dance, and more. Book your first lesson today.`,
    openGraph: {
      title: `Private Dance Lessons in ${cityName}`,
      description: `Discover ${studios.length} elite dance studios in ${cityName} offering private instruction across all styles.`,
    },
  };
}

// ── Sub-components ────────────────────────────────────────────────────────────

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

function StudioListCard({ studio }: { studio: StudioCard }) {
  const chain  = CHAIN_CONFIG[studio.studioChain];
  const styles = studio.danceStyles.slice(0, 4);

  return (
    <Link
      href={`/studios/${studio.slug}`}
      className="group block bg-white rounded-2xl border border-gray-200 hover:border-yellow-400
                 hover:shadow-xl transition-all duration-200 overflow-hidden"
    >
      <div className="h-1.5" style={{ background: "linear-gradient(90deg, #b8922a, #e8c560)" }} />
      <div className="p-6">
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

        <h2 className="font-display font-bold text-gray-900 text-xl leading-snug mb-1
                       group-hover:text-yellow-800 transition-colors">
          {studio.title}
        </h2>

        {studio.tagline ? (
          <p className="text-sm text-gray-500 italic mb-3">{studio.tagline}</p>
        ) : studio.description ? (
          <p className="text-sm text-gray-500 mb-3 line-clamp-2">{studio.description}</p>
        ) : null}

        {studio.rating && (
          <div className="flex items-center gap-2 mb-3">
            <Stars rating={studio.rating} />
            {studio.reviewCount && (
              <span className="text-xs text-gray-400">({studio.reviewCount} reviews)</span>
            )}
          </div>
        )}

        {styles.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {styles.map((style) => (
              <span
                key={style}
                className="px-2.5 py-0.5 rounded-full text-xs font-medium border"
                style={{ borderColor: "#e8c560", color: "#7a5c0a", background: "#fdf8f0" }}
              >
                {STYLE_LABELS[style as DanceStyle]}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
          <div className="text-xs text-gray-400">
            {[studio.city, studio.state].filter(Boolean).join(", ")}
          </div>
          {studio.privateLessonRate && (
            <div className="text-sm font-bold" style={{ color: "#b8922a" }}>
              {studio.privateLessonRate}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

// ── City SEO content map ──────────────────────────────────────────────────────

const CITY_CONTENT: Record<string, { intro: string; tip: string }> = {
  "los-angeles": {
    intro: "Los Angeles is home to a thriving private dance scene — from Hollywood-adjacent ballrooms to beachside Latin studios in Santa Monica. Whether you're preparing for a wedding, competition, or just want to move with more confidence, LA's elite instructors bring world-class technique to every session.",
    tip: "Many LA studios offer flexible scheduling and package deals. Ask about intro lesson specials to find the right fit before committing.",
  },
  "chicago": {
    intro: "Chicago's dance studio scene reflects the city's deep artistic roots — from Magnificent Mile ballrooms to neighborhood gems in Lincoln Park and the South Loop. The city's diverse cultural fabric shows in the range of styles offered, with everything from competitive ballroom to Afro-Cuban rhythms.",
    tip: "Chicago winters mean studios can get booked quickly in January and February as people pursue indoor hobbies. Book ahead for prime evening slots.",
  },
  "dallas": {
    intro: "Dallas has a passionate dance community built around both the social scene and competitive circuit. From classic Texas Two-Step to sophisticated ballroom, Lone Star City studios offer world-class private instruction with Southern hospitality.",
    tip: "Dallas studios often specialize in either social or competitive dancing — ask upfront which direction your instructor leans to make sure it aligns with your goals.",
  },
  "miami": {
    intro: "Miami is the Latin dance capital of the United States. With deep Cuban, Colombian, and Caribbean cultural roots, the city's private dance studios offer authentic instruction in Salsa, Mambo, Bachata, and beyond — often from native instructors who grew up in these traditions.",
    tip: "Many Miami studios stay open late and can accommodate evening sessions after 8pm. Mention your schedule when booking and they'll often accommodate.",
  },
  "houston": {
    intro: "Houston's remarkable cultural diversity makes it one of the most eclectic dance cities in America. From polished River Oaks ballet studios to inclusive Montrose neighborhood spaces, Houston offers private dance instruction across virtually every style and budget level.",
    tip: "Houston traffic can be brutal. Many studios near the Galleria or Montrose offer dedicated parking or are accessible by Metro Rail — factor this into your studio choice.",
  },
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function CityPage({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city } = await params;
  const cityName = citySlugToName(city);
  const studios = await getStudiosByCity(city);

  if (!studios.length) notFound();

  const cityContent = CITY_CONTENT[city];
  const avgRating = studios
    .filter((s) => s.rating)
    .reduce((sum, s) => sum + (s.rating || 0), 0) / studios.filter((s) => s.rating).length;

  // Schema.org for city page
  const schemaOrg = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `Private Dance Studios in ${cityName}`,
    "description": `Top-rated private dance studios offering lessons in ${cityName}`,
    "numberOfItems": studios.length,
    "itemListElement": studios.map((s, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": s.title,
      "url": `/studios/${s.slug}`,
    })),
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }}
      />

      {/* Hero */}
      <section
        className="py-16 px-6"
        style={{ background: "linear-gradient(135deg, #0c1428 0%, #1a2d5a 100%)" }}
      >
        <div className="max-w-5xl mx-auto">
          {/* Breadcrumb */}
          <nav className="text-sm mb-6">
            <Link href="/" className="text-white/50 hover:text-white transition-colors">Home</Link>
            <span className="text-white/30 mx-2">/</span>
            <Link href="/studios" className="text-white/50 hover:text-white transition-colors">Studios</Link>
            <span className="text-white/30 mx-2">/</span>
            <span className="text-white/80">{cityName}</span>
          </nav>

          <h1 className="font-display text-white font-bold mb-3"
            style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)" }}>
            Private Dance Studios in {cityName}
          </h1>
          <p className="text-white/60 text-lg mb-6">
            {studios.length} top-rated {studios.length === 1 ? "studio" : "studios"} offering private lessons
            {avgRating > 0 && ` · Avg. rating ${avgRating.toFixed(1)}★`}
          </p>

          {/* Stats pills */}
          <div className="flex flex-wrap gap-3">
            <span className="px-4 py-2 rounded-full text-sm font-semibold bg-white/10 text-white/80">
              🎵 {studios.length} Studios
            </span>
            <span className="px-4 py-2 rounded-full text-sm font-semibold bg-white/10 text-white/80">
              📍 {cityName}, {studios[0]?.state || ""}
            </span>
            <span className="px-4 py-2 rounded-full text-sm font-semibold bg-white/10 text-white/80">
              ⭐ Avg. {avgRating > 0 ? avgRating.toFixed(1) : "—"} Rating
            </span>
          </div>
        </div>
      </section>

      {/* Body */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Studio grid */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {studios.map((studio) => (
                <StudioListCard key={studio.id} studio={studio} />
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">

            {/* City intro */}
            {cityContent && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <h2 className="font-display font-bold text-gray-900 text-lg mb-3">
                  Dancing in {cityName}
                </h2>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  {cityContent.intro}
                </p>
                <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-100">
                  <p className="text-xs font-bold uppercase tracking-wide text-yellow-700 mb-1">Pro Tip</p>
                  <p className="text-sm text-yellow-900">{cityContent.tip}</p>
                </div>
              </div>
            )}

            {/* Browse by city */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="font-display font-bold text-gray-900 text-base mb-3">Browse Other Cities</h3>
              <div className="space-y-1">
                {[
                  { slug: "los-angeles", name: "Los Angeles" },
                  { slug: "chicago",     name: "Chicago" },
                  { slug: "dallas",      name: "Dallas" },
                  { slug: "miami",       name: "Miami" },
                  { slug: "houston",     name: "Houston" },
                ].filter((c) => c.slug !== city).map((c) => (
                  <Link
                    key={c.slug}
                    href={`/studios/city/${c.slug}`}
                    className="flex items-center justify-between py-2 px-3 rounded-lg text-sm
                               text-gray-700 hover:bg-yellow-50 hover:text-yellow-800 transition-colors"
                  >
                    <span>{c.name}</span>
                    <span className="text-gray-300">→</span>
                  </Link>
                ))}
              </div>
            </div>

            <Link href="/studios"
              className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
              ← View all studios
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-10 px-6 bg-white border-t border-gray-100 mt-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <div className="font-display font-bold text-gray-900">Private Dance Directory</div>
            <p className="text-gray-400 text-sm mt-1">America&apos;s premier resource for private dance instruction</p>
          </div>
          <div className="flex gap-6 text-sm text-gray-400">
            <Link href="/" className="hover:text-gray-900 transition-colors">Home</Link>
            <Link href="/studios" className="hover:text-gray-900 transition-colors">All Studios</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
