"use client";

interface Props { slug: string; }

export default function ClaimBadge({ slug }: Props) {
  return (
    <a
      href={`/claim?studio=${slug}`}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold
                 border border-gray-300 text-gray-600 hover:border-yellow-400 hover:text-yellow-700
                 transition-colors bg-white"
    >
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round"
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
      Claim this listing
    </a>
  );
}
