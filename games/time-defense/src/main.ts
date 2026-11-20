import "./style.css";
import { GameAudio } from "./audio/runtime";
import { setDialogAudioHooks } from "./economy/dialog";
import forestUrl from "../art-source/maps/foresta/fondale-v1.png?url";
import { startShell } from "./shell";
import { createFieldView } from "./field/view";
import { fieldMaps } from "./field/catalog";
import { missionIds, stories } from "./mission/content";
import { browserProfileStore } from "./profile/store";
import { canEnter, sagaComplete, starsForRatio } from "./profile/model";
import { ratioText } from "./profile/format";
import { createProfileUI } from "./profile/ui";
import { setReducedMotionPreference } from "./motion-preference";
import liaUrl from "../art-source/characters/lia-osserva.png?url";

try {
  document.body.classList.add("js-enabled");
  startShell(forestUrl);
  const fieldContainer = document.getElementById("field-view"),
    intro = document.getElementById("intro"),
    open = document.querySelector<HTMLButtonElement>("#open-field"),
    openMovement = document.querySelector<HTMLButtonElement>("#open-movement"),
    openCombat = document.querySelector<HTMLButtonElement>("#open-combat"),
    openEconomy = document.querySelector<HTMLButtonElement>("#open-economy"),
    openWaves = document.querySelector<HTMLButtonElement>("#open-waves");
  if (
    !fieldContainer ||
    !intro ||
    !open ||
    !openMovement ||
    !openCombat ||
    !openEconomy ||
    !openWaves
  )
    throw new Error("Missing field entry controls.");
  const laboratory = document.querySelector<HTMLDetailsElement>("#lab-tools")!;
  laboratory.hidden = !new URLSearchParams(location.search).has("laboratorio");
  laboratory.open = !laboratory.hidden;
  const profile = browserProfileStore(),
    audio = new GameAudio();
  audio.setPreferences(profile.profile.preferences);
  setDialogAudioHooks(
    (result) => {
      audio.stopListening();
      if (!result) audio.pause();
    },
    () => audio.stopListening(),
  );
  const audioButton =
    document.querySelector<HTMLButtonElement>("#audio-toggle")!;
  const updateAudio = () => {
    audioButton.textContent = !audio.enabled
      ? "Attiva audio"
      : profile.profile.preferences.muted
        ? "Riattiva audio"
        : !audio.running
          ? "Riprendi audio"
          : "Silenzia audio";
    audioButton.setAttribute(
      "aria-label",
      audioButton.textContent + ". " + audio.status,
    );
  };
  audio.subscribe(updateAudio);
  updateAudio();
  audioButton.addEventListener("click", () => {
    if (!audio.enabled) {
      if (profile.profile.preferences.muted) profile.settings({ muted: false });
      void audio.activate(true);
    } else if (!audio.running && !profile.profile.preferences.muted)
      audio.menu();
    else {
      profile.settings({ muted: !profile.profile.preferences.muted });
      if (!profile.profile.preferences.muted) audio.menu();
    }
  });
  const quiet = () => {
    audio.stopListening();
    audio.pause(true);
  };
  window.addEventListener("blur", quiet);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) quiet();
  });
  let returnFocus = open;
  const field = createFieldView(
    fieldContainer,
    (missionId) => {
      intro.hidden = false;
      if (missionId)
        document
          .getElementById(
            missionId === "dino-01"
              ? "open-mission"
              : missionId === "dino-02"
                ? "open-river"
                : missionId === "dino-03"
                  ? "open-swamp"
                  : missionId === "dino-04"
                    ? "open-plateau"
                    : "open-rift",
          )
          ?.focus();
      else returnFocus.focus();
    },
    profile,
    (opener) => profileUI.showSettings(opener),
    audio,
  );
  const profileUI = createProfileUI(profile, () => field.suspend(), audio);
  document.querySelector<HTMLImageElement>("#menu-lia")!.src = liaUrl;
  const buttons = [
    "open-mission",
    "open-river",
    "open-swamp",
    "open-plateau",
    "open-rift",
  ];
  // Native lazy loading can fetch images several screens ahead. Load only
  // visible cards, including when the player scrolls the campaign menu.
  const menuImages = new IntersectionObserver((entries) => {
    for (const entry of entries)
      if (entry.isIntersecting) {
        const image = entry.target as HTMLImageElement;
        image.src = image.dataset.source!;
        menuImages.unobserve(image);
      }
  });
  for (const [index, id] of missionIds.entries()) {
    const button = document.getElementById(buttons[index]!)!,
      card = document.createElement("article"),
      map = fieldMaps.find((map) => map.id === id)!;
    card.className = "campaign-card";
    card.dataset.level = id;
    const image = new Image();
    image.dataset.source = map.background;
    image.alt = "";
    image.width = 320;
    image.height = 180;
    menuImages.observe(image);
    const title = document.createElement("h2");
    title.id = "title-" + id;
    title.textContent = index + 1 + " · " + stories[id].title;
    const record = document.createElement("p");
    record.id = "record-" + id;
    button.setAttribute("aria-describedby", record.id);
    button.setAttribute("aria-labelledby", title.id + " " + button.id);
    button.before(card);
    card.append(image, title, record, button);
  }
  const continueButton =
    document.querySelector<HTMLButtonElement>("#continue-saga")!;
  function renderMenu(): void {
    setReducedMotionPreference(profile.profile.preferences.motion === "reduce");
    audio.setPreferences(profile.profile.preferences);
    updateAudio();
    document.querySelector("#campaign-summary")!.textContent = sagaComplete(
      profile.profile,
    )
      ? "Saga completata. Tutti i cinque livelli sono rigiocabili."
      : "Saga dei dinosauri · " +
        Object.keys(profile.profile.wins).length +
        " di 5 livelli completati. Le stelle non sono un requisito.";
    for (const [index, id] of missionIds.entries()) {
      const button = document.getElementById(
          buttons[index]!,
        ) as HTMLButtonElement,
        record = document.getElementById("record-" + id)!,
        best = profile.profile.wins[id];
      button.disabled = !canEnter(profile.profile, id);
      button.textContent = best
        ? "Rigioca"
        : button.disabled
          ? "Completa " + stories[missionIds[index - 1]!].title
          : "Gioca";
      record.textContent = best
        ? starsForRatio(best.ratio) +
          (starsForRatio(best.ratio) === 1 ? " stella" : " stelle") +
          " · Stabilità migliore " +
          ratioText(best.ratio) +
          " · Tempo migliore " +
          (best.seconds / 60).toLocaleString("it-IT", {
            maximumFractionDigits: 1,
          }) +
          " min"
        : button.disabled
          ? "Livello chiuso"
          : profile.profile.visited.includes(id)
            ? "Visitato · ancora da completare"
            : "Pronto per iniziare";
    }
    continueButton.hidden = false;
    continueButton.textContent = sagaComplete(profile.profile)
      ? "Rigioca il finale"
      : profile.profile.visited.length
        ? "Continua la saga"
        : "Inizia la saga";
    const notes = document.querySelector<HTMLButtonElement>("#open-notes")!;
    notes.hidden = !profile.profile.visited.length;
    notes.disabled = !profile.profile.visited.length;
    notes.textContent = profile.profile.visited.includes("dino-02")
      ? "Appunti dell’Atlante"
      : "Appunti della Foresta";
    profileUI.refresh();
  }
  profile.subscribe(renderMenu);
  renderMenu();
  document
    .querySelector("#open-settings")!
    .addEventListener("click", (event) =>
      profileUI.showSettings(event.currentTarget as HTMLElement),
    );
  document
    .querySelector("#reread-intro")!
    .addEventListener("click", () => field.showIntro());
  continueButton.addEventListener("click", () =>
    field.startMission(
      missionIds.find((id) => !profile.profile.wins[id]) ?? "dino-05",
    ),
  );
  const mission = document.querySelector<HTMLButtonElement>("#open-mission")!,
    notes = document.querySelector<HTMLButtonElement>("#open-notes")!;
  mission.disabled = false;
  mission.addEventListener("click", () => {
    returnFocus = mission;
    field.startMission();
  });
  notes.addEventListener("click", () => field.showNotes());
  document.getElementById("open-river")!.addEventListener("click", () => {
    returnFocus = document.querySelector<HTMLButtonElement>("#open-river")!;
    field.startMission("dino-02");
  });
  document.getElementById("open-swamp")!.addEventListener("click", () => {
    returnFocus = document.querySelector<HTMLButtonElement>("#open-swamp")!;
    field.startMission("dino-03");
  });
  document.getElementById("open-plateau")!.addEventListener("click", () => {
    returnFocus = document.querySelector<HTMLButtonElement>("#open-plateau")!;
    field.startMission("dino-04");
  });
  document.getElementById("open-rift")!.addEventListener("click", () => {
    returnFocus = document.querySelector<HTMLButtonElement>("#open-rift")!;
    field.startMission("dino-05");
  });
  open.disabled = false;
  open.addEventListener("click", () => {
    returnFocus = open;
    intro.hidden = true;
    field.open();
  });
  openMovement.disabled = false;
  openMovement.addEventListener("click", () => {
    returnFocus = openMovement;
    intro.hidden = true;
    field.open("movement");
  });
  openCombat.disabled = false;
  openCombat.addEventListener("click", () => {
    returnFocus = openCombat;
    intro.hidden = true;
    field.open("combat");
  });
  openEconomy.disabled = false;
  openEconomy.addEventListener("click", () => {
    returnFocus = openEconomy;
    intro.hidden = true;
    field.open("economy");
  });
  openWaves.disabled = false;
  openWaves.addEventListener("click", () => {
    returnFocus = openWaves;
    intro.hidden = true;
    field.open("waves");
  });
} catch (error) {
  const status = document.getElementById("boot-status");
  if (status) {
    status.setAttribute("role", "alert");
    status.textContent =
      "L’anteprima non si è aperta. Ricarica la pagina per riprovare.";
  }
  console.error("Time Defense bootstrap:", error);
}
