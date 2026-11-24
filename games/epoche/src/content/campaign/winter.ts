export const winterMarks = [
  "field",
  "clan",
  "hut",
  "table",
  "barter",
  "unseeded",
] as const;
export type WinterMark = (typeof winterMarks)[number];
export const remedies = [
  "carry",
  "seeds",
  "departure",
  "isolate",
  "care",
  "levy",
  "condone",
  "returnClan",
  "share",
  "renew",
] as const;
export type Remedy = (typeof remedies)[number];
export const winterRules = (rules: string) =>
  rules === "winter" || rules === "winterStudy";
export const scriptedRules = (rules: string) =>
  rules === "trial" || rules === "winterStudy";
