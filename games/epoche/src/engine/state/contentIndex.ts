import type {
  AttributeDef,
  ContentBundle,
  EraDef,
  InfluenceDef,
  PolicyDef,
} from "@content/schema";

interface IndexedEffect {
  policyId: string;
  at0: number;
  at100: number;
}

interface ContentIndex {
  attributes: AttributeDef[];
  attributesById: Map<string, AttributeDef>;
  policies: PolicyDef[];
  policiesById: Map<string, PolicyDef>;
  erasById: Map<string, EraDef>;
  tiers: ContentBundle["complexityTiers"];
  influencesByTarget: Map<string, InfluenceDef[]>;
  effectsByTarget: Map<string, IndexedEffect[]>;
}

const indexes = new WeakMap<ContentBundle, ContentIndex>();

function compare(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function byId(left: { id: string }, right: { id: string }): number {
  return compare(left.id, right.id);
}

function addByTarget<T>(
  entries: Map<string, T[]>,
  target: string,
  item: T,
): void {
  const items = entries.get(target);
  if (items) items.push(item);
  else entries.set(target, [item]);
}

export function indexContent(content: ContentBundle): ContentIndex {
  const existing = indexes.get(content);
  if (existing) return existing;
  const attributes = [...content.attributes].sort(byId);
  const policies = [...content.policies].sort(byId);
  const influencesByTarget = new Map<string, InfluenceDef[]>();
  const effectsByTarget = new Map<string, IndexedEffect[]>();
  const influences = [...content.influences].sort(
    (left, right) =>
      compare(left.from, right.from) ||
      compare(left.to, right.to) ||
      compare(left.mode, right.mode) ||
      left.weight - right.weight,
  );
  for (const influence of influences)
    addByTarget(influencesByTarget, influence.to, influence);
  for (const policy of policies) {
    for (const effect of policy.effects) {
      addByTarget(effectsByTarget, effect.attribute, {
        policyId: policy.id,
        at0: effect.at0,
        at100: effect.at100,
      });
    }
  }
  const index: ContentIndex = {
    attributes,
    attributesById: new Map(
      attributes.map((attribute) => [attribute.id, attribute]),
    ),
    policies,
    policiesById: new Map(policies.map((policy) => [policy.id, policy])),
    erasById: new Map(content.eras.map((era) => [era.id, era])),
    tiers: [...content.complexityTiers].sort(
      (left, right) => right.threshold - left.threshold || byId(left, right),
    ),
    influencesByTarget,
    effectsByTarget,
  };
  indexes.set(content, index);
  return index;
}

export function getEra(content: ContentBundle, id: string): EraDef {
  const era = indexContent(content).erasById.get(id);
  if (!era) throw new Error("Unknown era: " + id);
  return era;
}

export function canUsePolicy(
  policy: PolicyDef,
  content: ContentBundle,
  eraId: string,
): boolean {
  const year = getEra(content, eraId).startYear;
  return (
    year >= getEra(content, policy.eraMin).startYear &&
    (!policy.eraMax || year <= getEra(content, policy.eraMax).startYear)
  );
}
