import type { Campaign } from "@engine/campaign/model";
export function playMode(): Campaign["rules"] {
  const q = new URLSearchParams(
    typeof location === "undefined" ? "" : location.search,
  );
  if (q.get("studio") === "inverno") return "winterStudy";
  if (q.has("studio")) return "trial";
  return q.has("rimedi") ? "winter" : "current";
}
