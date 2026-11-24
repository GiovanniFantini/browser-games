import { expect, it } from "vitest";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { claimHoldout } from "../tools/sim/holdout";
it("requires matching frozen inputs and claims the interval only once", () => {
  const temp = mkdtempSync(join(tmpdir(),"epoche-holdout-"));
  try {
    const manifest = join(temp,"manifest.json"), mark = join(temp,"used"), rules = join(temp,"rules");
    const open = (path?: string) => claimHoldout(51,52,path,mark,[51,52]);
    expect(() => open()).toThrow();
    writeFileSync(manifest,JSON.stringify({start:51,end:52,files:{[rules]:createHash("sha256").update("rules").digest("hex")}}));
    writeFileSync(rules,"changed");
    expect(() => open(manifest)).toThrow();
    writeFileSync(rules,"rules");
    open(manifest);
    expect(() => open(manifest)).toThrow();
  } finally {rmSync(temp,{recursive:true,force:true});}
});
