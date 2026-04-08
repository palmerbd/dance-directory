import { DanceStyle, StudioChain } from "@/types/studio";

interface PhotoMeta { id: string; alt: string; }
interface StudioPhotos { hero: PhotoMeta; gallery: PhotoMeta[]; }

// Curated Unsplash photo IDs by chain/style
const CHAIN_PHOTOS: Record<string, string> = {
  fred_astaire:  "photo-1545959570-a94084071b5d",
  arthur_murray: "photo-1517457373958-b7bdd4587205",
  dance_with_me: "photo-1508700929628-666bc8bd84ea",
};

const STYLE_PHOTOS: Record<string, string[]> = {
  ballroom: ["photo-1545959570-a94084071b5d","photo-1519925610903-381054cc2a1c"],
  latin:    ["photo-1508700929628-666bc8bd84ea","photo-1504609813442-a8924e83f76e"],
  tango:    ["photo-1547036967-23d11aacaee0","photo-1533174072545-7a4b6ad7a6c3"],
  salsa:    ["photo-1504609813442-a8924e83f76e","photo-1508700929628-666bc8bd84ea"],
  swing:    ["photo-1519925610903-381054cc2a1c","photo-1535525153412-5a42439a210d"],
  default:  ["photo-1519925610903-381054cc2a1c","photo-1535525153412-5a42439a210d","photo-1547036967-23d11aacaee0"],
};

export function getStudioPhotos(
  studioId: number,
  styles: DanceStyle[],
  chain: StudioChain
): StudioPhotos {
  const chainId  = CHAIN_PHOTOS[chain];
  const styleKey = styles[0] || "default";
  const pool     = STYLE_PHOTOS[styleKey] ?? STYLE_PHOTOS.default;
  const heroId   = chainId ?? pool[studioId % pool.length];

  return {
    hero:    { id: heroId, alt: "Dance studio interior" },
    gallery: pool.map((id) => ({ id, alt: "Dance studio" })),
  };
}

export function unsplashUrl(photoId: string, w: number, h: number): string {
  return `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=${w}&h=${h}&q=80`;
}
