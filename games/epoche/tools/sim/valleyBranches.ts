import assert from "node:assert/strict";
import {
  initial,
  jobs,
  options,
  resolve,
  type Order,
  type Job,
  type Village,
} from "../../src/valley/game";

type Plan = readonly (readonly [Order, Job])[];
function run(seed: number, plan: Plan) {
  let v = initial(seed);
  for (const [order, job] of plan)
    v = resolve(v, { order, job, deliver: job === "trade" });
  return v;
}
function detail(v: Village) {
  return {
    flood: v.flood,
    wood: v.wood,
    food: v.food,
    seed: v.grain,
    home: v.repaired,
    guest: v.host,
    promise: v.trust,
    ending: v.ending,
    available: options(v),
  };
}
function finalists(seed: number) {
  const leaves: { path: string; v: Village; score: number[] }[] = [];
  function visit(v: Village, path: string[]) {
    if (v.ending) {
      const score = [Number(v.host), Number(v.trust === "kept")];
      if (v.flood === "high") score.push(Number(v.repaired));
      leaves.push({ path: path.join("/"), v, score });
      return;
    }
    for (const order of options(v))
      for (const job of jobs(v, order))
        visit(resolve(v, { order, job, deliver: job === "trade" }), [
          ...path,
          order + "." + job,
        ]);
  }
  visit(initial(seed), []);
  const harvests = leaves.filter((r) => r.v.ending === "harvest");
  const frontier = harvests.filter(
    (a) =>
      !harvests.some(
        (b) =>
          b.score.every((n, i) => n >= a.score[i]!) &&
          b.score.some((n, i) => n > a.score[i]!),
      ),
  );
  return { leaves, frontier: new Set(frontier.map((x) => x.path)) };
}
const evidence = [];
const grouped: { seed: number; frontier: Set<string> }[][] = [[], []];
for (let seed = 2; seed <= 51; seed++) {
  const { leaves, frontier } = finalists(seed);
  const high = leaves[0]!.v.flood === "high";
  grouped[Number(high)]!.push({ seed, frontier });
  if (high) {
    assert(
      leaves.some((x) => x.v.ending === "harvest" && x.v.trust === "kept"),
    );
    assert(
      leaves.some((x) => x.v.ending === "harvest" && x.v.host && x.v.repaired),
    );
    assert(
      leaves.some(
        (x) => x.v.ending === "migration" && x.v.trust === "kept" && x.v.host,
      ),
    );
  }
}
let pairs = 0;
for (const a of grouped[0]!)
  for (const b of grouped[1]!) {
    pairs++;
    assert(
      ![...a.frontier].some((p) => b.frontier.has(p)),
      "Fixed plan unsurpassed in both floods",
    );
  }
for (const seed of [1, 2]) {
  const prep = [
    ["shelter", "guard"],
    ["pledge", "mend"],
  ] as const;
  const high = run(seed, [["haul", "together"]]).flood === "high";
  const common = run(seed, [
    ...prep,
    ["common", "trade"],
    ["fell", "shelterGuest"],
  ]);
  const house = run(seed, [...prep, ["private", "gather"], ["warm", "gather"]]);
  evidence.push({
    seed,
    histories: finalists(seed).leaves.length,
    openings: {
      terrace: detail(run(seed, [["haul", "together"]])),
      bank: detail(run(seed, [["shelter", "gather"]])),
      watch: detail(run(seed, [["shelter", "guard"]])),
    },
    kept: detail(common),
    private: detail(house),
    ...(high
      ? {
          roofInstead: detail(
            run(seed, [...prep, ["common", "mend"], ["fell", "shelterGuest"]]),
          ),
        }
      : {}),
  });
}
console.log(
  JSON.stringify(
    {
      pairs,
      fixedPlansUnsurpassedInBoth: 0,
      objectives: ["guest", "kept promise", "repaired roof only in high flood"],
      evidence,
    },
    null,
    2,
  ),
);
