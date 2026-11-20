import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const files = [];
async function scan(directory) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) await scan(full);
    else {
      const bytes = await fs.readFile(full);
      files.push({
        path: path.relative(dist, full).replaceAll("\\", "/"),
        bytes: bytes.length,
        sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
      });
    }
  }
}
await scan(dist);
assert.ok(files.some((f) => f.path === "index.html"));
assert.ok(files.some((f) => /\.js$/.test(f.path)));
assert.ok(files.some((f) => /\.css$/.test(f.path)));
assert.equal(
  files.filter((f) => /\.png$/.test(f.path)).length,
  62,
  "Release selects18 map/tower resources,36 normal-enemy cutouts,5 boss limbs/tail and1 two-part boss atlas, plus2 character portraits",
);
assert.equal(files.filter((file) => file.path.endsWith(".mp3")).length, 3);
assert.ok(
  files.every(
    (f) => !/(art-source|docs|node_modules|review|\.map$|\.ts$)/.test(f.path),
  ),
  "Authoring/private/source files leaked into dist",
);
const html = await fs.readFile(path.join(dist, "index.html"), "utf8");
for (const file of files.filter((file) => file.path.endsWith(".js")))
  assert.ok(
    !(await fs.readFile(path.join(dist, file.path), "utf8")).match(
      /__bossFixtureSession|__profileResetFixtureSession|__audioFinaleSession|Mp3Encoder|lamejs/,
    ),
    "Test-only UI hook leaked into build",
  );
for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
  const target = match[1];
  if (target.startsWith("data:") || target === "./") continue;
  assert.ok(target.startsWith("./"), "Build paths must be relative: " + target);
  assert.ok(
    files.some((f) => f.path === target.slice(2)),
    "Missing built asset: " + target,
  );
}
const totalBytes = files.reduce((n, f) => n + f.bytes, 0);
assert.ok(
  totalBytes < 32 * 1024 * 1024,
  "Task47 unexpectedly contains more than its selected map and token resources",
);
const report = {
  status: "complete",
  scope:
    "Static artifact integrity only, not game performance or first-load timing.",
  files,
  totalBytes,
  relativeBase: true,
  authoringExcluded: true,
};
const reportPath = path.resolve(
  root,
  process.argv[2] || "docs/review/task-48-build-verification.json",
);
await fs.mkdir(path.dirname(reportPath), { recursive: true });
await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
console.log(
  JSON.stringify({
    files: files.length,
    totalBytes,
    relativeBase: true,
    authoringExcluded: true,
  }),
);
