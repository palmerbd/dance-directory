// ─── Studio Data Types ────────────────────────────────────────────────────────

export type StudioChain =
  | "fred_astaire"
  | "arthur_murray"
  | "dance_with_me"
  | "independent";

export type DanceStyle =
  | "ballroom"
  | "latin"
  | "tango"
  | "salsa"
  | "swing"
  | "waltz"
  | "foxtrot"
  | "cha_cha"
  | "rumba"
  | "wedding_dance"
  | "competition";

export type ListingTier = "free" | "paid";

export interface StudioHours {
  monday?:    string;
  tuesday?:   string;
  wednesday?: string;
  thursday?:  string;
  friday?:    string;
  saturday?:  string;
  sunday?:    string;
}

export interface Studio {
  id:                     number;
  slug:                   string;
  title:                  string;
  description:            string;
  phone:                  string;
  address:                string;
  city:                   string;
  state:                  string;
  zip:                    string;
  website?:               string;
  email?:                 string;
  hours?:                 StudioHours;
  studioChain:            StudioChain;
  danceStyles:            DanceStyle[];
  privateLessonRate?:     string;
  introLessonRate?:       string;
  monthlyRate?:           string;
  rating?:                number;
  reviewCount?:           number;
  tagline?:               string;
  foundedYear?:           number;
  yelpUrl?:               string;
  googleMapsUrl?:         string;
  facebookUrl?:           string;
  instagramUrl?:          string;
  amenities?:             string[];
  hasParking?:            boolean;
  hasPrivateLessons?:     boolean;
  hasGroupClasses?:       boolean;
  hasSprungFloor?:        boolean;
  instructorCount?:       number;
  competitionTraining:    boolean;
  weddingDanceSpecialty:  boolean;
  medalProgram:           boolean;
  featuredImage?:         string;
  claimed:                boolean;
  tier:                   ListingTier;
  cityState:              string; // e.g. "new-york-ny" — used in URL
}

export interface StudioCard {
  id:                number;
  slug:              string;
  title:             string;
  city:              string;
  state:             string;
  cityState:         string;
  studioChain:       StudioChain;
  danceStyles:       DanceStyle[];
  featuredImage?:    string;
  tier:              ListingTier;
  description:       string;
  rating?:           number;
  reviewCount?:      number;
  tagline?:          string;
  phone?:            string;
  address?:          string;
  privateLessonRate?: string;
}

// ─── Search / Filter Types ────────────────────────────────────────────────────

export interface SearchParams {
  city?:  string;
  style?: DanceStyle;
}

// ─── Chain Display Config ─────────────────────────────────────────────────────

export const CHAIN_CONFIG: Record<StudioChain, { label: string; color: string; bg: string }> = {
  fred_astaire:   { label: "Fred Astaire",   color: "#1e3a8a", bg: "#dbeafe" },
  arthur_murray:  { label: "Arthur Murray",  color: "#065f46", bg: "#d1fae5" },
  dance_with_me:  { label: "Dance With Me",  color: "#4c1d95", bg: "#ede9fe" },
  independent:    { label: "Independent",    color: "#92400e", bg: "#fef3c7" },
};

export const STYLE_LABELS: Record<DanceStyle, string> = {
  ballroom:       "Ballroom",
  latin:          "Latin",
  tango:          "Tango",
  salsa:          "Salsa",
  swing:          "Swing",
  waltz:          "Waltz",
  foxtrot:        "Foxtrot",
  cha_cha:        "Cha-Cha",
  rumba:          "Rumba",
  wedding_dance:  "Wedding Dance",
  competition:    "Competition",
};

export const DANCE_STYLES: DanceStyle[] = [
  "ballroom", "latin", "tango", "salsa", "swing",
  "waltz", "foxtrot", "cha_cha", "rumba", "wedding_dance", "competition"
];

export const AMENITY_LABELS: Record<string, string> = {
  parking:          "Free Parking",
  private_lessons:  "Private Lessons",
  group_classes:    "Group Classes",
  performance_opps: "Performance Opportunities",
  air_conditioning: "Air Conditioning",
  sprung_floor:     "Sprung Dance Floor",
  changing_rooms:   "Changing Rooms",
  shoe_rentals:     "Shoe Rentals",
  pro_shop:         "Pro Shop",
  wifi:             "Free WiFi",
};
