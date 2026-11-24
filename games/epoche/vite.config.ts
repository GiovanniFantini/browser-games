import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  base: "./",
  resolve: {
    alias: Object.fromEntries(
      ["engine", "content", "ui", "worker"].map((name) => [
        "@" + name,
        fileURLToPath(new URL("./src/" + name, import.meta.url)),
      ]),
    ),
  },
  test: { environment: "node" },
});
