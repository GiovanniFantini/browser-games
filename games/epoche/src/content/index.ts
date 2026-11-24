import { z } from "zod";
import { dictionaries } from "../i18n";
import { attributes } from "./attributes";
import { POPULATION_PRESSURE } from "./balance";
import { complexityTiers } from "./complexity";
import { prehistory } from "./eras/prehistory";
import { influences } from "./influences";
import { prehistoryPolicies } from "./policies/prehistory";
import {
  attributeSchema,
  eraSchema,
  influenceSchema,
  policySchema,
  tierSchema,
  type ContentBundle,
} from "./schema";

const definitions = {
  attributes: "attributes.ts",
  influences: "influences.ts",
  policies: "policies/prehistory.ts",
  complexityTiers: "complexity.ts",
  eras: "eras/prehistory.ts",
} as const;

const schema = z.strictObject({
  attributes: z.array(attributeSchema).min(1),
  influences: z.array(influenceSchema),
  policies: z.array(policySchema),
  complexityTiers: z.array(tierSchema).min(1),
  eras: z.array(eraSchema).min(1),
});

const startingContent: ContentBundle = {
  attributes,
  influences,
  policies: prehistoryPolicies,
  complexityTiers,
  eras: [prehistory],
};

function checkIds(items: { id: string }[], file: string): Set<string> {
  const ids = new Set<string>();
  for (const item of items) {
    if (ids.has(item.id)) throw new Error(file + ": duplicate id " + item.id);
    ids.add(item.id);
  }
  return ids;
}

export function loadContent(
  input: unknown = startingContent,
  translations = dictionaries,
): ContentBundle {
  const result = schema.safeParse(input);
  if (!result.success) {
    const issues = result.error.issues.map(({ path, message }) => {
      const section = path[0] as keyof typeof definitions | undefined;
      return (
        (section ? definitions[section] : "content") +
        " [" +
        path.join(".") +
        "]: " +
        message
      );
    });
    throw new Error(issues.join("\n"));
  }

  const content = result.data;
  const attributeIds = checkIds(content.attributes, definitions.attributes);
  const eraIds = checkIds(content.eras, definitions.eras);
  checkIds(content.policies, definitions.policies);
  checkIds(content.complexityTiers, definitions.complexityTiers);

  function requireAttribute(id: string, context: string): void {
    if (!attributeIds.has(id))
      throw new Error(context + ": unknown attribute " + id);
  }
  function requireTranslation(key: string, context: string): void {
    for (const [language, dictionary] of Object.entries(translations)) {
      if (!Object.hasOwn(dictionary, key) || !dictionary[key]?.trim()) {
        throw new Error(context + ": missing " + language + ".json key " + key);
      }
    }
  }

  for (const attribute of content.attributes) {
    requireTranslation(
      attribute.nameKey,
      definitions.attributes + " " + attribute.id,
    );
  }
  for (const influence of content.influences) {
    const context =
      definitions.influences + " " + influence.from + " → " + influence.to;
    requireAttribute(influence.to, context);
    if (influence.mode === "aboveThreshold") {
      if (influence.from !== POPULATION_PRESSURE) {
        throw new Error(context + ": aboveThreshold requires a special source");
      }
    } else {
      requireAttribute(influence.from, context);
    }
  }
  for (const policy of content.policies) {
    const context = definitions.policies + " " + policy.id;
    if (!eraIds.has(policy.eraMin))
      throw new Error(context + ": unknown era " + policy.eraMin);
    if (policy.eraMax && !eraIds.has(policy.eraMax))
      throw new Error(context + ": unknown era " + policy.eraMax);
    for (const key of [
      policy.nameKey,
      policy.leftLabelKey,
      policy.rightLabelKey,
      policy.tradeoffKey,
    ]) {
      requireTranslation(key, context);
    }
    for (const effect of policy.effects)
      requireAttribute(effect.attribute, context);
  }
  for (const tier of content.complexityTiers) {
    requireTranslation(
      tier.nameKey,
      definitions.complexityTiers + " " + tier.id,
    );
  }
  if (!content.complexityTiers.some((tier) => tier.threshold === 0)) {
    throw new Error(
      definitions.complexityTiers + ": a tier with threshold 0 is required",
    );
  }
  for (const era of content.eras) {
    const context = definitions.eras + " " + era.id;
    for (const id of era.activeAttributes) requireAttribute(id, context);
    requireTranslation(era.nameKey, context);
    if (era.startInfluence > era.influenceCap) {
      throw new Error(context + ": startInfluence exceeds influenceCap");
    }
  }
  return content;
}
