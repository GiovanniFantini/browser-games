import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { parseArgs } from "node:util";
import { loadContent } from "@content/index";
import { simulate, summarize } from "./simulate";
import { strategyNames, type StrategyName } from "./strategies";

function run(): void {
  const { values } = parseArgs({
    options: {
      years: { type: "string", default: "2000" },
      seeds: { type: "string", default: "20" },
      strategy: { type: "string", default: "idle" },
      json: { type: "string" },
    },
  });
  const years = Number(values.years);
  const seeds = Number(values.seeds);
  const requested = values.strategy;
  const strategy = strategyNames.find(
    (name): name is StrategyName => name === requested,
  );
  if (
    !Number.isFinite(years) ||
    years <= 0 ||
    !Number.isSafeInteger(seeds) ||
    seeds <= 0 ||
    !strategy
  ) {
    throw new Error(
      "Use positive years, an integer seed count and one of " +
        strategyNames.join(", "),
    );
  }

  const started = performance.now();
  const content = loadContent();
  const runs = Array.from({ length: seeds }, (_, index) =>
    simulate(content, years, index + 1, strategy),
  );
  const summary = summarize(runs);
  const seconds = (performance.now() - started) / 1000;
  console.log("Strategia:", strategy, "| Anni:", years, "| Semi:", seeds);
  console.table(
    summary.attributes.map((entry) => ({
      attributo: entry.id,
      attivo: entry.active,
      media: Number(entry.mean.toFixed(2)),
      minimo: Number(entry.min.toFixed(2)),
      massimo: Number(entry.max.toFixed(2)),
      "% tempo fuori zona": Number(entry.outsidePercent.toFixed(2)),
    })),
  );
  console.log(
    "Popolazione media:",
    summary.populationMean.toFixed(2),
    "| Complessità:",
    summary.tierCounts,
  );
  console.log(
    "Comandi rifiutati:",
    summary.rejected,
    "| Durata:",
    seconds.toFixed(2) + " s",
  );
  if (values.json) {
    mkdirSync(dirname(values.json), { recursive: true });
    writeFileSync(
      values.json,
      JSON.stringify(
        { years, seeds, strategy, seconds, summary, runs },
        null,
        2,
      ) + "\n",
    );
  }
  for (const run of runs) {
    if (run.invalid) throw new Error("Seme " + run.seed + ": " + run.invalid);
  }
}

try {
  run();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
