import type { WaveSession } from "../waves/session";
import type { WaterSegment } from "../enemies/terrain";
import { inWater } from "../enemies/terrain";
import { actors } from "../enemies/rig";
import { songState } from "../enemies/controller";
export interface AudioSink {
  readonly enabled: boolean;
  play(id: string): void;
}
interface FlightSound {
  readonly source: string;
  readonly target: string;
  readonly node: string;
  readonly impact: number;
}
export function attachSounds(
  session: WaveSession,
  audio: AudioSink,
  water?: WaterSegment,
): () => void {
  const flights = new Map<number, FlightSound>(),
    steps = new Map<string, number[]>(),
    songs = new Map<string, string>();
  let primed = false,
    lastStep = -Infinity;
  return session.observePresentation((packet) => {
    if (!audio.enabled) {
      primed = false;
      flights.clear();
      steps.clear();
      songs.clear();
      return;
    }
    const live = new Set<number>();
    for (const visual of session.towers.flights) {
      live.add(visual.number);
      if (primed && !flights.has(visual.number)) {
        if (visual.attack.node.id.startsWith("resina-")) audio.play("res-shot");
        else if (visual.attack.node.id.startsWith("nido-"))
          audio.play("nest-release");
      }
      flights.set(visual.number, {
        source: visual.attack.source,
        target: visual.target,
        node: visual.attack.node.id,
        impact: visual.impactAt,
      });
    }
    const impacts = new Set<string>();
    for (const event of packet.combat) {
      if (event.type === "impact") {
        const key = event.source + ":" + event.at.toFixed(6);
        if (impacts.has(key)) continue;
        impacts.add(key);
        const flight =
          [...flights.values()].find(
            (v) =>
              v.source === event.source &&
              v.target === event.enemy &&
              Math.abs(v.impact - event.at) < 1e-7,
          ) ??
          [...flights.values()].find(
            (v) =>
              v.source === event.source && Math.abs(v.impact - event.at) < 1e-7,
          );
        const node =
          flight?.node ??
          session.economy.towers.find((t) => t.uid === event.source)?.node;
        if (node === "resina-colla") audio.play("res-impact");
        else if (node === "resina-ambra") audio.play("amber-impact");
        else if (node === "spore-nube") audio.play("spore-cloud");
        else if (node?.startsWith("spore-")) audio.play("spore-apply");
        else if (node?.startsWith("nido-")) audio.play("nest-impact");
        else if (node === "roccia-frantuma") audio.play("rock-fracture");
        else if (node === "roccia-sisma") audio.play("rock-quake");
        else if (node?.startsWith("roccia-")) audio.play("rock-hit");
      } else if (event.type === "neutralized")
        audio.play(
          session.engine.enemy(event.enemy)?.definition.boss
            ? "boss-release"
            : "neutralize",
        );
      else if (event.type === "escaped") audio.play("portal-leak");
    }
    for (const event of packet.boss) {
      if (event.type === "phase") audio.play("boss-phase");
      else if (event.type === "roar-warning") audio.play("roar-warn");
      else if (event.type === "tail-warning") audio.play("tail-warn");
      else if (
        event.type === "tail-hit" &&
        session.economy.towers.some(
          (t) => session.towers.disabledRemaining(t.uid) > 0,
        )
      )
        audio.play("tail-hit");
    }
    const enemies = new Set<string>();
    for (const enemy of session.activeEnemies) {
      enemies.add(enemy.id);
      const actor = actors[enemy.definition.id],
        previous = songs.get(enemy.id),
        song = songState(enemy, packet.time);
      if (
        primed &&
        previous !== undefined &&
        previous !== "warning" &&
        song.phase === "warning"
      )
        audio.play("call-warn");
      songs.set(enemy.id, song.phase);
      if (actor) {
        const offsets = actor.quad ? actor.phases.slice(0, 2) : [0, 0.5],
          contacts = offsets.map((offset) =>
            Math.floor(
              enemy.traveller.distance / (actor.size * actor.stride) + offset,
            ),
          ),
          before = steps.get(enemy.id);
        if (
          primed &&
          before &&
          contacts.some((value, i) => value > before[i]!) &&
          packet.time - lastStep >= 0.12
        ) {
          audio.play(
            inWater(
              enemy.definition.id,
              enemy.traveller.path.id,
              enemy.traveller.distance,
              water,
            )
              ? "water-step"
              : "footstep",
          );
          lastStep = packet.time;
        }
        steps.set(enemy.id, contacts);
      }
    }
    for (const id of steps.keys()) if (!enemies.has(id)) steps.delete(id);
    for (const id of songs.keys()) if (!enemies.has(id)) songs.delete(id);
    for (const id of flights.keys()) if (!live.has(id)) flights.delete(id);
    primed = true;
  });
}
