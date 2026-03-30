import { Metadata } from "next";
import Link from "next/link";
import { DANCE_STYLES, STYLE_LABELS } from "@/types/studio";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Private Dance Lessons Directory — Find Elite Studios Near You",
  description:
    "Discover the finest private dance instruction studios across the United States. Fred Astaire, Arthur Murray, Dance With Me, and elite independent studios.",
};

const FEATURED_STYLES = [
  { key: "ballroom",      label: "Ballroom",      desc: "Classic elegance, refined technique" },
  { key: "latin",         label: "Latin",          desc: "Salsa, Rumba, Cha-Cha & more" },
  { key: "tango",         label: "Tango",          desc: "Passion and precision" },
  { key: "wedding-dance", label: "Wedding Dance",  desc: "Your perfect first dance" },
  { key: "swing",         label: "Swing",          desc: "Jive, East Coast, West Coast" },
  { key: "competition",   label: "Competition",    desc: "Train to compete and win" },
];

export default function HomePage() {
  return (
    <main>
      {/* Hero */}
      <section
        className="relative min-h-[85vh] flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, #0c1428 0%, #1a2d5a 60%, #2d1f0e 100%)" }}
      >
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <p className="text-xs font-bold tracking-[0.2em] uppercase mb-4"
            style={{ color: "#e8c560" }}>
            The Premier Dance Studio Directory
          </p>
          <h1 className="font-display text-white mb-6"
            style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)", lineHeight: 1.15, fontWeight: 800 }}>
            Find Private Dance Lessons
            <span className="block" style={{ color: "#e8c560" }}>Near You</span>
          </h1>
          <p className="text-white/70 max-w-xl mx-auto mb-12"
            style={{ fontSize: "1.1rem", lineHeight: 1.75 }}>
            Browse Fred Astaire, Arthur Murray, Dance With Me, and elite independent
            studios offering private instruction across the United States.
          </p>
          <form action="/search" method="GET"
            className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
            <input type="text" name="city" placeholder="City or ZIP code"
              className="flex-1 px-5 py-4 rounded-lg text-gray-900 text-base bg-white
                         border-2 border-transparent focus:outline-none focus:border-yellow-400
                         placeholder:text-gray-400" />
            <select name="style"
              className="sm:w-56 px-5 py-4 rounded-lg text-base bg-white text-gray-900
                         border-2 border-transparent focus:outline-none focus:border-yellow-400">
              <option value="">All Dance Styles</option>
              {DANCE_STYLES.map((s) => (
                <option key={s} value={s}>{STYLE_LABELS[s]}</option>
              ))}
            </select>
            <button type="submit"
              className="px-8 py-4 rounded-lg font-bold text-gray-900 text-base
                         transition-all duration-200 hover:brightness-110"
              style={{ background: "linear-gradient(135deg, #b8922a, #e8c560)" }}>
              Find Studios
            </button>
          </form>
          <p className="mt-6 text-white/40 text-sm">500+ elite studios listed across the United States</p>
        </div>
      </section>

      {/* Browse by Style */}
      <section className="py-20 px-6" style={{ background: "#f9f6f0" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold tracking-[0.15em] uppercase mb-3" style={{ color: "#b8922a" }}>
              Browse by Style
            </p>
            <h2 className="font-display text-gray-900 font-bold"
              style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)" }}>
              What Would You Like to Learn?
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {FEATURED_STYLES.map((style) => (
              <Link key={style.key} href={`/${style.key}-dance-lessons`}
                className="group p-6 bg-white rounded-xl border border-gray-200
                           hover:border-yellow-400 hover:shadow-lg transition-all duration-200">
                <h3 className="font-display font-bold text-gray-900 text-xl mb-1
                               group-hover:text-yellow-700 transition-colors">
                  {style.label}
                </h3>
                <p className="text-gray-500 text-sm">{style.desc}</p>
                <p className="mt-3 text-xs font-bold tracking-wide uppercase" style={{ color: "#b8922a" }}>
                  Find Studios →
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Studio Chains */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold tracking-[0.15em] uppercase mb-3" style={{ color: "#b8922a" }}>
              Featured Studio Networks
            </p>
            <h2 className="font-display text-gray-900 font-bold"
              style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)" }}>
              America&apos;s Premier Dance Studio Brands
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: "Fred Astaire Dance Studios", count: "200+", desc: "The gold standard in American ballroom dance education since 1947." },
              { name: "Arthur Murray Dance Studios", count: "280+", desc: "The world's most recognized name in dance instruction for over 100 years." },
              { name: "Dance With Me Studios",       count: "20+",  desc: "As seen on Dancing with the Stars. Premium instruction on the East Coast." },
            ].map((chain) => (
              <div key={chain.name} className="p-8 rounded-xl border border-gray-200" style={{ background: "#f9f6f0" }}>
                <div className="text-3xl font-display font-bold mb-1" style={{ color: "#b8922a" }}>{chain.count}</div>
                <div className="text-xs font-bold tracking-wide uppercase text-gray-400 mb-3">Locations</div>
                <h3 className="font-display font-bold text-gray-900 text-lg mb-2">{chain.name}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{chain.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Private Lessons */}
      <section className="py-20 px-6" style={{ background: "#0c1428" }}>
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs font-bold tracking-[0.15em] uppercase mb-4" style={{ color: "#e8c560" }}>
            Why Private Instruction
          </p>
          <h2 className="font-display text-white font-bold mb-6"
            style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)" }}>
            The Difference Private Lessons Make
          </h2>
          <p className="text-white/60 text-lg leading-relaxed max-w-2xl mx-auto mb-12">
            Private dance instruction offers personalized attention, accelerated progress,
            and the flexibility to learn at your own pace — all with an instructor focused
            entirely on your technique and goals.
          </p>
          <Link href="/ballroom-dance-lessons"
            className="inline-block px-8 py-4 rounded-lg font-bold text-gray-900 transition-all hover:brightness-110"
            style={{ background: "linear-gradient(135deg, #b8922a, #e8c560)" }}>
            Browse All Studios
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-white border-t border-gray-200">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <div className="font-display font-bold text-gray-900 text-lg">Private Dance Directory</div>
            <p className="text-gray-400 text-sm mt-1">America&apos;s premier resource for private dance instruction</p>
          </div>
          <div className="flex gap-6 text-sm text-gray-400">
            <Link href="/ballroom-dance-lessons" className="hover:text-gray-900 transition-colors">Ballroom</Link>
            <Link href="/latin-dance-lessons"    className="hover:text-gray-900 transition-colors">Latin</Link>
            <Link href="/tango-dance-lessons"    className="hover:text-gray-900 transition-colors">Tango</Link>
            <Link href="/wedding-dance-lessons"  className="hover:text-gray-900 transition-colors">Wedding Dance</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
