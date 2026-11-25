import { createRng } from "@engine/core/rng";

export const sites = ["terrace", "camp", "bank", "boat"] as const;
export type Site = (typeof sites)[number];
export const orders = [
  "haul",
  "shelter",
  "pledge",
  "forage",
  "common",
  "private",
  "glean",
  "warm",
  "fell",
  "eat",
  "sow",
  "cross",
  "stay",
] as const;
export type Order = (typeof orders)[number];
export type Ending = "harvest" | "migration" | "dispersal";
export type Job =
  "together" | "gather" | "guard" | "mend" | "trade" | "shelterGuest";
export type Turn = {
  order: Order;
  deliver: boolean;
  watch?: boolean;
  job?: Job;
};
export type Book = { version: 1; seed: number; turns: Turn[] };
export interface Village {
  seed: number;
  season: number;
  cloudy: boolean;
  flood: "unknown" | "high" | "low";
  wood: number;
  food: number;
  grain: number;
  hungry: number;
  sick: boolean;
  depot: "none" | "common" | "private";
  cargo: number;
  pledged: boolean;
  trust: "unknown" | "kept" | "broken" | "neutral";
  host: boolean;
  repaired: boolean;
  timberSite: Site;
  ending: Ending | null;
  events: string[];
}
export const destination: Record<Order, Site> = {
  haul: "terrace",
  shelter: "bank",
  pledge: "boat",
  forage: "terrace",
  common: "camp",
  private: "terrace",
  glean: "terrace",
  warm: "camp",
  fell: "terrace",
  eat: "bank",
  sow: "terrace",
  cross: "boat",
  stay: "camp",
};
export function initial(seed: number): Village {
  return {
    seed,
    season: 0,
    cloudy: createRng(seed).next() < 0.5,
    flood: "unknown",
    wood: 3,
    food: 2,
    grain: 1,
    hungry: 0,
    sick: false,
    depot: "none",
    cargo: 2,
    pledged: false,
    trust: "unknown",
    host: false,
    repaired: false,
    timberSite: "bank",
    ending: null,
    events: [],
  };
}
export function options(v: Village): Order[] {
  if (v.ending) return [];
  switch (v.season) {
    case 0:
      return ["haul", "shelter"];
    case 1:
      return [...(v.wood >= 2 ? ["pledge" as const] : []), "forage"];
    case 2:
      return [...(v.wood >= 1 ? ["common" as const] : []), "private"];
    case 3:
      return [
        ...(v.wood > 0 ? ["warm" as const] : []),
        "fell",
        ...(v.grain ? ["eat" as const] : []),
      ];
    case 4:
      return [
        ...(v.grain && (!v.sick || v.host) ? ["sow" as const] : []),
        ...(v.trust === "kept" ? ["cross" as const] : []),
        ...((!v.grain || (v.sick && !v.host)) && v.trust !== "kept"
          ? ["stay" as const]
          : []),
      ];
    default:
      return [];
  }
}
export function canDeliver(v: Village, order: Order) {
  return (
    v.season === 2 && v.pledged && v.wood >= 2 + Number(order === "common")
  );
}
// A job spends the second crew. A trade and a repair can never share it.
export function jobs(v: Village, order: Order): Job[] {
  switch (v.season) {
    case 0:
      return order === "haul" ? ["together"] : ["gather", "guard"];
    case 1:
      return order === "forage" ? ["gather", "mend"] : ["mend", "gather"];
    case 2:
      return [
        ...(canDeliver(v, order) ? ["trade" as const] : []),
        "gather",
        ...(v.flood === "high" &&
        !v.repaired &&
        v.wood > Number(order === "common")
          ? ["mend" as const]
          : []),
      ];
    case 3:
      return v.depot === "common" ? ["shelterGuest", "gather"] : ["gather"];
    case 4:
      return ["together"];
    default:
      return [];
  }
}
export const jobSite: Record<Job, Site> = {
  together: "terrace",
  gather: "terrace",
  guard: "bank",
  mend: "camp",
  trade: "boat",
  shelterGuest: "camp",
};
export function resolve(v: Village, t: Turn): Village {
  if (
    (t.job !== undefined &&
      (!jobs(v, t.order).includes(t.job) ||
        t.deliver !== (t.job === "trade"))) ||
    !options(v).includes(t.order) ||
    (t.watch && t.order !== "shelter") ||
    (t.deliver && !canDeliver(v, t.order))
  )
    throw Error("Invalid valley order");
  const n: Village = { ...v, events: [] };
  const event = (key: string) => n.events.push(key);
  const watch = t.job ? t.job === "guard" : !!t.watch;
  if (n.season === 2 && n.pledged) {
    if (t.deliver) {
      n.wood -= 2;
      n.food += n.cargo;
      n.cargo = 0;
      n.trust = "kept";
      event("delivered");
    } else {
      n.trust = "broken";
      event("broken");
    }
    n.pledged = false;
  }
  switch (t.order) {
    case "haul":
    case "shelter": {
      const rng = createRng(n.seed);
      rng.next();
      n.flood = rng.next() < (n.cloudy ? 0.75 : 0.25) ? "high" : "low";
      n.timberSite = destination[t.order];
      if (t.order === "shelter") {
        if (!watch) n.food += 2;
        if (n.flood === "high") n.wood -= watch ? 1 : 2;
        if (watch) n.food++;
      }
      event(
        t.order === "haul"
          ? "dry"
          : watch
            ? n.flood === "high"
              ? "watchHigh"
              : "watchLow"
            : n.flood === "high"
              ? "washed"
              : "saved",
      );
      break;
    }
    case "pledge":
      n.pledged = true;
      event("promise");
      break;
    case "forage":
      n.food += t.job ? 1 : 2;
      n.trust = "neutral";
      event("upriver");
      break;
    case "common":
      n.wood--;
      n.depot = "common";
      event("common");
      break;
    case "private":
      n.depot = "private";
      event("private");
      break;
    case "glean":
      n.food++;
      event("glean");
      break;
    case "warm":
      n.wood--;
      event("warmed");
      break;
    case "fell":
      n.sick = true;
      n.food++;
      event("ill");
      break;
    case "eat":
      n.grain = 0;
      n.food += 2;
      if (n.wood > 0) n.wood--;
      else n.sick = true;
      event("cooked");
      break;
    case "sow":
      n.grain = 0;
      n.food += 3;
      n.ending = "harvest";
      event("sown");
      break;
    case "cross":
      n.ending = "migration";
      event("ferry");
      break;
    case "stay":
      n.ending = "dispersal";
      event("scatter");
      break;
  }
  if (t.job && v.season > 0) {
    if (t.job === "mend" && !v.repaired && v.season !== 1) {
      n.wood--;
      n.repaired = true;
      event("houseFixed");
    } else if (t.job === "mend" && v.season === 1) {
      n.wood++;
      event("salvage");
    }
    if (t.job === "gather") {
      n.food++;
      event("extraRation");
    }
    if (t.job === "guard" && v.season === 3 && n.depot === "private") {
      n.wood--;
      n.sick = false;
      event("crewRested");
    }
    if (
      v.season === 3 &&
      n.flood === "high" &&
      n.depot !== "private" &&
      !n.repaired &&
      n.grain
    ) {
      n.grain = 0;
      event("wetSeed");
    }
  }
  if (v.season === 3) {
    if (
      n.depot === "common" &&
      n.food > 0 &&
      (!t.job || t.job === "shelterGuest")
    ) {
      n.food--;
      n.host = true;
      event("guest");
    } else event("left");
  }
  if (!n.ending) {
    if (n.food > 0) {
      n.food--;
      n.hungry = 0;
    } else {
      n.hungry++;
      event("hunger");
    }
    if (n.hungry >= 2) {
      n.ending = "dispersal";
      event("scatter");
    }
  }
  n.season++;
  return n;
}
export function replay(value: unknown) {
  if (
    !value ||
    typeof value !== "object" ||
    !("version" in value) ||
    value.version !== 1 ||
    !("seed" in value) ||
    typeof value.seed !== "number" ||
    !Number.isInteger(value.seed) ||
    value.seed < 0 ||
    value.seed > 0xffffffff ||
    !("turns" in value) ||
    !Array.isArray(value.turns) ||
    value.turns.length > 5
  )
    throw Error("Invalid valley book");
  const book: Book = { version: 1, seed: value.seed, turns: [] };
  const history = [initial(value.seed)];
  for (const raw of value.turns) {
    if (
      !raw ||
      (raw.job !== undefined && typeof raw.job !== "string") ||
      !orders.includes(raw.order) ||
      typeof raw.deliver !== "boolean" ||
      (raw.watch !== undefined && typeof raw.watch !== "boolean")
    )
      throw Error("Invalid valley turn");
    const turn: Turn = {
      order: raw.order,
      deliver: raw.deliver,
      ...(raw.watch ? { watch: true } : {}),
      ...(raw.job !== undefined ? { job: raw.job } : {}),
    };
    history.push(resolve(history[history.length - 1]!, turn));
    book.turns.push(turn);
  }
  return { book, history };
}
