import { playMode } from "./playMode";
import { traits } from "@content/campaign/definitions";
import { genesisModifiers } from "@engine/campaign/world";
import { useCallback, useEffect, useRef, useState } from "react";
import type { GenesisChoices, Pace } from "@engine/campaign/model";
import { translate, type Language } from "../i18n";
import {
  claimSlot,
  LeaseLost,
  listCampaigns,
  persist,
  slots,
  type Lease,
  type Slot,
  type SlotRecord,
} from "../persistence/library";
import { makeSave, parseSave } from "../persistence/save";
import { App, initialLanguage } from "./App";
import { download } from "./download";
import { historicalYear } from "./format";
import {
  captureGame,
  startGame,
  stopGame,
  useGameStore,
} from "./store/gameStore";
import "./campaign.css";

const blankChoices: GenesisChoices = [50, 50, 50, 50];
function initialSeed(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0] ?? 1;
}

function Genesis({
  language,
  begin,
  leave,
  allowSkip,
}: {
  language: Language;
  begin: (seed: number, choices: GenesisChoices, pace: Pace) => void;
  leave: () => void;
  allowSkip: boolean;
}) {
  const [act, setAct] = useState(0);
  const [pace, setPace] = useState<Pace>("standard");
  const [choices, setChoices] = useState<GenesisChoices>([...blankChoices]);
  const [seed, setSeed] = useState(() => initialSeed());
  const text = "genesis." + act;
  const modifiers = genesisModifiers(choices);
  const affected = [["ambition"], [], ["resilience", "coherence", "corruptibility"], ["adaptability", "memory"]] as const;
  return (
    <main
      className="genesis gate"
      data-act={act}
      style={
        { "--genesis-power": (choices[act] ?? 50) / 100 } as React.CSSProperties
      }
    >
      <div className="genesis-orbit" aria-hidden="true">
        <span />
        <i />
      </div>
      <article>
        <p className="gate-kicker">
          {translate(language, "genesis.step", { n: act + 1 })}
        </p>
        <h1>{translate(language, text)}</h1>
        <p>{translate(language, text + ".body")}</p>
        <div className="genesis-range">
          <span>{translate(language, text + ".low")}</span>
          <input
            aria-label={translate(language, text)}
            type="range"
            min={0}
            max={100}
            value={choices[act]}
            onChange={(event) => {
              const copy: GenesisChoices = [...choices];
              copy[act] = event.currentTarget.valueAsNumber;
              setChoices(copy);
            }}
          />
          <span>{translate(language, text + ".high")}</span>
        </div>
        <output className="genesis-choice">
          {translate(
            language,
            choices[act] === 50
              ? "edit.balance"
              : text + ((choices[act] ?? 50) < 50 ? ".low" : ".high"),
          )}{" "}
          · {choices[act]}/100
        </output>
        <p className="genesis-effect">{act === 1 ? translate(language, "genesis.waterEffect", {chance: Math.round(choices[1] / 610 * 100)}) :
          translate(language, "genesis.modifier") + " " + affected[act]?.map(trait => translate(language, "trait." + trait) + " " + new Intl.NumberFormat(language, {signDisplay:"exceptZero", maximumFractionDigits:1}).format(modifiers[traits.indexOf(trait)] ?? 0)).join(" · ")}</p>
        {act === 0 && (
          <details><summary>{translate(language, "genesis.advanced")}</summary><label className="genesis-seed">
            {translate(language, "genesis.seed")}
            <input
              type="number"
              min={0}
              max={4294967295}
              step={1}
              value={seed}
              onChange={(event) =>
                setSeed(
                  Math.max(
                    0,
                    Math.min(
                      4294967295,
                      Math.floor(event.currentTarget.valueAsNumber || 0),
                    ),
                  ),
                )
              }
            />
            <small>{translate(language, "genesis.seedHint")}</small>
          </label></details>
        )}
        {act === 3 && (
          <label className="genesis-seed">
            {translate(language, "pace.label")}
            <select
              value={pace}
              onChange={(event) =>
                setPace(
                  event.currentTarget.value === "rapid" ? "rapid" : "standard",
                )
              }
            >
              <option value="standard">
                {translate(language, "pace.standard")}
              </option>
              <option value="rapid">{translate(language, "pace.rapid")}</option>
            </select>
            <small>{translate(language, "pace." + pace + ".hint")}</small>
          </label>
        )}
        <div className="gate-actions">
          <button
            className="secondary"
            type="button"
            onClick={() => (act > 0 ? setAct(act - 1) : leave())}
          >
            {translate(language, act > 0 ? "genesis.back" : "genesis.cancel")}
          </button>
          <button
            type="button"
            onClick={() =>
              act < 3 ? setAct(act + 1) : begin(seed, choices, pace)
            }
          >
            {translate(language, act < 3 ? "genesis.next" : "genesis.begin")}
          </button>
        </div>
        {allowSkip && (
          <button
            className="link-button"
            type="button"
            onClick={() => begin(seed, blankChoices, "rapid")}
          >
            {translate(language, "genesis.skip")}
          </button>
        )}
      </article>
    </main>
  );
}

export function CampaignApp() {
  const [language, setLanguage] = useState<Language>(initialLanguage);
  const [screen, setScreen] = useState<"lobby" | "genesis" | "game">("lobby");
  const [replay,setReplay]=useState<{seed:number;choices:GenesisChoices;pace:Pace;inherited:number}|null>(null);
  const [library, setLibrary] = useState<{
    records: SlotRecord[];
    legacy: number;
  }>({ records: [], legacy: 0 });
  const [ready, setReady] = useState(false);
  const [slot, setSlot] = useState<Slot>(1);
  const [lease, setLease] = useState<Lease | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [saveStatus, setSaveStatus] = useState("slot.saving");
  const [leaveFailed, setLeaveFailed] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const leaveInProgress = useRef(false);
  const saveRequest = useRef(0);
  const revision = useGameStore((state) => state.revision);
  const initialized = useGameStore((state) => !!state.snapshot?.campaign);

  const refresh = useCallback(async () => {
    setReady(false);
    setError("");
    try {
      setLibrary(await listCampaigns());
      setReady(true);
    } catch {
      setError("slot.error");
    }
  }, []);
  useEffect(() => {
    void refresh();
    return stopGame;
  }, [refresh]);
  useEffect(() => {
    document.documentElement.lang = language;
    document.title = translate(language, "app.title");
    try {
      localStorage.setItem("epoche-language", language);
    } catch {
      /* Session preference remains available. */
    }
  }, [language]);

  const saveActive = useCallback(
    async (final = false): Promise<boolean> => {
      if (!lease) return true;
      if (!final && leaveInProgress.current) return false;
      const request = ++saveRequest.current;
      let status = "slot.saved";
      try {
        let capture = await captureGame();
        if (!capture?.campaign && !final && request === saveRequest.current) {
          // A busy worker can miss the capture deadline after a long absence.
          // Retry once while this autosave still belongs to the active slot.
          capture = await captureGame();
        }
        if (capture?.campaign) {
          await persist(
            lease,
            makeSave(
              capture.campaign,
              capture.speed,
              Date.now(),
              capture.queued,
            ),
          );
        } else {
          status = "slot.captureError";
        }
      } catch (cause) {
        status =
          cause instanceof LeaseLost ? "slot.conflict" : "slot.writeError";
      }
      if (request === saveRequest.current) setSaveStatus(status);
      return status === "slot.saved";
    },
    [lease],
  );
  useEffect(() => {
    if (screen !== "game" || !initialized) return;
    const save = () => {
      void saveActive();
    };
    const id = setInterval(save, 8000);
    document.addEventListener("visibilitychange", save);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", save);
    };
  }, [screen, initialized, saveActive]);
  useEffect(() => {
    if (screen === "game" && initialized) void saveActive();
  }, [screen, initialized, revision, saveActive]);

  function finishLeaving() {
    ++saveRequest.current;
    stopGame();
    setLease(null);
    setLeaveFailed(false);
    setScreen("lobby");
    void refresh();
  }

  async function leave(): Promise<void> {
    if (leaveInProgress.current) return;
    leaveInProgress.current = true;
    setLeaving(true);
    try {
      if (await saveActive(true)) finishLeaving();
      else setLeaveFailed(true);
    } finally {
      leaveInProgress.current = false;
      setLeaving(false);
    }
  }
  async function launch(
    seed: number,
    choices: GenesisChoices,
    pace: Pace,
    selected = slot, inherited = new URLSearchParams(location.search).has("studio") ? 0 : library.legacy,
  ): Promise<void> {
    if (busy) return;
    setBusy(true);
    setError("");
    setSaveStatus("slot.saving");
    try {
      const { lease } = await claimSlot(selected, false);
      setLease(lease);
      startGame({
        start: {
          id: crypto.randomUUID(),
          seed,
          choices,
          pace,
          rules: playMode(),
          inherited,
        },
      });
      setScreen("game");
    } catch {
      setError("slot.error");
    } finally {
      setBusy(false);
    }
  }
  async function resume(selected: Slot): Promise<void> {
    if (busy) return;
    setReplay(null);
    setBusy(true);
    setError("");
    setSaveStatus("slot.saving");
    try {
      const { lease, save } = await claimSlot(selected, true);
      if (!save) return;
      setLease(lease);
      startGame({
        campaign: save.campaign,
        speed: save.speed,
        elapsed: Date.now() - save.savedAt,
        queued: save.queued,
      });
      setScreen("game");
    } catch {
      setError("slot.invalid");
    } finally {
      setBusy(false);
    }
  }
  function create(selected: Slot, occupied: boolean) {
    if (
      busy ||
      (occupied && !window.confirm(translate(language, "slot.restart")))
    )
      return;
    setSlot(selected);
    setError("");
    if(replay){void launch(replay.seed,replay.choices,replay.pace,selected,replay.inherited);setReplay(null);return;}
    setScreen("genesis");
  }
  async function importSlot(
    selected: Slot,
    file: File | undefined,
    occupied: boolean,
  ): Promise<void> {
    if (
      busy ||
      !file ||
      (occupied && !window.confirm(translate(language, "slot.overwrite")))
    )
      return;
    setBusy(true);
    try {
      if (file.size > 2_000_000) throw new Error("Size limit");
      const save = parseSave(await file.text());
      if (save.campaign.rules !== playMode()) { setError("trial.wrongMode"); return; }
      const { lease } = await claimSlot(selected, false);
      await persist(
        lease,
        makeSave(save.campaign, save.speed, Date.now(), save.queued),
      );
      await refresh();
    } catch {
      setError("slot.invalid");
    } finally {
      setBusy(false);
    }
  }
  async function exportGame() {
    const capture = await captureGame();
    if (!capture?.campaign) {
      setSaveStatus("slot.captureError");
      return;
    }
    const save = makeSave(
      capture.campaign,
      capture.speed,
      Date.now(),
      capture.queued,
    );
    download(
      "epoche-" + capture.campaign.seed + ".json",
      JSON.stringify(save),
      "application/json",
    );
  }
  if (screen === "game")
    return (
      <App
        language={language}
        changeLanguage={setLanguage}
        onReplay={() => { const config=useGameStore.getState().snapshot?.campaign?.replay; if(config){setReplay(config);void leave();} }}
        onLeave={() => void leave()}
        onDiscard={finishLeaving}
        onExport={() => void exportGame()}
        saveStatus={saveStatus}
        leaving={leaving}
        leaveFailed={leaveFailed}
      />
    );
  if (screen === "genesis")
    return (
      <>
        <Genesis
          language={language}
          begin={(seed, choices, pace) => void launch(seed, choices, pace)}
          leave={() => setScreen("lobby")}
          allowSkip={library.records.some(({ save }) => !!save)}
        />
        {error && (
          <p role="alert" className="gate-error">
            {translate(language, error)}
          </p>
        )}
      </>
    );
  const agent = navigator.userAgent;
  const mobile =
    /Android|iPhone|iPad|iPod|Mobi/i.test(agent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const safari = /Version\/\S+.*Safari\//.test(agent);
  return (
    <main className="gate lobby">
      <header>
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            ◉
          </span>
          <h1>{translate(language, "app.title")}</h1>
        </div>
        <label className="language">
          <span className="sr-only">
            {translate(language, "language.label")}
          </span>
          <select
            value={language}
            onChange={(event) =>
              setLanguage(event.currentTarget.value === "en" ? "en" : "it")
            }
          >
            <option value="it">{translate(language, "language.it")}</option>
            <option value="en">{translate(language, "language.en")}</option>
          </select>
        </label>
      </header>
      <article>
        {mobile && <p>{translate(language, "compat.desktop")}</p>}
        {safari && <p>{translate(language, "compat.browsers")}</p>}
        <div className="section-heading">
          <h2>{translate(language, "slot.title")}</h2>
          <span>
            {translate(language, "spirit.legacy")} {library.legacy}
          </span>
        </div>
        <p>{translate(language, "slot.promise")} {translate(language, "spirit.inherited")}</p>
        <nav className="study-links">
          <a href="?valle">{language === "it" ? "Gioca Il guado · prototipo" : "Play The Ford · prototype"}</a>
          {playMode() !== "winter" && <a href="?rimedi">{translate(language,"hearing.full")}</a>}
          {playMode() !== "winterStudy" && <a href="?studio=inverno">{translate(language,"hearing.study")}</a>}
          {playMode() !== "current" && <a href="?">{translate(language,"hearing.normal")}</a>}
        </nav>
        {replay && <p role="status">{translate(language,"hearing.pickSlot")}</p>}
        {ready ? (
          <div className="slot-list">
            {slots.map((number) => {
              const save = library.records.find(
                (record) => record.slot === number,
              )?.save;
              return (
                <div className="save-slot" key={number}>
                  <span>
                    {translate(language, "slot.label", { n: number })}
                  </span>
                  <h3>
                    {save?.campaign.identity.name ??
                      translate(language, "slot.empty")}
                  </h3>
                  {save && (
                    <p>
                      {translate(language, "era." + save.campaign.core.eraId)} ·{" "}
                      {historicalYear(save.campaign.core.year, language)}
                    </p>
                  )}
                  <div className="gate-actions">
                    {save && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void resume(number)}
                      >
                        {translate(language, "slot.resume")}
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={busy}
                      className={save ? "secondary" : ""}
                      onClick={() => create(number, !!save)}
                    >
                      {translate(language, "slot.new")}
                    </button>
                    <label className="import-label" aria-disabled={busy}>
                      {translate(language, "slot.import")}
                      <input
                        type="file"
                        accept=".json,application/json"
                        disabled={busy}
                        onChange={(event) => {
                          const file = event.currentTarget.files?.[0];
                          event.currentTarget.value = "";
                          void importSlot(number, file, !!save);
                        }}
                      />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        ) : error === "slot.error" ? (
          <button type="button" onClick={() => void refresh()}>
            {translate(language, "slot.reload")}
          </button>
        ) : (
          <p role="status">{translate(language, "app.loading")}</p>
        )}
        {error && <p role="alert">{translate(language, error)}</p>}
      </article>
    </main>
  );
}
