import { createRng } from "@engine/core/rng";
import {
  jobs,
  initial,
  options,
  resolve,
  type Order,
  type Turn,
  type Village,
} from "../../src/valley/game";
const strategies = [
  "first",
  "random",
  "cautious",
  "foresight",
  "fixed",
] as const;
type Strategy = (typeof strategies)[number];
function choose(
  v: Village,
  strategy: Strategy,
  rng: ReturnType<typeof createRng>,
): Turn {
  const moves: Turn[] = options(v).flatMap((order) =>
    jobs(v, order).map((job) => ({ order, job, deliver: job === "trade" })),
  );
  if (strategy === "fixed") {
    const plan = [
      ["shelter", "gather"],
      ["forage", "gather"],
      ["private", "gather"],
      ["warm", "gather"],
      ["sow", "together"],
    ] as const;
    const pair = plan[v.season]!;
    const move = moves.find((m) => m.order === pair[0] && m.job === pair[1]);
    if (!move) throw Error("Fixed plan became illegal");
    return move;
  }
  if (strategy === "first") return moves[0]!;
  if (strategy === "random") return moves[rng.int(0, moves.length - 1)]!;
  const preferred: Order[][] =
    strategy === "foresight"
      ? [
          [v.cloudy ? "haul" : "shelter"],
          ["pledge", "forage"],
          ["common", "private", "glean"],
          [v.host ? "fell" : "warm", "fell", "eat"],
          ["sow", "cross", "stay"],
        ]
      : [
          ["shelter"],
          ["forage", "pledge"],
          ["private"],
          ["warm", "fell", "eat"],
          ["sow", "cross", "stay"],
        ];
  for (const order of preferred[v.season] ?? []) {
    const pool = moves.filter((m) => m.order === order);
    const want =
      strategy === "foresight"
        ? ["trade", "shelterGuest", "mend", "gather", "together"]
        : ["gather", "guard", "together"];
    const best =
      want.map((j) => pool.find((m) => m.job === j)).find(Boolean) ?? pool[0];
    if (best) return best;
  }
  return moves[0]!;
}
const results: Record<string, Record<string, number>> = {};
for (const strategy of strategies) {
  const counts: Record<string, number> = {};
  results[strategy] = counts;
  for (let seed = 1; seed <= 25; seed++)
    for (let route = 0; route < 2; route++) {
      // Two reproducible river conditions per historical seed; the legacy engine has different geography.
      let v = initial(seed * 2 + route);
      const rng = createRng(0x51ac87 ^ v.seed);
      while (!v.ending) v = resolve(v, choose(v, strategy, rng));
      counts[v.ending] = (counts[v.ending] ?? 0) + 1;
    }
}
console.log(JSON.stringify(results, null, 2));
