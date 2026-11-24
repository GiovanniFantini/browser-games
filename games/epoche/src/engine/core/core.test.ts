import { describe, expect, it } from "vitest";
import { CommandQueue } from "./commands";
import { hashState, stableStringify } from "./hash";
import { clamp, lerp, moveTowards } from "./math";
import { createRng, restoreRng } from "./rng";
import { formatYear, yearsPerTick } from "./time";

describe("engine primitives", () => {
  it("replays a random sequence and restores its state", () => {
    const sequence = (seed: number) => {
      const rng = createRng(seed);
      return Array.from({ length: 10_000 }, () => rng.next());
    };
    expect(sequence(21)).toEqual(sequence(21));
    expect(sequence(21)).not.toEqual(sequence(22));
    const rng = createRng(12);
    rng.next();
    expect(restoreRng(rng.getState()).next()).toBe(rng.next());
    expect(
      new Set(Array.from({ length: 10_000 }, () => rng.int(1, 6))),
    ).toEqual(new Set([1, 2, 3, 4, 5, 6]));
  });

  it("hashes stable JSON with the stated precision and excludes history", () => {
    expect(stableStringify({ z: { b: 2, a: 1 }, y: 3 })).toBe(
      '{"y":3,"z":{"a":1,"b":2}}',
    );
    expect(hashState({ y: 5, x: 0.1234561, history: [1] })).toBe(
      hashState({ x: 0.1234562, y: 5, history: [2] }),
    );
    expect(hashState({ y: 5 })).not.toBe(hashState({ y: 6 }));
  });

  it("takes due commands in arrival order once", () => {
    const queue = new CommandQueue();
    queue.enqueue({ type: "SET_SPEED", speed: 4, tick: 3 });
    queue.enqueue({ type: "SET_SPEED", speed: 1, tick: 1 });
    queue.enqueue({ type: "SET_SPEED", speed: 0, tick: 2 });
    expect(queue.takeForTick(2).map(({ tick }) => tick)).toEqual([1, 2]);
    expect(queue.takeForTick(3).map(({ tick }) => tick)).toEqual([3]);
    expect(queue.takeForTick(3)).toEqual([]);
  });

  it("uses fixed historical time and math bounds", () => {
    expect(yearsPerTick(200)).toBe(1 / 3);
    expect(formatYear(-299999.75)).toEqual({ value: 300000, era: "BCE" });
    expect(formatYear(0)).toEqual({ value: 1, era: "CE" });
    expect(clamp(-2, 0, 6)).toBe(0);
    expect(lerp(3, 7, 0.25)).toBe(4);
    expect(moveTowards(2, 7, 10)).toBe(7);
    expect(moveTowards(7, 2, 1)).toBe(6);
  });
});
