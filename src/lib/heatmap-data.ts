/**
 * Manhattan market model served by GET /api/heatmap.
 *
 * Baselines are modeled estimates calibrated to typical Manhattan resale levels
 * (blended across property types and unit sizes). They are not a live MLS feed;
 * responses are labeled `source: "modeled"` accordingly.
 */

export type PropertyTypeParam = "all" | "condo" | "co-op" | "th";
export type BedroomsParam = "all" | "1" | "2" | "3" | "4+";
export type MarketStatus = "hot" | "even" | "cold";

export interface NeighborhoodMetrics {
  /** Sub-neighborhood name; matches the map polygon names. */
  name: string;
  /** Months of supply at the current absorption pace. */
  supply: number;
  /** Average days on market. */
  avg_dom: number;
  /** Average asking price per square foot, USD. */
  price_sqft: number;
  /** Listings currently in contract. */
  in_contract: number;
  /** Active listings in this segment. */
  active_listings: number;
  status: MarketStatus;
}

export interface HeatmapResponse {
  propertyType: PropertyTypeParam;
  bedrooms: BedroomsParam;
  source: "modeled";
  generatedAt: string;
  thresholds: { hot: string; even: string; cold: string };
  neighborhoods: NeighborhoodMetrics[];
}

// Same rule the legend describes: < 5 mo seller's, 5–6 mo neutral, > 6 mo buyer's.
export function statusFor(supply: number): MarketStatus {
  if (supply < 5) return "hot";
  if (supply <= 6) return "even";
  return "cold";
}

interface Baseline {
  ppsf: number; // blended $/sqft
  mos: number; // blended months of supply
  dom: number; // blended days on market
  inventory: number; // active listings, all types & sizes
  /** false where townhouse stock is essentially nonexistent */
  townhouses?: false;
}

const BASELINES: Record<string, Baseline> = {
  // Upper Manhattan
  Inwood: { ppsf: 720, mos: 7.4, dom: 98, inventory: 60 },
  "Fort George": { ppsf: 690, mos: 7.8, dom: 104, inventory: 35 },
  "Washington Heights": { ppsf: 760, mos: 7.0, dom: 95, inventory: 140 },
  "Hamilton Heights": { ppsf: 880, mos: 6.6, dom: 92, inventory: 90 },
  Harlem: { ppsf: 1010, mos: 6.9, dom: 96, inventory: 260 },
  "East Harlem": { ppsf: 940, mos: 7.6, dom: 101, inventory: 170 },
  "Morningside Heights": { ppsf: 1180, mos: 5.6, dom: 78, inventory: 70 },
  // Upper West / East
  "Upper West Side": { ppsf: 1560, mos: 5.2, dom: 72, inventory: 620 },
  "Lincoln Square": { ppsf: 1830, mos: 5.9, dom: 80, inventory: 210 },
  Yorkville: { ppsf: 1290, mos: 5.8, dom: 76, inventory: 300 },
  "Upper East Side": { ppsf: 1640, mos: 5.5, dom: 74, inventory: 700 },
  "Lenox Hill": { ppsf: 1720, mos: 5.3, dom: 70, inventory: 260 },
  // Midtown
  "Hell's Kitchen": { ppsf: 1420, mos: 6.2, dom: 84, inventory: 180 },
  "Hudson Yards": { ppsf: 2350, mos: 8.4, dom: 112, inventory: 140, townhouses: false },
  "Theater District": { ppsf: 1500, mos: 7.2, dom: 96, inventory: 70, townhouses: false },
  Midtown: { ppsf: 1650, mos: 8.0, dom: 108, inventory: 320, townhouses: false },
  "Turtle Bay": { ppsf: 1380, mos: 6.4, dom: 86, inventory: 160 },
  "Sutton Place": { ppsf: 1300, mos: 6.8, dom: 90, inventory: 120 },
  Beekman: { ppsf: 1250, mos: 6.6, dom: 88, inventory: 70 },
  "Tudor City": { ppsf: 1060, mos: 6.0, dom: 82, inventory: 60, townhouses: false },
  "Murray Hill": { ppsf: 1370, mos: 5.9, dom: 80, inventory: 220 },
  "Kips Bay": { ppsf: 1290, mos: 5.7, dom: 77, inventory: 140 },
  "Rose Hill": { ppsf: 1480, mos: 6.1, dom: 82, inventory: 80 },
  "Midtown South": { ppsf: 1740, mos: 6.3, dom: 85, inventory: 150 },
  // Downtown
  "Gramercy Park": { ppsf: 1890, mos: 4.6, dom: 64, inventory: 110 },
  "Stuyvesant Town": { ppsf: 1150, mos: 4.2, dom: 58, inventory: 40, townhouses: false },
  Chelsea: { ppsf: 1960, mos: 4.8, dom: 66, inventory: 330 },
  "West Village": { ppsf: 2420, mos: 4.1, dom: 58, inventory: 260 },
  "Greenwich Village": { ppsf: 2280, mos: 4.4, dom: 61, inventory: 290 },
  "East Village": { ppsf: 1590, mos: 4.3, dom: 59, inventory: 170 },
  "Alphabet City": { ppsf: 1380, mos: 4.7, dom: 63, inventory: 80 },
  Bowery: { ppsf: 1820, mos: 5.4, dom: 72, inventory: 60 },
  "Little Italy": { ppsf: 1750, mos: 5.1, dom: 70, inventory: 40 },
  SoHo: { ppsf: 2480, mos: 5.0, dom: 69, inventory: 190 },
  Chinatown: { ppsf: 1290, mos: 6.1, dom: 84, inventory: 50 },
  "Lower East Side": { ppsf: 1460, mos: 5.6, dom: 75, inventory: 140 },
  "Two Bridges": { ppsf: 1520, mos: 7.3, dom: 98, inventory: 70, townhouses: false },
  Tribeca: { ppsf: 2600, mos: 5.7, dom: 77, inventory: 230 },
  "Civic Center": { ppsf: 1710, mos: 6.5, dom: 88, inventory: 50, townhouses: false },
  "Battery Park City": { ppsf: 1580, mos: 6.2, dom: 83, inventory: 150, townhouses: false },
  "Wall Street": { ppsf: 1330, mos: 7.9, dom: 105, inventory: 260, townhouses: false },
  "Southern Tip": { ppsf: 1450, mos: 7.0, dom: 95, inventory: 60, townhouses: false },
};

interface Adjustment {
  ppsf: number;
  mos: number;
  dom: number;
  /** share of active inventory in this segment */
  share: number;
}

// Condos carry a premium and new-development overhang; co-ops trade at a
// discount and close slower (board approval); townhouses are thin, slow markets.
const TYPE_ADJ: Record<PropertyTypeParam, Adjustment> = {
  all: { ppsf: 1, mos: 1, dom: 1, share: 1 },
  condo: { ppsf: 1.18, mos: 1.05, dom: 0.95, share: 0.45 },
  "co-op": { ppsf: 0.78, mos: 0.92, dom: 1.22, share: 0.5 },
  th: { ppsf: 1.1, mos: 1.35, dom: 1.3, share: 0.05 },
};

// Smaller units absorb fastest; larger units sit longer but price higher per sqft.
const BEDROOM_ADJ: Record<BedroomsParam, Adjustment> = {
  all: { ppsf: 1, mos: 1, dom: 1, share: 1 },
  "1": { ppsf: 0.92, mos: 0.85, dom: 0.88, share: 0.38 },
  "2": { ppsf: 1, mos: 0.98, dom: 1, share: 0.32 },
  "3": { ppsf: 1.1, mos: 1.18, dom: 1.12, share: 0.18 },
  "4+": { ppsf: 1.22, mos: 1.45, dom: 1.3, share: 0.07 },
};

// Townhouse stock is overwhelmingly 3+ bedrooms.
const TOWNHOUSE_BEDROOM_SHARE: Record<BedroomsParam, number> = {
  all: 1,
  "1": 0.02,
  "2": 0.06,
  "3": 0.17,
  "4+": 0.75,
};

// Deals typically stay in contract ~6 weeks, i.e. ~1.5 months of absorption.
const CONTRACT_MONTHS = 1.5;

/** Stable ±pct variation per neighborhood/segment so segments aren't purely multiplicative. */
function variation(key: string, pct: number) {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return 1 + (((h >>> 0) % 2001) / 1000 - 1) * pct;
}

export function buildHeatmap(type: PropertyTypeParam, bedrooms: BedroomsParam): HeatmapResponse {
  const t = TYPE_ADJ[type];
  const b = BEDROOM_ADJ[bedrooms];
  const bedShare = type === "th" ? TOWNHOUSE_BEDROOM_SHARE[bedrooms] : b.share;

  const neighborhoods = Object.entries(BASELINES).map(([name, base]): NeighborhoodMetrics => {
    const seg = `${name}|${type}|${bedrooms}`;
    const noStock = type === "th" && base.townhouses === false;
    const supply = +(base.mos * t.mos * b.mos * variation(`${seg}|mos`, 0.06)).toFixed(1);
    const active = noStock ? 0 : Math.max(1, Math.round(base.inventory * t.share * bedShare));
    return {
      name,
      supply,
      avg_dom: Math.round(base.dom * t.dom * b.dom * variation(`${seg}|dom`, 0.05)),
      price_sqft:
        Math.round((base.ppsf * t.ppsf * b.ppsf * variation(`${seg}|ppsf`, 0.04)) / 10) * 10,
      in_contract: Math.round((active / supply) * CONTRACT_MONTHS),
      active_listings: active,
      status: statusFor(supply),
    };
  });

  return {
    propertyType: type,
    bedrooms,
    source: "modeled",
    generatedAt: new Date().toISOString(),
    thresholds: { hot: "< 5 months", even: "5–6 months", cold: "> 6 months" },
    neighborhoods,
  };
}

const TYPE_VALUES: readonly PropertyTypeParam[] = ["all", "condo", "co-op", "th"];
const BEDROOM_VALUES: readonly BedroomsParam[] = ["all", "1", "2", "3", "4+"];

/** Parse query params; returns null for unrecognized values. Missing params default to "all". */
export function parseHeatmapParams(params: URLSearchParams) {
  const type = (params.get("propertyType") ?? "all").trim().toLowerCase();
  // An unencoded "+" in "4+" arrives as a space ("4 " → "4"), so accept "4" too.
  let beds = (params.get("bedrooms") ?? "all").trim().toLowerCase();
  if (beds === "4") beds = "4+";
  if (!TYPE_VALUES.includes(type as PropertyTypeParam)) return null;
  if (!BEDROOM_VALUES.includes(beds as BedroomsParam)) return null;
  return { type: type as PropertyTypeParam, bedrooms: beds as BedroomsParam };
}
