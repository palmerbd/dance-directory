"use client";
import { DanceStyle, StudioChain } from "@/types/studio";

export interface UploadedPhoto { url: string; caption?: string; }

interface Props {
  studioId: number;
  danceStyles: DanceStyle[];
  chain: StudioChain;
  featuredImageUrl?: string;
  studioPhotos?: UploadedPhoto[];
}

export default function StudioGallery({ featuredImageUrl, studioPhotos = [] }: Props) {
  const allPhotos: UploadedPhoto[] = [
    ...(featuredImageUrl ? [{ url: featuredImageUrl, caption: "Studio" }] : []),
    ...studioPhotos,
  ];

  if (!allPhotos.length) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {allPhotos.map((p, i) => (
        <div key={i} className="relative aspect-video rounded-xl overflow-hidden bg-gray-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={p.url}
            alt={p.caption || `Studio photo ${i + 1}`}
            className="w-full h-full object-cover"
          />
        </div>
      ))}
    </div>
  );
}
