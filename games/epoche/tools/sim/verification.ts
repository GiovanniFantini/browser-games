import type { ContentBundle } from "@content/schema";
import { simulate } from "./simulate";

export function checkBalance(content: ContentBundle, seeds = 5): string[] {
  const failures: string[] = [];
  for (let seed = 1; seed <= seeds; seed++) {
    const idle = simulate(content, 1000, seed, "idle");
    const growth = simulate(content, 3000, seed, "growth");
    for (const [name, run] of [
      ["idle", idle],
      ["growth", growth],
    ] as const) {
      if (run.invalid) failures.push(name + " / " + seed + ": " + run.invalid);
    }
    if (
      idle.attributes.filter((attribute) => attribute.outsideAtEnd).length >
      idle.attributes.filter((attribute) => attribute.active).length / 2
    ) {
      failures.push(
        "idle / " + seed + ": più della metà degli attributi è fuori zona",
      );
    }
    if (!growth.attributes.some((attribute) => attribute.outsidePercent > 0)) {
      failures.push(
        "growth / " + seed + ": nessun attributo esce dalla zona sana",
      );
    }
  }
  return failures;
}
