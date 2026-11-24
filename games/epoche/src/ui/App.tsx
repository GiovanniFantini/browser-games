import { campaignEras } from "@content/campaign/definitions";
import { useEffect, useState } from "react";
import { speeds } from "@engine/core/commands";
import type { Snapshot } from "@worker/protocol";
import { translate, type Language } from "../i18n";
import { AttributeCard } from "./components/AttributeCard";
import { PolicySlider } from "./components/PolicySlider";
import { formatNumber, historicalYear } from "./format";
import { useGameStore } from "./store/gameStore";
import {
  CampaignCenter,
  CampaignDialogs,
  Council,
  chronicleText,
  type CampaignTab,
} from "./components/CampaignPanels";
import { allowGameShortcut, listenForShortcutFocus } from "./keyboard";
import { useGameSound } from "./useGameSound";

const groups = ["material", "social", "power"] as const;
const languageKey = "epoche-language";

export function initialLanguage(): Language {
  try {
    return localStorage.getItem(languageKey) === "en" ? "en" : "it";
  } catch {
    return "it";
  }
}

function TimeControls({ language }: { language: Language }) {
  const speed = useGameStore((state) => state.speed);
  const setSpeed = useGameStore((state) => state.setSpeed);
  const lastRunningSpeed = useGameStore((state) => state.lastRunningSpeed);

  useEffect(() => {
    function shortcut(event: KeyboardEvent): void {
      if (!allowGameShortcut(event)) return;
      const next =
        event.code === "Space"
          ? speed === 0
            ? lastRunningSpeed
            : 0
          : /^[1-5]$/.test(event.key)
            ? (speeds[Number(event.key)] ?? null)
            : null;
      if (next !== null) {
        event.preventDefault();
        setSpeed(next);
      }
    }
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, [speed, setSpeed, lastRunningSpeed]);

  return (
    <div className="time">
      <div
        className="speed-controls"
        role="group"
        aria-label={translate(language, "time.controls")}
      >
        {speeds.map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={speed === value}
            data-speed={value}
            aria-label={
              value === 0
                ? translate(language, "time.pause")
                : translate(language, "time.speed", { speed: value })
            }
            onClick={() => setSpeed(value)}
          >
            {value === 0 ? (
              <span className="pause-icon" aria-hidden="true" />
            ) : (
              value + "×"
            )}
          </button>
        ))}
      </div>
      <span className="time-state" data-paused={speed === 0}>
        <i aria-hidden="true" />
        {translate(language, speed === 0 ? "time.paused" : "time.running")}
      </span>
    </div>
  );
}

function Header({
  snapshot,
  language,
  onLanguageChange,
}: {
  snapshot: Snapshot | null;
  language: Language;
  onLanguageChange: (language: Language) => void;
}) {
  return (
    <header className="game-header">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">
          ◉
        </span>
        <h1>{translate(language, "app.title")}</h1>
      </div>
      {snapshot && (
        <>
          <div className="date-block">
            <span>{translate(language, snapshot.eraNameKey)}</span>
            <strong className="year" data-tick={snapshot.tick}>
              {historicalYear(snapshot.year, language)}
            </strong>
          </div>
          <TimeControls language={language} />
          <dl className="resources">
            <div>
              <dt>{translate(language, "resource.population")}</dt>
              <dd>{formatNumber(Math.floor(snapshot.population), language)}</dd>
            </div>
            <div>
              <dt>{translate(language, "resource.influence")}</dt>
              <dd data-influence={snapshot.influence}>
                {formatNumber(snapshot.influence, language, 1)}{" "}
                <small>/ {snapshot.influenceCap}</small>
              </dd>
            </div>
            <div>
              <dt>{translate(language, "resource.legitimacy")}</dt>
              <dd>
                {formatNumber(snapshot.legitimacy, language)}
                <small>%</small>
              </dd>
            </div>
            <div>
              <dt>{translate(language, "resource.complexity")}</dt>
              <dd>{translate(language, snapshot.complexityNameKey)}</dd>
            </div>
          </dl>
        </>
      )}
      <label className="language">
        <span className="sr-only">{translate(language, "language.label")}</span>
        <select
          value={language}
          onChange={(event) =>
            onLanguageChange(event.currentTarget.value === "en" ? "en" : "it")
          }
        >
          <option value="it">{translate(language, "language.it")}</option>
          <option value="en">{translate(language, "language.en")}</option>
        </select>
      </label>
    </header>
  );
}

function Settlement({
  snapshot,
  language,
}: {
  snapshot: Snapshot;
  language: Language;
}) {
  const threshold = snapshot.pressureThreshold;
  const pressure =
    threshold !== null && snapshot.populationPressure > threshold;
  return (
    <section className="settlement" aria-labelledby="settlement-title">
      <div className="settlement-stage">
        <div className="stage-rings" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="stage-copy">
          <h2 id="settlement-title">{translate(language, "center.title")}</h2>
          <p>{translate(language, "center.placeholder")}</p>
        </div>
      </div>
      <div className="capacity" data-pressure={pressure}>
        <div className="capacity-header">
          <div>
            <h3>{translate(language, "center.capacity")}</h3>
            <p>
              {translate(language, "center.capacitySummary", {
                population: formatNumber(Math.floor(snapshot.population), language),
                capacity: formatNumber(snapshot.capacity, language),
              })}
            </p>
          </div>
          <strong>
            {formatNumber(snapshot.populationPressure * 100, language)}
            <small>%</small>
          </strong>
        </div>
        <div className="capacity-bar" aria-hidden="true">
          <span
            style={{
              width: Math.min(100, snapshot.populationPressure * 100) + "%",
            }}
          />
          {threshold !== null && <i style={{ left: threshold * 100 + "%" }} />}
        </div>
        <div className="capacity-notes">
          <p>
            {translate(
              language,
              pressure ? "center.pressureActive" : "center.pressureClear",
            )}
          </p>
          {threshold !== null && (
            <span>
              {translate(language, "center.threshold", {
                percent: formatNumber(threshold * 100, language),
              })}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

export function App({
  language,
  changeLanguage,
  onLeave, onReplay,
  onDiscard,
  onExport,
  saveStatus,
  leaving,
  leaveFailed,
}: {
  language: Language;
  changeLanguage: (language: Language) => void;
  onLeave: () => void; onReplay: () => void;
  onDiscard: () => void;
  onExport: () => void;
  saveStatus: string;
  leaving: boolean;
  leaveFailed: boolean;
}) {
  const [statistics, setStatistics] = useState(false);
  const [tab, setTab] = useState<CampaignTab>("region");
  const [reduced, setReduced] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [panels, setPanels] = useState(true);
  const snapshot = useGameStore((state) => state.snapshot);
  const error = useGameStore((state) => state.error);
  const absenceProgress = useGameStore((state) => state.absenceProgress);
  const speed = useGameStore((state) => state.speed);
  const pending = useGameStore((state) => state.pending);
  const lastResult = useGameStore((state) => state.lastResult);

  const rejected = useGameStore((state) => state.actionRejected);
  const campaign = snapshot?.campaign;
  const sound = useGameSound(campaign);
  const saveFailed =
    saveStatus !== "slot.saving" && saveStatus !== "slot.saved";
  useEffect(listenForShortcutFocus, []);

  const hasQueuedPolicies =
    Object.keys(pending).length > 0 || !!snapshot?.queuedPolicies?.length;
  let status: string | null = null;
  if (lastResult?.result.ok === false) {
    if (lastResult.result.reason !== "insufficient_influence")
      status = "policy." + lastResult.result.reason;
  } else if (speed === 0 && hasQueuedPolicies) {
    status = campaign?.event?.decisive
      ? "policy.queuedDecision"
      : "policy.queued";
  } else if (lastResult?.result.ok) {
    status = "policy.applied";
  }

  return (
    <div
      className="game-shell"
      data-campaign={!!(campaign || error)}
      data-panels={panels}
    >
      <Header
        snapshot={snapshot}
        language={language}
        onLanguageChange={changeLanguage}
      />
      {(campaign || error) && (
        <div className="campaign-toolbar">
          <div className="campaign-exit">
            <button
              type="button"
              className="secondary"
              onClick={onLeave}
              disabled={leaving}
            >
              {translate(
                language,
                leaveFailed ? "slot.retryExit" : "slot.back",
              )}
            </button>
            {leaveFailed && (
              <button
                type="button"
                className="secondary"
                onClick={onDiscard}
                disabled={leaving}
              >
                {translate(language, "slot.discardExit")}
              </button>
            )}
          </div>
          <span className="save-status" data-error={saveFailed} role="status">
            {translate(language, leaving ? "slot.saving" : saveStatus)}
          </span>
          {campaign && (
            <div>
              <button type="button" onClick={onExport}>
                {translate(language, "slot.export")}
              </button>
              <button
                type="button"
                aria-pressed={panels}
                onClick={() => setPanels(!panels)}
              >
                {translate(language, "display.panels")}
              </button>
              <button
                type="button"
                aria-pressed={reduced}
                onClick={() => setReduced(!reduced)}
              >
                {translate(language, "display.motion")}
              </button>
              <button
                type="button"
                aria-pressed={sound.wanted}
                onClick={sound.toggle}
              >
                {translate(language, sound.wanted ? "sound.off" : "sound.on")}
              </button>
              {sound.wanted && (
                <input
                  className="sound-volume"
                  type="range"
                  min={0}
                  max={100}
                  aria-label={translate(language, "sound.volume")}
                  value={sound.volume}
                  onChange={(event) =>
                    sound.setVolume(event.currentTarget.valueAsNumber)
                  }
                />
              )}
            </div>
          )}
        </div>
      )}
      {snapshot && !error ? (
        <main className="game-main">
          <section
            className="side attributes"
            aria-labelledby="attributes-title"
          >
            <h2 id="attributes-title">
              {translate(language, "panel.attributes")}
            </h2>
            <label className="stats-toggle">
              <input
                type="checkbox"
                checked={statistics}
                onChange={(event) => setStatistics(event.currentTarget.checked)}
              />
              {translate(language, "overview.details")}
            </label>
            {groups.map((group) => (
              <section
                className="attribute-group"
                key={group}
                aria-labelledby={"group-" + group}
              >
                <h3 id={"group-" + group}>
                  {translate(language, "group." + group)}
                </h3>
                {snapshot.attributes
                  .filter(
                    (attribute) =>
                      attribute.group === group &&
                      (statistics || attribute.active),
                  )
                  .map((attribute) => (
                    <AttributeCard
                      key={attribute.id}
                      attribute={attribute}
                      compact={!statistics}
                      historySampleYears={snapshot.historySampleYears}
                      language={language}
                    />
                  ))}
              </section>
            ))}
          </section>
          {campaign ? (
            <CampaignCenter
              snapshot={snapshot}
              language={language}
              tab={tab}
              setTab={setTab}
              reduced={reduced}
            />
          ) : (
            <Settlement snapshot={snapshot} language={language} />
          )}
          <section className="side policies" aria-labelledby="policies-title">
            <h2 id="policies-title">
              {translate(language, "panel.policies")}
              <span className="policy-key" aria-hidden="true">
                <i />
                {translate(language, "policy.effective")}
              </span>
            </h2>
            {campaign && (
              <div className="era-policy-note">
                <h3>{translate(language, "era." + campaign.eraId)}</h3>
                <p>{translate(language, "era.change." + campaign.eraId)}</p>
                <details key={campaign.eraId}>
                  <summary>{translate(language, "overview.policies")}</summary>
                  <p>{translate(language, "overview.policyRule")}</p>
                  {campaign.progress.nextId && (
                    <p>
                      {translate(language, "overview.next", {
                        era: translate(
                          language,
                          "era." + campaign.progress.nextId,
                        ),
                        names:
                          campaignEras
                            .find((era) => era.id === campaign.progress.nextId)
                            ?.policyIds.map((id) =>
                              translate(language, "policy." + id),
                            )
                            .join(", ") ?? "",
                      })}
                    </p>
                  )}
                </details>
              </div>
            )}
            {campaign && <Council view={campaign} language={language} />}
            {snapshot.policies.map((policy) => (
              <PolicySlider
                key={policy.id}
                policy={policy}
                language={language}
              />
            ))}
            <p
              className="policy-status"
              role="status"
              data-error={lastResult?.result.ok === false}
            >
              {rejected
                ? translate(language, "campaign.error")
                : status
                  ? translate(language, status)
                  : ""}
            </p>
          </section>
        </main>
      ) : (
        <main className="game-loading">
          {absenceProgress !== null && !error ? (
            <label>
              {translate(language, "absence.restoring", {
                percent: absenceProgress,
              })}
              <progress value={absenceProgress} max={100} />
            </label>
          ) : (
            <p role={error ? "alert" : "status"}>
              {translate(language, error ? "app.error" : "app.loading")}
            </p>
          )}
        </main>
      )}
      <footer className="chronicle">
        {campaign ? (
          <>
            <button
              type="button"
              className="chronicle-link"
              onClick={() => setTab("history")}
            >
              {translate(language, "panel.chronicle")}
            </button>
            {campaign.chronicle.at(-1) && (
              <p>{chronicleText(campaign.chronicle.at(-1)!, language)}</p>
            )}
          </>
        ) : (
          <h2>{translate(language, "panel.chronicle")}</h2>
        )}
      </footer>
      {campaign && snapshot && (
        <CampaignDialogs
          view={campaign}
          snapshot={snapshot}
          language={language}
          onEnd={onLeave} onReplay={onReplay}
          onDiscard={onDiscard}
          onExport={onExport}
          leaving={leaving}
          endFailed={leaveFailed}
        />
      )}
    </div>
  );
}
