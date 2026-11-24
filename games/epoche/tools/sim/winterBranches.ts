import { loadCampaignContent } from "@content/campaign/index";
import { eventsById } from "@content/campaign/definitions";
import { runCampaign } from "./campaign";
import type { Campaign } from "@engine/campaign/model";
import { responsesFor } from "@engine/campaign/events";
import { applyCampaignAction } from "@engine/campaign/campaign";
const content = loadCampaignContent("rapid");
const start = Number(process.argv[2] ?? 101);
const end = Number(process.argv[3] ?? 200);
for (let seed = start; seed <= end; seed++)
  for (const route of [0, 1] as const) {
    const winter: Campaign[] = [];
    runCampaign(content, seed, "prudence", 25000, "rapid", {
      rules: "winterStudy",
      route,
      response: (["first","random","cautious","foresight"] as const)[(seed+route)%4]!,
      extended: false,
      onDecision(state) {
        if (state.pending?.id === "winter" && !winter.length)
          winter.push(state);
      },
    });
    const state = winter[0];
    if (!state) {
      console.log(JSON.stringify({ seed, route, missing: true }));
      continue;
    }
    for (const option of responsesFor(
      state,
      eventsById.get("winter")!,
      content.attributes,
    )) {
      if (option.cost > state.core.influence) continue;
      const initial = applyCampaignAction(
        state,
        { type: "RESPOND", choice: option.choice },
        content,
      );
      for (const response of ["cautious", "foresight", "first"] as const) {
        const { current, remediesUsed } = runCampaign(
          content,
          seed,
          "prudence",
          25000,
          "rapid",
          { route, response, extended: false, initial },
        );
        console.log(
          JSON.stringify({
            seed,
            route,
            tick: state.core.tick,
            choice: option.choice,
            response,
            finished: current.studyFinished,
            ending:
              current.outcome?.kind ??
              (current.studyFinished ? "ledger" : "open"),
            population: current.core.population,
            crisis: current.crises.reduce((n, c) => n + c.severity, 0),
            heritage: current.heritage.length + Number(!!current.marks.table),
            remediesUsed,
          }),
        );
      }
    }
  }
