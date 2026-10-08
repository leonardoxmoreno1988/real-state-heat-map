import { createFileRoute } from "@tanstack/react-router";
import { keepPreviousData, queryOptions, useQuery } from "@tanstack/react-query";
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Info, Minus, Moon, Plus, RotateCcw, Sun } from "lucide-react";
import {
  TransformWrapper,
  TransformComponent,
  useControls,
} from "react-zoom-pan-pinch";
import type {
  BedroomsParam,
  HeatmapResponse,
  MarketStatus,
  PropertyTypeParam,
} from "@/lib/heatmap-data";

export const Route = createFileRoute("/")({
  component: Index,
});

type PropertyType = "All" | "Condo" | "Co-op" | "TH";
type SizeType = "All" | "1 Bed" | "2 Bed" | "3 Bed" | "4+ Bed";
type Thermal = MarketStatus;

interface SubPath {
  d: string;
  name: string;
  /** approximate centroid for micro-label placement */
  cx: number;
  cy: number;
}

interface Neighborhood {
  id: string;
  name: string;
  shortName: string;
  subPaths: SubPath[];
  labelX: number;
  labelY: number;
}

const NEIGHBORHOODS: Neighborhood[] = [
  {
    id: "harlem",
    name: "Harlem",
    shortName: "Harlem",
    subPaths: [
      { d: "M113.614 132.833L114.204 111.433L169.254 111.243C174.084 117.673 185.214 128.313 190.184 132.833H113.614Z", name: "Hamilton Heights", cx: 150, cy: 122 },
      { d: "M106.224 80.2325C105.574 67.4125 106.494 49.9225 107.044 42.7825L152.904 52.5625C153.294 63.3925 154.044 75.9225 154.504 80.4625L106.234 80.2325H106.224Z", name: "Fort George", cx: 130, cy: 61 },
      { d: "M153.134 52.5425L106.854 42.6725C106.854 32.6025 109.114 26.1725 110.254 24.0125C111.694 21.7125 116.234 17.7125 122.824 20.1025C128.554 22.1725 133.284 21.8725 135.614 21.3125C136.204 21.1725 136.714 20.8125 137.134 20.3725C144.094 13.3225 150.574 16.2225 153.674 19.2125C154.234 19.7525 154.444 20.5325 154.364 21.2925C153.294 31.6425 153.094 46.1625 153.124 52.5425H153.134Z", name: "Inwood", cx: 130, cy: 32 },
      { d: "M114.314 111.163C115.314 96.5625 109.704 84.3325 106.564 80.1725L154.534 80.4225C156.574 93.5225 165.084 106.373 169.084 111.163H114.314Z", name: "Washington Heights", cx: 138, cy: 96 },
      { d: "M231.194 173.263C217.114 166.383 205.404 152.493 201.534 146.033L201.954 276.603H260.404C259.614 274.003 260.734 270.013 261.394 268.343C262.544 259.273 264.834 234.933 264.834 210.123C264.834 185.313 242.414 175.213 231.204 173.263H231.194Z", name: "East Harlem", cx: 232, cy: 225 },
      { d: "M107.504 141.933C113.794 140.263 114.594 135.253 114.204 132.953L188.894 132.933L201.574 145.613V238.343H163.884V196.513H146.904L112.894 183.903C117.684 168.193 111.294 160.733 107.504 158.973V141.943V141.933Z", name: "Harlem", cx: 155, cy: 170 },
    ],
    labelX: 155,
    labelY: 155,
  },
  {
    id: "uws",
    name: "Upper West Side",
    shortName: "UWS",
    subPaths: [
      { d: "M110.524 219.693C106.164 204.573 110.394 189.533 113.054 183.903L146.984 196.623H163.904V238.473H112.274C112.804 229.723 111.334 222.303 110.524 219.693Z", name: "Morningside Heights", cx: 137, cy: 213 },
      { d: "M112.344 339.153V238.543H163.554V339.153H112.344Z", name: "Upper West Side", cx: 137, cy: 288 },
    ],
    labelX: 137,
    labelY: 285,
  },
  {
    id: "ues",
    name: "Upper East Side",
    shortName: "UES",
    subPaths: [
      { d: "M220.164 318.212V276.703L260.494 276.793C266.524 287.093 269.464 284.063 275.634 288.193C280.564 291.503 280.694 302.062 280.144 306.932L276.124 313.113V318.193H220.174L220.164 318.212Z", name: "Yorkville", cx: 250, cy: 297 },
      { d: "M220.294 318.213V276.663H201.624V339.103H267.564L275.654 319.633V318.213H220.294Z", name: "Upper East Side", cx: 238, cy: 328 },
    ],
    labelX: 240,
    labelY: 305,
  },
  {
    id: "midtown",
    name: "Midtown",
    shortName: "Midtown",
    subPaths: [
      { d: "M222.704 413.703H248.874V375.133H222.704V413.703Z", name: "Turtle Bay", cx: 236, cy: 394 },
      { d: "M222.444 448.203H182.494V386.983H164.514V418.223H152.094V375.233H222.454V448.203H222.444Z", name: "Midtown", cx: 200, cy: 410 },
      { d: "M164.494 418.173H151.904V429.833H182.434V386.903H164.494V418.173Z", name: "Theater District", cx: 172, cy: 408 },
      { d: "M112.504 418.283V375.403H151.984V418.283H112.504Z", name: "Hell's Kitchen", cx: 132, cy: 396 },
      { d: "M110.164 449.903C108.194 426.783 110.984 419.183 112.634 418.263H151.964V449.903H110.164Z", name: "Hudson Yards", cx: 132, cy: 435 },
      { d: "M112.424 375.523V339.253H163.794V375.523H112.424Z", name: "Lincoln Square", cx: 138, cy: 357 },
      { d: "M201.624 339.103V375.183H267.664V339.163L267.694 339.103H201.624Z", name: "Lenox Hill", cx: 234, cy: 357 },
    ],
    labelX: 190,
    labelY: 395,
  },
  {
    id: "chelsea",
    name: "Chelsea",
    shortName: "Chelsea",
    subPaths: [
      { d: "M120.224 479.943C111.774 478.713 110.234 459.343 110.524 449.803H152.094V429.753H182.424V500.413H126.914L120.234 479.943H120.224Z", name: "Chelsea", cx: 145, cy: 465 },
      { d: "M142.824 541.313L127.024 500.483H172.464V541.313H142.824Z", name: "West Village", cx: 152, cy: 520 },
      { d: "M172.464 500.483L222.464 500.583L224.404 506.743L226.244 539.853H182.224L172.464 541.313V500.483Z", name: "Greenwich Village", cx: 198, cy: 520 },
    ],
    labelX: 165,
    labelY: 480,
  },
  {
    id: "gramercy",
    name: "Gramercy",
    shortName: "Gramercy",
    subPaths: [
      { d: "M263.564 397.523L267.833 375.243H249.073V397.523H263.564Z", name: "Sutton Place", cx: 258, cy: 386 },
      { d: "M263.654 397.273H249.064V418.273H259.344L263.654 397.273Z", name: "Beekman", cx: 256, cy: 408 },
      { d: "M259.264 418.393H249.044V449.443H256.124C253.614 440.343 257.164 424.953 259.254 418.393H259.264Z", name: "Tudor City", cx: 253, cy: 434 },
      { d: "M268.474 475.653H249.434V449.563H256.174C259.404 461.143 265.654 471.123 268.724 475.163C268.874 475.373 268.724 475.653 268.474 475.653Z", name: "Kips Bay", cx: 259, cy: 462 },
      { d: "M222.464 500.583H182.134V447.963H222.464V500.583Z", name: "Midtown South", cx: 202, cy: 474 },
      { d: "M248.924 450.003V413.673H222.704V450.003H248.924Z", name: "Murray Hill", cx: 236, cy: 431 },
      { d: "M249.464 475.943H222.444V449.483H249.464V475.943Z", name: "Rose Hill", cx: 236, cy: 462 },
      { d: "M249.254 475.593H268.764C268.764 477.133 273.684 482.713 280.494 486.193C289.874 490.983 292.354 497.823 292.414 500.643H249.254V475.593Z", name: "Stuyvesant Town", cx: 271, cy: 488 },
      { d: "M222.444 475.943H249.464L249.254 500.643L222.464 500.583L222.444 475.943Z", name: "Gramercy Park", cx: 236, cy: 488 },
    ],
    labelX: 245,
    labelY: 450,
  },
  {
    id: "soho",
    name: "SoHo",
    shortName: "SoHo",
    subPaths: [
      { d: "M249.364 590.113L227.164 579.873V540.773H242.074L249.364 590.103V590.113Z", name: "Bowery", cx: 238, cy: 565 },
      { d: "M227.114 562.963H210.954V539.853H226.244V540.803H227.114V562.963Z", name: "Little Italy", cx: 219, cy: 551 },
      { d: "M151.934 561.343L142.974 541.613L172.654 541.423L182.224 539.843H210.934V562.893H200.074V570.683L162.034 561.343H151.934Z", name: "SoHo", cx: 178, cy: 553 },
      { d: "M222.194 500.633H269.134V540.763H226.364L224.404 506.743L222.194 500.633Z", name: "East Village", cx: 246, cy: 520 },
      { d: "M269.034 540.933V500.603H292.424C293.034 507.633 296.824 525.553 307.084 540.933H269.024H269.034Z", name: "Alphabet City", cx: 285, cy: 521 },
      { d: "M200.074 562.903L227.114 562.963L227.364 590.903L199.944 590.723L200.074 562.903Z", name: "Chinatown", cx: 214, cy: 577 },
    ],
    labelX: 220,
    labelY: 545,
  },
  {
    id: "fidi",
    name: "FiDi",
    shortName: "FiDi",
    subPaths: [
      { d: "M265.434 597.773L249.334 590.023L241.984 540.973H306.944C314.314 557.413 306.664 568.923 301.914 572.633L265.434 597.773Z", name: "Lower East Side", cx: 278, cy: 570 },
      { d: "M173.164 608.783L151.954 561.463L162.114 561.253L199.944 570.613V590.723L203.664 608.783H173.164Z", name: "Tribeca", cx: 180, cy: 587 },
      { d: "M227.364 609.713H203.624L199.994 590.893H227.354V609.713H227.364Z", name: "Civic Center", cx: 214, cy: 600 },
      { d: "M245.044 618.333L227.534 609.753V580.053L265.384 598.053C257.914 604.263 248.714 614.163 245.044 618.333Z", name: "Two Bridges", cx: 246, cy: 600 },
      { d: "M188.794 644.083L173.264 608.853L203.414 608.743L203.614 609.483H208.054L206.494 637.853L188.794 644.083Z", name: "Battery Park City", cx: 191, cy: 626 },
      { d: "M223.924 648.793C212.854 649.583 207.634 641.823 206.414 637.833L208.144 609.733H227.454L244.944 618.643C239.354 633.213 228.604 644.813 223.924 648.803V648.793Z", name: "Wall Street", cx: 224, cy: 628 },
      { d: "M224.024 649.023C208.494 666.293 194.184 652.863 188.974 643.993L206.574 637.783C209.854 647.653 219.574 649.393 224.024 649.023Z", name: "Southern Tip", cx: 208, cy: 652 },
    ],
    labelX: 215,
    labelY: 615,
  },
];

const CENTRAL_PARK_PATH =
  "M163.464 375.253H201.704L201.534 238.432H163.464V375.253Z";

const TYPE_OPTIONS = ["All", "Condo", "Co-op", "TH"] as const satisfies readonly PropertyType[];
const SIZE_OPTIONS = [
  "All",
  "1 Bed",
  "2 Bed",
  "3 Bed",
  "4+ Bed",
] as const satisfies readonly SizeType[];

// Query values for GET /api/heatmap (see src/routes/api/heatmap.ts)
const TYPE_PARAM: Record<PropertyType, PropertyTypeParam> = {
  All: "all",
  Condo: "condo",
  "Co-op": "co-op",
  TH: "th",
};
const SIZE_PARAM: Record<SizeType, BedroomsParam> = {
  All: "all",
  "1 Bed": "1",
  "2 Bed": "2",
  "3 Bed": "3",
  "4+ Bed": "4+",
};

interface Metrics {
  supply: number;
  dom: number;
  ppsf: number;
  inContract: number;
  thermal: Thermal;
}

/** Fetch one filter combination; returns metrics keyed by sub-neighborhood name. */
async function fetchHeatmap(type: PropertyType, size: SizeType): Promise<Map<string, Metrics>> {
  const params = new URLSearchParams({
    propertyType: TYPE_PARAM[type],
    bedrooms: SIZE_PARAM[size],
  });
  const res = await fetch(`/api/heatmap?${params}`);
  if (!res.ok) throw new Error(`GET /api/heatmap failed: ${res.status}`);
  const data: HeatmapResponse = await res.json();
  return new Map(
    data.neighborhoods.map((r) => [
      r.name,
      {
        supply: r.supply,
        dom: r.avg_dom,
        ppsf: r.price_sqft,
        inContract: r.in_contract,
        thermal: r.status,
      },
    ]),
  );
}

function heatmapQuery(type: PropertyType, size: SizeType) {
  return queryOptions({
    queryKey: ["heatmap", type, size],
    queryFn: () => fetchHeatmap(type, size),
    staleTime: 5 * 60_000,
    // Keep showing the previous combination while the next one loads.
    placeholderData: keepPreviousData,
  });
}

function subKey(nId: string, spName: string) {
  return `${nId}::${spName}`;
}

/** Unique per sub-path (unlike subKey); also used as the label's clipPath id. */
function labelId(nId: string, idx: number) {
  return `label-${nId}-${idx}`;
}

const LABEL_PAD = 1.5; // SVG units kept clear between label and polygon edge
const CHAR_W = 0.6; // approx. glyph advance as a fraction of font size (semibold)
const LINE_H = 1.15;
const MIN_LABEL_PX = 8; // smallest on-screen label size before it's hidden

interface Interior {
  /** usable width/height around the label anchor, and the centered x */
  w: number;
  h: number;
  cx: number;
}

/**
 * Measure the polygon's actual interior around (cx, cy) by walking outward
 * with isPointInFill. Bounding boxes overstate the room inside slanted or
 * irregular shapes, which is what let labels bleed past their edges.
 */
function measureInterior(el: SVGPathElement, cx: number, cy: number): Interior {
  const b = el.getBBox();
  const bboxFallback = { w: b.width, h: b.height, cx };
  if (typeof el.isPointInFill !== "function") return bboxFallback;
  const inside = (x: number, y: number) => el.isPointInFill(new DOMPoint(x, y));
  if (!inside(cx, cy)) return bboxFallback;

  const STEP = 0.5;
  const walk = (x: number, y: number, dx: number, dy: number) => {
    let d = 0;
    while (inside(x + dx * (d + STEP), y + dy * (d + STEP))) d += STEP;
    return d;
  };
  const left = walk(cx, cy, -1, 0);
  const right = walk(cx, cy, 1, 0);
  const up = walk(cx, cy, 0, -1);
  const down = walk(cx, cy, 0, 1);
  // Two-line labels extend above/below the anchor; use the narrowest row.
  const rowWidth = (y: number) => (inside(cx, y) ? walk(cx, y, -1, 0) + walk(cx, y, 1, 0) : 0);
  const w = Math.min(left + right, rowWidth(cy - 3), rowWidth(cy + 3));
  return {
    w,
    // Labels are vertically centered on cy, so only the tighter side counts.
    h: Math.min(up, down) * 2,
    cx: cx + (right - left) / 2,
  };
}

const THERMAL_FILL: Record<Thermal, string> = {
  hot: "var(--hot-fill)",
  even: "var(--even-fill)",
  cold: "var(--cold-fill)",
};
const THERMAL_STROKE: Record<Thermal, string> = {
  hot: "var(--hot-stroke)",
  even: "var(--even-stroke)",
  cold: "var(--cold-stroke)",
};
const THERMAL_LABEL: Record<Thermal, string> = {
  hot: "Hot · Seller's",
  even: "Even · Neutral",
  cold: "Cold · Buyer's",
};
// Border is drawn as an inset ring (box-shadow) so it never changes badge size;
// it's transparent in light mode.
const THERMAL_BADGE: Record<Thermal, { bg: string; color: string; ring: string }> = {
  hot: {
    bg: "var(--badge-hot-bg)",
    color: "var(--badge-hot-fg)",
    ring: "inset 0 0 0 1px var(--badge-hot-border)",
  },
  even: {
    bg: "var(--badge-even-bg)",
    color: "var(--badge-even-fg)",
    ring: "inset 0 0 0 1px var(--badge-even-border)",
  },
  cold: {
    bg: "var(--badge-cold-bg)",
    color: "var(--badge-cold-fg)",
    ring: "inset 0 0 0 1px var(--badge-cold-border)",
  },
};
const HOVER_STROKE = "#28AEE3";
const MIN_SCALE = 1;
const MAX_SCALE = 5;

const VIEW_W = 383; // SVG viewBox size
const VIEW_H = 674;

/**
 * Label tiers, like map zoom levels. Each sub-neighborhood label fades in once
 * zoom reaches its tier's minimum (and only if it fits and doesn't collide).
 * Tier 1 anchors stay labeled at every zoom: below ZOOM_THRESHOLD their group
 * label (Harlem, UWS, Midtown…) stands in for them.
 */
type LabelTier = 1 | 2 | 3;
const TIER_MIN_ZOOM: Record<LabelTier, number> = { 1: 1.4, 2: 1.7, 3: 2.2 };
const ZOOM_THRESHOLD = TIER_MIN_ZOOM[1]; // group labels hand off to sub-labels here

const LABEL_TIER: Record<string, LabelTier> = {
  // Tier 1: anchors
  Harlem: 1,
  "Upper West Side": 1,
  "Upper East Side": 1,
  Midtown: 1,
  Chelsea: 1,
  SoHo: 1,
  "Wall Street": 1, // FiDi's core
  // Tier 3: micro neighborhoods
  "Sutton Place": 3,
  "Two Bridges": 3,
  Bowery: 3,
  "Little Italy": 3,
  "Battery Park City": 3,
  "Civic Center": 3,
  "Rose Hill": 3,
  Inwood: 3,
  "Fort George": 3,
  Beekman: 3,
  "Tudor City": 3,
  "Southern Tip": 3,
};
// Everything else (Yorkville, Lenox Hill, Hell's Kitchen, Tribeca…) is tier 2.
const tierOf = (name: string): LabelTier => LABEL_TIER[name] ?? 2;

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = "md",
  fullWidth = false,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}) {
  const pad =
    size === "sm"
      ? "px-3 py-1.5 text-xs"
      : size === "lg"
        ? fullWidth
          ? "flex-1 px-2 py-1.5 text-sm"
          : "px-4 py-2 text-sm"
        : "px-3.5 py-1.5 text-[13px]";
  return (
    <div
      className={
        fullWidth
          ? "flex w-full rounded-lg bg-slate-100/80 p-1 dark:bg-slate-800/60"
          : "inline-flex rounded-lg bg-secondary p-1 dark:bg-slate-800/80"
      }
    >

      {options.map((opt) => {
        const active = opt === value;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`${pad} whitespace-nowrap rounded-md tracking-tight transition-all duration-200 ${
              active
                ? "bg-primary font-semibold text-primary-foreground shadow-sm dark:bg-white dark:text-slate-900"
                : fullWidth
                  ? "font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  : "font-medium text-muted-foreground hover:text-foreground dark:text-slate-400 dark:hover:bg-slate-700/50 dark:hover:text-white"
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function Index() {
  const [globalType, setGlobalType] = useState<PropertyType>("All");
  const [globalSize, setGlobalSize] = useState<SizeType>("All");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  // Track the hovered path's geometry too: sub-path keys aren't unique
  // (e.g. Kips Bay), so the highlight overlay can't be derived from the key.
  const [hovered, setHovered] = useState<{ key: string; d: string } | null>(null);
  const hoveredKey = hovered?.key ?? null;
  // Geometry of the selected path, for the selection outline overlay (same
  // reason as `hovered`: keys aren't unique, so it can't be looked up by key).
  const [selectedD, setSelectedD] = useState<string | null>(null);
  const [localType, setLocalType] = useState<PropertyType>("All");
  const [localSize, setLocalSize] = useState<SizeType>("All");
  const [zoom, setZoom] = useState(1);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    name: string;
    thermal: Thermal | null;
  } | null>(null);
  // Drag vs click discrimination: track pointer-down origin and suppress
  // the synthetic click if the pointer moved past the threshold (pan).
  const pointerDownRef = useRef<{ x: number; y: number } | null>(null);
  const suppressClickRef = useRef(false);
  const DRAG_THRESHOLD = 4;

  const selection = useMemo(() => {
    if (!selectedKey) return null;
    const [nId, spName] = selectedKey.split("::");
    const n = NEIGHBORHOODS.find((x) => x.id === nId);
    if (!n) return null;
    const sp = n.subPaths.find((s) => s.name === spName);
    if (!sp) return null;
    return { n, sp };
  }, [selectedKey]);

  // Map colors come from the header filters; the selected polygon follows the
  // detail card's own filters (same cache entry when they match).
  const globalQuery = useQuery(heatmapQuery(globalType, globalSize));
  const localQuery = useQuery({
    ...heatmapQuery(localType, localSize),
    enabled: selectedKey !== null,
  });
  // "No data yet" counts as syncing so the server render (query not started)
  // and the first client render (fetch in flight) agree during hydration.
  const apiState: ApiState =
    globalQuery.isError && !globalQuery.data
      ? "error"
      : !globalQuery.data || globalQuery.isFetching || localQuery.isFetching
        ? "syncing"
        : "live";
  const mapLoading = !globalQuery.data && !globalQuery.isError;

  const polygonState = useMemo(() => {
    return NEIGHBORHOODS.map((n) => {
      const subStates = n.subPaths.map((sp) => {
        const key = subKey(n.id, sp.name);
        const isSelected = key === selectedKey;
        const data = isSelected ? localQuery.data : globalQuery.data;
        // null until the API responds: rendered as a neutral skeleton
        const thermal: Thermal | null = data?.get(sp.name)?.thermal ?? null;
        return { sp, key, isSelected, thermal };
      });
      return { n, subStates };
    });
  }, [globalQuery.data, localQuery.data, selectedKey]);

  const selectedMetrics = selection ? (localQuery.data?.get(selection.sp.name) ?? null) : null;

  const handleSelect = (nId: string, sp: SubPath) => {
    setSelectedKey(subKey(nId, sp.name));
    setSelectedD(sp.d);
    setTooltip(null);
    setLocalType(globalType);
    setLocalSize(globalSize);
  };

  const microVisible = zoom >= ZOOM_THRESHOLD;
  // CSS var so the base border width can differ per theme (0.7 light, 1 dark)
  const microStrokeWidthBase = "var(--map-stroke-width)";

  // Measure each sub-path once mounted so we can size labels to fit and
  // detect collisions between neighboring label rects. Keyed by label id
  // (not subKey) because sub-path names aren't unique (e.g. Kips Bay).
  const pathRefs = useRef<Record<string, SVGPathElement | null>>({});
  const [bboxes, setBboxes] = useState<Record<string, Interior>>({});
  useLayoutEffect(() => {
    const next: Record<string, Interior> = {};
    for (const n of NEIGHBORHOODS) {
      n.subPaths.forEach((sp, idx) => {
        const id = labelId(n.id, idx);
        const el = pathRefs.current[id];
        if (!el) return;
        try {
          next[id] = measureInterior(el, sp.cx, sp.cy);
        } catch {
          /* ignore */
        }
      });
    }
    setBboxes(next);
  }, []);

  // Compute label layout (font size, wrapped lines, visibility) per sub-path,
  // considering polygon area, textual length, and pairwise collisions at
  // the current zoom level. Smaller/lower-priority labels are hidden when
  // they overlap larger neighbors, and re-appear as zoom shrinks label rects.
  // Real on-screen pixels per SVG unit at zoom 1 (preserveAspectRatio="meet").
  // ResizeObserver reports the untransformed layout box, so zoom is applied separately.
  const svgRef = useRef<SVGSVGElement>(null);
  const [viewScale, setViewScale] = useState(1);
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width && height) setViewScale(Math.min(width / VIEW_W, height / VIEW_H));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // The header is fixed over the map so polygons can glide under its glass. Its
  // height varies (filters stack on mobile), so measure it and pad the map content
  // by that amount to keep the initial view centered in the visible area.
  const headerRef = useRef<HTMLElement>(null);
  const [headerH, setHeaderH] = useState(0);
  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setHeaderH(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const labelLayouts = useMemo(() => {
    type Layout = {
      key: string;
      cx: number;
      cy: number;
      fontSize: number;
      lines: string[];
      width: number;
      height: number;
      area: number;
      tier: LabelTier;
      visible: boolean;
    };
    const z = Math.max(zoom, 1);
    const pxPerUnit = viewScale * z;
    const items: Layout[] = [];
    for (const n of NEIGHBORHOODS) {
      n.subPaths.forEach((sp, idx) => {
        const key = labelId(n.id, idx);
        const bb = bboxes[key];
        const polyW = bb?.w ?? 40;
        const polyH = bb?.h ?? 40;
        const area = polyW * polyH;
        const isSmall = area < 900;
        const tier = tierOf(sp.name);
        // On-screen size grows continuously with zoom (no steps between
        // levels), clamped, then converted to SVG units via the real scale.
        const targetPx = isSmall
          ? clamp(9 + (z - ZOOM_THRESHOLD) * 3, 9, 13)
          : clamp(10 + (z - ZOOM_THRESHOLD) * 3.5, 10, 15);
        let fontSize = targetPx / pxPerUnit;

        // Usable interior after padding on every side.
        const fitW = polyW - LABEL_PAD * 2;
        const fitH = polyH - LABEL_PAD * 2;

        // Try single line; if too wide for polygon, wrap around the middle.
        const words = sp.name.split(" ");
        const singleWidth = sp.name.length * fontSize * CHAR_W;
        let lines: string[] = [sp.name];
        if (words.length > 1 && singleWidth > fitW) {
          const mid = Math.ceil(words.length / 2);
          lines = [
            words.slice(0, mid).join(" "),
            words.slice(mid).join(" "),
          ];
        }
        // Shrink to fit both the interior width and height.
        const longest = Math.max(...lines.map((l) => l.length));
        fontSize = Math.min(fontSize, fitW / (longest * CHAR_W), fitH / (lines.length * LINE_H));
        const width = longest * fontSize * CHAR_W;
        const height = lines.length * fontSize * LINE_H;
        items.push({
          key,
          cx: bb?.cx ?? sp.cx,
          cy: sp.cy,
          fontSize,
          lines,
          width,
          height,
          area,
          tier,
          // Hidden below its tier's zoom, or when it would have to shrink
          // below a readable size to fit (rather than overflow the polygon).
          visible: z >= TIER_MIN_ZOOM[tier] && fontSize * pxPerUnit >= MIN_LABEL_PX,
        });
      });
    }
    // Greedy collision resolution: lower tier wins, then the larger polygon.
    items.sort((a, b) => a.tier - b.tier || b.area - a.area);
    const placed: Layout[] = [];
    for (const item of items) {
      if (!item.visible) continue;
      const pad = 1.5;
      const ax0 = item.cx - item.width / 2 - pad;
      const ax1 = item.cx + item.width / 2 + pad;
      const ay0 = item.cy - item.height / 2 - pad;
      const ay1 = item.cy + item.height / 2 + pad;
      let collides = false;
      for (const p of placed) {
        const bx0 = p.cx - p.width / 2 - pad;
        const bx1 = p.cx + p.width / 2 + pad;
        const by0 = p.cy - p.height / 2 - pad;
        const by1 = p.cy + p.height / 2 + pad;
        if (ax0 < bx1 && ax1 > bx0 && ay0 < by1 && ay1 > by0) {
          collides = true;
          break;
        }
      }
      if (collides) {
        item.visible = false;
      } else {
        placed.push(item);
      }
    }
    const map: Record<string, Layout> = {};
    for (const it of items) map[it.key] = it;
    return map;
  }, [bboxes, zoom, viewScale]);

  return (
    <div className="relative h-[100dvh] overflow-hidden bg-background text-foreground">
      <header
        ref={headerRef}
        className="fixed left-0 right-0 top-0 z-40 border-none bg-white/70 backdrop-blur-xl dark:bg-slate-950/50"
      >
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-5">
          <div className="flex items-center gap-2.5">
            <span className="relative">
              <LogoMark />
              {/* Mobile: status dot on the logo (no room for the full badge) */}
              <ApiStatusDot state={apiState} className="absolute -right-0.5 -top-0.5 sm:hidden" />
            </span>
            <span className="text-[17px] font-semibold leading-none tracking-tight text-primary">
              Real Estate<span className="text-muted-foreground font-normal"> Heatmap</span>
            </span>
            <ApiStatusBadge state={apiState} />
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
              aria-label="Change borough"
            >
              Manhattan
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden>
                <path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <ThemeToggle />
          </div>
        </div>

        <div className="mx-auto flex max-w-3xl flex-col gap-4 px-5 pb-4 pt-2 sm:flex-row sm:items-center sm:justify-start">
          <Segmented
            options={TYPE_OPTIONS}
            value={globalType}
            onChange={setGlobalType}
          />
          <Segmented
            options={SIZE_OPTIONS}
            value={globalSize}
            onChange={setGlobalSize}
          />
        </div>

        {/* Indeterminate progress bar while /api/heatmap requests are in flight */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 -bottom-px z-20 h-0.5 overflow-hidden">
          <div
            className={`h-full w-1/3 bg-[#28AEE3] transition-opacity duration-300 ${
              apiState === "syncing" ? "animate-api-progress opacity-100" : "opacity-0"
            }`}
          />
        </div>
      </header>

      <main className="absolute inset-0 overflow-hidden bg-[var(--water)]">
        <TransformWrapper
          initialScale={1}
          minScale={MIN_SCALE}
          maxScale={MAX_SCALE}
          wheel={{ step: 0.15 }}
          doubleClick={{ mode: "toggle", step: 1.6 }}
          pinch={{ step: 8 }}
          panning={{ velocityDisabled: true }}
          onTransform={(ref) => setZoom(ref.state.scale)}
          onZoom={(ref) => setZoom(ref.state.scale)}
        >
          <TransformComponent
            wrapperStyle={{ width: "100%", height: "100%" }}
            contentStyle={{ width: "100%", height: "100%" }}
          >
            <div
              className="relative mx-auto flex h-full w-full max-w-3xl items-center justify-center px-4 py-3"
              style={{ paddingTop: headerH + 12 }}
            >
              <svg
                ref={svgRef}
                viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
                preserveAspectRatio="xMidYMid meet"
                className={`mx-auto h-full max-h-full w-auto max-w-full drop-shadow-[0_10px_15px_rgba(0,0,0,0.06)] ${
                  mapLoading ? "animate-pulse" : ""
                }`}
                aria-busy={mapLoading}
                role="img"
                aria-label="Manhattan neighborhoods heatmap"
              >

                {/* Per-polygon clip paths keep micro labels inside their shape */}
                <defs>
                  {NEIGHBORHOODS.flatMap((n) =>
                    n.subPaths.map((sp, idx) => (
                      <clipPath key={labelId(n.id, idx)} id={labelId(n.id, idx)}>
                        <path d={sp.d} />
                      </clipPath>
                    )),
                  )}
                </defs>
                {polygonState.map(({ n, subStates }) => (
                  <g key={n.id}>
                    {subStates.map(({ sp, key, isSelected, thermal }, idx) => {
                      const isHovered = hoveredKey === key;
                      return (
                        <path
                          key={key}
                          ref={(el) => {
                            pathRefs.current[labelId(n.id, idx)] = el;
                          }}
                          d={sp.d}
                          className="map-path"
                          fill={THERMAL_FILL[thermal ?? "even"]}
                          stroke={THERMAL_STROKE[thermal ?? "even"]}
                          strokeOpacity={1}
                          vectorEffect="non-scaling-stroke"
                          style={{
                            // Base width comes from a CSS var so it can differ per theme
                            strokeWidth: isSelected ? 1.8 : isHovered ? 1.3 : microStrokeWidthBase,
                            cursor: "pointer",
                            transition:
                              "fill 400ms ease, stroke 300ms ease, stroke-width 180ms ease, opacity 250ms ease, filter 180ms ease",
                            opacity:
                              selectedKey && !isSelected ? 0.5 : 1,
                            filter:
                              isHovered && !isSelected
                                ? "brightness(1.08)"
                                : "none",
                          }}
                          onPointerDown={(e) => {
                            pointerDownRef.current = { x: e.clientX, y: e.clientY };
                            suppressClickRef.current = false;
                          }}
                          onPointerMove={(e) => {
                            const p = pointerDownRef.current;
                            if (!p) return;
                            const dx = e.clientX - p.x;
                            const dy = e.clientY - p.y;
                            if (dx * dx + dy * dy > DRAG_THRESHOLD * DRAG_THRESHOLD) {
                              suppressClickRef.current = true;
                            }
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (suppressClickRef.current) {
                              suppressClickRef.current = false;
                              pointerDownRef.current = null;
                              return;
                            }
                            pointerDownRef.current = null;
                            handleSelect(n.id, sp);
                          }}
                          onMouseEnter={() => setHovered({ key, d: sp.d })}
                          onMouseLeave={() => {
                            setHovered((h) => (h?.d === sp.d ? null : h));
                            setTooltip(null);
                          }}
                          onMouseMove={(e) =>
                            setTooltip({
                              x: e.clientX,
                              y: e.clientY,
                              name: sp.name,
                              thermal,
                            })
                          }
                          onTouchStart={() => setHovered({ key, d: sp.d })}
                        />
                      );
                    })}

                    {/* Group label: stands in for tier-1 anchors below ZOOM_THRESHOLD */}
                    <text
                      x={n.labelX}
                      y={n.labelY}
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="neighborhood-label map-label map-fade"
                      data-visible={!microVisible}
                      letterSpacing="0.06em"
                      fill="var(--map-label)"
                      style={{ pointerEvents: "none" }}
                    >
                      {n.shortName}
                    </text>

                    {/* Sub-neighborhood labels — tiered, collision-managed, fit to their polygon */}
                    {n.subPaths.map((sp, idx) => {
                      const id = labelId(n.id, idx);
                      const layout = labelLayouts[id];
                      if (!layout) {
                        return (
                          <text
                            key={`micro-${id}`}
                            x={sp.cx}
                            y={sp.cy}
                            style={{ opacity: 0, pointerEvents: "none" }}
                          />
                        );
                      }
                      const { cx, fontSize, lines, visible } = layout;
                      const lineHeight = fontSize * LINE_H;
                      const startDy = -((lines.length - 1) * lineHeight) / 2;
                      return (
                        <text
                          key={`micro-${id}`}
                          x={cx}
                          y={sp.cy}
                          clipPath={`url(#${id})`}
                          className="map-label map-fade"
                          data-visible={visible}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill="var(--map-label)"
                          style={{
                            pointerEvents: "none",
                            // Follows zoom continuously; no font-size transition (it lagged and swam)
                            fontSize: `${fontSize}px`,
                            letterSpacing: "0.01em",
                          }}
                        >
                          {lines.map((line, i) => (
                            <tspan
                              key={i}
                              x={cx}
                              dy={i === 0 ? startDy : lineHeight}
                            >
                              {line}
                            </tspan>
                          ))}
                        </text>
                      );
                    })}
                  </g>
                ))}

                {/* Central Park */}
                <path
                  d={CENTRAL_PARK_PATH}
                  className="map-path"
                  fill="var(--park)"
                  stroke="var(--park-stroke)"
                  strokeWidth="0.8"
                  vectorEffect="non-scaling-stroke"
                  style={{ pointerEvents: "none" }}
                />
                <text
                  x="182.5"
                  y={microVisible ? 296 : 300}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="park-label"
                  fill="var(--park-label, var(--park-stroke))"
                  style={{
                    pointerEvents: "none",
                    fontSize: microVisible ? `${Math.max(5.5, 9 / Math.max(zoom, 1))}px` : undefined,
                    transition: "font-size 180ms ease",
                  }}
                >
                  CENTRAL
                </text>
                <text
                  x="182.5"
                  y={microVisible ? 306 : 312}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="park-label"
                  fill="var(--park-label, var(--park-stroke))"
                  style={{
                    pointerEvents: "none",
                    fontSize: microVisible ? `${Math.max(5.5, 9 / Math.max(zoom, 1))}px` : undefined,
                    transition: "font-size 180ms ease",
                  }}
                >
                  PARK
                </text>

                {/* Selection outline — drawn on top so neighboring strokes don't cover it.
                    Only themes that set --map-selected-stroke (dark) show it. */}
                {selectedKey && selectedD && (
                  <path
                    d={selectedD}
                    className="map-path"
                    fill="none"
                    stroke="var(--map-selected-stroke, none)"
                    vectorEffect="non-scaling-stroke"
                    style={{
                      strokeWidth: "var(--map-selected-width, 0)",
                      pointerEvents: "none",
                    }}
                  />
                )}

                {/* Hover highlight — drawn last so neighboring strokes don't cover it */}
                {hovered && hovered.key !== selectedKey && (
                  <path
                    d={hovered.d}
                    className="map-path"
                    fill="none"
                    stroke={HOVER_STROKE}
                    strokeWidth={1.6}
                    vectorEffect="non-scaling-stroke"
                    style={{ pointerEvents: "none" }}
                  />
                )}
              </svg>
            </div>
          </TransformComponent>
          <ZoomControls zoom={zoom} />
        </TransformWrapper>

        {/* Tooltip */}
        {tooltip && <MapTooltip {...tooltip} />}

        {/* Positioned card: the (i) icon sits in its top-right corner and the
            disclaimer tooltip anchors to its left edge. pr-8 keeps rows clear of the icon. */}
        <div className="pointer-events-auto absolute bottom-12 left-4 z-10 flex flex-col gap-1.5 rounded-2xl border-none bg-white/95 py-2.5 pl-3 pr-8 text-xs text-slate-800 shadow-xl backdrop-blur-md dark:shadow-2xl sm:bottom-4 dark:bg-slate-800/90 dark:text-slate-100">
          <LegendRow color="var(--hot)" label="Hot · Seller's" />
          <LegendRow color="var(--even)" label="Even · Neutral" />
          <LegendRow color="var(--cold)" label="Cold · Buyer's" />
          <DisclaimerInfo />
        </div>

        {/* Bottom-right under the zoom stack, right edges aligned (right-4). Mobile: bottom-3, with
            legend + zoom stack above at bottom-12. sm+: bottom-4, on the legend's baseline; zoom
            stack moves up to bottom-14. */}
        <div className="pointer-events-none absolute bottom-3 right-4 z-20 whitespace-nowrap rounded-full border-none bg-white/95 px-3 py-1 text-[10px] font-medium text-slate-700 shadow-xl backdrop-blur-md dark:shadow-2xl sm:text-[11px] dark:bg-slate-800/90 dark:text-slate-200 sm:bottom-4">
          © 2026 Real Estate Heatmap · Privacy · Terms
        </div>

      </main>

      <BottomSheet
        open={!!selection}
        onClose={() => setSelectedKey(null)}
        neighborhood={selection?.n ?? null}
        displayName={selection?.sp.name ?? null}
        metrics={selectedMetrics}
        updating={localQuery.isFetching}
        localType={localType}
        localSize={localSize}
        setLocalType={setLocalType}
        setLocalSize={setLocalSize}
      />
    </div>
  );
}


function ZoomControls({ zoom }: { zoom: number }) {
  const { zoomIn, zoomOut, resetTransform } = useControls();
  const btn =
    "flex h-8 w-8 items-center justify-center text-slate-700 transition-colors hover:bg-secondary hover:text-slate-900 dark:text-slate-200 dark:hover:text-white disabled:pointer-events-none disabled:opacity-40";
  return (
    <div className="pointer-events-auto absolute bottom-12 right-4 z-10 flex flex-col divide-y divide-slate-200/60 overflow-hidden rounded-2xl border-none bg-white/95 text-slate-800 shadow-xl backdrop-blur-md dark:shadow-2xl dark:divide-slate-700/60 dark:bg-slate-800/90 dark:text-slate-100 sm:bottom-14">
      <button
        type="button"
        aria-label="Zoom in"
        onClick={() => zoomIn(0.5)}
        disabled={zoom >= MAX_SCALE - 0.01}
        className={btn}
      >
        <Plus size={15} strokeWidth={1.8} />
      </button>
      <button
        type="button"
        aria-label="Zoom out"
        onClick={() => zoomOut(0.5)}
        disabled={zoom <= MIN_SCALE + 0.01}
        className={btn}
      >
        <Minus size={15} strokeWidth={1.8} />
      </button>
      <button
        type="button"
        aria-label="Reset view"
        onClick={() => resetTransform()}
        className={btn}
      >
        <RotateCcw size={14} strokeWidth={1.8} />
      </button>
    </div>
  );
}

function MapTooltip({
  x,
  y,
  name,
  thermal,
}: {
  x: number;
  y: number;
  name: string;
  thermal: Thermal | null;
}) {
  const badge = thermal ? THERMAL_BADGE[thermal] : null;
  // Offset clears the ~12×19px arrow cursor; flip to the opposite side near
  // the right/bottom edges so the box never clips off-screen.
  const OFFSET_X = 16;
  const OFFSET_Y = 20;
  const vw = typeof window !== "undefined" ? window.innerWidth : Infinity;
  const vh = typeof window !== "undefined" ? window.innerHeight : Infinity;
  const flipX = x > vw - 200;
  const flipY = y > vh - 80;
  return (
    <div
      role="tooltip"
      className="pointer-events-none fixed z-[35] flex select-none flex-col items-start gap-1 rounded-md border border-border/60 bg-card px-2.5 py-1.5 shadow-lg"
      style={{
        left: flipX ? undefined : x + OFFSET_X,
        right: flipX ? vw - x + OFFSET_X : undefined,
        top: flipY ? undefined : y + OFFSET_Y,
        bottom: flipY ? vh - y + OFFSET_Y : undefined,
      }}
    >
      <span className="text-[12px] font-semibold tracking-tight text-primary">{name}</span>
      {thermal && badge ? (
        <span
          className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs font-medium"
          style={{ backgroundColor: badge.bg, color: badge.color, boxShadow: badge.ring }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: badge.color }} />
          {THERMAL_LABEL[thermal]}
        </span>
      ) : (
        <span className="text-xs text-muted-foreground">Loading market data…</span>
      )}
    </div>
  );
}

type ApiState = "live" | "syncing" | "error";

const API_STATE_LABEL: Record<ApiState, string> = {
  live: "API Connected",
  syncing: "Syncing…",
  error: "API Offline",
};

function ApiStatusDot({ state, className = "" }: { state: ApiState; className?: string }) {
  const color = state === "error" ? "bg-red-500" : state === "syncing" ? "bg-amber-400" : "bg-emerald-500";
  return (
    <span className={`flex h-2 w-2 ${className}`} aria-hidden>
      {state === "live" && (
        <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-emerald-400 opacity-60" />
      )}
      <span className={`relative inline-flex h-2 w-2 rounded-full ${color}`} />
    </span>
  );
}

/** Header badge reflecting /api/heatmap request state. Hidden below sm (see ApiStatusDot). */
function ApiStatusBadge({ state }: { state: ApiState }) {
  return (
    <span
      title="Market data served by GET /api/heatmap (modeled estimates)"
      className={`hidden items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset sm:inline-flex ${
        state === "error"
          ? "bg-red-50 text-red-700 ring-red-200 dark:bg-red-950/60 dark:text-red-300 dark:ring-red-800/50"
          : "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-800/50"
      }`}
    >
      <ApiStatusDot state={state} className="relative" />
      {API_STATE_LABEL[state]}
    </span>
  );
}

const THEME_KEY = "theme"; // keep in sync with THEME_INIT_SCRIPT in __root.tsx

function ThemeToggle() {
  // null until mounted: the server can't know the theme. Icons switch via the
  // dark: variant instead of state, so there's no hydration mismatch or flicker.
  const [isDark, setIsDark] = useState<boolean | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    setIsDark(root.classList.contains("dark"));
    // Follow OS changes until the user picks a theme explicitly.
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => {
      try {
        if (localStorage.getItem(THEME_KEY)) return;
      } catch {
        /* storage unavailable: keep following the OS */
      }
      root.classList.toggle("dark", e.matches);
      setIsDark(e.matches);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const toggle = () => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem(THEME_KEY, next ? "dark" : "light");
    } catch {
      /* private mode etc.: the choice just won't persist */
    }
    setIsDark(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Dark mode"
      aria-pressed={isDark ?? undefined}
      className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
    >
      <Moon size={16} strokeWidth={1.8} className="dark:hidden" />
      <Sun size={16} strokeWidth={1.8} className="hidden dark:block" />
    </button>
  );
}

function LegendRow({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      <span>{label}</span>
    </div>
  );
}

/** Legend (i) icon. Renders its tooltip against the nearest positioned ancestor (the legend card). */
function DisclaimerInfo() {
  const [open, setOpen] = useState(false);
  const tooltipId = useId();
  return (
    <>
      <button
        type="button"
        aria-label="Data disclaimer"
        aria-describedby={open ? tooltipId : undefined}
        onClick={() => setOpen((v) => !v)}
        // Hover only for real mice; on touch the emulated enter + click
        // would open and immediately toggle closed.
        onPointerEnter={(e) => e.pointerType === "mouse" && setOpen(true)}
        onPointerLeave={(e) => e.pointerType === "mouse" && setOpen(false)}
        onBlur={() => setOpen(false)}
        // right-1/top-1 + p-1 puts the glyph at top-2/right-2 with a larger hit area
        className="absolute right-1 top-1 cursor-pointer rounded-full p-1 text-slate-400 transition-colors hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
      >
        <Info size={14} strokeWidth={1.8} />
      </button>
      {open && (
        <div
          id={tooltipId}
          role="tooltip"
          className="absolute bottom-full left-0 mb-2 w-64 rounded-md border border-border/60 bg-card px-3 py-2 text-xs leading-snug text-muted-foreground shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-bottom-1 duration-150"
        >
          Market indicators are estimates based on available listing data and may be delayed or incomplete. Not real estate, financial, legal, or investment advice.
        </div>
      )}
    </>
  );
}


function LogoMark() {
  return (
    <svg
      viewBox="0 0 512 512"
      className="h-7 w-7 shrink-0 fill-current text-primary"
      role="img"
      aria-label="Real Estate Heatmap"
    >
      <path d="m141 466h80v-161.751l-80-35.556zm45-145h20v30h-20zm0 40h20v30h-20zm0 40h20v30h-20zm-30-80h20v30h-20zm0 40h20v30h-20zm0 40h20v30h-20z" />
      <path d="m51 466h80v-197.307l-80 35.556zm45-145h20v30h-20zm0 40h20v30h-20zm0 40h20v30h-20zm-30-80h20v30h-20zm0 40h20v30h-20zm0 40h20v30h-20z" />
      <path d="m171 271c0 .027-.008.053-.008.08l57.039 25.351c1.806.803 2.969 2.594 2.969 4.569v165h80v-418.063l-140 46.667zm85-170 40-10v20l-40 10zm0 30 40-10v20l-40 10zm0 30 40-10v20l-40 10zm0 30 40-10v20l-40 10zm0 30 40-10v20l-40 10zm0 30 40-10v20l-40 10zm0 30 40-10v20l-40 10zm0 30 40-10v20l-40 10zm-60-190 40-10v20l-40 10zm0 30 40-10v20l-40 10zm0 30 40-10v20l-40 10zm0 30 40-10v20l-40 10z" />
      <path d="m321 47.937v418.063h140v-371.396zm55 283.063-40-10v-20l40 10zm0-30-40-10v-20l40 10zm0-30-40-10v-20l40 10zm0-30-40-10v-20l40 10zm0-30-40-10v-20l40 10zm0-30-40-10v-20l40 10zm0-30-40-10v-20l40 10zm0-30-40-10v-20l40 10zm60 230-40-10v-20l40 10zm0-30-40-10v-20l40 10zm0-30-40-10v-20l40 10zm0-30-40-10v-20l40 10zm0-30-40-10v-20l40 10zm0-30-40-10v-20l40 10zm0-30-40-10v-20l40 10zm0-30-40-10v-20l40 10z" />
    </svg>
  );
}

function BottomSheet({
  open,
  onClose,
  neighborhood,
  displayName,
  metrics,
  updating,
  localType,
  localSize,
  setLocalType,
  setLocalSize,
}: {
  open: boolean;
  onClose: () => void;
  neighborhood: Neighborhood | null;
  displayName: string | null;
  metrics: Metrics | null;
  /** true while a new filter combination is loading (stale numbers still shown) */
  updating: boolean;
  localType: PropertyType;
  localSize: SizeType;
  setLocalType: (v: PropertyType) => void;
  setLocalSize: (v: SizeType) => void;
}) {
  const thermal = metrics?.thermal ?? "even";
  const { bg: badgeBg, color: badgeColor, ring: badgeRing } = THERMAL_BADGE[thermal];

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close panel"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-primary/20 backdrop-blur-sm dark:bg-black/50 transition-opacity animate-fade-in"
        />
      )}
      <aside
        aria-hidden={!open}
        className={`fixed z-50 flex flex-col overflow-hidden border border-border/70 bg-card dark:border-slate-800/60 dark:bg-slate-900/95 dark:shadow-2xl dark:backdrop-blur-md dark:md:shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] inset-x-0 bottom-0 mx-auto max-w-3xl rounded-2xl shadow-[0_-20px_60px_-20px_rgba(15,23,42,0.25)] md:inset-x-auto md:bottom-auto md:left-1/2 md:top-1/2 md:mx-0 md:w-[min(576px,92vw)] md:max-w-xl md:rounded-2xl md:shadow-[0_30px_80px_-20px_rgba(15,23,42,0.35)] ${
          open
            ? "translate-y-0 opacity-100 md:-translate-x-1/2 md:-translate-y-1/2"
            : "translate-y-full opacity-0 pointer-events-none md:-translate-x-1/2 md:-translate-y-[calc(50%-12px)]"
        }`}
        style={{ maxHeight: "88vh", height: "auto" }}
      >
        <div className="flex shrink-0 items-center justify-center pt-2.5 md:hidden">
          <span className="h-1.5 w-10 rounded-full bg-border" />
        </div>

        {neighborhood && (
          <>
            <div className="flex shrink-0 items-center justify-between gap-3 px-5 pt-3 md:px-8 md:pt-7">
              <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5">
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                  {displayName ?? neighborhood.name}
                </h2>
                {metrics ? (
                  <span
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
                    style={{ backgroundColor: badgeBg, color: badgeColor, boxShadow: badgeRing }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: badgeColor }}
                    />
                    {THERMAL_LABEL[thermal]}
                  </span>
                ) : (
                  <span className="block h-6 w-28 animate-pulse rounded-full bg-secondary dark:bg-slate-800" />
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-secondary dark:text-slate-400 dark:hover:text-white"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 md:px-8 md:pb-8 md:pt-4">
              <div className="flex flex-col gap-2">
                <Segmented
                  size="lg"
                  fullWidth
                  options={TYPE_OPTIONS}
                  value={localType}
                  onChange={setLocalType}
                />
                <Segmented
                  size="lg"
                  fullWidth
                  options={SIZE_OPTIONS}
                  value={localSize}
                  onChange={setLocalSize}
                />
              </div>



              {/* Dim stale numbers while a new filter combination loads */}
              <div
                aria-busy={updating}
                className={`mt-4 grid grid-cols-2 gap-x-8 gap-y-6 py-3 transition-opacity duration-200 ${
                  updating && metrics ? "opacity-60" : ""
                }`}
              >
                <Metric
                  label="Supply"
                  value={metrics && `${metrics.supply}`}
                  unit="mo"
                  info="Months of supply: how long current listings would take to sell at the recent sales pace. Under 5 mo is a seller's market; over 6 mo is a buyer's market."
                />
                <Metric
                  label="Avg DOM"
                  value={metrics && `${metrics.dom}`}
                  unit="days"
                  infoAlign="end"
                  info="Average days on market: how long listings typically stay active before going into contract."
                />
                <Metric
                  label="Avg Price / sqft"
                  value={metrics && `$${metrics.ppsf.toLocaleString()}`}
                />
                <Metric label="In Contract" value={metrics && `${metrics.inContract}`} />
              </div>

              <LeadCapture neighborhoodName={displayName ?? neighborhood.name} />
            </div>
          </>
        )}
      </aside>
    </>
  );
}

function Metric({
  label,
  value,
  unit,
  info,
  infoAlign = "start",
}: {
  label: string;
  /** null renders a loading skeleton */
  value: string | null;
  unit?: string;
  info?: string;
  /** Which side of the icon the tooltip extends from; "end" for the right grid column
      so the tooltip doesn't overflow the sheet edge. */
  infoAlign?: "start" | "end";
}) {
  const [infoOpen, setInfoOpen] = useState(false);
  const tooltipId = useId();
  return (
    <div className="relative flex flex-col justify-between">
      <span className="mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        {label}
        {info && (
          <span className="relative inline-flex">
            <button
              type="button"
              aria-label={`About ${label}`}
              aria-describedby={infoOpen ? tooltipId : undefined}
              onClick={() => setInfoOpen((v) => !v)}
              // Hover only for real mice; on touch the emulated enter + click
              // would open and immediately toggle closed.
              onPointerEnter={(e) => e.pointerType === "mouse" && setInfoOpen(true)}
              onPointerLeave={(e) => e.pointerType === "mouse" && setInfoOpen(false)}
              onBlur={() => setInfoOpen(false)}
              className="-m-1 rounded-full p-1 text-slate-500 transition-colors hover:text-primary dark:text-slate-400"
            >
              <Info size={13} strokeWidth={2} />
            </button>
            {infoOpen && (
              <>
                {/* Anchored above the icon so it never covers the numbers below */}
                <span
                  id={tooltipId}
                  role="tooltip"
                  className={`pointer-events-none absolute bottom-full z-50 mb-2 block w-64 rounded-xl border border-slate-200/60 bg-white p-3 text-xs font-normal normal-case leading-snug tracking-normal text-slate-700 shadow-xl dark:border-slate-700/60 dark:bg-slate-800 dark:text-slate-200 ${
                    infoAlign === "end" ? "-right-3" : "-left-3"
                  }`}
                >
                  {info}
                </span>
                <span
                  aria-hidden
                  className="pointer-events-none absolute bottom-full left-1/2 z-50 -translate-x-1/2 border-4 border-transparent border-t-white dark:border-t-slate-800"
                />
              </>
            )}
          </span>
        )}
      </span>
      <span className="flex items-baseline gap-1">
        {value === null ? (
          <span className="h-8 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        ) : (
          <>
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {value}
            </span>
            {unit && <span className="text-sm text-slate-600 dark:text-slate-400">{unit}</span>}
          </>
        )}
      </span>
    </div>
  );
}

function LeadCapture({ neighborhoodName }: { neighborhoodName: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "success">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setEmail("");
    setStatus("idle");
    setError(null);
  }, [neighborhoodName]);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!emailRegex.test(trimmed) || trimmed.length > 255) {
      setError("Please enter a valid email.");
      return;
    }
    setError(null);
    setStatus("success");
  };

  if (status === "success") {
    return (
      <div
        role="status"
        className="mt-4 rounded-lg bg-slate-100 p-4 text-sm dark:bg-slate-800/60 font-medium leading-snug text-primary transition-all duration-500"
      >
        <span className="mr-1.5 text-emerald-500 dark:text-emerald-400">✓</span>
        Perfect! We will notify you if the real estate climate shifts in this
        neighborhood.
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 rounded-lg bg-slate-100 p-4 dark:bg-slate-800/60"
    >
      <p className="text-sm leading-snug tracking-tight text-primary">
        Sign me up if the heatmap changes in{" "}
        <span className="font-semibold">{neighborhoodName}</span>.
      </p>
      <div className="mt-2.5 flex items-center gap-2">
        <input
          type="email"
          required
          maxLength={255}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError(null);
          }}
          placeholder="you@email.com"
          aria-label="Email address"
          className="h-10 min-w-0 flex-1 rounded-lg border border-primary/35 bg-card px-4 text-sm text-primary placeholder:text-slate-500 transition-colors hover:border-primary/60 focus:border-primary dark:border-slate-700/60 dark:bg-slate-900/80 dark:text-white dark:placeholder:text-slate-500 dark:hover:border-slate-500 dark:focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/15"
        />
        <button
          type="submit"
          className="h-10 shrink-0 rounded-lg bg-primary px-4 text-sm font-semibold tracking-tight text-primary-foreground transition-[transform,background-color] dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 hover:scale-[1.02] active:scale-[0.98]"
        >
          Notify Me
        </button>
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-destructive">{error}</p>
      )}
    </form>
  );
}
