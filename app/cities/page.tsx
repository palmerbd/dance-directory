import { Metadata } from "next";
import Link from "next/link";
import { getAllCities } from "@/lib/wordpress";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Browse Dance Studios by City | Ballroom Dance Directory",
  description:
    "Find private ballroom dance studios in your city. Browse our directory of 4,000+ studios across hundreds of US cities — from New York to Los Angeles and everywhere in between.",
};

// US state name lookup
const STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri",
  MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio",
  OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
  VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
  DC: "Washington DC",
};

export default async function CitiesPage() {
  const allCities = await getAllCities();

  // Group by state
  const byState = new Map<string, typeof allCities>();
  for (const c of allCities) {
    if (!c.state) continue;
    const st = c.state.toUpperCase();
    if (!byState.has(st)) byState.set(st, []);
    byState.get(st)!.push(c);
  }

  // Sort states alphabetically
  const sortedStates = Array.from(byState.entries()).sort(([a], [b]) => {
    const nameA = STATE_NAMES[a] || a;
    const nameB = STATE_NAMES[b] || b;
    return nameA.localeCompare(nameB);
  });

  // Top cities (sorted by studio count)
  const topCities = [...allCities].slice(0, 20);

  const totalCities = allCities.length;
  const totalStudios = allCities.reduce((sum, c) => sum + c.count, 0);

  return (
    <main>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section
        className="py-16 px-6"
        style={{ background: "linear-gradient(135deg, #0c1428 0%, #1a2d5a 100%)" }}
      >
        <div className="max-w-6xl mx-auto">
          <nav className="text-sm mb-6">
            <Link href="/" className="text-white/50 hover:text-white transition-colors">Home</Link>
            <span className="text-white/30 mx-2">/</span>
            <span className="text-white/80">Browse by City</span>
          </nav>
          <p className="text-xs font-bold tracking-[0.2em] uppercase mb-3" style={{ color: "#e8c560" }}>
            Find Studios Near You
          </p>
          <h1
            className="font-display text-white font-bold mb-4"
            style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}
          >
            Browse Studios by City
          </h1>
          <p className="text-white/60 text-lg max-w-2xl">
            {totalStudios.toLocaleString()} studios across {totalCities} cities — click your city to see all listings.
          </p>
        </div>
      </section>

      {/* ── Top Cities ─────────────────────────────────────────────────────── */}
      <section className="py-12 px-6 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display font-bold text-gray-900 text-2xl mb-2">Top Markets</h2>
          <p className="text-gray-500 text-sm mb-8">Cities with the most studios in our directory</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {topCities.map((c) => (
              <Link
                key={`${c.city}-${c.state}`}
                href={`/studios/city/${c.slug}`}
                className="group flex flex-col items-center justify-center p-4 rounded-xl border border-gray-200
                           hover:border-yellow-400 hover:shadow-md hover:bg-yellow-50 transition-all duration-200
                           text-center"
              >
                <span className="font-semibold text-gray-900 group-hover:text-yellow-800 transition-colors text-sm leading-tight">
                  {c.city}
                </span>
                <span className="text-xs text-gray-400 mt-0.5">{c.state}</span>
                <span
                  className="mt-2 text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: "#fef3c7", color: "#92400e" }}
                >
                  {c.count} studio{c.count !== 1 ? "s" : ""}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── All Cities by State ─────────────────────────────────────────────── */}
      <section className="py-12 px-6" style={{ background: "#f9f6f0" }}>
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display font-bold text-gray-900 text-2xl mb-2">All Cities by State</h2>
          <p className="text-gray-500 text-sm mb-10">
            {sortedStates.length} states covered — click any city to view its studios
          </p>

          <div className="space-y-10">
            {sortedStates.map(([abbr, cities]) => (
              <div key={abbr}>
                {/* State header */}
                <div className="flex items-center gap-3 mb-4">
                  <span
                    className="inline-flex items-center justify-center w-10 h-10 rounded-lg font-bold text-sm"
                    style={{ background: "linear-gradient(135deg, #0c1428, #1a2d5a)", color: "#e8c560" }}
                  >
                    {abbr}
                  </span>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg leading-tight">
                      {STATE_NAMES[abbr] || abbr}
                    </h3>
                    <p className="text-xs text-gray-400">
                      {cities.reduce((s, c) => s + c.count, 0)} studios · {cities.length} cit{cities.length !== 1 ? "ies" : "y"}
                    </p>
                  </div>
                </div>

                {/* Cities grid */}
                <div className="flex flex-wrap gap-2">
                  {cities.map((c) => (
                    <Link
                      key={`${c.city}-${c.state}`}
                      href={`/studios/city/${c.slug}`}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-gray-200
                                 hover:border-yellow-400 hover:bg-yellow-50 transition-colors text-sm font-medium
                                 text-gray-700 hover:text-yellow-800 group"
                    >
                      {c.city}
                      <span className="text-xs text-gray-400 group-hover:text-yellow-600">
                        ({c.count})
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────────── */}
      <section className="py-14 px-6 bg-white border-t border-gray-100">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display font-bold text-gray-900 text-2xl mb-3">
            Don&apos;t see your city?
          </h2>
          <p className="text-gray-500 mb-6">
            Our directory covers 45 states. Browse all studios or search by name to find what you&apos;re looking for.
          </p>
          <Link
            href="/studios"
            className="inline-block px-8 py-3 rounded-lg font-bold text-gray-900 transition-all hover:brightness-110"
            style={{ background: "linear-gradient(135deg, #b8922a, #e8c560)" }}
          >
            Browse All Studios
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="py-10 px-6 bg-white border-t border-gray-100">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <div className="font-display font-bold text-gray-900">Ballroom Dance Directory</div>
            <p className="text-gray-400 text-sm mt-1">America&apos;s premier resource for private dance instruction</p>
          </div>
          <div className="flex gap-6 text-sm text-gray-400">
            <Link href="/" className="hover:text-gray-900 transition-colors">Home</Link>
            <Link href="/studios" className="hover:text-gray-900 transition-colors">All Studios</Link>
            <Link href="/styles" className="hover:text-gray-900 transition-colors">Browse by Style</Link>
            <Link href="/claim" className="hover:text-gray-900 transition-colors">Claim Studio</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
