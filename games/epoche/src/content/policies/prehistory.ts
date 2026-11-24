import type { PolicyDef } from "../schema";

function policy(
  id: string,
  delayYears: number,
  rampYears: number,
  costPerPoint: number,
  effects: [attribute: string, at0: number, at100: number][],
): PolicyDef {
  const key = "policy." + id;
  return {
    id,
    eraMin: "prehistory",
    nameKey: key,
    leftLabelKey: key + ".left",
    rightLabelKey: key + ".right",
    tradeoffKey: key + ".tradeoff",
    default: 50,
    delayYears,
    rampYears,
    costPerPoint,
    effects: effects.map(([attribute, at0, at100]) => ({
      attribute,
      at0,
      at100,
    })),
  };
}

export const prehistoryPolicies = [
  policy("settlement", 20, 200, 0.2, [
    ["sustenance", 0, 1.5],
    ["environment", 1, -2],
    ["health", 0.5, -1],
    ["cohesion", -0.5, 1],
  ]),
  policy("subsistence", 10, 100, 0.15, [
    ["military", 2, -1],
    ["sustenance", -0.5, 1],
    ["knowledge", 0, 1],
    ["environment", -1, 0],
  ]),
  policy("elders", 10, 150, 0.15, [
    ["knowledge", -1, 2],
    ["cohesion", -1, 1.5],
    ["faith", 0, 1],
    ["military", 0.5, -0.5],
  ]),
  policy("exogamy", 20, 200, 0.2, [
    ["health", -1.5, 1],
    ["cohesion", 1.5, -1],
    ["knowledge", -0.5, 1],
  ]),
  policy("fire", 5, 80, 0.1, [
    ["sustenance", -1, 1.5],
    ["health", -0.5, 1],
    ["environment", 0.5, -2.5],
  ]),
  policy("rites", 10, 120, 0.15, [
    ["faith", -1, 2.5],
    ["cohesion", -0.5, 1.5],
    ["sustenance", 0.3, -0.7],
  ]),
];
