import { createEconomyDialog } from "../economy/dialog";
import type { WaveSession } from "../waves/session";
import {
  allGuideNotes,
  introduction,
  epilogue,
  missionGuide,
  missionIds,
  stories,
} from "./content";
import type { MissionId } from "./content";
import forest from "../../docs/livelli/dino-01.json";
import river from "../../docs/livelli/dino-02.json";
import towerData from "../../docs/dati-torri.json";
import liaUrl from "../../art-source/characters/lia-osserva.png?url";
import ticUrl from "../../art-source/characters/tic-osserva.png?url";
import "./style.css";
import { starsForRatio } from "../profile/model";
import type { ProfileStore } from "../profile/store";
function portrait(who: "Lia" | "Tic"): HTMLElement {
  const row = document.createElement("div");
  row.className = "mission-speaker";
  const image = new Image();
  image.src = who === "Lia" ? liaUrl : ticUrl;
  image.alt = "";
  image.width = image.height = 96;
  const name = document.createElement("p");
  name.textContent = who;
  row.append(image, name);
  return row;
}
interface MissionOptions {
  readonly enter: () => void;
  readonly restart: () => void;
  readonly suspend: () => void;
  readonly focus: () => void;
  readonly map: () => void;
  readonly profile: ProfileStore;
}
// Campaign records are persisted separately from the disposable battle session.
export function createSagaMission(host: HTMLElement, options: MissionOptions) {
  const dialog = createEconomyDialog(options.suspend),
    store = options.profile;
  let dialogOpener: HTMLElement | null = null,
    attemptEpoch = store.epoch;
  let id: MissionId = "dino-01",
    active = false,
    session: WaveSession | null = null,
    available = false,
    lastHint = "";
  host.className = "mission-guide";
  host.hidden = true;
  host.innerHTML = `<h2></h2><div class="mission-actions"><button id="mission-skip" type="button">Salta guida</button><button id="mission-notes" type="button">Appunti</button><button id="mission-card" type="button"></button></div><div class="mission-guide-text" tabindex="0" aria-label="Guida del livello, area scorrevole"><p id="mission-arrival"></p><p id="mission-hint" role="status"></p></div><p id="mission-scroll-hint" class="mission-scroll-hint" hidden>Scorri il testo qui sopra per continuare.</p>`;
  const hint = host.querySelector<HTMLElement>("#mission-hint")!,
    arrival = host.querySelector<HTMLElement>("#mission-arrival")!,
    skip = host.querySelector<HTMLButtonElement>("#mission-skip")!,
    cardButton = host.querySelector<HTMLButtonElement>("#mission-card")!;
  const restore = () => {
    if (dialog.isOpen()) return;
    if (dialogOpener?.isConnected && dialogOpener.getClientRects().length)
      dialogOpener.focus();
    else if (active) options.focus();
  };
  const canEnter = (level: MissionId): boolean => {
    const index = missionIds.indexOf(level);
    return (
      index === 0 ||
      (index > 0 && Boolean(store.profile.wins[missionIds[index - 1]!]))
    );
  };
  function enter(next: MissionId): void {
    if (!canEnter(next)) return;
    id = next;
    attemptEpoch = store.epoch;
    session = null;
    options.enter();
  }
  function intro(step = 0, launch = true): void {
    if (step === 0)
      dialogOpener =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
    const finish = () => {
      store.introSeen();
      if (launch) enter("dino-01");
    };
    dialog.open({
      title: "L’Atlante spezzato · " + (step + 1) + "/2",
      paragraphs: [introduction[step]!],
      content: (() => {
        const group = document.createElement("div");
        group.className = "mission-companions";
        group.append(portrait("Lia"), portrait("Tic"));
        return group;
      })(),
      confirmText:
        step === 0 ? "Avanti" : launch ? "Entra nella Foresta" : "Chiudi",
      cancelText: launch ? "Salta introduzione" : "Chiudi",
      onConfirm: () => {
        if (step === 0) intro(1, launch);
        else finish();
      },
      onCancel: () => {
        if (launch) finish();
      },
      restoreFocus: restore,
    });
  }
  function showCard(level: MissionId = id): void {
    if (!store.profile.visited.includes(level)) return;
    dialogOpener =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const card = stories[level].card,
      body = document.createElement("div");
    if (card.periods) {
      const caption = document.createElement("p");
      caption.textContent = "Dal più antico al più recente:";
      body.append(caption);
      const list = document.createElement("ol");
      list.className = "mission-periods";
      list.setAttribute("aria-label", "Successione dei periodi del Mesozoico");
      for (const period of card.periods) {
        const item = document.createElement("li");
        item.textContent = period;
        list.append(item);
      }
      body.append(list);
    }
    if (card.present) {
      const today = document.createElement("p");
      today.className = "mission-present";
      today.innerHTML =
        '<svg viewBox="0 0 64 48" width="48" height="36" aria-hidden="true"><path fill="#a9ebd7" d="M5 35l15-4c-2-14 6-22 18-16 0-12 17-13 20-2l-4 10c-4 15-25 21-36 11z"/><path fill="#f4b32f" d="M56 14l8 4-9 3z"/><circle fill="#071e25" cx="50" cy="12" r="2"/></svg>';
      const label = document.createElement("span");
      label.textContent = card.present;
      today.append(label);
      body.append(today);
    }
    for (const source of card.sources ?? [
      {
        title: "EPA, Ecological Condition",
        url: "https://www.epa.gov/report-environment/ecological-condition",
      },
    ]) {
      const link = document.createElement("a");
      link.href = source.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "Fonte: " + source.title + " (altra scheda)";
      body.append(link);
    }
    dialog.open({
      title: card.id + " · " + card.title,
      paragraphs: [
        card.question,
        "Nel mondo reale: " + card.real,
        "Nel gioco: " + card.game,
        "Nessun quiz. La partita resta ferma alla chiusura.",
      ],
      content: body,
      restoreFocus: restore,
    });
  }
  function showNotes(): void {
    if (!store.profile.visited.length) return;
    dialogOpener =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const body = document.createElement("div"),
      cards = document.createElement("div");
    cards.className = "mission-note-cards";
    body.append(cards);
    for (const level of missionIds) {
      if (!store.profile.visited.includes(level)) continue;
      const story = stories[level],
        button = document.createElement("button");
      button.type = "button";
      button.textContent = "Apri " + story.card.id + " · " + story.card.title;
      button.addEventListener("click", () => {
        dialog.cancel();
        showCard(level);
      });
      cards.append(button);
    }
    const section = (title: string, texts: readonly string[]) => {
      const details = document.createElement("details"),
        summary = document.createElement("summary");
      summary.textContent = title;
      details.append(summary);
      for (const text of texts) {
        const paragraph = document.createElement("p");
        paragraph.textContent = text;
        details.append(paragraph);
      }
      body.append(details);
    };
    section("Rileggi il racconto", [
      ...introduction,
      ...missionIds.flatMap((level) => {
        if (!store.profile.visited.includes(level)) return [];
        const story = stories[level];
        return [
          story.title +
            ". " +
            story.arrivalSpeaker +
            ": «" +
            story.arrival +
            "»",
          ...(store.profile.wins[level]
            ? [
                story.endingSpeaker + ": «" + story.ending + "»",
                ...(level === "dino-05" ? [epilogue] : []),
              ]
            : []),
        ];
      }),
    ]);
    section(
      "Consulta la guida dei livelli visitati",
      missionIds.flatMap((level) =>
        store.profile.visited.includes(level)
          ? [stories[level].title, ...allGuideNotes(level)]
          : [],
      ),
    );
    dialog.open({
      title: store.profile.visited.includes("dino-02")
        ? "Appunti dell’Atlante"
        : "Appunti della Foresta",
      paragraphs: [
        store.saved
          ? "Scoperte e sblocchi sono conservati sul dispositivo."
          : "Scoperte e sblocchi restano nella sessione, ma non sono salvati sul dispositivo.",
      ],
      content: body,
      contentFirst: true,
      restoreFocus: restore,
    });
  }

  function refresh(): void {
    host.hidden = !active;
    if (!active || !session) return;
    const story = stories[id];
    const heading = host.querySelector("h2")!;
    if (heading.textContent !== story.title) heading.textContent = story.title;
    if (cardButton.textContent !== story.card.id)
      cardButton.textContent = story.card.id;
    cardButton.setAttribute(
      "aria-label",
      story.card.id + " · " + story.card.title,
    );
    for (const button of host.querySelectorAll<HTMLButtonElement>("button"))
      button.disabled = !available;
    skip.hidden = store.profile.skipped.includes(id);
    arrival.hidden =
      session.phase !== "preparation" ||
      store.profile.skipped.includes(id) ||
      session.economy.towers.length > 0;
    const arrivalText = story.arrivalSpeaker + ": «" + story.arrival + "»";
    if (arrival.textContent !== arrivalText) arrival.textContent = arrivalText;
    const guide = missionGuide(id, session),
      text =
        guide.mandatory || !store.profile.skipped.includes(id)
          ? guide.text
          : "";
    if (text !== lastHint) {
      hint.textContent = text;
      lastHint = text;
      if (guide.mandatory)
        host.querySelector<HTMLElement>(".mission-guide-text")!.scrollTop = 0;
    }
    hint.hidden = !text;
    const reading = host.querySelector<HTMLElement>(".mission-guide-text")!;
    const first = guide.mandatory ? hint : arrival;
    if (reading.firstElementChild !== first) reading.prepend(first);
    host.querySelector<HTMLElement>("#mission-scroll-hint")!.hidden =
      reading.scrollHeight <= reading.clientHeight + 1 ||
      reading.scrollTop + reading.clientHeight >= reading.scrollHeight - 2;
  }
  skip.addEventListener("click", () => {
    store.skip(id);
    refresh();
    host.querySelector<HTMLButtonElement>("#mission-notes")!.focus();
  });
  host.querySelector("#mission-notes")!.addEventListener("click", showNotes);
  cardButton.addEventListener("click", () => showCard());
  host
    .querySelector(".mission-guide-text")!
    .addEventListener("scroll", refresh);
  store.subscribe((kind) => {
    if (kind === "reset" && active && attemptEpoch !== store.epoch) {
      options.suspend();
      dialog.cancel();
      if (!active) return;
      dialogOpener = null;
      dialog.open({
        title: "Progressi aggiornati",
        paragraphs: [
          "I progressi sono stati sostituiti in un’altra scheda. Torna alla mappa prima di iniziare un nuovo tentativo.",
        ],
        cancelText: "Torna alla mappa",
        onCancel: options.map,
        restoreFocus: restore,
      });
    }
    refresh();
  });
  return {
    start(level: MissionId = "dino-01"): void {
      if (!canEnter(level)) return;
      if (!store.profile.seenIntro && level === "dino-01") intro();
      else enter(level);
    },
    setActive(value: boolean): void {
      active = value;
      session = null;
      available = false;
      lastHint = "";
      refresh();
    },
    update(next: WaveSession, enabled: boolean): void {
      if (!active || next.level.id !== id || attemptEpoch !== store.epoch)
        return;
      session = next;
      available = enabled;
      if (enabled && !store.profile.visited.includes(id)) {
        store.visit(id, attemptEpoch);
      }
      refresh();
    },
    refresh,
    showNotes,
    showIntro: () => intro(0, false),
    currentId: () => id,
    title: () => stories[id].title,
    hasWon: (level: MissionId) => Boolean(store.profile.wins[level]),
    hasVisited: (level: MissionId) => store.profile.visited.includes(level),
    arsenal(): readonly string[] {
      return Boolean(store.profile.wins["dino-03"])
        ? towerData.nodes.map((node) => node.id)
        : Boolean(store.profile.wins["dino-02"])
          ? towerData.nodes
              .filter(
                (node) =>
                  node.family === "Resina" ||
                  node.family === "Spore" ||
                  node.id === "nido-base" ||
                  node.id === "nido-vedetta",
              )
              .map((node) => node.id)
          : Boolean(store.profile.wins["dino-01"])
            ? river.firstEntryTowers
            : forest.firstEntryTowers;
    },
    isDialogOpen: () => dialog.isOpen(),
    result(next: WaveSession): boolean {
      if (!active || next.level.id !== id || !next.result) return false;
      const story = stories[id],
        victory = next.result.outcome === "won";
      if (attemptEpoch !== store.epoch) return true;
      if (victory) {
        if (
          !store.win(
            id,
            next.stability / next.level.stability,
            next.engine.time,
            attemptEpoch,
          )
        )
          return true;
      }
      dialogOpener = null;
      const ratio = next.stability / next.level.stability,
        stars = starsForRatio(ratio),
        nextLevel = victory ? story.next : null;
      return dialog.open({
        audio: "result",
        title: victory ? story.victory : "Il portale è instabile",
        paragraphs: [
          next.result.reason,
          "Stabilità " +
            next.stability +
            "/" +
            next.level.stability +
            ". Ondate risolte " +
            next.cleared +
            "/" +
            next.level.waves.length +
            ".",
          ...(victory
            ? [
                stars +
                  (stars === 1
                    ? " stella. Tempo attivo: "
                    : " stelle. Tempo attivo: ") +
                  (next.engine.time / 60).toLocaleString("it-IT", {
                    maximumFractionDigits: 1,
                  }) +
                  " minuti.",
                story.endingSpeaker + ": «" + story.ending + "»",
                ...(id === "dino-05" ? [epilogue] : []),
                story.unlock,
              ]
            : ["Hai raggiunto l’ondata " + next.wave + ". " + story.defeat]),
          store.saved
            ? "Progressi salvati sul dispositivo. Le stelle non sono un requisito per proseguire."
            : "Il progresso resta disponibile in questa sessione, ma non è stato salvato sul dispositivo. Apri Impostazioni per recuperarlo.",
        ],
        content: portrait(victory ? story.endingSpeaker : story.arrivalSpeaker),
        confirmText: nextLevel
          ? "Prossimo livello"
          : victory
            ? "Rigioca"
            : "Riprova",
        cancelText: "Torna alla mappa",
        cancelAction: "mission-map",
        onCancel: options.map,
        onConfirm: nextLevel ? () => enter(nextLevel) : options.restart,
        additionalActions: nextLevel
          ? [{ label: "Rigioca", name: "mission-replay", run: options.restart }]
          : [],
        restoreFocus: restore,
      });
    },
  };
}
