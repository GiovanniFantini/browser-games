import enemyData from "../../docs/dati-nemici.json";
import type { FieldMap } from "../field/catalog";
import { compilePath } from "./path";
import { advanceTraveller, createTraveller, travellerPose } from "./traveller";
import type { Traveller } from "./traveller";
import type { PathPose } from "./path";

export interface MovementMarker extends PathPose { readonly number: number }
export function createMovementPreview(container: HTMLElement, changed: () => void,
  announce: (text: string) => void) {
  container.innerHTML = `<h2>Prova dei percorsi</h2>
    <p class="field-hint">Segnaposti numerati alle velocità previste. Le ondate non sono ancora disponibili.</p>
    <div class="motion-actions"><button type="button" id="motion-play">Avvia prova</button><button type="button" id="motion-reset">Dall’inizio</button><button type="button" id="motion-step">Avanza 5 s</button></div>
    <label class="motion-seek-label" for="motion-seek">Posizione della prova</label><input id="motion-seek" type="range" min="0" max="1000" value="0" step="1" />
    <p id="motion-time"></p><p id="motion-legend" class="field-hint"></p><div id="motion-readout" class="motion-readout" tabindex="0" aria-label="Posizione dei campioni, area scorrevole"></div>`;
  const get = <T extends HTMLElement>(selector: string): T => {
    const element = container.querySelector<T>(selector);
    if (!element) throw new Error("Missing movement control");
    return element;
  };
  const play = get<HTMLButtonElement>("#motion-play"), reset = get<HTMLButtonElement>("#motion-reset"),
    step = get<HTMLButtonElement>("#motion-step"), seek = get<HTMLInputElement>("#motion-seek"),
    time = get<HTMLElement>("#motion-time"), readout = get<HTMLElement>("#motion-readout"),
    legend = get<HTMLElement>("#motion-legend");
  let actors: Traveller[] = [], initial: Traveller[] = [], enabled = false, running = false,
    elapsed = 0, duration = 0, frameId = 0, lastFrame: number | null = null, lastReadout = -Infinity;
  let rows: HTMLElement[] = [], names: string[] = [], enemyNames: string[] = [];
  function updateReadout(): void {
    play.textContent = running ? "Pausa" : "Avvia prova";
    const finished = actors.length > 0 && actors.every(a => a.state === "escaped");
    const focusReset = enabled && finished &&
      (document.activeElement === play || document.activeElement === step);
    play.disabled = !enabled || finished;
    reset.disabled = !enabled;
    step.disabled = !enabled || finished;
    seek.disabled = !enabled;
    if (focusReset) reset.focus();
    seek.value = String(duration ? Math.round(elapsed / duration * 1000) : 0);
    seek.setAttribute("aria-valuetext", Math.round(elapsed) + " secondi su " + Math.ceil(duration));
    time.textContent = `${elapsed.toFixed(1)} s / ${duration.toFixed(1)} s${running ? " · In movimento" : " · Ferma"}`;
    actors.forEach((actor, i) => {
      const row = rows[i];
      if (!row) return;
      row.textContent = `${i + 1}. ${names[i]}. ${enemyNames[i]}, ${actor.speed} unità/s. ` +
        (actor.state === "escaped" ? "Arrivato al portale." :
          `${Math.round(actor.distance)} / ${Math.round(actor.path.length)} unità. Restano ${Math.ceil(actor.path.length - actor.distance)}.`);
    });
  }
  function pause(): void {
    running = false;
    cancelAnimationFrame(frameId);
    frameId = 0;
    lastFrame = null;
    updateReadout();
  }
  function advance(seconds: number): void {
    actors = actors.map(actor => advanceTraveller(actor, seconds).traveller);
    elapsed = Math.min(duration, elapsed + seconds);
    if (actors.every(a => a.state === "escaped")) {
      pause();
      announce("Tutti i campioni sono arrivati al portale. La prova è conclusa, senza effetti sulla partita.");
    }
  }
  function frame(timestamp: number): void {
    if (!running || !enabled) return;
    if (lastFrame !== null) advance(Math.max(0, (timestamp - lastFrame) / 1000));
    lastFrame = timestamp;
    changed();
    if (timestamp - lastReadout >= 200 || !running) {
      updateReadout();
      lastReadout = timestamp;
    }
    if (running) frameId = requestAnimationFrame(frame);
  }
  play.addEventListener("click", () => {
    if (!enabled) return;
    if (running) { pause(); announce("Prova del movimento in pausa."); }
    else if (actors.some(a => a.state === "active")) {
      running = true; lastFrame = null;
      frameId = requestAnimationFrame(frame);
      announce("Prova avviata. Puoi fermarla o spostare la posizione."); updateReadout();
    }
  });
  reset.addEventListener("click", () => {
    if (!enabled) return;
    pause(); actors = initial; elapsed = 0; updateReadout(); changed();
    announce("Campioni riportati agli ingressi. La prova resta ferma.");
  });
  step.addEventListener("click", () => {
    if (!enabled) return;
    pause(); advance(5); updateReadout(); changed();
    if (elapsed < duration) announce("Prova avanzata di 5 secondi. Resta ferma finché non premi Avvia prova.");
  });
  seek.addEventListener("input", () => {
    if (!enabled) return;
    const fraction = Number(seek.value) / 1000;
    pause(); elapsed = duration * fraction;
    actors = initial.map(actor => advanceTraveller(actor, elapsed).traveller);
    updateReadout(); changed();
    announce(actors.every(actor => actor.state === "escaped")
      ? "Tutti i campioni sono arrivati al portale. Usa Dall’inizio per ripartire."
      : "Posizione aggiornata. La prova resta ferma.");
  });
  return {
    setMap(map: FieldMap): void {
      pause(); elapsed = 0;
      initial = map.routes.map((route, i) => {
        const enemyId = route.shortcut ? "guado" : "esploratore";
        if (route.allowedEnemies && !route.allowedEnemies.includes(enemyId))
          throw new Error("Preview enemy is not allowed on route " + route.id);
        const enemy = enemyData.enemies.find(e => e.id === enemyId);
        if (!enemy) throw new Error("Missing movement data");
        return createTraveller(map.id + ":" + route.id, enemy.id, i,
          compilePath(route.id, route.points), enemy.speed);
      });
      actors = initial;
      names = map.routes.map(route => route.name);
      enemyNames = initial.map(actor => enemyData.enemies.find(enemy => enemy.id === actor.enemy)!.name);
      legend.textContent = map.routeLegend;
      duration = Math.max(0, ...initial.map(actor => actor.path.length / actor.speed));
      readout.replaceChildren();
      rows = initial.map(() => { const p = document.createElement("p"); readout.append(p); return p; });
      updateReadout();
    },
    setEnabled(value: boolean): void { enabled = value; if (!value && running) pause(); updateReadout(); },
    setRoutesVisible(value: boolean): void { legend.hidden = !value; },
    suspend(): void { pause(); },
    markers(): readonly MovementMarker[] {
      return actors.flatMap((actor, i) => actor.state === "active" ? [{ ...travellerPose(actor), number: i + 1 }] : []);
    },
  };
}
