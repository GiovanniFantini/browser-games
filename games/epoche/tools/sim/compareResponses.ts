import { claimHoldout } from "./holdout";
import { loadCampaignContent } from "@content/campaign/index";
import assert from "node:assert/strict";
import { appendFileSync, writeFileSync } from "node:fs";
import { responseStrategies, runCampaign, type ResponseStrategy } from "./campaign";

const content = loadCampaignContent("rapid");
const defaults = process.argv.includes("--cautious")
  ? (["cautious"] as const)
  : (["first", "random"] as const);
const arg = (name: string) => process.argv.find(value => value.startsWith("--" + name + "="))?.split("=")[1];
const range = arg("seeds") ?? "1-25";
if (!/^\d+-\d+$/.test(range)) throw new Error("Expected --seeds=start-end");
const [start, end] = range.split("-").map(Number) as [number, number];
if (start < 1 || end < start || end > 4294967295) throw new Error("Invalid or reserved seeds");
const strategies = (arg("strategies")?.split(",") ?? defaults) as readonly ResponseStrategy[];
if (!strategies.every(item => responseStrategies.includes(item))) throw new Error("Unknown strategy");
const routes = (arg("routes") ?? "0,1").split(",");
if (routes.some(route => route !== "0" && route !== "1")) throw new Error("Expected routes 0,1");
const file = arg("output");
claimHoldout(start,end,arg("holdout-manifest"),"artifacts/revisione-gameplay/apertura-1001-1100.json");
if (file) writeFileSync(file, "", {flag:"wx"});
for (let seed = start; seed <= end; seed++) {
  for (const rawRoute of routes) {
    const route = Number(rawRoute) as 0 | 1;
    for (const response of strategies) {
      const run = runCampaign(content, seed, "prudence", 25000, "rapid", {
        route,
        response, rules:process.argv.includes("--remedies")?"winter":"current",
        extended: false,
        withoutDeferredCosts: process.argv.includes("--no-deferred-costs"),
      });
      const arrival = run.arrived.find(campaign => campaign.core.eraId === "future");
      let control;
      if (arrival && process.argv.includes("--heritage")) {
        const replay = runCampaign(content, seed, "prudence", 25000, "rapid", {
          route, response, rules:process.argv.includes("--remedies")?"winter":"current", extended: false, withoutFutureHeritage: true,
        });
        assert.deepEqual(replay.arrived.find(campaign => campaign.core.eraId === "future"), arrival);
        assert.ok(replay.futureDecisions.every(decision => decision.used === null));
        control = {
          ending: replay.current.outcome?.kind ?? "open",
          ticks: replay.current.core.tick,
          population: replay.current.core.population,
        };
      }
      const row = JSON.stringify({
          reachedBronze: run.arrived.some(state => state.core.eraId === "bronze" && !state.outcome),
          remedies:run.remediesUsed,
          seed,
          route,
          response,
          ending: run.current.outcome?.kind ?? "open",
          era: run.current.core.eraId,
          ticks: run.current.core.tick,
          decisions: Object.values(run.encounters).reduce(
            (sum, era) => sum + era.ticks.length,
            0,
          ),
          ...(process.argv.includes("--heritage") ? {
            reachedFuture: !!arrival, inherited: arrival?.heritage ?? [],
            futureDecisions: run.futureDecisions, control: control ?? null,
          } : {}),
          choiceCounts: run.choiceCounts,
          affordableCounts: run.affordableCounts,
          delayedCollapse: run.delayedCollapse,
          cause: run.current.outcome?.kind === "collapse" ? {
            family: run.current.outcome.family,
            lastEntries: run.current.chronicle.slice(-12),
          } : null,
          firstUnavailable: run.firstUnavailable,
          setbacks: run.structural,
          population: run.current.core.population,
          peakCrisis: run.peakCrisis,
        });
      if (file) appendFileSync(file, row + "\n"); else console.log(row);
    }
  }
}
