import { loadContent } from "../index";
import type { ContentBundle, EraDef } from "../schema";
import {
  campaignBalance,
  campaignEras,
  campaignPolicies,
  campaignTiming,
} from "./definitions";

const extendedTiers = [
  { id: "empire", nameKey: "tier.empire", threshold: 4.8 },
  { id: "industrial", nameKey: "tier.industrial", threshold: 5.2 },
  { id: "global", nameKey: "tier.global", threshold: 5.7 },
];

export function loadCampaignContent(
  pace: "standard" | "rapid" = "rapid",
): ContentBundle {
  const start = loadContent();
  const first = start.eras[0];
  if (!first) throw new Error("Missing prehistory");
  const eras: EraDef[] = campaignEras.map((entry, index) => ({
    ...first,
    id: entry.id,
    nameKey: "era." + entry.id,
    startYear: entry.startYear,
    yearsPerMinute: entry.yearsPerMinute / campaignTiming(pace).tickScale,
    baseCapacity: entry.baseCapacity,
    baseGrowthPerYear: entry.baseGrowthPerYear,
    startPopulation: entry.startPopulation,
    activeAttributes:
      index === 0
        ? first.activeAttributes
        : start.attributes
            .filter(
              ({ id }) => index > 1 || !["prestige", "innovation"].includes(id),
            )
            .map(({ id }) => id),
    startInfluence: index === 0 ? first.startInfluence : 32 + 3 * index,
    influenceRegenPerYear:
      index === 0 ? first.influenceRegenPerYear : 0.12 + index * 0.028,
    influenceCap: 100 + index * 8,
    historySampleYears: Math.max(2, 10 - index),
    ...(index > 0
      ? {
          baseAttributes: {
            prosperity: 9.5 + index * 0.4,
            infrastructure: 8.5 + index * 0.4,
            stability: 10,
            culture: 9.5 + index * 0.25,
            freedom: 10,
            prestige: 8.5 + index * 0.3,
            innovation: 9.5 + index * 0.35,
            knowledge: campaignBalance.lateKnowledgeBaseline + 0.27 * index,
            sustenance: 12 + index * 0.15,
            environment: 14,
            health: 12 + index * 0.2,
          },
        }
      : {}),
  }));
  return loadContent({
    ...start,
    eras,
    policies: [
      ...start.policies.map((policy) => ({ ...policy, eraMax: "prehistory" })),
      ...campaignPolicies,
    ],
    complexityTiers: [...start.complexityTiers, ...extendedTiers],
  });
}
