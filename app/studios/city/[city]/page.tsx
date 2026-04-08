import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getStudiosByCity, citySlugToName, getAllStudios,
  getMetroSlug, getMetroSuburbs,
} from "@/lib/wordpress";
import { StudioCard, CHAIN_CONFIG, STYLE_LABELS, DanceStyle, DANCE_STYLES } from "@/types/studio";
import { getCityConfig } from "@/lib/neighborhoods";

export const revalidate = 3600;

// ── Static params ─────────────────────────────────────────────────────────────

// Pre-build only the major metro city hubs; all others render on-demand via ISR.
export async function generateStaticParams() {
  const majorCities = [
    "new-york","los-angeles","chicago","houston","dallas","miami",
    "phoenix","san-antonio","san-diego","atlanta","austin","denver",
    "seattle","portland","boston","las-vegas","orlando","tampa",
    "charlotte","nashville",
  ];
  return majorCities.map((city) => ({ city }));
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city } = await params;
  const cityName = citySlugToName(city);
  const studios  = await getStudiosByCity(city);
  if (!studios.length) return { title: "City Not Found" };

  return {
    title: `Ballroom Dance Studios in ${cityName} | Ballroom Dance Directory`,
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

function StudioListCard({ studio, featured = false }: { studio: StudioCard; featured?: boolean }) {
  const chain  = CHAIN_CONFIG[studio.studioChain];
  const styles = studio.danceStyles.slice(0, 4);

  return (
    <Link
      href={`/studios/${studio.slug}`}
      className={`group block bg-white rounded-2xl border transition-all duration-200 overflow-hidden
        ${featured
          ? "border-yellow-300 shadow-lg hover:shadow-xl hover:border-yellow-400"
          : "border-gray-200 hover:border-yellow-400 hover:shadow-xl"
        }`}
    >
      {/* Gold accent bar — thicker for featured */}
      <div
        className={featured ? "h-2" : "h-1.5"}
        style={{ background: "linear-gradient(90deg, #b8922a, #e8c560)" }}
      />
      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <span
            className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide"
            style={{ color: chain.color, background: chain.bg }}
          >
            {chain.label}
          </span>
          {featured && (
            <span className="text-xs font-bold text-yellow-700 bg-yellow-50 px-2.5 py-0.5 rounded-full border border-yellow-300">
              ⭐ Sponsored
            </span>
          )}
          {!featured && studio.tier === "paid" && (
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
  "new-york-city": {
    intro: "New York City's dance studio landscape is unmatched in depth and prestige. From Lincoln Center–adjacent ballrooms on the Upper West Side to intimate salons in Greenwich Village, NYC attracts world-champion instructors and a student body that includes Broadway performers, socialites, and passionate beginners alike.",
    tip: "NYC studios fill up fast, especially on evenings and weekends. Many top studios offer dedicated beginner tracks — don't be intimidated to book even if you have zero experience.",
  },
  "new-york": {
    intro: "New York's dance scene spans every borough — from polished Manhattan ballrooms to neighborhood studios in Brooklyn and Queens offering everything from Argentine tango to West African dance. Whatever style you're drawn to, New York has a world-class instructor who specializes in it.",
    tip: "Subway access varies by neighborhood — confirm the studio's closest train stop when booking, especially for evening classes when Ubers surge.",
  },
  "atlanta": {
    intro: "Atlanta's dance scene punches well above its weight. The city's vibrant arts community and proximity to a world-class film and entertainment industry has cultivated exceptional talent across ballroom, Latin, and contemporary styles. Buckhead and Midtown are the two primary dance corridors.",
    tip: "Many Atlanta studios participate in the competitive ballroom circuit and can prepare you for showcases even as a beginner. Mention your goals early so they can match you to the right instructor.",
  },
  "seattle": {
    intro: "Seattle's dance community thrives in the spaces between its coffee shop culture and tech-industry wealth. From Capitol Hill swing dancing venues to Bellevue ballrooms, the Pacific Northwest offers a uniquely welcoming private lesson environment with instructors who emphasize individuality and fun.",
    tip: "Seattle rain means indoor activities surge in fall and winter. Studios in Capitol Hill, Ballard, and Bellevue tend to book faster November through March — plan ahead.",
  },
  "denver": {
    intro: "Denver's active, outdoorsy population brings exceptional energy to the ballroom floor. The Mile High City has cultivated a competitive dance scene anchored by Arthur Murray and Fred Astaire franchises, alongside passionate independent studios that reflect Colorado's pioneering spirit.",
    tip: "Denver studios often host monthly social dances where you can practice between lessons and meet other students. Ask your studio about their social calendar — it's one of Denver's best-kept dance secrets.",
  },
  "las-vegas": {
    intro: "Las Vegas is a professional dance hub hiding in plain sight. Behind the neon, the city employs thousands of professional dancers for shows, events, and casinos — and many of them teach private lessons on the side. You're often just one studio visit away from learning from a Cirque du Soleil veteran.",
    tip: "Vegas studios understand unpredictable schedules — many offer late-night appointments and weekend slots that most cities never see. Don't assume you can't fit lessons into a Vegas lifestyle.",
  },
  "phoenix": {
    intro: "Phoenix's sprawling Sunbelt layout means dance studios are spread across the Valley of the Sun — from Scottsdale's luxury ballrooms to Mesa and Tempe studios that serve ASU's student population. The dry desert heat makes Phoenix studios popular year-round with climate-controlled facilities.",
    tip: "Scottsdale tends to have the highest concentration of upscale private lesson studios in the Phoenix metro. If you're in Chandler, Gilbert, or Tempe, ask about satellite locations or traveling instructors.",
  },
  "minneapolis": {
    intro: "Minneapolis is a hidden gem in the American dance world. The Twin Cities arts community — one of the most vibrant per capita in the country — has seeded exceptional ballroom and Latin studios throughout the metro. Expect rigorous training and a community that takes the craft seriously.",
    tip: "Minnesota winters push dance indoors in a big way. Studios in Minneapolis and St. Paul tend to see a spike in new students every October — book your intro lesson before the seasonal rush.",
  },
  "nashville": {
    intro: "Nashville's rise as a national destination city has brought a dance studio boom. Beyond country line dancing, Music City has cultivated serious ballroom and Latin instruction, with studios drawing from the city's deep pool of musically sophisticated residents who bring rhythm to everything they do.",
    tip: "Nashville's wedding industry is enormous — many studios run dedicated wedding dance packages that include choreography and rehearsal coaching. Worth asking even if you're not planning a wedding.",
  },
  "boston": {
    intro: "Boston's world-class university ecosystem keeps the dance scene perpetually refreshed with ambitious students and faculty. From Back Bay ballrooms to Cambridge studios catering to the MIT and Harvard communities, Boston offers private dance instruction at a consistently high academic standard.",
    tip: "Parking in Boston is notoriously difficult. Prioritize studios near the T — especially the Green Line and Red Line corridors — for the most convenient access.",
  },
  "san-diego": {
    intro: "San Diego's year-round sunshine and laid-back beach culture create an infectious enthusiasm for social dance. The city's private studio scene reflects this warmth — instructors tend to emphasize enjoyment and confidence over rigid technique, making San Diego an excellent place for first-time dancers.",
    tip: "San Diego studios in the Gaslamp Quarter and Hillcrest neighborhoods often partner with local Latin dance venues. Ask your instructor about complimentary social dance tickets — it's a great way to practice.",
  },
  "portland": {
    intro: "Portland's fiercely independent creative culture has produced a dance studio scene unlike any other. Alongside national chains, the city hosts a constellation of independent instructors — many of them competition champions who chose Oregon's quality of life over the ballroom circuit. Expect creativity, warmth, and no pretension.",
    tip: "Portland studios tend to be smaller and more intimate than those in larger cities. The upside is more personal attention. The downside is availability — popular instructors book weeks in advance.",
  },
  "san-antonio": {
    intro: "San Antonio's rich Hispanic heritage infuses its dance scene with authentic Latin flair. Studios here offer some of the most genuine instruction in Salsa, Cumbia, and Bachata you'll find in the country, alongside polished ballroom programs shaped by the city's military and upscale social culture.",
    tip: "San Antonio's dance community is tight-knit and welcoming to newcomers. Studios often host free demo nights — a great way to watch instructors before booking a private lesson.",
  },
  "austin": {
    intro: "Austin's explosive growth has brought world-class dance instruction to the Live Music Capital. From East Austin Latin studios to Westlake ballrooms catering to tech executives, the city's dance scene is as eclectic as its music scene — and expanding fast.",
    tip: "Austin's traffic has become Houston-level bad on major corridors. Studios near South Congress, East Cesar Chavez, or the Domain tend to have the best parking and access from multiple sides of town.",
  },
  "tampa": {
    intro: "Tampa's Gulf Coast energy and strong Cuban heritage make it one of Florida's most dynamic dance cities. South Tampa and Hyde Park are home to upscale private lesson studios, while Ybor City's Latin roots give the city an authentic connection to the rhythms at the heart of competitive ballroom.",
    tip: "Tampa's dance community regularly produces national-level competitors. Even recreational students benefit from this — studios here maintain high standards that accelerate your progress.",
  },
  "orlando": {
    intro: "Orlando's tourism industry draws professional dancers from around the world, and many of them teach private lessons between gigs at Walt Disney World, Universal, and the city's show venues. You're likely to find instructors here with performance résumés unmatched in any other mid-size city.",
    tip: "Many Orlando studios offer accelerated programs for visitors — 3-day or week-long intensives are common. If you're in town short-term, ask about crash-course options.",
  },
  "frisco": {
    intro: "Frisco's rapid growth has brought first-rate private dance studios to this Dallas suburb. With a young, affluent population and strong school arts programs, Frisco has become a serious training ground for competitive ballroom — particularly youth dancers working toward national titles.",
    tip: "Frisco studios often offer family packages and youth lesson programs. If you have children interested in competitive dance, start the conversation early — waitlists form for top junior instructors.",
  },
  "plano": {
    intro: "Plano's sophisticated suburban community supports a polished dance studio scene that rivals many larger cities. With a diverse international community and strong corporate culture that values social polish, Plano studios attract students who want high-quality instruction without the drive into Dallas proper.",
    tip: "Plano is home to several corporate headquarters — many studios offer lunch-hour private lessons for working professionals. Ask about midday availability.",
  },
  "scottsdale": {
    intro: "Scottsdale's luxury market has cultivated the finest private dance studios in the Phoenix metropolitan area. Studios here attract an upscale clientele that expects premium instruction, top-tier facilities with sprung floors, and instructors with national competition credentials.",
    tip: "Snowbirds arrive in Scottsdale in October and leave in April. If you're a year-round resident, winter months may require earlier booking as studios fill with seasonal students.",
  },
  "bellevue": {
    intro: "Bellevue's tech-wealth demographic has created a demand for high-quality, sophisticated private dance instruction. Studios here cater to busy professionals and competitive students, offering premium instruction in ballroom, Latin, and wedding dance with flexible scheduling to accommodate demanding careers.",
    tip: "Bellevue studios are significantly less expensive than comparable Manhattan or San Francisco studios — and the instruction quality is equal. If you're new to the area from a coastal city, you'll be pleasantly surprised.",
  },
};

// ── Style descriptions for sidebar ───────────────────────────────────────────

const STYLE_HREFS: Partial<Record<DanceStyle, string>> = {
  ballroom:     "/ballroom-dance-lessons",
  latin:        "/latin-dance-lessons",
  tango:        "/tango-dance-lessons",
  wedding_dance:"/wedding-dance-lessons",
  swing:        "/swing-dance-lessons",
  competition:  "/competition-dance-lessons",
  salsa:        "/studios?style=salsa",
  waltz:        "/studios?style=waltz",
  foxtrot:      "/studios?style=foxtrot",
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function CityPage({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city } = await params;
  const cityName = citySlugToName(city);
  const studios  = await getStudiosByCity(city);

  if (!studios.length) notFound();

  // Split featured (paid/claimed) from standard for display priority
  const featuredStudios = studios
    .filter((s) => s.tier === "paid")
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  const standardStudios = studios
    .filter((s) => s.tier !== "paid")
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));

  const cityContent = CITY_CONTENT[city];
  const avgRating   = studios
    .filter((s) => s.rating)
    .reduce((sum, s) => sum + (s.rating || 0), 0) / (studios.filter((s) => s.rating).length || 1);

  // Build a style count from local studios
  const styleCount: Partial<Record<DanceStyle, number>> = {};
  for (const s of studios) {
    for (const style of s.danceStyles) {
      styleCount[style as DanceStyle] = (styleCount[style as DanceStyle] ?? 0) + 1;
    }
  }
  const popularStyles = DANCE_STYLES
    .filter((s) => (styleCount[s] ?? 0) > 0)
    .sort((a, b) => (styleCount[b] ?? 0) - (styleCount[a] ?? 0))
    .slice(0, 6);

  // Suburb context
  const metroSlug   = getMetroSlug(city);
  const metroSuburbs = city ? getMetroSuburbs(city) : [];

  // Schema.org
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home",    "item": "https://www.ballroomdancedirectory.com" },
      { "@type": "ListItem", "position": 2, "name": "Studios", "item": "https://www.ballroomdancedirectory.com/studios" },
      { "@type": "ListItem", "position": 3, "name": `Dance Studios in ${cityName}`, "item": `https://www.ballroomdancedirectory.com/studios/city/${city}` },
    ],
  };

  const schemaOrg = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `Ballroom Dance Studios in ${cityName}`,
    "description": `Top-rated private dance studios offering lessons in ${cityName}`,
    "numberOfItems": studios.length,
    "itemListElement": studios.map((s, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": s.title,
      "url": `https://www.ballroomdancedirectory.com/studios/${s.slug}`,
    })),
  };

  const state = studios[0]?.state || "";

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section
        className="relative py-20 px-6 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0c1428 0%, #1a2d5a 60%, #2d1f0e 100%)" }}
      >
        {/* Decorative gold overlay pattern */}
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{ backgroundImage: "repeating-linear-gradient(45deg, #e8c560 0, #e8c560 1px, transparent 0, transparent 50%)", backgroundSize: "20px 20px" }}
        />

        <div className="relative max-w-5xl mx-auto">
          {/* Breadcrumb */}
          <nav className="text-sm mb-6">
            <Link href="/" className="text-white/50 hover:text-white transition-colors">Home</Link>
            <span className="text-white/30 mx-2">/</span>
            <Link href="/studios" className="text-white/50 hover:text-white transition-colors">Studios</Link>
            <span className="text-white/30 mx-2">/</span>
            <Link href="/cities" className="text-white/50 hover:text-white transition-colors">Cities</Link>
            <span className="text-white/30 mx-2">/</span>
            <span className="text-white/80">{cityName}</span>
          </nav>

          <p className="text-xs font-bold tracking-[0.2em] uppercase mb-3" style={{ color: "#e8c560" }}>
            {state ? `${state} · ` : ""}Dance Studio Hub
          </p>
          <h1 className="font-display text-white font-bold mb-4"
            style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", lineHeight: 1.1 }}>
            Private Dance Lessons<br />
            <span style={{ color: "#e8c560" }}>in {cityName}</span>
          </h1>

          <p className="text-white/60 text-lg mb-8 max-w-2xl">
            {studios.length} top-rated {studios.length === 1 ? "studio" : "studios"} offering ballroom, Latin,
            tango, and more{avgRating > 0 ? ` · Avg. ${avgRating.toFixed(1)}★ rated` : ""}.
          </p>

          {/* Hero stats pills */}
          <div className="flex flex-wrap gap-3">
            <span className="px-4 py-2 rounded-full text-sm font-semibold bg-white/10 text-white/80">
              🎵 {studios.length} Studios
            </span>
            <span className="px-4 py-2 rounded-full text-sm font-semibold bg-white/10 text-white/80">
              📍 {cityName}{state ? `, ${state}` : ""}
            </span>
            {featuredStudios.length > 0 && (
              <span className="px-4 py-2 rounded-full text-sm font-semibold" style={{ background: "rgba(184,146,42,0.3)", color: "#e8c560" }}>
                ⭐ {featuredStudios.length} Featured
              </span>
            )}
          </div>
        </div>
      </section>

      {/* ── Featured / Sponsored Studios ──────────────────────────────────── */}
      {featuredStudios.length > 0 && (
        <section className="py-10 px-6 bg-white border-b border-gray-100">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs font-bold tracking-[0.15em] uppercase mb-1" style={{ color: "#b8922a" }}>
                  Sponsored Listings
                </p>
                <h2 className="font-display font-bold text-gray-900 text-xl">
                  Featured Studios in {cityName}
                </h2>
              </div>
              <Link
                href="/claim"
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg
                           border border-yellow-300 text-yellow-800 bg-yellow-50 hover:bg-yellow-100 transition-colors"
              >
                Advertise here →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {featuredStudios.map((studio) => (
                <StudioListCard key={studio.id} studio={studio} featured />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Main body: studio grid + sidebar ─────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Studio grid ─────────────────────────────────────────────── */}
          <div className="lg:col-span-2">
            {standardStudios.length > 0 ? (
              <>
                <h2 className="font-display font-bold text-gray-900 text-xl mb-6">
                  All Studios in {cityName}
                  <span className="ml-2 text-sm font-normal text-gray-400">
                    ({standardStudios.length})
                  </span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {standardStudios.map((studio) => (
                    <StudioListCard key={studio.id} studio={studio} />
                  ))}
                </div>
              </>
            ) : featuredStudios.length > 0 ? (
              <p className="text-gray-500 text-sm">All studios in {cityName} are shown above.</p>
            ) : null}

            {/* Metro suburbs note */}
            {metroSuburbs.length > 0 && (
              <div className="mt-10 p-5 rounded-xl border border-gray-100 bg-gray-50">
                <p className="text-sm font-semibold text-gray-700 mb-3">
                  Also in the {cityName} metro area:
                </p>
                <div className="flex flex-wrap gap-2">
                  {metroSuburbs.map((suburb) => (
                    <Link
                      key={suburb}
                      href={`/studios/city/${suburb.toLowerCase().replace(/\s+/g, "-")}`}
                      className="px-3 py-1.5 bg-white rounded-lg border border-gray-200 text-sm text-gray-700
                                 hover:border-yellow-400 hover:text-yellow-800 transition-colors font-medium"
                    >
                      {suburb}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Sidebar ──────────────────────────────────────────────────── */}
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

            {/* Browse by style in this city */}
            {popularStyles.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <h3 className="font-display font-bold text-gray-900 text-base mb-1">
                  Browse by Style
                </h3>
                <p className="text-xs text-gray-400 mb-4">
                  Available in {cityName}
                </p>
                <div className="space-y-0.5">
                  {popularStyles.map((style) => (
                    <Link
                      key={style}
                      href={STYLE_HREFS[style] ?? `/studios?style=${style}`}
                      className="flex items-center justify-between py-2 px-3 rounded-lg text-sm
                                 text-gray-700 hover:bg-yellow-50 hover:text-yellow-800 transition-colors group"
                    >
                      <span className="font-medium">{STYLE_LABELS[style]}</span>
                      <span className="text-xs text-gray-400 group-hover:text-yellow-600">
                        {styleCount[style]} studio{(styleCount[style] ?? 0) !== 1 ? "s" : ""}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Advertise Here CTA */}
            <div
              className="rounded-2xl p-6 shadow-sm"
              style={{ background: "linear-gradient(135deg, #0c1428, #1a2d5a)" }}
            >
              <p className="text-xs font-bold tracking-[0.15em] uppercase mb-2" style={{ color: "#e8c560" }}>
                Studio Owners
              </p>
              <h3 className="font-display font-bold text-white text-lg mb-2">
                Get Featured in {cityName}
              </h3>
              <p className="text-white/60 text-sm leading-relaxed mb-5">
                Reach students actively searching for dance lessons in {cityName}.
                Sponsored listings appear first, above all standard listings.
              </p>
              <div className="space-y-2 mb-5">
                {[
                  { label: "Featured listing", price: "$149/mo" },
                  { label: "Premium + gallery",  price: "$299/mo" },
                ].map((tier) => (
                  <div key={tier.label} className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/10">
                    <span className="text-white/80 text-sm">{tier.label}</span>
                    <span className="font-bold text-sm" style={{ color: "#e8c560" }}>{tier.price}</span>
                  </div>
                ))}
              </div>
              <Link
                href="/claim"
                className="block text-center w-full py-3 rounded-xl font-bold text-gray-900 text-sm
                           transition-all hover:brightness-110"
                style={{ background: "linear-gradient(135deg, #b8922a, #e8c560)" }}
              >
                Claim Your Studio →
              </Link>
            </div>

            {/* Neighborhoods in this city */}
            {(() => {
              const cityConf = getCityConfig(city);
              if (!cityConf || !cityConf.neighborhoods.length) return null;
              return (
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                  <h3 className="font-display font-bold text-gray-900 text-base mb-3">
                    Browse by Neighborhood
                  </h3>
                  <div className="space-y-0.5">
                    {cityConf.neighborhoods.map((n) => (
                      <Link
                        key={n.slug}
                        href={`/studios/city/${city}/${n.slug}`}
                        className="flex items-center justify-between py-2 px-3 rounded-lg text-sm
                                   text-gray-700 hover:bg-yellow-50 hover:text-yellow-800 transition-colors"
                      >
                        <span>{n.name}</span>
                        <span className="text-gray-300">→</span>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Browse other major cities */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="font-display font-bold text-gray-900 text-base mb-3">Other Top Markets</h3>
              <div className="space-y-0.5">
                {[
                  { slug: "los-angeles",    name: "Los Angeles" },
                  { slug: "new-york-city",  name: "New York City" },
                  { slug: "chicago",        name: "Chicago" },
                  { slug: "dallas",         name: "Dallas" },
                  { slug: "miami",          name: "Miami" },
                  { slug: "houston",        name: "Houston" },
                  { slug: "atlanta",        name: "Atlanta" },
                  { slug: "seattle",        name: "Seattle" },
                  { slug: "denver",         name: "Denver" },
                  { slug: "phoenix",        name: "Phoenix" },
                  { slug: "nashville",      name: "Nashville" },
                  { slug: "boston",         name: "Boston" },
                  { slug: "san-diego",      name: "San Diego" },
                  { slug: "austin",         name: "Austin" },
                  { slug: "tampa",          name: "Tampa" },
                ].filter((c) => c.slug !== city).slice(0, 10).map((c) => (
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
              <div className="mt-3 pt-3 border-t border-gray-100">
                <Link href="/cities" className="text-xs font-semibold text-amber-700 hover:text-amber-900 transition-colors">
                  View all cities →
                </Link>
              </div>
            </div>

            <Link href="/studios"
              className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
              ← All studios directory
            </Link>
          </div>
        </div>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="py-10 px-6 bg-white border-t border-gray-100 mt-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <div className="font-display font-bold text-gray-900">Ballroom Dance Directory</div>
            <p className="text-gray-400 text-sm mt-1">America&apos;s premier resource for private dance instruction</p>
          </div>
          <div className="flex gap-6 text-sm text-gray-400">
            <Link href="/" className="hover:text-gray-900 transition-colors">Home</Link>
            <Link href="/studios" className="hover:text-gray-900 transition-colors">All Studios</Link>
            <Link href="/cities" className="hover:text-gray-900 transition-colors">Cities</Link>
            <Link href="/claim" className="hover:text-gray-900 transition-colors">Claim Studio</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
