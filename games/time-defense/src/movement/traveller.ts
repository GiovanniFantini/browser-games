import { pathPose } from "./path";
import type { DistancePath, PathPose } from "./path";

export interface Traveller {
  readonly id: string;
  readonly enemy: string;
  readonly entryOrder: number;
  readonly path: DistancePath;
  readonly speed: number;
  readonly distance: number;
  readonly state: "active" | "escaped";
}
export interface TravelStep {
  readonly traveller: Traveller;
  readonly escaped: boolean;
  readonly secondsToExit: number | null;
}
export function createTraveller(id: string, enemy: string, entryOrder: number,
  path: DistancePath, speed: number): Traveller {
  if (!id || !enemy || !Number.isInteger(entryOrder) || entryOrder < 0 || !Number.isFinite(speed) || speed <= 0)
    throw new Error("Invalid traveller");
  return { id, enemy, entryOrder, path, speed, distance: 0, state: "active" };
}
export function advanceTraveller(actor: Traveller, seconds: number, speedMultiplier = 1): TravelStep {
  if (!Number.isFinite(seconds) || seconds < 0 || !Number.isFinite(speedMultiplier) || speedMultiplier < 0)
    throw new Error("Invalid movement step");
  if (actor.state === "escaped" || seconds === 0 || speedMultiplier === 0)
    return { traveller: actor, escaped: false, secondsToExit: null };
  const speed = actor.speed * speedMultiplier;
  if (!Number.isFinite(speed)) throw new Error("Invalid effective speed");
  const timeLeft = Math.max(0, (actor.path.length - actor.distance) / speed);
  const escaped = seconds >= timeLeft;
  return { traveller: { ...actor, distance: escaped ? actor.path.length : actor.distance + speed * seconds,
      state: escaped ? "escaped" : "active" },
    escaped, secondsToExit: escaped ? timeLeft : null };
}
export function travellerPose(actor: Traveller): PathPose {
  return pathPose(actor.path, actor.distance);
}
