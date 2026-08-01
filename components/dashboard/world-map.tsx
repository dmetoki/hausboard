"use client";

import { useMemo, useState, type MouseEvent } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { statusColorFromScore } from "@/lib/utils";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Antarctica has no mentions data and no reason to take up a third of the
// map's vertical space — excluded from render entirely.
const ANTARCTICA_ID = "010";

// The US feature's geometry includes Hawaii as a disjoint polygon far out in
// the Pacific — it drags the visible frame west for one small island chain
// with no added value here, so it's stripped from the US MultiPolygon below.
const US_ID = "840";
const HAWAII_BOUNDS = { minLng: -161, maxLng: -154, minLat: 18, maxLat: 23 };

function isInHawaii([lng, lat]: [number, number]) {
  return (
    lng >= HAWAII_BOUNDS.minLng &&
    lng <= HAWAII_BOUNDS.maxLng &&
    lat >= HAWAII_BOUNDS.minLat &&
    lat <= HAWAII_BOUNDS.maxLat
  );
}

// `<Geography>` doesn't compute its own path from the object it's given —
// it renders a pre-baked `svgPath` string that `Geographies` computes once,
// before any of this filtering runs. Editing `.geometry` alone leaves that
// stale path (and the Hawaii-shaped hole in it) untouched, so `svgPath` has
// to be regenerated here too, using the same path generator.
function excludeHawaii<
  T extends {
    id: string;
    geometry?: { type: string; coordinates: number[][][][] };
    svgPath?: string;
  },
>(geo: T, path: (geo: T) => string | null): T {
  if (geo.id !== US_ID || geo.geometry?.type !== "MultiPolygon") return geo;
  const updated: T = {
    ...geo,
    geometry: {
      ...geo.geometry,
      coordinates: geo.geometry.coordinates.filter(
        (polygon) => !polygon[0].every((point) => isInHawaii(point as [number, number])),
      ),
    },
  };
  return { ...updated, svgPath: path(updated) ?? undefined };
}

// The projection itself is computed for a fixed 800x400 frame (the library's
// translate/center math is keyed off these exact dimensions) — changing them
// re-centers the projection and can clip real geometry (e.g. Argentina's
// southern tip) rather than just trimming empty space. At this scale/center,
// land (incl. Hawaii-stripped US) spans roughly y:[4, 354], leaving a mostly
// empty ocean band below — VISIBLE_HEIGHT below crops the *rendered* view to
// that content instead of changing the projection.
const MAP_WIDTH = 800;
const MAP_HEIGHT = 400;
const VISIBLE_HEIGHT = 365;

export type CountryValue = {
  /** ISO 3166-1 numeric country code as a string, e.g. "840" for the US —
   * matches the `id` field on each feature in the world-atlas topology. */
  id: string;
  label: string;
  /** Drives the fill color — a diverging status scale, not a magnitude:
   * negative → the negative color, zero → neutral, positive → the positive
   * color. Only the sign matters, not how far from zero. */
  score: number;
  /** Raw mention count for this country — shown in the hover tooltip, plays
   * no part in color. */
  mentions: number;
};

type HoverState = { label: string; mentions: number; x: number; y: number };

export function WorldMap({ data }: { data: CountryValue[] }) {
  const [hover, setHover] = useState<HoverState | null>(null);
  const byId = useMemo(() => new Map(data.map((d) => [d.id, d])), [data]);

  function handleMove(event: MouseEvent<SVGPathElement>, entry?: CountryValue) {
    if (!entry) return;
    const rect = event.currentTarget.ownerSVGElement?.getBoundingClientRect();
    if (!rect) return;
    setHover({
      label: entry.label,
      mentions: entry.mentions,
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  }

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ aspectRatio: `${MAP_WIDTH} / ${VISIBLE_HEIGHT}` }}
    >
      <ComposableMap
        width={MAP_WIDTH}
        height={MAP_HEIGHT}
        projectionConfig={{ scale: 150 }}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: `${(MAP_HEIGHT / VISIBLE_HEIGHT) * 100}%`,
        }}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies, path }) =>
            geographies
              .filter((geo) => geo.id !== ANTARCTICA_ID)
              .map((geo) => excludeHawaii(geo, path))
              .map((geo) => {
                const entry = byId.get(geo.id);
                const fill = entry ? `var(${statusColorFromScore(entry.score)})` : "var(--muted)";
                const hoverFill = entry
                  ? `color-mix(in oklab, ${fill} 75%, var(--foreground) 25%)`
                  : "var(--muted)";

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={fill}
                    stroke="var(--card)"
                    strokeWidth={0.5}
                    onMouseMove={(event) => handleMove(event, entry)}
                    onMouseLeave={() => setHover(null)}
                    style={{
                      default: { outline: "none", cursor: entry ? "pointer" : "default" },
                      hover: { outline: "none", fill: hoverFill, cursor: entry ? "pointer" : "default" },
                      pressed: { outline: "none", cursor: entry ? "pointer" : "default" },
                    }}
                  />
                );
              })
          }
        </Geographies>
      </ComposableMap>
      {hover && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md border border-border bg-popover px-2.5 py-1.5 text-[11px] shadow-md"
          style={{ left: hover.x, top: hover.y - 8 }}
        >
          <div className="font-medium text-popover-foreground">{hover.label}</div>
          <div className="text-muted-foreground">{hover.mentions.toLocaleString()} mentions</div>
        </div>
      )}
    </div>
  );
}
