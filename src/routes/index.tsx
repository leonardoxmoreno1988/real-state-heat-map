import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/")({
  component: Index,
});

type PropertyType = "All" | "Condo" | "Co-op" | "TH";
type SizeType = "All" | "1 Bed" | "2 Bed" | "3 Bed";
type Thermal = "hot" | "even" | "cold";

interface Neighborhood {
  id: string;
  name: string;
  points: string; // SVG polygon points
  labelX: number;
  labelY: number;
  // supply months by property type + size — used to derive thermal state
  base: number; // baseline supply months
  dom: number;
  ppsf: number;
  inContract: number;
}

const NEIGHBORHOODS: Neighborhood[] = [
  {
    id: "harlem",
    name: "Harlem",
    points: "60,40 240,40 240,140 60,140",
    labelX: 150,
    labelY: 92,
    base: 6.8,
    dom: 112,
    ppsf: 890,
    inContract: 42,
  },
  {
    id: "uws",
    name: "Upper West Side",
    points: "60,140 150,140 150,300 60,300",
    labelX: 105,
    labelY: 222,
    base: 4.2,
    dom: 68,
    ppsf: 1680,
    inContract: 78,
  },
  {
    id: "ues",
    name: "Upper East Side",
    points: "195,140 240,140 240,300 195,300",
    labelX: 218,
    labelY: 222,
    base: 5.4,
    dom: 84,
    ppsf: 1740,
    inContract: 61,
  },
  {
    id: "midtown",
    name: "Midtown",
    points: "60,300 240,300 240,400 60,400",
    labelX: 150,
    labelY: 352,
    base: 5.8,
    dom: 92,
    ppsf: 1590,
    inContract: 54,
  },
  {
    id: "chelsea",
    name: "Chelsea",
    points: "60,400 150,400 150,510 60,510",
    labelX: 105,
    labelY: 458,
    base: 3.8,
    dom: 54,
    ppsf: 1980,
    inContract: 89,
  },
  {
    id: "gramercy",
    name: "Gramercy",
    points: "150,400 240,400 240,510 150,510",
    labelX: 195,
    labelY: 458,
    base: 5.1,
    dom: 72,
    ppsf: 1820,
    inContract: 66,
  },
  {
    id: "soho",
    name: "SoHo",
    points: "60,510 240,510 240,600 60,600",
    labelX: 150,
    labelY: 558,
    base: 4.6,
    dom: 61,
    ppsf: 2240,
    inContract: 71,
  },
  {
    id: "fidi",
    name: "FiDi",
    points: "80,600 220,600 200,700 100,700",
    labelX: 150,
    labelY: 650,
    base: 7.2,
    dom: 128,
    ppsf: 1420,
    inContract: 38,
  },
];

const CENTRAL_PARK = "155,145 190,145 190,295 155,295";

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
  // Reinforce color/data duality: DOM tracks the thermal state.
  // Hot markets clear fast; cold markets linger.
  const idHash = n.id.charCodeAt(0) + n.id.charCodeAt(n.id.length - 1);
  let dom: number;
  if (thermal === "hot") {
    dom = 20 + (idHash % 12); // 20–31 days
  } else if (thermal === "cold") {
    dom = 82 + (idHash % 18); // 82–99 days
  } else {
    dom = 55 + (idHash % 15); // 55–69 days
  }
  const ppsf = Math.round(n.ppsf * (2 - SIZE_FACTORS[size]) * (type === "Condo" ? 1.08 : type === "Co-op" ? 0.92 : 1));
  const inContract = Math.max(4, Math.round(n.inContract / factor));
  return { supply, dom, ppsf, inContract, thermal };
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

function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = "md",
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  size?: "sm" | "md";
}) {
  const pad = size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm";
  return (
    <div className="inline-flex rounded-full bg-secondary p-1">
      {options.map((opt) => {
        const active = opt === value;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`${pad} rounded-full font-medium tracking-tight transition-all duration-200 ${
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [localType, setLocalType] = useState<PropertyType>("All");
  const [localSize, setLocalSize] = useState<SizeType>("All");

  const selected = NEIGHBORHOODS.find((n) => n.id === selectedId) ?? null;

  const polygonState = useMemo(() => {
    return NEIGHBORHOODS.map((n) => {
      const isSelected = n.id === selectedId;
      const t = isSelected ? localType : globalType;
      const s = isSelected ? localSize : globalSize;
      const m = computeMetrics(n, t, s);
      return { n, ...m, isSelected };
    });
  }, [globalType, globalSize, selectedId, localType, localSize]);

  const selectedMetrics = selected
    ? computeMetrics(selected, localType, localSize)
    : null;

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setLocalType(globalType);
    setLocalSize(globalSize);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Navbar */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-5">
          <div className="flex items-center gap-2.5">
            <LogoA />
            <span className="text-[15px] font-semibold tracking-tight text-primary">
              Alta<span className="text-muted-foreground font-normal"> Heatmap</span>
            </span>
          </div>
          <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Manhattan
          </span>
        </div>

        {/* Global filters */}
        <div className="mx-auto flex max-w-3xl flex-col gap-2 px-5 pb-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
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

      {/* Map area */}
      <main className="relative flex-1 overflow-hidden">
        <div className="relative mx-auto flex h-[calc(100vh-11rem)] max-w-3xl items-center justify-center px-4">
          <svg
            viewBox="0 0 300 750"
            className="h-full w-auto max-w-full drop-shadow-[0_20px_40px_rgba(15,23,42,0.06)]"
            role="img"
            aria-label="Manhattan neighborhoods heatmap"
          >
            {/* water backdrop */}
            <rect width="300" height="750" fill="var(--water)" rx="24" />

            {polygonState.map(({ n, thermal, isSelected }) => (
              <g
                key={n.id}
                onClick={() => handleSelect(n.id)}
                style={{
                  cursor: "pointer",
                  transformOrigin: `${n.labelX}px ${n.labelY}px`,
                  transform: isSelected ? "scale(1.015)" : "scale(1)",
                  transition: "transform 300ms cubic-bezier(0.22, 1, 0.36, 1), opacity 300ms",
                  opacity: selectedId && !isSelected ? 0.55 : 1,
                }}
              >
                <polygon
                  points={n.points}
                  fill={THERMAL_FILL[thermal]}
                  stroke={THERMAL_STROKE[thermal]}
                  strokeWidth={isSelected ? 1.6 : 0.8}
                  style={{ transition: "fill 400ms ease, stroke-width 200ms" }}
                />
                <text
                  x={n.labelX}
                  y={n.labelY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="10"
                  fontWeight={600}
                  letterSpacing="0.02em"
                  fill="var(--primary)"
                  style={{ pointerEvents: "none" }}
                >
                  {n.name}
                </text>
              </g>
            ))}

            {/* Central Park */}
            <polygon
              points={CENTRAL_PARK}
              fill="var(--park)"
              stroke="var(--park-stroke)"
              strokeWidth="0.8"
              style={{ pointerEvents: "none" }}
            />
            <text
              x="172.5"
              y="220"
              textAnchor="middle"
              fontSize="8"
              fontWeight={600}
              fill="var(--park-stroke)"
              style={{ pointerEvents: "none", letterSpacing: "0.05em" }}
            >
              CENTRAL
            </text>
            <text
              x="172.5"
              y="232"
              textAnchor="middle"
              fontSize="8"
              fontWeight={600}
              fill="var(--park-stroke)"
              style={{ pointerEvents: "none", letterSpacing: "0.05em" }}
            >
              PARK
            </text>
          </svg>

          {/* Legend */}
          <div className="pointer-events-none absolute bottom-4 left-4 flex flex-col gap-1.5 rounded-2xl border border-border/60 bg-card/85 px-3 py-2.5 text-[11px] shadow-sm backdrop-blur-md">
            <LegendRow color="var(--hot)" icon="🔥" label="Hot · Seller's" />
            <LegendRow color="var(--even)" icon="⬜" label="Even · Neutral" />
            <LegendRow color="var(--cold)" icon="❄️" label="Cold · Buyer's" />
          </div>
        </div>
      </main>

      {/* Bottom Sheet */}
      <BottomSheet
        open={!!selected}
        onClose={() => setSelectedId(null)}
        neighborhood={selected}
        metrics={selectedMetrics}
        localType={localType}
        localSize={localSize}
        setLocalType={setLocalType}
        setLocalSize={setLocalSize}
      />
    </div>
  );
}

function LegendRow({ color, icon, label }: { color: string; icon: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      <span className="text-muted-foreground">
        <span className="mr-1">{icon}</span>
        {label}
      </span>
    </div>
  );
}

function LogoA() {
  return (
    <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden>
      <rect width="32" height="32" rx="8" fill="var(--primary)" />
      <path
        d="M9 24 L16 8 L23 24 M12 19 L20 19"
        stroke="var(--primary-foreground)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function BottomSheet({
  open,
  onClose,
  neighborhood,
  metrics,
  localType,
  localSize,
  setLocalType,
  setLocalSize,
}: {
  open: boolean;
  onClose: () => void;
  neighborhood: Neighborhood | null;
  metrics: ReturnType<typeof computeMetrics> | null;
  localType: PropertyType;
  localSize: SizeType;
  setLocalType: (v: PropertyType) => void;
  setLocalSize: (v: SizeType) => void;
}) {
  const thermal = metrics?.thermal ?? "even";
  const badgeBg =
    thermal === "hot"
      ? "var(--hot-fill)"
      : thermal === "cold"
        ? "var(--cold-fill)"
        : "var(--even-fill)";
  const badgeColor =
    thermal === "hot"
      ? "var(--hot-stroke)"
      : thermal === "cold"
        ? "var(--cold-stroke)"
        : "var(--even-stroke)";

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close panel"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-primary/10 backdrop-blur-[2px] transition-opacity animate-fade-in"
        />
      )}
      <aside
        aria-hidden={!open}
        className={`fixed inset-x-0 bottom-0 z-50 mx-auto max-w-3xl rounded-t-[28px] border border-border/70 bg-card shadow-[0_-20px_60px_-20px_rgba(15,23,42,0.25)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ height: "34vh", minHeight: 340 }}
      >
        <div className="flex items-center justify-center pt-2.5">
          <span className="h-1.5 w-10 rounded-full bg-border" />
        </div>

        {neighborhood && metrics && (
          <div className="flex h-[calc(100%-1.25rem)] flex-col px-5 pb-5 pt-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-primary">
                  {neighborhood.name}
                </h2>
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

            {/* Local filters */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Segmented
                size="sm"
                options={["All", "Condo", "Co-op", "TH"] as const}
                value={localType}
                onChange={setLocalType}
              />
              <Segmented
                size="sm"
                options={["All", "1 Bed", "2 Bed", "3 Bed"] as const}
                value={localSize}
                onChange={setLocalSize}
              />
            </div>

            {/* Metrics 2x2 */}
            <div className="mt-4 grid flex-1 grid-cols-2 gap-2.5">
              <Metric label="Supply" value={`${metrics.supply}`} unit="mo" />
              <Metric label="Avg DOM" value={`${metrics.dom}`} unit="days" />
              <Metric
                label="Avg Price / sqft"
                value={`$${metrics.ppsf.toLocaleString()}`}
              />
              <Metric label="In Contract" value={`${metrics.inContract}`} />
            </div>

            <LeadCapture neighborhoodName={neighborhood.name} />

            <button
              type="button"
              className="mt-3 w-full rounded-full bg-primary py-3.5 text-sm font-semibold tracking-[0.08em] text-primary-foreground transition-transform hover:scale-[1.01] active:scale-[0.99]"
            >
              SEE LISTINGS
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

function Metric({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="flex flex-col justify-between rounded-2xl bg-secondary/70 p-3.5">
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
