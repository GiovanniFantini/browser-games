import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const target = path.resolve(root, process.argv[2] || "artifacts/site");
const artifacts = path.join(root, "artifacts");
if (!target.startsWith(artifacts + path.sep))
  throw new Error("Choose a new output directory inside artifacts/.");
await fs.mkdir(artifacts, { recursive: true });
try {
  await fs.access(target);
  throw new Error(
    "Output already exists. Choose another artifacts/ directory to preserve the previous package.",
  );
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
const inventory = JSON.parse(
  await fs.readFile(path.join(root, "release/assets.json"), "utf8"),
);
const forest = inventory.assets.find(
  (asset) => asset.source === "art-source/maps/foresta/fondale-v1.png",
);
for (const asset of inventory.assets) {
  const distributed = await fs.readFile(
    path.join(root, "dist", asset.distributed),
  );
  if (
    crypto.createHash("sha256").update(distributed).digest("hex") !==
    asset.sha256
  )
    throw new Error(
      "Build/inventory mismatch. Rebuild and update the release inventory before packaging: " +
        asset.distributed,
    );
}
const html = (
  await fs.readFile(path.join(root, "release/collection.html"), "utf8")
).replaceAll("{{FOREST_URL}}", "./time-defense/" + forest.distributed);
if (/\{\{/.test(html)) throw new Error("Unresolved collection template");
await fs.mkdir(target);
await fs.cp(path.join(root, "dist"), path.join(target, "time-defense"), {
  recursive: true,
});
await fs.writeFile(path.join(target, "index.html"), html);
console.log(
  JSON.stringify({ site: target, index: "index.html", game: "time-defense/" }),
);
