import type { ContentBundle } from "@content/schema";
import { CommandQueue, type SetPolicyCommand } from "@engine/core/commands";
import { yearsPerTick } from "@engine/core/time";
import { getEra } from "@engine/state/contentIndex";
import { createNewGame } from "@engine/state/newGame";
import { step } from "@engine/step";

export const replaySeeds = [1, 23, 101] as const;

export function runReplay(content: ContentBundle, seed: number) {
  let state = createNewGame(content, seed);
  const dt = yearsPerTick(getEra(content, state.eraId).yearsPerMinute);
  const queue = new CommandQueue<SetPolicyCommand>();
  const script = [
    ["settlement", 100],
    ["fire", 90],
    ["rites", 80],
    ["subsistence", 20],
    ["fire", 15],
    ["elders", 80],
    ["settlement", 20],
    ["exogamy", 60],
    ["subsistence", 75],
    ["rites", 35],
    ["settlement", 66],
    ["fire", 95],
  ] as const;

  script.forEach(([policyId, value], index) => {
    queue.enqueue({
      type: "SET_POLICY",
      policyId,
      value,
      tick: 1 + index * 350,
    });
  });

  for (let tick = 1; tick <= Math.ceil(3000 / dt); tick++) {
    state = step(state, queue.takeForTick(tick), content).state;
  }
  return state;
}
