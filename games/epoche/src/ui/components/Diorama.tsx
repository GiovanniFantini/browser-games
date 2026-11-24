import { eventsById, isTradition } from "@content/campaign/definitions";
import { valley as terrain, focusFor, heritageCamera } from "../../map/viewpoint";
import { subjectSymbols } from "../symbols";
import { useEffect, useRef, useState } from "react";
import type { mountDiorama, Scene } from "../../map/diorama";
import { translate, type Language } from "../../i18n";
import type { Snapshot } from "@worker/protocol";
import { allowGameShortcut } from "../keyboard";
import { useGameStore } from "../store/gameStore";

export function Diorama({
  snapshot,
  language,
  reduced,
}: {
  snapshot: Snapshot;
  language: Language;
  reduced: boolean;
}) {
  const view = snapshot.campaign!;
  const host = useRef<HTMLDivElement | null>(null);
  const current = useRef<Awaited<ReturnType<typeof mountDiorama>> | null>(null);
  const [loaded, markLoaded] = useState(false);
  const [camera, setCamera] = useState(0.5);
  const [zoom, setZoom] = useState(1);
  const speed = useGameStore((state) => state.speed);
  const [notice, setNotice] = useState<(typeof view.chronicle)[number] | null>(
    null,
  );
  const seen = useRef(view.chronicle.at(-1)?.id ?? 0);
  useEffect(() => {
    const fresh = view.chronicle.filter((entry) => entry.id > seen.current);
    seen.current = view.chronicle.at(-1)?.id ?? 0;
    const latest = fresh
      .reverse()
      .find((entry) =>
        [
          "log.response",
          "log.crisis",
          "log.recovery",
          "log.policyChosen",
          "log.policySettled",
          "log.fieldsExpand",
          "log.fieldsProtect",
        ].includes(entry.key),
      );
    if (latest) setNotice(latest);
  }, [view.chronicle]);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 8000);
    return () => window.clearTimeout(timer);
  }, [notice]);
  const eventId = notice?.eventKey?.split(".")[1] ?? "";
  const family =
    eventsById.get(eventId)?.family ?? notice?.nameKey?.replace("family.", "");
  let place: "river" | "woods" | "fields" | "village" = "village";
  if (
    ["drought", "flood", "silt", "creek", "coldwater", "spring"].includes(
      eventId,
    ) ||
    family === "policy.irrigation"
  )
    place = "river";
  else if (
    ["nuts", "saplings", "shade"].includes(eventId) ||
    notice?.key === "log.fieldsProtect"
  )
    place = "woods";
  else if (
    family === "food" ||
    [
      "policy.fields",
      "policy.shares",
      "policy.husbandry",
      "policy.subsistence",
    ].includes(family ?? "")
  )
    place = "fields";

  const x =
    50 +
    (100 * (terrain[place] - focusFor(camera, terrain)) * zoom) /
      (terrain.river - terrain.fields + 285);
  const scene: Scene = {
    era: view.stage,
    heritage: view.heritage,
    traditionLife: view.traditionLife,
    palette: view.palette,
    tick: snapshot.tick,
    population: snapshot.population,
    speed: speed === 0 ? 0 : snapshot.speed,
    attributes: snapshot.attributes.flatMap(({ id, active, value, zone }) => {
      if (!active || (value >= zone.min && value <= zone.max)) return [];
      return [{ id, direction: value < zone.min ? "below" : "above" } as const];
    }),
    crises: view.crises.map(({ family }) => family),
    drought: view.event?.id === "drought" || view.event?.id === "dryHarvest",
    conflict: !!view.war,
    camera,
    zoom,
    reduced,
  };

  useEffect(() => {
    const target = host.current;
    if (!target) return;
    let disposed = false;
    void import("../../map/diorama")
      .then(({ mountDiorama }) => mountDiorama(target))
      .then((controller) => {
        if (disposed) controller.destroy();
        else {
          current.current = controller;
          markLoaded(true);
        }
      })
      .catch(() => markLoaded(false));
    return () => {
      disposed = true;
      current.current?.destroy();
      current.current = null;
    };
  }, []);

  useEffect(() => {
    if (loaded) current.current?.draw(scene);
  });
  useEffect(() => {
    function move(event: KeyboardEvent) {
      if (!allowGameShortcut(event)) return;
      const key = event.key.toLowerCase();
      if (key !== "a" && key !== "d") return;
      event.preventDefault();
      setCamera((value) =>
        Math.max(0, Math.min(1, value + (key === "a" ? -0.08 : 0.08))),
      );
    }
    window.addEventListener("keydown", move);
    return () => window.removeEventListener("keydown", move);
  }, []);
  return (
    <div className="diorama">
      <div
        ref={host}
        className="diorama-canvas"
        role="img"
        data-rendered={loaded}
        aria-label={translate(language, "land.diorama", {
          name: view.identity.name,
        })}
      />
      <div className="diorama-label">
        <h2>{view.identity.name}</h2>
        <span>{translate(language, "culture." + view.identity.archetype)}</span>
        {view.heritage.length > 0 && <details className="heritage-register" key={view.id}>
          <summary>{translate(language, "heritage.register", { count: view.heritage.length })}</summary>
          <div className="heritage-places">{view.heritage.map(site => <button key={site} type="button" onClick={event => {
            setCamera(heritageCamera[site]);
            setZoom(1.38);
            event.currentTarget.closest("details")?.removeAttribute("open");
          }}>{translate(language, "heritage." + site)} · {translate(language,
            isTradition(site) ? "heritage.life" + view.traditionLife[site] : "heritage.lasting")}</button>)}</div>
        </details>}
      </div>
      {notice && (
        <div
          className="village-notice"
          role="status"
          style={{ left: Math.max(25, Math.min(75, x)) + "%" }}
        >
          <small>
            <span aria-hidden="true">
              {subjectSymbols[family ?? ""] ??
                { fields: "🌾", woods: "🌳", river: "💧", village: "🏘️" }[
                  place
                ]}{" "}
            </span>
            {translate(
              language,
              place === "fields" && view.stage === 0
                ? "policy.subsistence.right"
                : "land." + place,
            )}
          </small>
          {translate(language, notice.consequenceKey ?? notice.key, {
            name: translate(language, notice.nameKey ?? ""),
            value: notice.setting ?? "",
          })}
        </div>
      )}
      <div className="diorama-controls">
        <div className="diorama-places">
          {(["fields", "village", "woods", "river"] as const).map(
            (key, index) => (
              <button
                key={key}
                type="button"
                aria-pressed={Math.abs(camera - index / 3) < 0.001}
                onClick={() => setCamera(index / 3)}
              >
                {translate(
                  language,
                  key === "fields" && view.stage === 0
                    ? "policy.subsistence.right"
                    : "land." + key,
                )}
              </button>
            ),
          )}
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(camera * 100)}
            step={1}
            aria-label={translate(language, "land.pan")}
            onChange={(event) =>
              setCamera(event.currentTarget.valueAsNumber / 100)
            }
          />
        </div>
        <div
          className="diorama-zoom"
          role="group"
          aria-label={translate(language, "land.zoom")}
        >
          <button
            type="button"
            aria-label={translate(language, "land.zoom") + " −"}
            onClick={() => setZoom(Math.max(0.88, zoom - 0.19))}
          >
            −
          </button>
          <button
            type="button"
            aria-label={translate(language, "land.zoom") + " +"}
            onClick={() => setZoom(Math.min(1.55, zoom + 0.19))}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
