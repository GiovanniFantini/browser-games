import { describe, expect, it } from "vitest";
import {
  jobs,
  initial,
  options,
  replay,
  resolve,
  type Book,
  type Job,
  type Order,
  type Village,
} from "../src/valley/game";
const play = (state: Village, order: Order, job: Job) =>
  resolve(state, { order, job, deliver: job === "trade" });
describe("valley commitments", () => {
  it("predicts both floods without consuming the roll while planning", () => {
    const floods = new Set<string>();
    for (let seed = 0; seed < 50; seed++) {
      const start = initial(seed);
      const high = play(start, "haul", "together"),
        bank = play(start, "shelter", "gather");
      expect(start.flood).toBe("unknown");
      expect(high.wood).toBe(3);
      expect(bank.flood).toBe(high.flood);
      expect(bank.food).toBe(high.food + 2);
      expect(bank.wood).toBe(bank.flood === "high" ? 1 : 3);
      floods.add(bank.flood);
    }
    expect(floods.size).toBe(2);
  });
  it("memory changes permission to cross after the same promise", () => {
    const promise = play(
      play(initial(2), "haul", "together"),
      "pledge",
      "mend",
    );
    const kept = play(promise, "private", "trade"),
      broken = play(promise, "private", "gather");
    expect(kept.cargo).toBe(0);
    expect(kept.wood).toBe(broken.wood - 2);
    expect(options(play(kept, "eat", "gather"))).toContain("cross");
    expect(options(play(broken, "eat", "gather"))).not.toContain("cross");
  });
  it("a guest who ate can sow when a household crew is sick", () => {
    const prep = play(play(initial(2), "haul", "together"), "forage", "gather");
    const common = play(play(prep, "common", "gather"), "fell", "shelterGuest"),
      privateStore = play(play(prep, "private", "gather"), "fell", "gather");
    expect(common.host).toBe(true);
    expect(privateStore.host).toBe(false);
    expect(options(common)).toContain("sow");
    expect(options(privateStore)).not.toContain("sow");
  });
  it("all legal branches finish with non-negative stores and replay identically", () => {
    const endings = new Set<string>();
    function visit(v: Village, b: Book) {
      expect(v.season).toBeLessThanOrEqual(5);
      expect(Math.min(v.food, v.wood, v.grain)).toBeGreaterThanOrEqual(0);
      if (v.ending) {
        endings.add(v.ending);
        expect(replay(b).history.at(-1)).toEqual(v);
        return;
      }
      const moves = options(v);
      expect(moves.length).toBeGreaterThan(0);
      for (const order of moves)
        for (const job of jobs(v, order)) {
          const t = { order, job, deliver: job === "trade" };
          visit(resolve(v, t), { ...b, turns: [...b.turns, t] });
        }
    }
    for (const seed of [1, 2, 3, 4, 5, 6])
      visit(initial(seed), { version: 1, seed, turns: [] });
    expect([...endings].sort()).toEqual(["dispersal", "harvest", "migration"]);
  });
  it("rejects corrupt histories and out of season actions", () => {
    expect(() => replay({ version: 1, seed: -2, turns: [] })).toThrow();
    expect(() =>
      replay({
        version: 1,
        seed: 4,
        turns: [{ order: "sow", deliver: false }],
      }),
    ).toThrow();
    expect(() => play(initial(1), "haul", "trade")).toThrow();
  });
});

it("high water makes repairing the roof and delivering the pledged logs lead to different spring destinations", () => {
  function route(trade: boolean) {
    let v = initial(1);
    for (const [order, job] of [
      ["shelter", "guard"],
      ["pledge", "mend"],
      ["common", trade ? "trade" : "mend"],
      ["fell", "shelterGuest"],
    ] as const) {
      v = resolve(v, { order, job, deliver: job === "trade" });
    }
    return v;
  }
  const kept = route(true),
    broken = route(false);
  expect(options(kept)).toEqual(["cross"]);
  expect(options(broken)).toEqual(["sow"]);
  expect(kept.trust).toBe("kept");
  expect(broken.repaired).toBe(true);
});
it("the same wet winter leaves household seed dry and unroofed common seed spoiled", () => {
  for (const [depot, result] of [
    ["common", "stay"],
    ["private", "sow"],
  ] as const) {
    let v = initial(1);
    for (const [order, job] of [
      ["shelter", "gather"],
      ["forage", "mend"],
      [depot, "gather"],
      ["warm", "gather"],
    ] as const)
      v = resolve(v, { order, job, deliver: false });
    expect(options(v)).toEqual([result]);
  }
});
