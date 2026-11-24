import {
  campaignBalance,
  campaignEras,
  campaignTiming,
} from "@content/campaign/definitions";
import type { GameState } from "../state/gameState";
import type { Pace } from "./model";

type Reform = readonly [policy: string, direction: "left" | "right"];
type Route = readonly Reform[];

export const reformRoutes = (stage: number): readonly Route[] =>
  campaignEras[stage]?.reformRoutes ?? [];

export function eraRequirements(core: GameState, pace: Pace, stage: number) {
  const era = campaignEras[stage]!;
  return [
    {
      key: "campaign.wait",
      value: core.tick - (core.eraOrigin?.tick ?? 0),
      target: era.minTicks * campaignTiming(pace).tickScale,
    },
    {
      key: "resource.population",
      value: core.population,
      target: era.requiredPopulation,
    },
    {
      key: "attribute.knowledge",
      value: core.attributes.knowledge?.value ?? 0,
      target: era.knowledge,
    },
  ];
}

export function reformRequirements(core: GameState, stage: number) {
  return reformRoutes(stage).map((route) =>
    route.map(([id, direction]) => {
      const effective = core.policies[id]?.effective ?? 50;
      const { reformThreshold } = campaignBalance;
      return {
        policyId: id,
        key: "policy." + id + "." + direction,
        setting: core.policies[id]?.target ?? 50,
        value: effective,
        target: direction === "right" ? reformThreshold : 100 - reformThreshold,
        direction,
        met:
          direction === "right"
            ? effective >= reformThreshold
            : effective <= 100 - reformThreshold,
      };
    }),
  );
}
