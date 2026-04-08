import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStudio, getAllStudioSlugs, getStudiosByCity } from "@/lib/wordpress";
import { Studio, StudioCard, CHAIN_CONFIG, STYLE_LABELS, AMENITY_LABELS, DanceStyle } from "@/types/studio";
import ClaimBadge from "@/components/ClaimBadge";
import LeadCaptureForm from "@/components/LeadCaptureForm";
import StudioGallery, { type UploadedPhoto } from "@/components/StudioGallery";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const revalidate = 3600;

// Static params

export async function generateStaticParams() {
  const slugs = await getAllStudioSlugs();
  return slugs.map((slug) => ({ slug }));
}

// Metadata

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
    title: `${studio.title}${location ? " \u2014 " + location : ""} | Ballroom Dance Directory`,
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

// Sub-components

function StarRating({ rating, count }: { rating: number; count?: number }) {
  const full  = Math.floor(rating);
  const half  = rating % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <div className="flex items-center gap-2">
      <span className="flex gap-0.5">
        {Array.from({ length: full  }).map((_, i) => (
          <span key={`f${i}`} className="text-xl" style={{ color: "#e8c560" }}>&#9733;</span>
        ))}
        {half && <span className="text-xl" style={{ color: "#e8c560" }}>&#9733;</span>}
        {Array.from({ length: empty }).map((_, i) => (
          <span key={`e${i}`} className="text-xl text-gray-300">&#9733;</span>
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

// Page

export default async function StudioPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [studio, cityStudiosRaw] = await Promise.all([
    getStudio(slug),
    // We resolve city studios after we know the studio; handled below
    Promise.resolve([] as StudioCard[]),
  ]);
  if (!studio) notFound();

  // Fetch related studios in the same city (excluding current)
  const relatedStudios = studio.city
    ? (await getStudiosByCity(
        studio.city.toLowerCase().replace(/\s+/g, "-")
      )).filter((s) => s.slug !== studio.slug).slice(0, 3)
    : [];

  // Fetch live GBP rating for paid-tier studios (non-fatal)
  let gbpRating:      number | null = null;
  let gbpReviewCount: number | null = null;
  let gbpConnected                  = false;
  if (studio.tier === "paid") {
    try {
      const { data: gbp } = await supabaseAdmin
        .from("gbp_connections")
        .select("rating, review_count, gbp_location_id")
        .eq("studio_slug", slug)
        .maybeSingle();
      if (gbp) {
        gbpConnected  = !!gbp.gbp_location_id;
        gbpRating      = gbp.rating     ? Number(gbp.rating)     : null;
        gbpReviewCount = gbp.review_count ? Number(gbp.review_count) : null;
        // Override WP-sourced rating with live GBP data when available
        if (gbpRating) {
          studio.rating      = gbpRating;
          studio.reviewCount = gbpReviewCount ?? studio.reviewCount;
        }
      }
    } catch { /* non-fatal */ }
  }

  // Fetch uploaded photos for paid-tier studios (non-fatal if table doesn't exist yet)
  let studioPhotos: UploadedPhoto[] = [];
  if (studio.tier === "paid") {
    try {
      const { data } = await supabaseAdmin
        .from("studio_photos")
        .select("id, url")
        .eq("studio_slug", slug)
        .order("created_at", { ascending: true })
        .limit(6);
      studioPhotos = data ?? [];
    } catch {
      // Table may not exist yet — fall back to Unsplash placeholders silently
    }
  }

  const chain    = CHAIN_CONFIG[studio.studioChain];
  const location = [studio.address, studio.city, studio.state, studio.zip]
    .filter(Boolean).join(", ");
  const cityState = studio.cityState;

  // Map embed query — prefer full address, fall back to city+state
  const mapQuery = location || [studio.city, studio.state].filter(Boolean).join(", ");
  const mapEmbedUrl = mapQuery
    ? `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed&zoom=15`
    : null;

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

  const schemaOrg = {
    "@context": "https://schema.org",
    "@type": "DanceSchool",
    "name": studio.title,
    "description": studio.description || studio.tagline,
    "url": studio.website || undefined,
    "telephone": studio.phone || undefined,
    "email": studio.email || undefined,
    ...(studio.address || studio.city ? {
      "address": {
        "@type": "PostalAddress",
        "streetAddress": studio.address || undefined,
        "addressLocality": studio.city || undefined,
        "addressRegion": studio.state || undefined,
        "postalCode": studio.zip || undefined,
        "addressCountry": "US",
      }
    } : {}),
    ...(studio.rating ? {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": studio.rating.toFixed(1),
        "reviewCount": studio.reviewCount || 1,
        "bestRating": "5",
        "worstRating": "1",
      }
    } : {}),
    ...(studio.privateLessonRate ? {
      "priceRange": studio.privateLessonRate,
    } : {}),
    "currenciesAccepted": "USD",
    "paymentAccepted": "Cash, Credit Card",
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.ballroomdancedirectory.com" },
      { "@type": "ListItem", "position": 2, "name": "Studios", "item": "https://www.ballroomdancedirectory.com/studios" },
      ...(studio.city ? [{
        "@type": "ListItem",
        "position": 3,
        "name": `Dance Studios in ${studio.city}`,
        "item": `https://www.ballroomdancedirectory.com/studios/city/${studio.city.toLowerCase().replace(/\s+/g, "-")}`,
      }] : []),
      {
        "@type": "ListItem",
        "position": studio.city ? 4 : 3,
        "name": studio.title,
        "item": `https://www.ballroomdancedirectory.com/studios/${studio.slug}`,
      },
    ],
  };

  const styleList = studio.danceStyles
    .map((s) => STYLE_LABELS[s as DanceStyle])
    .join(", ");

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      ...(studio.danceStyles.length > 0 ? [{
        "@type": "Question",
        "name": `What dance styles does ${studio.title} offer?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `${studio.title} offers ${styleList} instruction.`,
        },
      }] : []),
      ...(studio.city || studio.address ? [{
        "@type": "Question",
        "name": `Where is ${studio.title} located?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": location || `${studio.city}${studio.state ? ", " + studio.state : ""}`,
        },
      }] : []),
      ...(studio.privateLessonRate || studio.introLessonRate ? [{
        "@type": "Question",
        "name": `How much do lessons cost at ${studio.title}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": [
            studio.introLessonRate ? `Intro lesson: ${studio.introLessonRate}` : null,
            studio.privateLessonRate ? `Private lesson rate: ${studio.privateLessonRate}` : null,
            studio.monthlyRate ? `Monthly membership: ${studio.monthlyRate}` : null,
          ].filter(Boolean).join(". ") + ".",
        },
      }] : []),
      ...(studio.phone || studio.email || studio.website ? [{
        "@type": "Question",
        "name": `How can I contact ${studio.title}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": [
            studio.phone ? `Call ${studio.phone}` : null,
            studio.email ? `Email ${studio.email}` : null,
            studio.website ? `Visit ${studio.website}` : null,
          ].filter(Boolean).join(". ") + ".",
        },
      }] : []),
    ],
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {faqSchema.mainEntity.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

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

          {/* Badges row */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span
              className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide"
              style={{ color: chain.color, background: chain.bg }}
            >
              {chain.label}
            </span>
            {studio.tier === "paid" && (
              <span
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold"
                style={{ background: "#b8922a22", color: "#e8c560", border: "1px solid #b8922a" }}
              >
                Featured
              </span>
            )}
          </div>

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
                  <span className="text-white/20">&middot;</span>
                  <span>Est. {studio.foundedYear}</span>
                </>
              )}
            </div>
          )}

          {/* Verified Owner badge */}
          <div className="mt-4">
            <ClaimBadge slug={studio.slug} />
          </div>
        </div>
      </section>

      {/* Per-listing disclaimer */}
      {studio.tier !== "claimed" && studio.tier !== "paid" && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="max-w-5xl mx-auto px-6 py-3 flex items-start gap-2">
            <span className="text-amber-600 text-xs mt-0.5 shrink-0 font-bold italic">i</span>
            <p className="text-xs text-amber-800 leading-relaxed">
              <strong>Independent listing:</strong> Ballroom Dance Directory is not affiliated with{" "}
              {studio.studioChain !== "independent" ? chain.label : "this studio"}. This listing was
              compiled from public sources for informational purposes. Information may not be
              current &mdash; please contact the studio directly to confirm hours, pricing, and availability.{" "}
              <a
                href={`/claim?slug=${encodeURIComponent(studio.slug)}`}
                className="underline font-medium hover:text-amber-900"
              >
                Own this studio? Claim your listing.
              </a>
            </p>
          </div>
        </div>
      )}

      {/* Photo Gallery — currently only shown for claimed/paid studios.
          To re-enable Unsplash placeholders for ALL studios, remove the
          (studio.tier === "claimed" || studio.tier === "paid") && wrapper below. */}
      {(studio.tier === "claimed" || studio.tier === "paid") && (
        <div className="max-w-5xl mx-auto px-6 pt-10 pb-0">
          <StudioGallery
            studioId={studio.id}
            danceStyles={studio.danceStyles}
            chain={studio.studioChain}
            featuredImageUrl={studio.featuredImage}
            studioPhotos={studioPhotos}
          />
        </div>
      )}

      {/* Body */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left / Main */}
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
                      <span className="text-green-500 shrink-0">&#10003;</span>
                      {AMENITY_LABELS[a] || a}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Pricing */}
            <section>
              <h2 className="font-display font-bold text-gray-900 text-xl mb-4">Pricing</h2>
              {(studio.introLessonRate || studio.privateLessonRate || studio.monthlyRate) ? (
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
              ) : (
                /* No pricing data — show a CTA to contact the studio */
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800 mb-1">Pricing available upon inquiry</p>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      Private lesson rates vary by instructor and package. Contact {studio.title} directly
                      for current pricing, intro offers, and availability.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    {studio.phone && (
                      <a
                        href={`tel:${studio.phone.replace(/\D/g, "")}`}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-gray-900
                                   text-sm transition-all hover:brightness-110 whitespace-nowrap"
                        style={{ background: "linear-gradient(135deg, #b8922a, #e8c560)" }}
                      >
                        <PhoneIcon /> Call for Pricing
                      </a>
                    )}
                    {studio.website && (
                      <a
                        href={studio.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-gray-700
                                   text-sm border-2 border-gray-200 hover:border-yellow-400 hover:text-yellow-800
                                   transition-all whitespace-nowrap"
                      >
                        <GlobeIcon /> Visit Website
                      </a>
                    )}
                    {!studio.phone && !studio.website && (
                      <a
                        href={`/claim?slug=${encodeURIComponent(studio.slug)}`}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-gray-600
                                   text-sm border-2 border-dashed border-gray-300 hover:border-yellow-400
                                   hover:text-yellow-800 transition-all whitespace-nowrap"
                      >
                        Own this studio? Add pricing
                      </a>
                    )}
                  </div>
                </div>
              )}
            </section>

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
                <h2 className="font-display font-bold text-gray-900 text-xl mb-4">Reviews &amp; Directions</h2>
                <div className="flex flex-wrap gap-3">
                  {studio.yelpUrl && (
                    <a href={studio.yelpUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border-2 border-red-100
                                 bg-red-50 text-red-700 font-semibold text-sm hover:bg-red-100 transition-colors">
                      &#9733; Read Yelp Reviews
                    </a>
                  )}
                  {studio.googleMapsUrl && (
                    <a href={studio.googleMapsUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border-2 border-blue-100
                                 bg-blue-50 text-blue-700 font-semibold text-sm hover:bg-blue-100 transition-colors">
                      <MapIcon /> Get Directions
                    </a>
                  )}
                </div>
              </section>
            )}
          </div>

          {/* Right / Sidebar */}
          <div className="space-y-6">

            {/* Lead capture form */}
            {studio.tier === "paid" && (
              <LeadCaptureForm
                studioSlug={studio.slug}
                studioTitle={studio.title}
              />
            )}

            {/* Google Business Profile connect — Featured studios only */}
            {studio.tier === "paid" && !gbpConnected && (
              <div className="rounded-2xl border border-dashed border-gray-200 p-5 bg-gray-50 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⭐</span>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm mb-1">
                      Show Live Google Ratings
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed mb-3">
                      Connect your Google Business Profile to display live star ratings and
                      review counts directly on this listing.
                    </p>
                    <a
                      href={`/api/auth/google?studio_slug=${encodeURIComponent(studio.slug)}`}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold
                                 text-white transition-all hover:brightness-110"
                      style={{ background: "#4285f4" }}
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Connect Google Business
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* GBP connected confirmation */}
            {studio.tier === "paid" && gbpConnected && (
              <div className="rounded-2xl border border-green-100 p-4 bg-green-50 shadow-sm">
                <div className="flex items-center gap-2 text-green-700 text-sm font-semibold">
                  <span>✅</span> Google ratings connected
                </div>
                <p className="text-xs text-green-600 mt-1">
                  Ratings refresh daily. Last sync shows {gbpRating?.toFixed(1)}★
                  {gbpReviewCount ? ` · ${gbpReviewCount.toLocaleString()} reviews` : ""}.
                </p>
              </div>
            )}

            {/* Contact card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="font-display font-bold text-gray-900 text-lg mb-4">Contact &amp; Location</h3>

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

            {/* Google Map embed */}
            {mapEmbedUrl && (
              <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                <iframe
                  title={`Map of ${studio.title}`}
                  src={mapEmbedUrl}
                  width="100%"
                  height="220"
                  style={{ border: 0, display: "block" }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen={false}
                />
              </div>
            )}

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
              &larr; Back to all studios
            </Link>
          </div>
        </div>
      </div>

      {/* Related Studios */}
      {relatedStudios.length > 0 && (
        <section className="bg-gray-50 border-t border-gray-100 py-12 px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="font-display font-bold text-gray-900 text-2xl mb-6">
              More Studios in {studio.city}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {relatedStudios.map((s) => {
                const sChain = CHAIN_CONFIG[s.studioChain];
                return (
                  <Link
                    key={s.slug}
                    href={`/studios/${s.slug}`}
                    className="group bg-white rounded-2xl border border-gray-200 p-5 shadow-sm
                               hover:shadow-md hover:border-yellow-300 transition-all block"
                  >
                    <span
                      className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold mb-3"
                      style={{ color: sChain.color, background: sChain.bg }}
                    >
                      {sChain.label}
                    </span>
                    <h3 className="font-display font-bold text-gray-900 text-base mb-1 group-hover:text-amber-800 transition-colors">
                      {s.title}
                    </h3>
                    {s.tagline && (
                      <p className="text-gray-500 text-sm italic mb-2 line-clamp-2">{s.tagline}</p>
                    )}
                    {s.description && !s.tagline && (
                      <p className="text-gray-500 text-sm mb-2 line-clamp-2">{s.description}</p>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      {s.privateLessonRate && (
                        <span className="text-sm font-semibold" style={{ color: "#b8922a" }}>
                          {s.privateLessonRate}
                        </span>
                      )}
                      <span className="text-xs text-gray-400 ml-auto">View studio &rarr;</span>
                    </div>
                  </Link>
                );
              })}
            </div>
            <div className="mt-6">
              <Link
                href={`/studios/city/${studio.city.toLowerCase().replace(/\s+/g, "-")}`}
                className="text-sm font-semibold text-amber-700 hover:text-amber-900 transition-colors"
              >
                See all dance studios in {studio.city} &rarr;
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-10 px-6 bg-white border-t border-gray-100 mt-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <div className="font-display font-bold text-gray-900">Ballroom Dance Directory</div>
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
