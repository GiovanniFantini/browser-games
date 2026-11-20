import forest from "../../docs/livelli/dino-01.json";
import river from "../../docs/livelli/dino-02.json";
import swamp from "../../docs/livelli/dino-03.json";
import plateau from "../../docs/livelli/dino-04.json";
import rift from "../../docs/livelli/dino-05.json";
import towerData from "../../docs/dati-torri.json";
import forestUrl from "../../art-source/maps/foresta/fondale-v1.png?url";
import riverUrl from "../../art-source/maps/fiume/fondale-v2.png?url";
import swampUrl from "../../art-source/maps/palude/fondale-v1.png?url";
import plateauUrl from "../../art-source/maps/altopiano/fondale-v2.png?url";
import riftUrl from "../../art-source/maps/frattura/fondale-v5.png?url";
import resinUrl from "../../art-source/ui/assets/tower-resina.png?url";
import sporesUrl from "../../art-source/ui/assets/tower-spore.png?url";
import nestUrl from "../../art-source/ui/assets/tower-nido.png?url";
import rockUrl from "../../art-source/ui/assets/tower-roccia.png?url";
import type { Point } from "./geometry";
import type { BossRequirement,WaveDefinition } from "../waves/types";
import { compilePath } from "../movement/path";
import type { WaterSegment } from "../enemies/terrain";

export type Family = "resina" | "spore" | "nido" | "roccia";
export interface Slot extends Point {
  readonly id: string;
}
export interface Route {
  readonly id: string;
  readonly name: string;
  readonly points: readonly Point[];
  readonly traceDash: boolean;
  readonly shortcut: boolean;
  readonly allowedEnemies: readonly string[] | null;
}
export interface Entry extends Point {
  readonly id: string;
}
export interface FieldMap {
  readonly id: string;
  readonly name: string;
  readonly background: string;
  readonly description: string;
  readonly slots: readonly Slot[];
  readonly routes: readonly Route[];
  readonly routeLegend: string;
  readonly portalLabelOffset: Point;
  readonly entries: readonly Entry[];
  readonly budget: number;
  readonly firstEntryTowers: readonly string[];
  readonly stability: number;
  readonly waves: readonly WaveDefinition[];
  readonly bossRequirement?: BossRequirement;
  readonly waterSegment?: WaterSegment;
  readonly landmarks?: readonly (Point & {readonly id:string})[];
}
interface RawPath {
  id: string;
  name?: string;
  knots?: number[][];
  sections?: number[][][];
  stepsPerSegment?: number;
  traceDash?: boolean;
  shortcut?: boolean;
  allowedEnemies?: string[];
}
interface RawMap {
  id: string;
  name: string;
  width: number;
  height: number;
  slots: Slot[];
  paths: RawPath[];
  canvasDescription?: string;
  portalLabelOffset?: Point;
  routeLegend?: string;
  entries?: Entry[];
  budget: number;
  firstEntryTowers: string[];
  stability: number;
  waves: WaveDefinition[];
  bossRequirement?: BossRequirement;
  waterSegment?: {path:string;from:number[];to:number[]};
  markers?: (Point & {id:string})[];
}
function sample(path: RawPath): readonly Point[] {
  const result: Point[] = [];
  for (const knots of path.sections ?? [path.knots ?? []]) {
    if (knots.length < 2)
      throw new Error("A field path needs at least two knots.");
    const at = (index: number, axis: number): number => {
      const value =
        knots[Math.max(0, Math.min(knots.length - 1, index))]?.[axis];
      if (value === undefined || !Number.isFinite(value))
        throw new Error("Invalid path coordinate.");
      return value;
    };
    const steps = path.stepsPerSegment ?? 50;
    for (let i = 0; i < knots.length - 1; i++)
      for (let j = 0; j < steps; j++) {
        const t = j / steps;
        const axis = (k: number): number =>
          0.5 *
          (2 * at(i, k) +
            (-at(i - 1, k) + at(i + 1, k)) * t +
            (2 * at(i - 1, k) -
              5 * at(i, k) +
              4 * at(i + 1, k) -
              at(i + 2, k)) *
              t *
              t +
            (-at(i - 1, k) + 3 * at(i, k) - 3 * at(i + 1, k) + at(i + 2, k)) *
              t *
              t *
              t);
        result.push({ x: axis(0), y: axis(1) });
      }
    result.push({ x: at(knots.length - 1, 0), y: at(knots.length - 1, 1) });
  }
  return result.filter(
    (p, i) => i === 0 || p.x !== result[i - 1]?.x || p.y !== result[i - 1]?.y,
  );
}
function adapt(raw: RawMap, background: string): FieldMap {
  if (raw.width !== 1536 || raw.height !== 1024)
    throw new Error("Unexpected field dimensions.");
  if (new Set(raw.slots.map((s) => s.id)).size !== raw.slots.length)
    throw new Error("Duplicate slot ID.");
  const routes = raw.paths.map((p) => ({
    id: p.id,
    name: p.name ?? "Sentiero principale",
    points: sample(p),
    traceDash: p.traceDash === true,
    shortcut: p.shortcut === true,
    allowedEnemies: p.allowedEnemies ?? null,
  }));
  const starts = routes
    .map((r) => r.points[0])
    .filter((p): p is Point => Boolean(p))
    .filter(
      (p, i, all) => !all.slice(0, i).some((q) => p.x === q.x && p.y === q.y),
    );
  const entries =
    raw.entries ??
    starts.map((p, i) => ({
      ...p,
      id: starts.length === 1 ? "I" : "I" + (i + 1),
    }));
  let waterSegment:WaterSegment|undefined;
  if(raw.waterSegment){
    const source=raw.waterSegment,route=routes.find(route=>route.id===source.path);
    if(!route)throw new Error("Missing water route");
    const path=compilePath(route.id,route.points);
    const boundary=(point:number[]):number=>{
      const index=path.points.findIndex(p=>Math.hypot(p.x-point[0]!,p.y-point[1]!)<.01);
      if(index<0)throw new Error("Water boundary must be on its declared path");return path.cumulative[index]!;
    };
    waterSegment={path:source.path,from:boundary(source.from),to:boundary(source.to)};
    if(waterSegment.to<=waterSegment.from)throw new Error("Reversed water interval");
  }
  return {
    id: raw.id,
    name: raw.name,
    background,
    description:
      raw.canvasDescription ??
      "Foresta con sentiero sinuoso, piazzole rotonde e portale di uscita.",
    slots: raw.slots,
    routes,
    routeLegend: raw.routeLegend
      ? raw.routeLegend.split(". ")[0]!.replace(/[.]+$/, "") + "."
      : routes.map((route) =>
          (route.traceDash || route.shortcut ? "Linea a trattini: " : "Linea continua: ") + route.name,
        ).join(". ") + ".",
    entries,
    portalLabelOffset:raw.portalLabelOffset??{x:36,y:-34},
    budget: raw.budget,
    firstEntryTowers: raw.firstEntryTowers,
    stability: raw.stability,
    waves: raw.waves,
    ...(raw.bossRequirement?{bossRequirement:raw.bossRequirement}:{}),
    ...(waterSegment?{waterSegment}:{}),
    landmarks:[...(raw.markers??[]),...(raw.waterSegment?[{id:"≈1",x:raw.waterSegment.from[0]!,y:raw.waterSegment.from[1]!},{id:"≈2",x:raw.waterSegment.to[0]!,y:raw.waterSegment.to[1]!}]:[])],
  };
}
export const fieldMaps: readonly FieldMap[] = [
  adapt(forest, forestUrl),
  adapt(river, riverUrl),
  adapt(swamp, swampUrl),
  adapt(plateau, plateauUrl),
  adapt(rift, riftUrl),
];
export const families: readonly Family[] = [
  "resina",
  "spore",
  "nido",
  "roccia",
];
export const familyArt: Record<Family, string> = {
  resina: resinUrl,
  spore: sporesUrl,
  nido: nestUrl,
  roccia: rockUrl,
};
export const familyHeight: Record<Family, number> = {
  resina: 180,
  spore: 180,
  nido: 230,
  roccia: 170,
};
export const baseTowers = Object.fromEntries(
  families.map((family) => {
    const node = towerData.nodes.find((n) => n.id === family + "-base");
    if (!node) throw new Error("Missing base tower data: " + family);
    return [family, node];
  }),
) as Record<Family, (typeof towerData.nodes)[number]>;
