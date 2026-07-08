import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Building, Info } from "lucide-react";
import {
  TransformWrapper,
  TransformComponent,
} from "react-zoom-pan-pinch";

export const Route = createFileRoute("/")({
  component: Index,
});

type PropertyType = "All" | "Condo" | "Co-op" | "TH";
type SizeType = "All" | "1 Bed" | "2 Bed" | "3 Bed";
type Thermal = "hot" | "even" | "cold";

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
  base: number;
  dom: number;
  ppsf: number;
  inContract: number;
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
    base: 6.8,
    dom: 112,
    ppsf: 890,
    inContract: 42,
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
    base: 4.2,
    dom: 68,
    ppsf: 1680,
    inContract: 78,
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
    base: 5.4,
    dom: 84,
    ppsf: 1740,
    inContract: 61,
  },
  {
    id: "midtown",
    name: "Midtown",
    shortName: "Midtown",
    subPaths: [
      { d: "M222.704 413.703H248.874V375.133H222.704V413.703Z", name: "Turtle Bay", cx: 236, cy: 394 },
      { d: "M222.444 448.203H182.494V386.983H164.514V418.223H152.094V375.233H222.454V448.203H222.444Z", name: "Midtown", cx: 200, cy: 410 },
      { d: "M164.494 418.173H151.904V429.833H182.434V386.903H164.494V418.173Z", name: "Theater District", cx: 172, cy: 408 },
      { d: "M112.504 418.283V375.403H151.984V418.283H112.504Z", name: "Clinton", cx: 132, cy: 396 },
      { d: "M112.424 375.523V339.253H163.794V375.523H112.424Z", name: "Lincoln Square", cx: 138, cy: 357 },
      { d: "M201.624 339.103V375.183H267.664V339.163L267.694 339.103H201.624Z", name: "Lenox Hill", cx: 234, cy: 357 },
    ],
    labelX: 190,
    labelY: 395,
    base: 5.8,
    dom: 92,
    ppsf: 1590,
    inContract: 54,
  },
  {
    id: "chelsea",
    name: "Chelsea",
    shortName: "Chelsea",
    subPaths: [
      { d: "M120.224 479.943C111.774 478.713 110.234 459.343 110.524 449.803H152.094V429.753H182.424V500.413H126.914L120.234 479.943H120.224Z", name: "Chelsea", cx: 145, cy: 465 },
      { d: "M142.824 541.313L127.024 500.483H172.464V541.313H142.824Z", name: "Meatpacking", cx: 152, cy: 520 },
      { d: "M172.464 500.483L222.464 500.583L224.404 506.743L226.244 539.853H182.224L172.464 541.313V500.483Z", name: "West Village", cx: 198, cy: 520 },
    ],
    labelX: 165,
    labelY: 480,
    base: 3.8,
    dom: 54,
    ppsf: 1980,
    inContract: 89,
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
      { d: "M222.464 500.583H182.134V447.963H222.464V500.583Z", name: "Gramercy", cx: 202, cy: 474 },
      { d: "M248.924 450.003V413.673H222.704V450.003H248.924Z", name: "Rose Hill", cx: 236, cy: 431 },
      { d: "M110.164 449.903C108.194 426.783 110.984 419.183 112.634 418.263H151.964V449.903H110.164Z", name: "Flatiron", cx: 132, cy: 435 },
      { d: "M249.464 475.943H222.444V449.483H249.464V475.943Z", name: "Stuyvesant", cx: 236, cy: 462 },
      { d: "M249.254 475.593H268.764C268.764 477.133 273.684 482.713 280.494 486.193C289.874 490.983 292.354 497.823 292.414 500.643H249.254V475.593Z", name: "Peter Cooper", cx: 271, cy: 488 },
      { d: "M222.444 475.943H249.464L249.254 500.643L222.464 500.583L222.444 475.943Z", name: "Union Square", cx: 236, cy: 488 },
    ],
    labelX: 245,
    labelY: 450,
    base: 5.1,
    dom: 72,
    ppsf: 1820,
    inContract: 66,
  },
  {
    id: "soho",
    name: "SoHo",
    shortName: "SoHo",
    subPaths: [
      { d: "M249.364 590.113L227.164 579.873V540.773H242.074L249.364 590.103V590.113Z", name: "East Village", cx: 238, cy: 565 },
      { d: "M227.114 562.963H210.954V539.853H226.244V540.803H227.114V562.963Z", name: "Bowery", cx: 219, cy: 551 },
      { d: "M151.934 561.343L142.974 541.613L172.654 541.423L182.224 539.843H210.934V562.893H200.074V570.683L162.034 561.343H151.934Z", name: "NoHo", cx: 178, cy: 553 },
      { d: "M222.194 500.633H269.134V540.763H226.364L224.404 506.743L222.194 500.633Z", name: "Nolita", cx: 246, cy: 520 },
      { d: "M269.034 540.933V500.603H292.424C293.034 507.633 296.824 525.553 307.084 540.933H269.024H269.034Z", name: "Little Italy", cx: 285, cy: 521 },
      { d: "M200.074 562.903L227.114 562.963L227.364 590.903L199.944 590.723L200.074 562.903Z", name: "SoHo", cx: 214, cy: 577 },
    ],
    labelX: 220,
    labelY: 545,
    base: 4.6,
    dom: 61,
    ppsf: 2240,
    inContract: 71,
  },
  {
    id: "fidi",
    name: "FiDi",
    shortName: "FiDi",
    subPaths: [
      { d: "M265.434 597.773L249.334 590.023L241.984 540.973H306.944C314.314 557.413 306.664 568.923 301.914 572.633L265.434 597.773Z", name: "Lower East Side", cx: 278, cy: 570 },
      { d: "M173.164 608.783L151.954 561.463L162.114 561.253L199.944 570.613V590.723L203.664 608.783H173.164Z", name: "Tribeca", cx: 180, cy: 587 },
      { d: "M227.364 609.713H203.624L199.994 590.893H227.354V609.713H227.364Z", name: "Chinatown", cx: 214, cy: 600 },
      { d: "M245.044 618.333L227.534 609.753V580.053L265.384 598.053C257.914 604.263 248.714 614.163 245.044 618.333Z", name: "Two Bridges", cx: 246, cy: 600 },
      { d: "M188.794 644.083L173.264 608.853L203.414 608.743L203.614 609.483H208.054L206.494 637.853L188.794 644.083Z", name: "Battery Park City", cx: 191, cy: 626 },
      { d: "M223.924 648.793C212.854 649.583 207.634 641.823 206.414 637.833L208.144 609.733H227.454L244.944 618.643C239.354 633.213 228.604 644.813 223.924 648.803V648.793Z", name: "Civic Center", cx: 224, cy: 628 },
      { d: "M224.024 649.023C208.494 666.293 194.184 652.863 188.974 643.993L206.574 637.783C209.854 647.653 219.574 649.393 224.024 649.023Z", name: "Financial District", cx: 208, cy: 652 },
    ],
    labelX: 215,
    labelY: 615,
    base: 7.2,
    dom: 128,
    ppsf: 1420,
    inContract: 38,
  },
];

const CENTRAL_PARK_PATH =
  "M163.464 375.253H201.704L201.534 238.432H163.464V375.253Z";

const TYPE_FACTORS: Record<PropertyType, number> = {
  All: 1,
  Condo: 0.78,
  "Co-op": 1.18,
  TH: 0.92,
};
const SIZE_FACTORS: Record<SizeType, number> = {
  All: 1,
  "1 Bed": 0.85,
  "2 Bed": 1.0,
  "3 Bed": 1.22,
};

function thermalFor(supply: number): Thermal {
  if (supply < 5) return "hot";
  if (supply <= 6) return "even";
  return "cold";
}

function computeMetrics(n: Neighborhood, type: PropertyType, size: SizeType) {
  const factor = TYPE_FACTORS[type] * SIZE_FACTORS[size];
  const supply = +(n.base * factor).toFixed(1);
  const thermal = thermalFor(supply);
  const idHash = n.id.charCodeAt(0) + n.id.charCodeAt(n.id.length - 1);
  let dom: number;
  if (thermal === "hot") {
    dom = 20 + (idHash % 12);
  } else if (thermal === "cold") {
    dom = 82 + (idHash % 18);
  } else {
    dom = 55 + (idHash % 15);
  }
  const ppsf = Math.round(
    n.ppsf *
      (2 - SIZE_FACTORS[size]) *
      (type === "Condo" ? 1.08 : type === "Co-op" ? 0.92 : 1),
  );
  const inContract = Math.max(4, Math.round(n.inContract / factor));
  return { supply, dom, ppsf, inContract, thermal };
}

function hashStr(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function subMetrics(
  n: Neighborhood,
  sp: SubPath,
  type: PropertyType,
  size: SizeType,
) {
  const h = hashStr(n.id + "::" + sp.name);
  const jitterSupply = ((h % 34) - 17) / 10; // -1.7..+1.7
  const jitterPpsf = ((h >> 5) % 500) - 250;
  const jitterContract = ((h >> 11) % 30) - 15;
  const derived: Neighborhood = {
    ...n,
    id: `${n.id}--${sp.name}`,
    base: Math.max(1.4, +(n.base + jitterSupply).toFixed(2)),
    ppsf: Math.max(600, n.ppsf + jitterPpsf),
    inContract: Math.max(4, n.inContract + jitterContract),
  };
  return computeMetrics(derived, type, size);
}

function subKey(nId: string, spName: string) {
  return `${nId}::${spName}`;
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

const ZOOM_THRESHOLD = 1.4; // Tier 2 begins — micro labels fade in
const ZOOM_THRESHOLD_LG = 2.2; // Tier 3 begins — micro labels scale up

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
        ? "px-4 py-2 text-sm"
        : "px-3.5 py-1.5 text-[13px]";
  return (
    <div className={`${fullWidth ? "flex w-full" : "inline-flex"} rounded-md bg-secondary p-1`}>

      {options.map((opt) => {
        const active = opt === value;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`${pad} rounded-md font-medium tracking-tight transition-all duration-200 ${
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
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
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [localType, setLocalType] = useState<PropertyType>("All");
  const [localSize, setLocalSize] = useState<SizeType>("All");
  const [zoom, setZoom] = useState(1);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    label: string;
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

  const polygonState = useMemo(() => {
    return NEIGHBORHOODS.map((n) => {
      const subStates = n.subPaths.map((sp) => {
        const key = subKey(n.id, sp.name);
        const isSelected = key === selectedKey;
        const t = isSelected ? localType : globalType;
        const s = isSelected ? localSize : globalSize;
        const m = subMetrics(n, sp, t, s);
        return { sp, key, isSelected, ...m };
      });
      return { n, subStates };
    });
  }, [globalType, globalSize, selectedKey, localType, localSize]);

  const selectedMetrics = selection
    ? subMetrics(selection.n, selection.sp, localType, localSize)
    : null;

  const handleSelect = (nId: string, spName: string) => {
    setSelectedKey(subKey(nId, spName));
    setLocalType(globalType);
    setLocalSize(globalSize);
  };

  const microVisible = zoom >= ZOOM_THRESHOLD;
  const microStrokeWidthBase = 0.7;

  // Measure each sub-path bbox once mounted so we can size labels to fit
  // and detect collisions between neighboring label rects.
  const pathRefs = useRef<Record<string, SVGPathElement | null>>({});
  const [bboxes, setBboxes] = useState<
    Record<string, { w: number; h: number; cx: number; cy: number }>
  >({});
  useLayoutEffect(() => {
    const next: Record<string, { w: number; h: number; cx: number; cy: number }> = {};
    for (const [k, el] of Object.entries(pathRefs.current)) {
      if (!el) continue;
      try {
        const b = el.getBBox();
        next[k] = {
          w: b.width,
          h: b.height,
          cx: b.x + b.width / 2,
          cy: b.y + b.height / 2,
        };
      } catch {
        /* ignore */
      }
    }
    setBboxes(next);
  }, []);

  // Compute label layout (font size, wrapped lines, visibility) per sub-path,
  // considering polygon area, textual length, and pairwise collisions at
  // the current zoom level. Smaller/lower-priority labels are hidden when
  // they overlap larger neighbors, and re-appear as zoom shrinks label rects.
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
      visible: boolean;
    };
    const z = Math.max(zoom, 1);
    const items: Layout[] = [];
    for (const n of NEIGHBORHOODS) {
      for (const sp of n.subPaths) {
        const key = subKey(n.id, sp.name);
        const bb = bboxes[key];
        const polyW = bb?.w ?? 40;
        const polyH = bb?.h ?? 40;
        const area = polyW * polyH;
        const isSmall = area < 900;
        // 3-tier target visual pixel size (SVG is inside a scaled wrapper,
        // so we divide by z to keep on-screen size predictable per tier).
        // Tier 2 (1.4x–2.2x): compact, crisp. Tier 3 (>2.2x): comfortable read.
        const tier3 = z >= ZOOM_THRESHOLD_LG;
        const targetPx = tier3
          ? (isSmall ? 13 : 15)
          : (isSmall ? 10 : 11.5);
        let fontSize = Math.max(5.5, targetPx / z);

        // Try single line; if too wide for polygon, wrap around the middle.
        const words = sp.name.split(" ");
        const singleWidth = sp.name.length * fontSize * 0.55;
        let lines: string[] = [sp.name];
        const fitBudget = polyW * 0.92;
        if (words.length > 1 && singleWidth > fitBudget) {
          const mid = Math.ceil(words.length / 2);
          lines = [
            words.slice(0, mid).join(" "),
            words.slice(mid).join(" "),
          ];
        }
        // If wrapped lines still overflow, nudge font down a touch.
        const longest = Math.max(...lines.map((l) => l.length));
        if (longest * fontSize * 0.55 > fitBudget && fontSize > 6) {
          fontSize = Math.max(
            5.5,
            (fitBudget / (longest * 0.55)) as number,
          );
        }
        const width = longest * fontSize * 0.55;
        const height = lines.length * fontSize * 1.15;
        items.push({
          key,
          cx: sp.cx,
          cy: sp.cy,
          fontSize,
          lines,
          width,
          height,
          area,
          visible: true,
        });
      }
    }
    // Greedy collision resolution: larger polygon wins, smaller hides.
    items.sort((a, b) => b.area - a.area);
    const placed: Layout[] = [];
    for (const item of items) {
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
  }, [bboxes, zoom]);

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-5">
          <div className="flex items-center gap-2.5">
            <LogoA />
            <span className="text-[17px] font-semibold tracking-tight text-primary">
              Alta<span className="text-muted-foreground font-normal"> Forecast</span>
            </span>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
            aria-label="Change borough"
          >
            Manhattan
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden>
              <path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div className="mx-auto flex max-w-3xl flex-col gap-4 px-5 pb-4 pt-2 sm:flex-row sm:items-center sm:justify-start">
          <Segmented
            options={["All", "Condo", "Co-op", "TH"] as const}
            value={globalType}
            onChange={setGlobalType}
          />
          <Segmented
            options={["All", "1 Bed", "2 Bed", "3 Bed"] as const}
            value={globalSize}
            onChange={setGlobalSize}
          />
        </div>
      </header>

      <main className="relative flex-1 overflow-hidden bg-[var(--water)]">
        <TransformWrapper
          initialScale={1}
          minScale={1}
          maxScale={5}
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
            <div className="relative mx-auto flex h-full w-full max-w-3xl items-center justify-center px-4 py-3">
              <svg
                viewBox="0 0 383 674"
                preserveAspectRatio="xMidYMid meet"
                className="mx-auto h-full max-h-full w-auto max-w-full drop-shadow-[0_20px_40px_rgba(15,23,42,0.06)]"
                role="img"
                aria-label="Manhattan neighborhoods heatmap"
              >
                {polygonState.map(({ n, subStates }) => (
                  <g key={n.id}>
                    {subStates.map(({ sp, key, isSelected, thermal }) => {
                      const isHovered = hoveredKey === key;
                      return (
                        <path
                          key={key}
                          ref={(el) => {
                            pathRefs.current[key] = el;
                          }}
                          d={sp.d}
                          fill={THERMAL_FILL[thermal]}
                          stroke={THERMAL_STROKE[thermal]}
                          strokeOpacity={1}
                          strokeWidth={
                            isSelected
                              ? 1.8
                              : isHovered
                                ? 1.3
                                : microStrokeWidthBase
                          }
                          strokeLinejoin="round"
                          vectorEffect="non-scaling-stroke"
                          style={{
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
                            handleSelect(n.id, sp.name);
                          }}
                          onMouseEnter={() => setHoveredKey(key)}
                          onMouseLeave={() => {
                            setHoveredKey((k) => (k === key ? null : k));
                            setTooltip(null);
                          }}
                          onMouseMove={(e) =>
                            setTooltip({
                              x: e.clientX,
                              y: e.clientY,
                              label: sp.name,
                            })
                          }
                          onTouchStart={() => setHoveredKey(key)}
                        >
                          <title>{sp.name}</title>
                        </path>
                      );
                    })}

                    {/* Macro label (Tier 1) */}
                    <text
                      x={n.labelX}
                      y={n.labelY}
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="neighborhood-label"
                      letterSpacing="0.06em"
                      fill="#183659"
                      style={{
                        pointerEvents: "none",
                        opacity: microVisible ? 0 : 1,
                        transition: "opacity 250ms ease",
                      }}
                    >
                      {n.shortName}
                    </text>

                    {/* Micro labels (Tier 2) — collision-managed, per-polygon fit */}
                    {n.subPaths.map((sp) => {
                      const key = subKey(n.id, sp.name);
                      const layout = labelLayouts[key];
                      if (!layout) {
                        return (
                          <text
                            key={`micro-${sp.name}`}
                            x={sp.cx}
                            y={sp.cy}
                            style={{ opacity: 0, pointerEvents: "none" }}
                          />
                        );
                      }
                      const { fontSize, lines, visible } = layout;
                      const lineHeight = fontSize * 1.15;
                      const startDy = -((lines.length - 1) * lineHeight) / 2;
                      return (
                        <text
                          key={`micro-${sp.name}`}
                          x={sp.cx}
                          y={sp.cy}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill="#183659"
                          style={{
                            pointerEvents: "none",
                            opacity: microVisible && visible ? 1 : 0,
                            transition:
                              "opacity 250ms ease, font-size 180ms ease",
                            fontSize: `${fontSize}px`,
                            fontWeight: 600,
                            letterSpacing: "0.01em",
                          }}
                        >
                          {lines.map((line, i) => (
                            <tspan
                              key={i}
                              x={sp.cx}
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
                  fill="var(--park-stroke)"
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
                  fill="var(--park-stroke)"
                  style={{
                    pointerEvents: "none",
                    fontSize: microVisible ? `${Math.max(5.5, 9 / Math.max(zoom, 1))}px` : undefined,
                    transition: "font-size 180ms ease",
                  }}
                >
                  PARK
                </text>
              </svg>
            </div>
          </TransformComponent>
        </TransformWrapper>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="pointer-events-none fixed z-20 rounded-md bg-primary px-2.5 py-1 text-[11px] font-semibold tracking-tight text-primary-foreground shadow-lg"
            style={{
              left: tooltip.x + 12,
              top: tooltip.y + 12,
            }}
          >
            {tooltip.label}
          </div>
        )}

        <div className="pointer-events-auto absolute bottom-4 left-4 z-10 flex items-start gap-2">
          <div className="flex flex-col gap-1.5 rounded-md border border-border/60 bg-card/85 px-3 py-2.5 text-[11px] shadow-none backdrop-blur-md">
            <LegendRow color="var(--hot)" label="Hot · Seller's" />
            <LegendRow color="var(--even)" label="Even · Neutral" />
            <LegendRow color="var(--cold)" label="Cold · Buyer's" />
          </div>
          <DisclaimerInfo />
        </div>

        <div className="pointer-events-none absolute bottom-3 right-4 z-10 text-[10px] tracking-tight text-slate-400/70">
          © 2026 Alta Forecast · Privacy · Terms
        </div>

      </main>

      <BottomSheet
        open={!!selection}
        onClose={() => setSelectedKey(null)}
        neighborhood={selection?.n ?? null}
        displayName={selection?.sp.name ?? null}
        metrics={selectedMetrics}
        localType={localType}
        localSize={localSize}
        setLocalType={setLocalType}
        setLocalSize={setLocalSize}
      />
    </div>
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
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}

function DisclaimerInfo() {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label="Data disclaimer"
        onClick={() => setOpen((v) => !v)}
        className="flex h-7 w-7 items-center justify-center rounded-md border border-border/60 bg-card/85 text-muted-foreground shadow-none backdrop-blur-md transition-colors hover:text-foreground"
      >
        <Info size={14} strokeWidth={1.8} />
      </button>
      {open && (
        <div
          role="tooltip"
          className="absolute bottom-full left-0 mb-2 w-64 rounded-md border border-border/60 bg-card px-3 py-2 text-[11px] leading-snug text-muted-foreground shadow-lg backdrop-blur-md"
        >
          Market indicators are estimates based on available listing data and may be delayed or incomplete. Not real estate, financial, legal, or investment advice.
        </div>
      )}
    </div>
  );
}


function LogoA() {
  return (
    <svg
      viewBox="0 0 40 40"
      className="h-8 w-auto"
      role="img"
      aria-label="Alta"
      fill="none"
    >
      <path
        d="M4.5 35 L20 4 L35.5 35"
        stroke="#183659"
        strokeWidth="3"
        strokeLinejoin="miter"
        strokeMiterlimit="10"
        strokeLinecap="butt"
        fill="none"
      />
      <path
        d="M20 16 L14.5 26 L25.5 26 Z"
        stroke="#183659"
        strokeWidth="2"
        strokeLinejoin="miter"
        fill="none"
      />
      <rect x="12.5" y="33.5" width="15" height="2.4" fill="#3EB6DC" />
    </svg>
  );
}

function BottomSheet({
  open,
  onClose,
  neighborhood,
  displayName,
  metrics,
  localType,
  localSize,
  setLocalType,
  setLocalSize,
}: {
  open: boolean;
  onClose: () => void;
  neighborhood: Neighborhood | null;
  displayName: string | null;
  metrics: ReturnType<typeof computeMetrics> | null;
  localType: PropertyType;
  localSize: SizeType;
  setLocalType: (v: PropertyType) => void;
  setLocalSize: (v: SizeType) => void;
}) {
  const thermal = metrics?.thermal ?? "even";
  const badgeBg =
    thermal === "hot"
      ? "#FCE7EC"
      : thermal === "cold"
        ? "#E0F2FB"
        : "#EEF1F5";
  const badgeColor =
    thermal === "hot"
      ? "#9F1239"
      : thermal === "cold"
        ? "#0369A1"
        : "#475569";


  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close panel"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-primary/20 backdrop-blur-sm transition-opacity animate-fade-in"
        />
      )}
      <aside
        aria-hidden={!open}
        className={`fixed z-50 flex flex-col overflow-hidden border border-border/70 bg-card transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] inset-x-0 bottom-0 mx-auto max-w-3xl rounded-2xl shadow-[0_-20px_60px_-20px_rgba(15,23,42,0.25)] md:inset-x-auto md:bottom-auto md:left-1/2 md:top-1/2 md:mx-0 md:w-[min(576px,92vw)] md:max-w-xl md:rounded-2xl md:shadow-[0_30px_80px_-20px_rgba(15,23,42,0.35)] ${
          open
            ? "translate-y-0 opacity-100 md:-translate-x-1/2 md:-translate-y-1/2"
            : "translate-y-full opacity-0 pointer-events-none md:-translate-x-1/2 md:-translate-y-[calc(50%-12px)]"
        }`}
        style={{ maxHeight: "88vh", height: "auto" }}
      >
        <div className="flex shrink-0 items-center justify-center pt-2.5 md:hidden">
          <span className="h-1.5 w-10 rounded-full bg-border" />
        </div>

        {neighborhood && metrics && (
          <>
            <div className="flex shrink-0 items-start justify-between gap-3 px-5 pt-3 md:px-8 md:pt-7">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-primary">
                  {displayName ?? neighborhood.name}
                </h2>
                <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  {neighborhood.name}
                </p>
                <span
                  className="mt-1.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
                  style={{ backgroundColor: badgeBg, color: badgeColor }}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: badgeColor }}
                  />
                  {THERMAL_LABEL[thermal]}
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-secondary"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-3 pt-3 md:px-8 md:pt-4">
              <div className="flex flex-col gap-2">
                <Segmented
                  size="lg"
                  fullWidth
                  options={["All", "Condo", "Co-op", "TH"] as const}
                  value={localType}
                  onChange={setLocalType}
                />
                <Segmented
                  size="lg"
                  fullWidth
                  options={["All", "1 Bed", "2 Bed", "3 Bed"] as const}
                  value={localSize}
                  onChange={setLocalSize}
                />
              </div>



              <div className="mt-4 grid grid-cols-2 gap-2.5">
                <Metric label="Supply" value={`${metrics.supply}`} unit="mo" />
                <Metric label="Avg DOM" value={`${metrics.dom}`} unit="days" />
                <Metric
                  label="Avg Price / sqft"
                  value={`$${metrics.ppsf.toLocaleString()}`}
                />
                <Metric label="In Contract" value={`${metrics.inContract}`} />
              </div>

              <LeadCapture neighborhoodName={displayName ?? neighborhood.name} />
            </div>

            <div className="shrink-0 border-t border-border/60 bg-card px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 md:border-t-0 md:px-8 md:pb-7 md:pt-4">
              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-md border border-[#183659] bg-transparent py-3.5 text-sm font-semibold tracking-[0.08em] text-[#183659] transition-transform hover:scale-[1.01] active:scale-[0.99]"
              >
                <Building size={16} strokeWidth={2} aria-hidden className="shrink-0" />
                SEE LISTINGS
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}

function Metric({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="flex flex-col justify-between rounded-md bg-secondary/70 p-3.5">
      <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </span>
      <span className="mt-1 flex items-baseline gap-1">
        <span className="text-xl font-semibold tracking-tight text-primary">{value}</span>
        {unit && <span className="text-[11px] text-muted-foreground">{unit}</span>}
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
        className="mt-4 rounded-none border border-border/70 bg-secondary/60 px-4 py-3 text-[13px] font-medium leading-snug text-primary transition-all duration-500"
      >
        <span className="mr-1.5 text-hot">✓</span>
        Perfect! We will notify you if the real estate climate shifts in this
        neighborhood.
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 rounded-none border border-border/70 bg-secondary/40 p-3.5"
    >
      <p className="text-[12.5px] leading-snug tracking-tight text-primary">
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
          className="h-10 flex-1 rounded-md border border-border bg-card px-4 text-[13px] text-primary placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
        />
        <button
          type="submit"
          className="h-10 shrink-0 rounded-md bg-primary px-4 text-[12.5px] font-semibold tracking-tight text-primary-foreground transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          Notify Me
        </button>
      </div>
      {error && (
        <p className="mt-1.5 text-[11px] text-destructive">{error}</p>
      )}
    </form>
  );
}
