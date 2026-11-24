import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";

let opened: readonly [number, number] | undefined;
export function checkCampaignSeed(seed: number) {
  if (seed >= 1001 && seed <= 1100 && !(opened && seed >= opened[0] && seed <= opened[1])) {
    throw new Error("Reserved seeds require a frozen manifest");
  }
}
const manifestSchema = z.object({
  start: z.number().int(), end: z.number().int(),
  files: z.record(z.string(), z.string().regex(/^[0-9a-f]{64}$/)),
});
export function claimHoldout(start: number, end: number, manifest: string | undefined,
  receipt: string, reserved: readonly [number, number] = [1001, 1100]) {
  if (end < reserved[0] || start > reserved[1]) return;
  if (start !== reserved[0] || end !== reserved[1] || !manifest) throw new Error("Reserved seeds require a frozen manifest");
  const bytes = readFileSync(manifest);
  const freeze = manifestSchema.parse(JSON.parse(bytes.toString()));
  if (freeze.start !== start || freeze.end !== end || !Object.keys(freeze.files).length) throw new Error("Invalid manifest");
  const hash = (data: Buffer) => createHash("sha256").update(data).digest("hex");
  for (const [path, expected] of Object.entries(freeze.files)) {
    if (hash(readFileSync(resolve(path))) !== expected) throw new Error("Changed since freeze: " + path);
  }
  writeFileSync(receipt, JSON.stringify({start,end,sha256:hash(bytes)}), {flag:"wx"});
  opened = [start,end];
}
