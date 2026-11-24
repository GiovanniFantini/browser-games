import { expect, it } from "vitest";
import { loadContent } from "@content/index";
import { hashState } from "@engine/core/hash";
import { replaySeeds, runReplay } from "../tools/sim/replay";
import { checkBalance } from "../tools/sim/verification";
import expected from "./determinism.snapshot.json";

it.each(replaySeeds)(
  "replays seed %s with the expected hash and identical histories",
  (seed) => {
    const content = loadContent();
    const first = runReplay(content, seed);
    const second = runReplay(content, seed);
    expect(hashState(first)).toBe(expected[seed]);
    expect(hashState(second)).toBe(hashState(first));
    expect(second.attributes).toEqual(first.attributes);
  },
);

it("detects a balance change in a deterministic replay", () => {
  const content = loadContent();
  const perturbed = loadContent({
    ...content,
    attributes: content.attributes.map((attribute) =>
      attribute.id === "environment" ? { ...attribute, base: 16 } : attribute,
    ),
  });
  expect(hashState(runReplay(perturbed, 1))).not.toBe(expected[1]);
});

it("detects loss of the population feedback from the balance check", () => {
  const content = loadContent();
  const perturbed = loadContent({
    ...content,
    influences: content.influences.map((entry) =>
      entry.mode === "aboveThreshold" ? { ...entry, weight: 0 } : entry,
    ),
  });
  expect(checkBalance(perturbed, 1)).toContain(
    "growth / 1: nessun attributo esce dalla zona sana",
  );
});
