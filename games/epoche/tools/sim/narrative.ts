import {
  campaignEras,
  campaignTiming,
  events,
} from "@content/campaign/definitions";
import { loadCampaignContent } from "@content/campaign/index";
import type { Pace } from "@engine/campaign/model";
import { runCampaign } from "./campaign";

type Trajectory = {
  kind: "trajectory";
  pace: Pace;
  seed: number;
  route: 0 | 1;
  extended: boolean;
  ending: string;
  tick: number;
  finalEra: string;
  arrivals: { era: string; tick: number }[];
  encountered: ReturnType<typeof runCampaign>["encounters"];
};

const pace: Pace = process.argv.includes("--standard") ? "standard" : "rapid";
const extended = process.argv.includes("--coverage");
const start = Number(process.argv[2] ?? 1);
const count = Number(process.argv[3] ?? 10);
if (
  !Number.isInteger(start) ||
  start < 1 ||
  !Number.isInteger(count) ||
  count < 1
)
  throw new Error("Expected positive first seed and number of seeds");
const scale = campaignTiming(pace).tickScale;
const content = loadCampaignContent(pace);
const rows: Trajectory[] = [];
for (let seed = start; seed < start + count; seed++) {
  for (const route of [0, 1] as const) {
    const run = runCampaign(content, seed, "prudence", 25_000 * scale, pace, {
      route,
      extended,
    });
    const row: Trajectory = {
      kind: "trajectory",
      pace,
      seed,
      route,
      extended,
      ending: run.current.outcome?.kind ?? "open",
      tick: run.current.core.tick,
      finalEra: run.current.core.eraId,
      arrivals: run.arrived.map(({ core }) => ({ era: core.eraId, tick: core.tick })),
      encountered: run.encounters,
    };
    rows.push(row);
    console.log(JSON.stringify(row));
  }
}

const catalog = new Set(
  rows.flatMap(({ encountered }) =>
    Object.values(encountered).flatMap(({ opened }) => opened),
  ),
);
const missing = events.filter(({ id }) => !catalog.has(id)).map(({ id }) => id);
const eraSummary = campaignEras.map(({ id }) => {
  const eras = rows.map(({ encountered }) => encountered[id]);
  return {
    id,
    minDistinct: Math.min(
      ...eras.map((history) => history?.opened.length ?? 0),
    ),
    withFollowUp: eras.filter((history) => history?.followUps.length).length,
    choseFollowUp: eras.filter((history) => history?.chosen.length).length,
  };
});
const completed = rows.filter(
  ({ ending }) => ending === "transcendence",
).length;
console.log(
  JSON.stringify({
    kind: "summary",
    pace,
    extended,
    rows: rows.length,
    completed,
    catalog: catalog.size,
    missing,
    eras: eraSummary,
  }),
);
if (
  !extended &&
  (completed !== rows.length ||
    eraSummary.some(
      ({ minDistinct, withFollowUp }) =>
        minDistinct < 2 || withFollowUp * 2 < rows.length,
    ))
)
  process.exitCode = 1;
