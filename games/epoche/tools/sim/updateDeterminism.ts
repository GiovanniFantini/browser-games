import { writeFileSync } from "node:fs";
import { loadContent } from "@content/index";
import { hashState } from "@engine/core/hash";
import { replaySeeds, runReplay } from "./replay";

const content = loadContent();
const hashes = Object.fromEntries(
  replaySeeds.map((seed) => [seed, hashState(runReplay(content, seed))]),
);
writeFileSync(
  new URL("../../tests/determinism.snapshot.json", import.meta.url),
  JSON.stringify(hashes, null, 2) + "\n",
);
console.log(hashes);
