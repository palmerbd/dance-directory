import { MetadataRoute } from "next";
import { getAllStudios } from "@/lib/wordpress";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.privatedancedirectory.com";

const CITIES = [
  "los-angeles",
  "chicago",
  "dallas",
  "miami",
  "houston",
  "new-york",
  "austin",
  "atlanta",
  "seattle",
  "denver",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const studios = await getAllStudios();

  const studioEntries: MetadataRoute.Sitemap = studios.map((studio) => ({
    url: `${BASE_URL}/studios/${studio.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const cityEntries: MetadataRoute.Sitemap = CITIES.map((city) => ({
    url: `${BASE_URL}/studios/city/${city}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/studios`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  return [...staticEntries, ...cityEntries, ...studioEntries];
}
