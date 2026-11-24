import { z } from "zod";

const id = z.string().regex(/^[a-z][a-z0-9_]*$/);
const textKey = z.string().min(1);
const attributeValue = z.number().min(1).max(20);
const nonNegative = z.number().nonnegative();

const zone = z
  .strictObject({ min: attributeValue, max: attributeValue })
  .refine(({ min, max }) => min < max, {
    message: "zone.min must be below zone.max",
  });

export const attributeSchema = z.strictObject({
  id,
  group: z.enum(["material", "social", "power"]),
  nameKey: textKey,
  base: attributeValue,
  zone,
  adaptRate: z.number().positive(),
  pressureGain: nonNegative,
  pressureDecay: nonNegative,
});

const influenceFields = { from: id, to: id, weight: z.number() };
export const influenceSchema = z.discriminatedUnion("mode", [
  z.strictObject({
    ...influenceFields,
    mode: z.enum(["linear", "belowZone", "aboveZone"]),
  }),
  z.strictObject({
    ...influenceFields,
    mode: z.literal("aboveThreshold"),
    threshold: nonNegative,
  }),
]);

export const policySchema = z.strictObject({
  id,
  eraMin: id,
  eraMax: id.optional(),
  nameKey: textKey,
  leftLabelKey: textKey,
  rightLabelKey: textKey,
  tradeoffKey: textKey,
  default: z.number().int().min(0).max(100),
  delayYears: nonNegative,
  rampYears: z.number().positive(),
  costPerPoint: nonNegative,
  effects: z
    .array(
      z.strictObject({ attribute: id, at0: z.number(), at100: z.number() }),
    )
    .min(1),
});

export const tierSchema = z.strictObject({
  id,
  nameKey: textKey,
  threshold: nonNegative,
});
export const eraSchema = z.strictObject({
  id,
  nameKey: textKey,
  startYear: z.number(),
  baseAttributes: z.record(id, attributeValue).optional(),
  yearsPerMinute: z.number().positive(),
  activeAttributes: z.array(id),
  influenceRegenPerYear: nonNegative,
  influenceCap: z.number().positive(),
  startInfluence: nonNegative,
  baseCapacity: z.number().positive(),
  baseGrowthPerYear: nonNegative,
  startPopulation: z.number().min(10),
  complexityMultiplier: z.number().positive(),
  historySampleYears: z.number().positive(),
});

export type AttributeDef = z.infer<typeof attributeSchema>;
export type AttributeId = AttributeDef["id"];
export type InfluenceDef = z.infer<typeof influenceSchema>;
export type PolicyDef = z.infer<typeof policySchema>;
export type ComplexityTierDef = z.infer<typeof tierSchema>;
export type EraDef = z.infer<typeof eraSchema>;

export interface ContentBundle {
  attributes: AttributeDef[];
  influences: InfluenceDef[];
  policies: PolicyDef[];
  complexityTiers: ComplexityTierDef[];
  eras: EraDef[];
}
