import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStudio, getAllStudioSlugs } from "@/lib/wordpress";
import { Studio, CHAIN_CONFIG, STYLE_LABELS, AMENITY_LABELS, DanceStyle } from "@/types/studio";

export const revalidate = 3600;

// ── Static params ─────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  const slugs = await getAllStudioSlugs();
  return slugs.map((slug) => ({ slug }));
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const studio = await getStudio(slug);
  if (!studio) return { title: "Studio Not Found" };

  const location = [studio.city, studio.state].filter(Boolean).join(", ");
  return {
    title: `${studio.title}${location ? ` — ${location}` : ""} | Private Dance Directory`,
    description:
      studio.description ||
      `Private dance lessons at ${studio.title}${location ? ` in ${location}` : ""}. ${
        studio.danceStyles.map((s) => STYLE_LABELS[s as DanceStyle]).join(", ")
      } instruction available.`,
    openGraph: {
      title: studio.title,
      description: studio.tagline || studio.description,
    },
  };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StarRating({ rating, count }: { rating: number; count?: number }) {
  const full  = Math.floor(rating);
  const half  = rating % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <div className="flex items-center gap-2">
      <span className="flex gap-0.5">
        {Array.from({ length: full  }).map((_, i) => (
          <span key={`f${i}`} className="text-xl" style={{ color: "#e8c560" }}>★</span>
        ))}
        {half && <span className="text-xl" style={{ color: "#e8c560" }}>★</span>}
        {Array.from({ length: empty }).map((_, i) => (
          <span key={`e${i}`} className="text-xl text-gray-300">★</span>
        ))}
      </span>
      <span className="font-bold text-gray-900">{rating.toFixed(1)}</span>
      {count && <span className="text-gray-400 text-sm">({count} reviews)</span>}
    </div>
  );
}

function InfoRow({ icon, label, value, href }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      <span className="mt-0.5 shrink-0 text-gray-400">{icon}</span>
      <div>
        <div className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-0.5">{label}</div>
        <div className="text-gray-800 font-medium">{value}</div>
      </div>
    </div>
  );
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className="block hover:bg-gray-50 -mx-1 px-1 rounded transition-colors">
      {content}
    </a>
  ) : (
    <div>{content}</div>
  );
}

// SVG icon helpers
const PhoneIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 7V5z" />
  </svg>
);
const MapIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const GlobeIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
  </svg>
);
const MailIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);
const CalendarIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function StudioPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const studio: Studio | null = await getStudio(slug);
  if (!studio) notFound();

  const chain    = CHAIN_CONFIG[studio.studioChain];
  const location = [studio.address, studio.city, studio.state, studio.zip]
    .filter(Boolean).join(", ");
  const cityState = studio.cityState;

  const hours = studio.hours;
  const hoursRows = [
    { day: "Monday",    val: hours?.monday    },
    { day: "Tuesday",   val: hours?.tuesday   },
    { day: "Wednesday", val: hours?.wednesday },
    { day: "Thursday",  val: hours?.thursday  },
    { day: "Friday",    val: hours?.friday    },
    { day: "Saturday",  val: hours?.saturday  },
    { day: "Sunday",    val: hours?.sunday    },
  ].filter((r) => r.val);

  return (
    <main>
      {/* Hero / Title Bar */}
      <section
        className="py-14 px-6"
        style={{ background: "linear-gradient(135deg, #0c1428 0%, #1a2d5a 100%)" }}
      >
        <div className="max-w-5xl mx-auto">
          {/* Breadcrumb */}
          <nav className="text-sm mb-6">
            <Link href="/" className="text-white/50 hover:text-white transition-colors">Home</Link>
            <span className="text-white/30 mx-2">/</span>
            <Link href="/studios" className="text-white/50 hover:text-white transition-colors">Studios</Link>
            <span className="text-white/30 mx-2">/</span>
            <span className="text-white/80">{studio.title}</span>
          </nav>

          {/* Chain badge */}
          <span
            className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide mb-4"
            style={{ color: chain.color, background: chain.bg }}
          >
            {chain.label}
          </span>

          <h1 className="font-display text-white font-bold mb-3"
            style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)" }}>
            {studio.title}
          </h1>

          {studio.tagline && (
            <p className="text-white/60 text-lg italic mb-4">{studio.tagline}</p>
          )}

          {/* Rating */}
          {studio.rating && (
            <div className="mb-4">
              <StarRating rating={studio.rating} count={studio.reviewCount} />
            </div>
          )}

          {/* Location pill */}
          {(studio.city || studio.state) && (
            <div className="flex items-center gap-2 text-white/60 text-sm">
              <MapIcon />
              <span>{studio.city}{studio.city && studio.state ? ", " : ""}{studio.state}</span>
              {studio.foundedYear && (
                <>
                  <span className="text-white/20">·</span>
                  <span>Est. {studio.foundedYear}</span>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Body */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Left / Main ── */}
          <div className="lg:col-span-2 space-y-8">

            {/* About */}
            {studio.description && (
              <section>
                <h2 className="font-display font-bold text-gray-900 text-xl mb-3">About</h2>
                <p className="text-gray-600 leading-relaxed">{studio.description}</p>
              </section>
            )}

            {/* Dance Styles */}
            {studio.danceStyles.length > 0 && (
              <section>
                <h2 className="font-display font-bold text-gray-900 text-xl mb-4">Dance Styles Offered</h2>
                <div className="flex flex-wrap gap-2">
                  {studio.danceStyles.map((style) => (
                    <span
                      key={style}
                      className="px-4 py-2 rounded-full text-sm font-semibold border"
                      style={{ borderColor: "#b8922a", color: "#b8922a", background: "#fdf8f0" }}
                    >
                      {STYLE_LABELS[style as DanceStyle]}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Amenities */}
            {studio.amenities && studio.amenities.length > 0 && (
              <section>
                <h2 className="font-display font-bold text-gray-900 text-xl mb-4">Amenities</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {studio.amenities.map((a) => (
                    <div key={a} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="text-green-500 shrink-0">✓</span>
                      {AMENITY_LABELS[a] || a}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Pricing */}
            {(studio.introLessonRate || studio.privateLessonRate || studio.monthlyRate) && (
              <section>
                <h2 className="font-display font-bold text-gray-900 text-xl mb-4">Pricing</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {studio.introLessonRate && (
                    <div className="p-4 rounded-xl border border-gray-200 text-center">
                      <div className="text-2xl font-bold mb-1" style={{ color: "#b8922a" }}>
                        {studio.introLessonRate}
                      </div>
                      <div className="text-xs font-bold uppercase tracking-wide text-gray-400">Intro Lesson</div>
                    </div>
                  )}
                  {studio.privateLessonRate && (
                    <div className="p-4 rounded-xl border border-gray-200 text-center">
                      <div className="text-2xl font-bold mb-1" style={{ color: "#b8922a" }}>
                        {studio.privateLessonRate}
                      </div>
                      <div className="text-xs font-bold uppercase tracking-wide text-gray-400">Drop-In Rate</div>
                    </div>
                  )}
                  {studio.monthlyRate && (
                    <div className="p-4 rounded-xl border border-gray-200 text-center">
                      <div className="text-2xl font-bold mb-1" style={{ color: "#b8922a" }}>
                        {studio.monthlyRate}
                      </div>
                      <div className="text-xs font-bold uppercase tracking-wide text-gray-400">Membership</div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Hours */}
            {hoursRows.length > 0 && (
              <section>
                <h2 className="font-display font-bold text-gray-900 text-xl mb-4">Business Hours</h2>
                <div className="rounded-xl border border-gray-200 overflow-hidden">
                  {hoursRows.map((row, i) => (
                    <div key={row.day}
                      className={`flex justify-between px-5 py-3 text-sm ${
                        i % 2 === 0 ? "bg-white" : "bg-gray-50"
                      }`}>
                      <span className="font-semibold text-gray-700">{row.day}</span>
                      <span className="text-gray-500">{row.val}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* External Reviews */}
            {(studio.yelpUrl || studio.googleMapsUrl) && (
              <section>
                <h2 className="font-display font-bold text-gray-900 text-xl mb-4">Reviews & Directions</h2>
                <div className="flex flex-wrap gap-3">
                  {studio.yelpUrl && (
                    <a href={studio.yelpUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border-2 border-red-100
                                 bg-red-50 text-red-700 font-semibold text-sm hover:bg-red-100 transition-colors">
                      ★ Read Yelp Reviews
                    </a>
                  )}
                  {studio.googleMapsUrl && (
                    <a href={studio.googleMapsUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border-2 border-blue-100
                                 bg-blue-50 text-blue-700 font-semibold text-sm hover:bg-blue-100 transition-colors">
                      🗺 Get Directions
                    </a>
                  )}
                </div>
              </section>
            )}
          </div>

          {/* ── Right / Sidebar ── */}
          <div className="space-y-6">

            {/* Contact card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="font-display font-bold text-gray-900 text-lg mb-4">Contact & Location</h3>

              {studio.phone && (
                <InfoRow
                  icon={<PhoneIcon />}
                  label="Phone"
                  value={studio.phone}
                  href={`tel:${studio.phone.replace(/\D/g, "")}`}
                />
              )}
              {location && (
                <InfoRow
                  icon={<MapIcon />}
                  label="Address"
                  value={location}
                  href={studio.googleMapsUrl}
                />
              )}
              {studio.website && (
                <InfoRow
                  icon={<GlobeIcon />}
                  label="Website"
                  value={studio.website.replace(/^https?:\/\//, "")}
                  href={studio.website}
                />
              )}
              {studio.email && (
                <InfoRow
                  icon={<MailIcon />}
                  label="Email"
                  value={studio.email}
                  href={`mailto:${studio.email}`}
                />
              )}
              {studio.foundedYear && (
                <InfoRow
                  icon={<CalendarIcon />}
                  label="Established"
                  value={String(studio.foundedYear)}
                />
              )}

              {/* Primary CTA */}
              {studio.phone && (
                <a
                  href={`tel:${studio.phone.replace(/\D/g, "")}`}
                  className="mt-5 flex items-center justify-center gap-2 w-full py-3 rounded-xl
                             font-bold text-gray-900 text-sm transition-all hover:brightness-110"
                  style={{ background: "linear-gradient(135deg, #b8922a, #e8c560)" }}
                >
                  <PhoneIcon /> Call to Book a Lesson
                </a>
              )}
              {studio.website && (
                <a
                  href={studio.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 flex items-center justify-center gap-2 w-full py-3 rounded-xl
                             font-bold text-gray-700 text-sm border-2 border-gray-200
                             hover:border-yellow-400 hover:text-yellow-800 transition-all"
                >
                  <GlobeIcon /> Visit Website
                </a>
              )}
            </div>

            {/* Social links */}
            {(studio.facebookUrl || studio.instagramUrl) && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <h3 className="font-display font-bold text-gray-900 text-lg mb-4">Follow</h3>
                <div className="space-y-2">
                  {studio.facebookUrl && (
                    <a href={studio.facebookUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                      <span>f</span> Facebook
                    </a>
                  )}
                  {studio.instagramUrl && (
                    <a href={studio.instagramUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-pink-600 hover:underline">
                      <span>@</span> Instagram
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Back to directory */}
            <Link href="/studios"
              className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
              ← Back to all studios
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
