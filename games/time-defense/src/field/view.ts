import { baseTowers, families, familyArt, fieldMaps } from "./catalog";
import type { Family, FieldMap } from "./catalog";
import { fitCamera, pickSlot, unproject } from "./geometry";
import { FieldImages } from "./images";
import { FieldRenderer } from "./renderer";
import type { FieldRenderState } from "./renderer";
import "./style.css";
import { createMovementPreview } from "../movement/preview";
import { createCombatPreview } from "../combat/preview";
import { createEconomyPreview } from "../economy/preview";
import { createWavePreview } from "../waves/preview";
import { loadTowerArt } from "../towers/art";
import type { TowerArt } from "../towers/art";
import { loadEnemyArt } from "../enemies/art";
import type { EnemyArt } from "../enemies/art";
import { createBossHud } from "../enemies/boss-hud";
import { createSagaMission } from "../mission/campaign";
import type { MissionId } from "../mission/content";
import type { ProfileStore } from "../profile/store";
import { attachSounds } from "../audio/bridge";
import type { GameAudio } from "../audio/runtime";
import { missionIds,stories } from "../mission/content";
type PreviewMode = "field" | "movement" | "combat" | "economy" | "waves";

function element<T extends HTMLElement>(
  root: HTMLElement,
  selector: string,
): T {
  const result = root.querySelector<T>(selector);
  if (!result) throw new Error("Missing field control: " + selector);
  return result;
}
export function createFieldView(
  container: HTMLElement,
  onClose: (mission:MissionId|null) => void,
  profile:ProfileStore,openSettings:(opener:HTMLElement)=>void,audio:GameAudio,
): { open: (mode?: PreviewMode) => void; startMission:(level?:MissionId)=>void; showNotes:()=>void;showIntro:()=>void;suspend:()=>void } {
  container.innerHTML = `
    <div class="field-screen">
      <header class="field-header"><div><p class="field-kicker">Campo in anteprima</p><h1>Time Defense</h1></div>
        <label class="field-map-label">Ambientazione<select id="field-map"></select></label>
        <button id="field-routes" type="button" aria-pressed="false">Mostra percorsi</button>
        <div id="wave-controls" class="wave-controls" hidden></div>
        <button id="field-settings" type="button">Impostazioni</button><button id="field-back" type="button">Mappa</button>
      </header>
      <div class="field-main">
        <section class="field-stage" aria-label="Mappa e selezione">
          <div id="field-wrap" class="field-wrap">
            <canvas id="game-canvas" width="1536" height="1024" role="img" aria-describedby="field-description" hidden></canvas>
            <p id="wave-paused-badge" class="wave-paused-badge" hidden>In pausa</p>
            <p id="field-loading" role="status">Caricamento della mappa…</p>
            <section id="field-notice" class="field-notice" aria-labelledby="field-notice-title" aria-describedby="field-notice-text" hidden><h2 id="field-notice-title">Anteprima in pausa</h2><p id="field-notice-text"></p><button id="field-resume" type="button" hidden>Riprendi anteprima</button></section>
            <section id="field-error" class="field-notice" role="alert" hidden><h2>La mappa non è disponibile</h2><p id="field-error-text"></p><button id="field-retry" type="button">Riprova caricamento</button></section>
          </div>
          <p id="field-description" class="field-description"></p>
        </section>
        <aside id="field-panel" class="field-panel" aria-label="Selezione di difese e piazzole">
          <div><h2>Confronta una difesa</h2><p class="field-hint">Quattro famiglie in anteprima. Nessuna Scintilla viene spesa.</p><div id="field-families" class="field-families" role="group" aria-label="Famiglia della difesa"></div></div>
          <div><h2>Piazzole</h2><div id="field-slots" class="field-slots" role="group" aria-label="Piazzole della mappa"></div></div>
          <div class="field-inspection"><p id="field-route-legend" role="note" hidden></p><h2 id="field-selection-title">Scegli una piazzola</h2><p id="field-detail"></p></div>
          <div class="field-actions"><button id="field-cancel" type="button" hidden>Rimuovi anteprima</button></div>
        </aside>
        <aside id="movement-panel" class="field-panel" aria-label="Prova dei percorsi" hidden></aside>
        <aside id="combat-panel" class="field-panel" aria-label="Prova dei colpi" hidden></aside>
        <div id="economy-column" class="economy-column" hidden><section id="mission-guide" hidden></section><section id="boss-hud" hidden></section><aside id="economy-panel" class="field-panel" aria-label="Preparazione delle difese"></aside></div>
      </div>
      <footer class="field-footer"><p id="field-status" role="status">Le ondate non sono ancora disponibili.</p><span id="field-save-status" hidden>Non salvato</span><button id="wave-info" type="button" hidden>Dettagli ondata</button><p id="field-economy-legend" role="note" aria-label="Legenda dei percorsi" hidden></p></footer>
    </div>`;
  const mapSelect = element<HTMLSelectElement>(container, "#field-map");
  const canvas = element<HTMLCanvasElement>(container, "#game-canvas");
  const wrap = element<HTMLElement>(container, "#field-wrap");
  const panel = element<HTMLElement>(container, "#field-panel");
  const movementPanel = element<HTMLElement>(container, "#movement-panel");
  const combatPanel = element<HTMLElement>(container, "#combat-panel");
  const economyPanel = element<HTMLElement>(container, "#economy-panel");
  const economyColumn=element<HTMLElement>(container,"#economy-column");
  const kicker = element<HTMLElement>(container, ".field-kicker");
  const loading = element<HTMLElement>(container, "#field-loading");
  const notice = element<HTMLElement>(container, "#field-notice");
  const noticeTitle = element<HTMLElement>(container, "#field-notice-title");
  const noticeText = element<HTMLElement>(container, "#field-notice-text");
  const resume = element<HTMLButtonElement>(container, "#field-resume");
  const errorPanel = element<HTMLElement>(container, "#field-error");
  const errorText = element<HTMLElement>(container, "#field-error-text");
  const retry = element<HTMLButtonElement>(container, "#field-retry");
  const routes = element<HTMLButtonElement>(container, "#field-routes");
  const back = element<HTMLButtonElement>(container, "#field-back");
  const familyList = element<HTMLElement>(container, "#field-families");
  const slotList = element<HTMLElement>(container, "#field-slots");
  const selectedTitle = element<HTMLElement>(
    container,
    "#field-selection-title",
  );
  const detail = element<HTMLElement>(container, "#field-detail");
  const cancel = element<HTMLButtonElement>(container, "#field-cancel");
  const status = element<HTMLElement>(container, "#field-status");
  const economyLegend = element<HTMLElement>(container, "#field-economy-legend");
  const description = element<HTMLElement>(container, "#field-description");
  const routeLegend = element<HTMLElement>(container, "#field-route-legend");
  const inspection = element<HTMLElement>(container, ".field-inspection");
  const images = new FieldImages();
  let currentMap: FieldMap = fieldMaps[0]!;
  let mode: PreviewMode = "field";
  let missionActive=false;
  let active = false,
    selectedSlot: string | null = null,
    selectedFamily: Family | null = null;
  let suspension: "focus" | "size" | null = null,
    phase: "loading" | "ready" | "error" = "loading";
  let showRoutes = false,
    sequence = 0,
    renderer: FieldRenderer | null = null;
  let art: {
    background: HTMLImageElement;
    tokens: Record<Family, HTMLImageElement>;
    towerArt?: TowerArt;
    enemyArt?: EnemyArt;
  } | null = null;
  const adequate = (): boolean => innerWidth >= 1024 && innerHeight >= 720;
  let previousAdequate = adequate();
  const enabled = (): boolean =>
    active && adequate() && suspension === null && phase === "ready";
  const announce = (text: string): void => {
    status.textContent = text;
  };
  const movement = createMovementPreview(movementPanel, () => draw(), announce);
  const combat = createCombatPreview(combatPanel, () => draw(), announce);
  const waveControls=element<HTMLElement>(container,"#wave-controls"),waveInfo=element<HTMLButtonElement>(container,"#wave-info");
  const pausedBadge=element<HTMLElement>(container,"#wave-paused-badge");
  const focusField=():void=>{if(active){if(!resume.hidden)resume.focus();else if(missionActive)back.focus();else mapSelect.focus();}};
  const economy = createEconomyPreview(economyPanel, () => draw(), announce,focusField,{
    context:()=>missionActive?"mission":"lab",
    onSelect:()=>audio.uiCue("ui-select"),
    onTransaction:result=>audio.uiCue(result.ok?(result.change>0?"ui-sell":"ui-build"):"ui-invalid"),
    onDialog:()=>{if(mode==="waves")waves.suspend();},
    onReset:()=>{if(mode==="waves")waves.reset();else economy.setMap(currentMap);},
  });
  element<HTMLButtonElement>(container,"#field-settings").addEventListener("click",event=>openSettings(event.currentTarget as HTMLElement));
  const bossHud=createBossHud(element<HTMLElement>(container,"#boss-hud"));
  let detachSounds:()=>void=()=>{};
  const waves=createWavePreview(waveControls,waveInfo,economy,()=>draw(),announce,focusField,bossHud,{
    onSession:(session,map)=>{detachSounds();audio.enterField();detachSounds=attachSounds(session,audio,map.waterSegment);},
    onPresentationState:(session,value)=>audio.setGameState(session.phase,value,currentMap.id==="dino-05"&&session.wave===currentMap.waves.length?"boss":currentMap.id==="dino-02"||currentMap.id==="dino-03"?"wetland":"forest"),
    onEvents:events=>{for(const event of events){if(event.type==="started")audio.play("wave-start");else if(event.type==="cleared")audio.play("wave-clear");else if(event.type==="won"||event.type==="lost")audio.end(event.type==="won");}},
    onUpdate:(session,value)=>{mission.update(session,value);if(missionActive)economyPanel.querySelector("h2")!.textContent="Difese del portale";},onResult:session=>mission.result(session),
    resetMap:map=>missionActive?missionMap():map,
  });
  const mission=createSagaMission(element<HTMLElement>(container,"#mission-guide"),{
    profile,map:()=>closeField(),
    enter:()=>{document.getElementById("intro")!.hidden=true;openView("waves",true);},
    restart:()=>{currentMap=missionMap();waves.setMap(currentMap);},suspend:()=>{if(active)waves.suspend();},focus:focusField,

  });
  function missionMap():FieldMap {const map=fieldMaps.find(map=>map.id===mission.currentId())!;return{...map,firstEntryTowers:mission.arsenal()};}
  const isEconomy=():boolean=>mode==="economy"||mode==="waves";

  function draw(): void {
    mission.refresh();
    pausedBadge.hidden=mode!=="waves"||waves.phase()!=="paused"||!enabled();
    if (!enabled() || !renderer || !art) return;
    const width = Math.min(wrap.clientWidth - 2, (wrap.clientHeight - 2) * 1.5),
      height = width / 1.5;
    if (width <= 0 || height <= 0) return;
    renderer.resize(width, height);
    const renderState: FieldRenderState = {
      map: currentMap,
      ...art,
      selectedSlot: isEconomy() ? economy.selection().slot : mode === "combat" ? combat.selection().slot : selectedSlot,
      family: isEconomy() ? economy.selection().family : mode === "combat" ? combat.selection().family : selectedFamily,
      showRoutes,
      movement: mode === "movement" ? movement.markers() : [],
      ...(mode === "combat" ? {combat:combat.visual(),rangeOverride:combat.selection().range} : {}),
      ...(isEconomy() ? {towers:economy.towers(),coverageRoute:economy.selection().route,...(economy.selection().range===null?{}:{rangeOverride:economy.selection().range!})} : {}),
      ...(mode==="waves"?{wavePhase:waves.phase(),waveMarkers:waves.markers(),combat:waves.visual(),...(waves.boss()?{boss:waves.boss()!}:{}),...(waves.controller()?{towerController:waves.controller()!}:{}),...(art.towerArt?{towerArt:art.towerArt}:{}),...(art.enemyArt?{enemyArt:art.enemyArt}:{})}:{}),
    };
    try {
      renderer.draw(renderState);
    } catch(error) {
      console.error("Time Defense field rendering",error);
      phase = "error";
      errorText.textContent =
        "Non siamo riusciti a disegnare la mappa. Riprova o torna alla presentazione.";
      update();
    }
  }
  function update(): void {
    if (!active) return;
    const blocked = !adequate() || suspension !== null;
    canvas.hidden = phase !== "ready" || blocked;
    panel.hidden = phase !== "ready" || blocked || mode !== "field";
    movementPanel.hidden = phase !== "ready" || blocked || mode !== "movement";
    combatPanel.hidden = phase !== "ready" || blocked || mode !== "combat";
    economyColumn.hidden = phase !== "ready" || blocked || !isEconomy();
    if(mode==="waves")waves.setEnabled(enabled());else{waves.setEnabled(false);economy.setEnabled(enabled()&&mode==="economy");}
    waveControls.hidden=mode!=="waves";waveInfo.hidden=mode!=="waves";
    container.classList.toggle("wave-mode",mode==="waves");routes.hidden=mode==="waves";
    economyLegend.hidden=mode!=="economy"||!showRoutes||!enabled();
    economyLegend.textContent=currentMap.routeLegend;
    combat.setEnabled(enabled() && mode === "combat");
    combat.setRoutesVisible(showRoutes);
    movement.setEnabled(enabled() && mode === "movement");
    movement.setRoutesVisible(showRoutes);
    kicker.textContent = missionActive?"Missione "+(missionIds.indexOf(mission.currentId())+1)+" · "+mission.title():mode==="waves"?"Prova delle ondate":mode === "economy" ? "Preparazione in prova" : mode === "combat" ? "Prova del combattimento" : mode === "movement" ? "Prova del movimento" : "Campo in anteprima";
    loading.hidden = phase !== "loading" || blocked;
    notice.hidden = !blocked || phase === "error";
    errorPanel.hidden = phase !== "error";
    routes.disabled = !enabled();
    resume.hidden = !blocked || !adequate() || phase !== "ready";
    if (!adequate()) {
      noticeTitle.textContent = "Serve più spazio per la mappa";
      noticeText.textContent =
        "Allarga la finestra ad almeno 1024 × 720 pixel. Puoi scegliere un’ambientazione o tornare alla presentazione. L’anteprima resta ferma.";
    } else {
      noticeTitle.textContent = "Anteprima in pausa";
      noticeText.textContent =
        "Premi Riprendi anteprima quando sei pronto. Il ritorno alla finestra non riprende da solo.";
    }
    routes.textContent = showRoutes ? "Nascondi percorsi" : "Mostra percorsi";
    routes.setAttribute("aria-pressed", String(showRoutes));
    routeLegend.hidden = !showRoutes || !enabled();
    routeLegend.textContent = currentMap.routeLegend;
    for (const button of familyList.querySelectorAll<HTMLButtonElement>(
      "button",
    )) {
      button.disabled = !enabled();
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.family === selectedFamily),
      );
    }
    for (const button of slotList.querySelectorAll<HTMLButtonElement>(
      "button",
    )) {
      button.disabled = !enabled();
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.slot === selectedSlot),
      );
    }
    cancel.hidden = selectedFamily === null;
    cancel.disabled = !enabled();
    selectedTitle.textContent = selectedSlot
      ? "Piazzola " + selectedSlot
      : "Scegli una piazzola";
    detail.textContent = selectedFamily
      ? baseTowers[selectedFamily].family +
        " Base. Gittata " +
        baseTowers[selectedFamily].range +
        ". Effetto previsto: " +
        baseTowers[selectedFamily].note.replace(/[.\s]+$/, "") +
        ". " +
        (selectedSlot ? "" : "Seleziona una piazzola per vedere il raggio.")
      : "Scegli una famiglia per confrontarne il raggio. Puoi usare il terreno o i pulsanti delle piazzole.";
    description.textContent = mode === "waves"&&currentMap.id==="dino-05" ? "Un solo giro al portale centrale, senza scorciatoie. Esc mette in pausa." : mode === "waves" ? "Le difese attaccano automaticamente. Esc mette in pausa. Dettagli mostra creature e prossimi ingressi."
      : mode === "economy" ? currentMap.name+": difese sulle piazzole. ● indica occupata."
      : mode === "combat" ? currentMap.name+": campioni con Carica, colpi e tempo manuale."
      : mode === "movement"
      ? currentMap.name + ": segnaposti numerati dal proprio ingresso al portale."
      : currentMap.description;
    canvas.setAttribute(
      "aria-label",
      currentMap.name + ". " + description.textContent,
    );
    canvas.dataset.mapId = currentMap.id;
    draw();
  }
  function populateSlots(): void {
    inspection.scrollTop = 0;
    slotList.replaceChildren();
    for (const slot of currentMap.slots) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = slot.id;
      button.dataset.slot = slot.id;
      button.setAttribute("aria-label", "Piazzola " + slot.id);
      button.setAttribute("aria-pressed", "false");
      button.addEventListener("click", () => selectSlot(slot.id));
      slotList.append(button);
    }
  }
  function selectSlot(id: string): void {
    if (!enabled() || !currentMap.slots.some((s) => s.id === id)) return;
    selectedSlot = id;
    announce(
      "Piazzola " +
        id +
        " selezionata." +
        (selectedFamily
          ? " " +
            baseTowers[selectedFamily].family +
            " in anteprima, gittata " +
            baseTowers[selectedFamily].range +
            ". Nessuna risorsa spesa."
          : " Scegli una difesa per confrontarne il raggio."),
    );
    update();
  }
  async function loadMap(): Promise<void> {
    const request = ++sequence;
    const restoreAfterRetry = document.activeElement === retry;
    retry.disabled = true;
    phase = "loading";
    art = null;
    announce("Caricamento di " + currentMap.name + "…");
    update();
    try {
      renderer ??= new FieldRenderer(canvas);
      const requestedMap = currentMap;
      const [loadedArt,towerArt,enemyArt] = await Promise.all([
        Promise.all([images.load(requestedMap.background),...families.map((f)=>images.load(familyArt[f]))]),
        mode==="waves"?loadTowerArt(images):Promise.resolve(undefined),
        mode==="waves"?loadEnemyArt(images,[...new Set(requestedMap.waves.flatMap(wave=>wave.groups.map(group=>group.enemy)))]):Promise.resolve(undefined),
      ]);
      const [background,...tokens]=loadedArt;
      if (!active || request !== sequence) return;
      if (!background) throw new Error("Missing map background.");
      const tokenRecord = Object.fromEntries(
        families.map((f, i) => {
          const image = tokens[i];
          if (!image) throw new Error("Missing family token.");
          return [f, image];
        }),
      ) as Record<Family, HTMLImageElement>;
      art = { background, tokens: tokenRecord,...(towerArt?{towerArt}:{}),...(enemyArt?{enemyArt}:{}) };
      phase = "ready";
      retry.disabled = false;
      announce(
        currentMap.name +
          " pronta." +
          (!adequate()
            ? " Il campo richiede una finestra di almeno 1024 × 720 pixel."
            : suspension
              ? " L’anteprima resta in pausa."
              : mode === "waves"
                ? " Prepara le difese e avvia l’ondata. Attaccheranno automaticamente quando le creature saranno in gittata."
              : mode === "economy"
                ? " Scegli una famiglia e una piazzola. Soltanto Costruisci spende Scintille; le ondate non sono ancora disponibili."
                : mode === "combat"
                ? " Scegli il profilo e lancia un colpo. Il tempo avanza solo dai pulsanti."
                : mode === "movement"
                ? " Premi Avvia prova per seguire i percorsi. Le ondate non sono ancora disponibili."
                : " Seleziona una piazzola. Le ondate non sono ancora disponibili."),
      );
      update();
      if (restoreAfterRetry)
        focusField();
    } catch {
      if (!active || request !== sequence) return;
      phase = "error";
      retry.disabled = false;
      errorText.textContent = renderer
        ? "Una risorsa della mappa non è disponibile. Scegli un’altra ambientazione oppure riprova il caricamento."
        : "Questo browser non riesce a disegnare il campo. Puoi tornare alla presentazione.";
      announce("La mappa non è disponibile.");
      update();
      if (restoreAfterRetry) retry.focus();
    }
  }
  for (const map of fieldMaps) {
    const option = document.createElement("option");
    option.value = map.id;
    option.textContent = stories[map.id as MissionId]?.title??map.name;
    mapSelect.append(option);
  }
  for (const family of families) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.family = family;
    button.setAttribute("aria-pressed", "false");
    const image = document.createElement("img");
    image.alt = "";
    image.width = image.height = 32;
    image.loading = "lazy";
    image.src = familyArt[family];
    const label = document.createElement("span");
    label.textContent = baseTowers[family].family;
    const range = document.createElement("span");
    range.className = "family-range";
    range.textContent = "Gittata " + baseTowers[family].range;
    label.append(range);
    button.append(image, label);
    button.addEventListener("click", () => {
      if (!enabled()) return;
      selectedFamily = family;
      announce(
        baseTowers[family].family +
          " selezionata." +
          (selectedSlot
            ? " Anteprima sulla piazzola " + selectedSlot + "."
            : " Scegli una piazzola."),
      );
      update();
    });
    familyList.append(button);
  }
  mapSelect.addEventListener("change", () => {
    if(missionActive){mapSelect.value=currentMap.id;return;}
    const map = fieldMaps.find((m) => m.id === mapSelect.value);
    if (!map) return;
    const applyMap=():void=>{
      currentMap=map;mapSelect.value=map.id;
      if(mode==="movement")movement.setMap(currentMap);
      if(mode==="combat")combat.setMap(currentMap);
      if(mode==="economy")economy.setMap(currentMap);
      if(mode==="waves")waves.setMap(currentMap);
      selectedSlot=null;populateSlots();void loadMap();
    };
    if(isEconomy()){
      mapSelect.value=currentMap.id;
      if(mode==="waves")waves.requestLeave(applyMap,()=>mapSelect.focus());else economy.requestLeave(applyMap,()=>mapSelect.focus());
    } else applyMap();
  });
  routes.addEventListener("click", () => {
    if (!enabled()) return;
    showRoutes = !showRoutes;
    if (showRoutes) inspection.scrollTop = 0;
    update();
    announce(showRoutes ? "Percorsi evidenziati." : "Percorsi nascosti.");
  });
  function clearPreview(): void {
    if (!enabled()) return;
    const old = selectedFamily,
      wasCancel = document.activeElement === cancel;
    selectedFamily = null;
    update();
    if (wasCancel)
      familyList
        .querySelector<HTMLButtonElement>('[data-family="' + old + '"]')
        ?.focus();
    announce("Anteprima rimossa. Nessuna risorsa è stata spesa.");
  }
  cancel.addEventListener("click", clearPreview);
  const closeField=():void=>{
    movement.suspend();
    waves.suspend();
    active = false;
    mission.setActive(false);
    sequence++;
    container.hidden = true;
    document.body.classList.remove("field-open");
    onClose(missionActive?mission.currentId():null);
    detachSounds();audio.menu();
  };
  back.addEventListener("click",()=>{
    if(mode==="waves")waves.requestLeave(closeField,()=>{if(!container.hidden)back.focus();});
    else if(mode==="economy")economy.requestLeave(closeField,()=>{if(!container.hidden)back.focus();});
    else closeField();
  });
  retry.addEventListener("click", () => {
    void loadMap();
  });
  resume.addEventListener("click", () => {
    if (!adequate() || phase !== "ready") return;
    suspension = null;
    update();
    focusField();
    announce("Anteprima ripresa.");
  });
  canvas.addEventListener("click", (event) => {
    if (!enabled() || event.detail>1 || (mode !== "field" && !isEconomy())) return;
    const rect = canvas.getBoundingClientRect(),
      camera = fitCamera(rect.width, rect.height);
    const slot = pickSlot(
      unproject(
        { x: event.clientX - rect.left, y: event.clientY - rect.top },
        camera,
      ),
      currentMap.slots,
      22 / camera.scale,
    );
    if (slot) {if(isEconomy())economy.selectSlot(slot.id);else selectSlot(slot.id);}
    else
      announce(
        "Qui non c’è una piazzola. Scegli uno dei cerchi o usa i pulsanti delle piazzole.",
      );
  });
  canvas.addEventListener("mousemove", (event) => {
    if (!enabled() || (mode !== "field" && !isEconomy())) return;
    const rect = canvas.getBoundingClientRect(),
      camera = fitCamera(rect.width, rect.height);
    const hit = pickSlot(
      unproject(
        { x: event.clientX - rect.left, y: event.clientY - rect.top },
        camera,
      ),
      currentMap.slots,
      22 / camera.scale,
    );
    canvas.style.cursor = hit ? "pointer" : "default";
  });
  window.addEventListener("keydown", (event) => {
    if(event.target instanceof Element&&event.target.closest("dialog"))return;
    if (
      !enabled() ||
      event.key !== "Escape" ||
      event.target instanceof HTMLSelectElement
    )
      return;
    event.preventDefault();
    if(mode==="waves"){waves.suspend();return;}
    if(mode==="economy"){if(!economy.isDialogOpen())economy.clearSelection();return;}
    if (mode === "combat") {
      announce("La prova è ferma. Avanza il tempo soltanto quando sei pronto.");
      return;
    }
    if (mode === "movement") {
      movement.suspend();
      announce("Prova del movimento in pausa.");
      return;
    }
    clearPreview();
  });
  const suspend = (): void => {
    if (!active) return;
    suspension = "focus";
    announce("Anteprima in pausa. Riprendi quando sei pronto.");
    update();
  };
  window.addEventListener("blur", suspend);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) suspend();
  });
  window.addEventListener("resize", () => {
    if (!active) return;
    const fits = adequate();
    if (!fits) {
      if (suspension !== "size")
        announce(
          "Anteprima sospesa: serve una finestra di almeno 1024 × 720 pixel.",
        );
      suspension = "size";
    } else if (!previousAdequate)
      announce(
        "Ora c’è spazio per la mappa. Premi Riprendi anteprima quando sei pronto.",
      );
    previousAdequate = fits;
    update();
  });
  new ResizeObserver(() => draw()).observe(wrap);
  function openView(nextMode:PreviewMode="field",asMission=false):void {
      audio.enterField();waves.setEnabled(false);phase="loading";
      missionActive=asMission;mission.setActive(asMission);mapSelect.disabled=asMission;
      if(asMission)currentMap=missionMap();else currentMap=fieldMaps.find(map=>map.id===currentMap.id)??fieldMaps[0]!;
      mapSelect.value=currentMap.id;
      mode = nextMode;
      showRoutes = mode !== "field";
      if (mode === "movement") {
        selectedFamily = null;
        selectedSlot = null;
        movement.setMap(currentMap);
      }
      if (mode === "combat") combat.setMap(currentMap);
      if (mode === "economy") economy.setMap(currentMap);
      if (mode === "waves") waves.setMap(currentMap);
      active = true;
      previousAdequate = adequate();
      suspension = adequate() ? null : "size";
      container.hidden = false;
      document.body.classList.add("field-open");
      populateSlots();
      focusField();
      void loadMap();
  }
  return {
    open:mode=>openView(mode),startMission:level=>mission.start(level),showNotes:()=>mission.showNotes(),showIntro:()=>mission.showIntro(),suspend:()=>{waves.suspend();movement.suspend();},
  };
}
