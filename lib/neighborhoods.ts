export interface Neighborhood { slug: string; name: string; }

interface CityConfig {
  neighborhoods: Neighborhood[];
  tip?: string;
}

function n(slug: string, name: string): Neighborhood { return { slug, name }; }

const CITY_CONFIGS: Record<string, CityConfig> = {
  "new-york":    { neighborhoods: [n("manhattan","Manhattan"),n("brooklyn","Brooklyn"),n("queens","Queens"),n("upper-west-side","Upper West Side"),n("midtown","Midtown"),n("soho","SoHo"),n("park-slope","Park Slope")] },
  "los-angeles": { neighborhoods: [n("hollywood","Hollywood"),n("westwood","Westwood"),n("santa-monica","Santa Monica"),n("silver-lake","Silver Lake"),n("beverly-hills","Beverly Hills"),n("culver-city","Culver City")] },
  "chicago":     { neighborhoods: [n("lincoln-park","Lincoln Park"),n("wicker-park","Wicker Park"),n("river-north","River North"),n("south-loop","South Loop"),n("lakeview","Lakeview"),n("west-loop","West Loop")] },
  "miami":       { neighborhoods: [n("south-beach","South Beach"),n("brickell","Brickell"),n("wynwood","Wynwood"),n("coral-gables","Coral Gables"),n("coconut-grove","Coconut Grove"),n("little-havana","Little Havana")] },
  "houston":     { neighborhoods: [n("midtown","Midtown"),n("montrose","Montrose"),n("river-oaks","River Oaks"),n("heights","Heights"),n("sugar-land","Sugar Land"),n("galleria","Galleria")] },
  "dallas":      { neighborhoods: [n("uptown","Uptown"),n("oak-lawn","Oak Lawn"),n("deep-ellum","Deep Ellum"),n("plano","Plano"),n("frisco","Frisco"),n("irving","Irving"),n("addison","Addison")] },
  "atlanta":     { neighborhoods: [n("buckhead","Buckhead"),n("midtown","Midtown"),n("virginia-highland","Virginia Highland"),n("decatur","Decatur"),n("sandy-springs","Sandy Springs")] },
  "phoenix":     { neighborhoods: [n("scottsdale","Scottsdale"),n("tempe","Tempe"),n("chandler","Chandler"),n("gilbert","Gilbert"),n("peoria","Peoria"),n("glendale","Glendale")] },
  "san-antonio": { neighborhoods: [n("alamo-heights","Alamo Heights"),n("stone-oak","Stone Oak"),n("medical-center","Medical Center"),n("pearl-district","Pearl District"),n("downtown","Downtown")] },
  "san-diego":   { neighborhoods: [n("gaslamp","Gaslamp Quarter"),n("hillcrest","Hillcrest"),n("mission-valley","Mission Valley"),n("la-jolla","La Jolla"),n("north-park","North Park"),n("chula-vista","Chula Vista")] },
};

export function getCityConfig(citySlug: string): CityConfig | null {
  return CITY_CONFIGS[citySlug] ?? null;
}
