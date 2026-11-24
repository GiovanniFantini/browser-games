import { exportTrialLog, useTrialLog, logTrialRemedy } from "../trialLog";
import { EventScene } from "./DecisionScenes";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { subjectSymbols, incidentSymbols } from "../symbols";
import {
  campaignBalance,
  isTradition,
  doctrines,
  campaignEras,
  traits,
} from "@content/campaign/definitions";
import type { ChronicleEntry, Objective } from "@engine/campaign/model";
import { TICKS_PER_SECOND } from "@engine/core/time";
import type { Snapshot } from "@worker/protocol";
import type { CampaignView } from "@worker/campaignView";
import { translate, type Language } from "../../i18n";
import { download } from "../download";
import { formatNumber, historicalYear } from "../format";
import { allowGameShortcut } from "../keyboard";
import { useGameStore } from "../store/gameStore";
import { WorldAtlas } from "./WorldAtlas";
import { Diorama } from "./Diorama";

export type CampaignTab = "region" | "world" | "history" | "spirit";
const tabs = ["region", "world", "history", "spirit"] as const;
type Props = { view: CampaignView; language: Language };

export function chronicleText(
  entry: ChronicleEntry,
  language: Language,
): string {
  if (entry.key === "log.hearing" && entry.offered?.length) {
    const labels = entry.offered.map(id => translate(language, "remedy." + id));
    return translate(language, entry.key) + " " + labels.join(" / ");
  }
  if (entry.key === "log.response" && entry.eventKey && entry.consequenceKey)
    return translate(language, "log.response.detail", {
      event: translate(language, entry.eventKey),
      name: entry.nameKey
        ? translate(language, entry.nameKey)
        : (entry.name ?? ""),
      consequence: translate(language, entry.consequenceKey),
    });
  return translate(language, entry.key, {
    name:
      entry.name ?? (entry.nameKey ? translate(language, entry.nameKey) : ""),
    value: entry.setting ?? "",
    result: entry.result ? translate(language, entry.result) : "",
    era: translate(language, "era." + entry.era),
  });
}

function clockAtNormalSpeed(ticks: number, elapsed = false): string {
  const round = elapsed ? Math.floor : Math.ceil;
  const seconds = Math.max(0, round(ticks / TICKS_PER_SECOND));
  return minutesSeconds(seconds);
}

function minutesSeconds(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return minutes + ":" + String(seconds % 60).padStart(2, "0");
}

function Chronicle({ view, language }: Props) {
  const chronological = view.chronicle.reduce<
    { era: string; entries: ChronicleEntry[] }[]
  >((chapters, item) => {
    const last = chapters.at(-1);
    if (last && last.era === item.era) last.entries.push(item);
    else chapters.push({ era: item.era, entries: [item] });
    return chapters;
  }, []);
  const ordered = [...chronological].reverse();
  const chapterTitle = (era: string) =>
    translate(language, "chronicle.chapter", {
      era: translate(language, "era." + era),
    });
  function exportChronicle() {
    const text = [
      view.identity.name,
      ...chronological.flatMap(({ era, entries }) => [
        "",
        chapterTitle(era),
        ...entries.map(
          (entry) =>
            historicalYear(entry.year, language) +
            "  " +
            chronicleText(entry, language),
        ),
      ]),
    ].join("\n");
    download(
      "epoche-" + view.seed + "-chronicle.txt",
      text,
      "text/plain;charset=utf-8",
    );
  }
  return (
    <section className="campaign-scroll">
      <div className="section-heading">
        <h2>{translate(language, "view.history")}</h2>
        <button type="button" onClick={exportChronicle}>
          {translate(language, "chronicle.export")}
        </button>
      </div>
      {!ordered.length && <p>{translate(language, "chronicle.empty")}</p>}
      {ordered.map(({ era, entries }, index) => (
        <section className="chapter" key={era + index}>
          <h3>{chapterTitle(era)}</h3>
          {[...entries].reverse().map((entry) => (
            <div className="chronicle-entry" key={entry.id}>
              <time>{historicalYear(entry.year, language)}</time>
              <p>{chronicleText(entry, language)}</p>
            </div>
          ))}
        </section>
      ))}
    </section>
  );
}

function Spirit({ view, language }: Props) {
  const send = useGameStore((state) => state.sendAction);
  return (
    <section className="campaign-scroll spirit-view">
      <div className="section-heading">
        <div>
          <h2>{view.identity.name}</h2>
          <p>{translate(language, "culture." + view.identity.archetype)}</p>
        </div>
        <strong>
          {translate(language, "spirit.legacy")} {view.legacy}
        </strong>
      </div>
      <h3>{translate(language, "spirit.traits")}</h3>
      <dl className="trait-list">
        {traits.map((trait) => (
          <div key={trait}>
            <dt>{translate(language, "trait." + trait)}</dt>
            <dd>
              {view.identity.traits[trait] ??
                translate(language, "spirit.undiscovered")}
            </dd>
          </div>
        ))}
      </dl>
      <h3>{translate(language, "social.title")}</h3>
      <div className="social-list">
        {view.groups.map((group) => (
          <div key={group.id} className="social-group">
            <span>{translate(language, "social." + group.id)}</span>
            <meter
              min={0}
              max={100}
              value={group.support}
              aria-label={translate(language, "social.support", {
                value: formatNumber(group.support, language),
              })}
            />
            <strong>{formatNumber(group.support, language)}%</strong>
          </div>
        ))}
      </div>
      <h3>{translate(language, "doctrine.title")}</h3>
      <p>{translate(language, "doctrine.help")}</p>
      <div className="doctrines">
        {doctrines.map((id) => (
          <button
            type="button"
            key={id}
            aria-pressed={view.doctrine === id}
            onClick={() => send({ type: "DOCTRINE", doctrine: id })}
          >
            {translate(language, "doctrine." + id)}
          </button>
        ))}
      </div>
    </section>
  );
}

function actionReason(language: Language, reason: string | null) {
  return reason ? translate(language, "action.block." + reason) : undefined;
}

function ExileStatus({ view, language }: Props) {
  if (!view.dormantTicks) return null;
  return (
    <p id="campaign-dormancy">
      {translate(language, "action.exile", {
        time: clockAtNormalSpeed(view.dormantTicks),
      })}
    </p>
  );
}

function World({ view, language }: Props) {
  const send = useGameStore((state) => state.sendAction);
  const [selected, setSelected] = useState(view.war?.rival ?? "spirit");
  const [objective, setObjective] = useState<Objective>("defend");
  const [posture, setPosture] = useState(40);
  const [commitment, setCommitment] = useState(55);
  const rival = view.rivals.find(({ id }) => id === selected);
  const war = view.war;
  const {
    pactCosts,
    warCosts,
    truceBreakCost,
    peaceCost,
    peaceBlock,
    territories,
    raidReward,
  } = view.diplomacy;
  const treaties = ["trade", "truce", "alliance", "aid"] as const;
  const activeTruce = (rival?.truceTicks ?? 0) > 0;
  const unavailable = !!view.actionBlock;
  const exileDescription = view.dormantTicks ? "campaign-dormancy" : undefined;
  const warCost = warCosts[objective] + (activeTruce ? truceBreakCost : 0);
  const withCost = (key: string, cost: number) =>
    translate(language, "world.actionCost", {
      action: translate(language, key),
      cost,
    });
  return (
    <section className="campaign-scroll world-view">
      <div className="section-heading">
        <h2>{translate(language, "land.map")}</h2>
        <span>
          {translate(language, "atlas.you") + " · " + view.identity.name}
        </span>
      </div>
      <ExileStatus view={view} language={language} />
      <WorldAtlas
        view={view}
        language={language}
        selected={selected}
        select={setSelected}
      />
      {!rival && (
        <div className="rival-details">
          <h3>
            {view.identity.name} · {translate(language, "atlas.you")}
          </h3>
          <p>{translate(language, "culture." + view.identity.archetype)}</p>
          <p>{translate(language, "atlas.home", { value: territories })}</p>
        </div>
      )}
      {rival && (
        <div className="rival-details">
          <div className="section-heading">
            <div>
              <h3>{rival.name}</h3>
              <p>{translate(language, "culture." + rival.archetype)}</p>
              <p>
                {translate(language, "era." + rival.eraId)} ·{" "}
                {formatNumber(rival.population, language)}{" "}
                {translate(language, "resource.population").toLowerCase()}
              </p>
            </div>
            <strong>
              {translate(
                language,
                war?.rival === rival.id
                  ? "atlas.war"
                  : rival.relation < -20
                    ? "atlas.cold"
                    : rival.relation > 20
                      ? "atlas.warm"
                      : "atlas.neutral",
              )}
              <small className="relation-score">
                {translate(language, "world.relationship", {
                  value: formatNumber(rival.relation, language, 0, true),
                })}
              </small>
            </strong>
          </div>
          <p>
            {translate(language, "world." + rival.treaty)} ·{" "}
            {translate(language, "world.plotCount", {
              value: rival.territories,
            })}
          </p>
          {activeTruce && (
            <p>
              {translate(language, "world.truceTime", {
                time: clockAtNormalSpeed(rival.truceTicks),
              })}
            </p>
          )}
          <div className="pact-buttons">
            {treaties.map((treaty) => (
              <button
                key={treaty}
                type="button"
                disabled={!!rival.pacts[treaty]}
                aria-describedby={exileDescription}
                title={
                  actionReason(language, rival.pacts[treaty]) ??
                  translate(language, "world.pact.effect." + treaty)
                }
                onClick={() => send({ type: "PACT", rival: rival.id, treaty })}
              >
                {withCost("world." + treaty, pactCosts[treaty])}
              </button>
            ))}
          </div>
          <details className="diplomacy-notes">
            <summary>{translate(language, "world.pactHelp")}</summary>
            <ul>
              {treaties.map((treaty) => (
                <li key={treaty}>
                  {translate(language, "world.pact.effect." + treaty)}
                </li>
              ))}
            </ul>
          </details>
        </div>
      )}
      {(rival || war) && (
        <div className="war-board">
          <div className="section-heading">
            <h3>{translate(language, "world.front")}</h3>
            {war && (
              <strong>
                {view.rivals.find(({ id }) => id === war.rival)?.name}
              </strong>
            )}
          </div>
          {war && (
            <>
              <meter
                min={-100}
                max={100}
                low={-25}
                high={25}
                optimum={100}
                value={war.front}
                aria-label={translate(language, "world.front")}
              />
              <p>
                {formatNumber(war.front, language, 0, true)} ·{" "}
                {translate(language, "world.fatigue", {
                  value: formatNumber(war.fatigue, language),
                })}
              </p>
            </>
          )}
          <div className="war-fields">
            {!war && (
              <label>
                {translate(language, "world.objective")}
                <select
                  value={objective}
                  disabled={unavailable}
                  aria-describedby={exileDescription}
                  onChange={(event) =>
                    setObjective(event.currentTarget.value as Objective)
                  }
                >
                  {(["raid", "defend", "tribute", "conquer"] as const).map(
                    (item) => (
                      <option key={item} value={item}>
                        {translate(language, "world." + item)}
                      </option>
                    ),
                  )}
                </select>
              </label>
            )}
            <label>
              {translate(language, "world.posture")}
              <input
                aria-label={translate(language, "world.posture")}
                type="range"
                min={0}
                max={100}
                value={posture}
                disabled={unavailable}
                aria-describedby={exileDescription}
                onChange={(event) =>
                  setPosture(event.currentTarget.valueAsNumber)
                }
              />
              <span>
                {translate(
                  language,
                  posture < 50 ? "world.prudent" : "world.aggressive",
                )}
                {" · "}
                {posture}/100
              </span>
            </label>
            <label>
              {translate(language, "world.commitment")}
              <input
                aria-label={translate(language, "world.commitment")}
                type="range"
                min={10}
                max={100}
                value={commitment}
                disabled={unavailable}
                aria-describedby={exileDescription}
                onChange={(event) =>
                  setCommitment(event.currentTarget.valueAsNumber)
                }
              />
              <span>{commitment}%</span>
            </label>
          </div>
          {war ? (
            <div className="pact-buttons">
              <button
                type="button"
                disabled={unavailable}
                title={actionReason(language, view.actionBlock)}
                aria-describedby={exileDescription}
                onClick={() =>
                  send({ type: "WAR_POLICY", posture, commitment })
                }
              >
                {translate(language, "world.posture")}
              </button>
              <button
                type="button"
                disabled={!!peaceBlock}
                title={actionReason(language, peaceBlock)}
                aria-describedby={exileDescription}
                onClick={() => send({ type: "PEACE" })}
              >
                {peaceCost === null
                  ? translate(language, "world.endWar")
                  : withCost("world.endWar", peaceCost)}
              </button>
              {peaceCost === null && (
                <p>{translate(language, "world.peaceUnavailable")}</p>
              )}
            </div>
          ) : (
            rival && (
              <>
                <p className="diplomacy-notes">
                  {translate(language, "world.objective.effect." + objective, {
                    reward: raidReward,
                  })}
                </p>
                {activeTruce && (
                  <p className="diplomacy-notes">
                    {translate(language, "world.truceBreak", {
                      cost: truceBreakCost,
                    })}
                  </p>
                )}
                <button
                  type="button"
                  disabled={!!rival.warOrders[objective]}
                  title={actionReason(language, rival.warOrders[objective])}
                  aria-describedby={exileDescription}
                  onClick={() =>
                    send({
                      type: "WAR",
                      rival: rival.id,
                      objective,
                      posture,
                      commitment,
                    })
                  }
                >
                  {withCost("world.startWar", warCost)}
                </button>
              </>
            )
          )}
        </div>
      )}
    </section>
  );
}

export function Council({ view, language }: Props) {
  const crisis = view.crises[0]?.family;
  const advice = view.progress.ready
    ? (view.hearingAhead ? "hearing" : "ready")
    : crisis === "clans"
      ? "social"
      : crisis === "health"
        ? "health"
        : crisis === "food"
          ? "food"
          : crisis === "state"
            ? "social"
            : view.groups.some(({ support }) => support < 35)
              ? "social"
              : "steady";
  const role =
    view.stage === 0
      ? "elders"
      : view.stage === 1
        ? "agriculture"
        : view.stage < 6
          ? "merchant"
          : "science";
  return (
    <aside className="council">
      <h3>{translate(language, "council.title")}</h3>
      <div>
        <span className="council-sign" aria-hidden="true">
          ◈
        </span>
        <div>
          <strong>{translate(language, "council." + role)}</strong>
          <p>
            {translate(
              language,
              view.actionBlock === "dormant"
                ? "action.block.dormant"
                : "council." + advice,
            )}
          </p>
        </div>
      </div>
    </aside>
  );
}

export function CampaignCenter({
  snapshot,
  language,
  tab,
  setTab,
  reduced,
}: {
  snapshot: Snapshot;
  language: Language;
  tab: CampaignTab;
  setTab: (tab: CampaignTab) => void;
  reduced: boolean;
}) {
  const view = snapshot.campaign!;
  const send = useGameStore((state) => state.sendAction);
  const threshold = snapshot.pressureThreshold ?? 0.8;
  const pressure = snapshot.populationPressure >= threshold;
  useEffect(() => {
    function keyboard(event: KeyboardEvent): void {
      if (event.key.toLowerCase() === "m" && allowGameShortcut(event)) {
        event.preventDefault();
        setTab(tab === "world" ? "region" : "world");
      }
    }
    window.addEventListener("keydown", keyboard);
    return () => window.removeEventListener("keydown", keyboard);
  }, [tab, setTab]);
  return (
    <section className="campaign-center">
      <nav
        className="campaign-tabs"
        aria-label={translate(language, "campaign.tabs")}
      >
        {tabs.map((key) => (
          <button
            type="button"
            key={key}
            aria-pressed={key === tab}
            onClick={() => setTab(key)}
          >
            {translate(language, "view." + key)}
          </button>
        ))}
      </nav>
      {tab === "region" ? (
        <>
              {view.pressures.length > 0 && (
                <div className="crisis-list">
                  {view.pressures.map(({ family, severity }) => (
                    <span key={family}>
                      {translate(language, "family." + family)}{" "}
                      {severity < 1 ? "<1" : formatNumber(severity, language)}%
                    </span>
                  ))}
                </div>
              )}
          <Diorama snapshot={snapshot} language={language} reduced={reduced} />
          <div className="campaign-metrics">
            <section className="demography" data-pressure={pressure}>
              <div className="section-heading">
                <h3>{translate(language, "center.capacity")}</h3>
                <strong>
                  {formatNumber(snapshot.populationPressure * 100, language)}%
                </strong>
              </div>
              <p>
                {translate(language, "center.capacitySummary", {
                  population: formatNumber(Math.floor(snapshot.population), language),
                  capacity: formatNumber(snapshot.capacity, language),
                })}
              </p>
              <div className="capacity-bar" aria-hidden="true">
                <span
                  style={{
                    width:
                      Math.min(100, snapshot.populationPressure * 100) + "%",
                  }}
                />
                <i style={{ left: threshold * 100 + "%" }} />
              </div>
              <span>
                {translate(
                  language,
                  pressure ? "center.pressureActive" : "center.pressureClear",
                )}
              </span>
              <div className="era-note">
                <h4>{translate(language, "era." + view.eraId)}</h4>
                <p>{translate(language, "era." + view.eraId + ".story")}</p>
              </div>
            </section>
            <section className="progress-panel">
              <div className="section-heading">
                <h3>{translate(language, view.progress.discoveryKey)}</h3>
                <button
                  type="button"
                  disabled={
                    !view.progress.ready || !!view.actionBlock || !!view.event
                  }
                  title={actionReason(
                    language,
                    view.event ? "decision" : view.actionBlock,
                  )}
                  aria-describedby={
                    view.dormantTicks ? "campaign-dormancy" : undefined
                  }
                  onClick={() => send({ type: "ADVANCE" })}
                >
                  {translate(
                    language,
                    view.hearingAhead ? "hearing.title" : view.progress.nextId
                      ? "campaign.advance"
                      : "campaign.complete",
                  )}
                </button>
              </div>
              <ExileStatus view={view} language={language} />
              {view.deferred.map(entry => <p key={entry.source + entry.due}>{translate(language, "debt.pending", {
                era: translate(language, "era." + campaignEras[entry.due]!.id), family: translate(language, "family." + entry.family),
                name: translate(language, entry.source), points: entry.points,
              })}</p>)}
              {view.threatened.map(family => <p key={family}>{translate(language, view.hearingAhead ? "hearing.debtDanger" : "debt.danger", {
                family: translate(language, "family." + family),
              })}</p>)}
              <div className="progress-checks">
                {view.progress.criteria.map(({ key, value, target }) => {
                  const time = key === "campaign.wait";
                  return (
                    <span key={key} data-done={value >= target}>
                      {value >= target ? "✓ " : "◌ "}
                      {translate(language, key)}{" "}
                      {time
                        ? translate(language, "campaign.timeProgress", {
                            value: clockAtNormalSpeed(
                              Math.min(value, target),
                              true,
                            ),
                            target: clockAtNormalSpeed(target),
                            remaining: clockAtNormalSpeed(target - value),
                          })
                        : formatNumber(key === "resource.population" ? Math.floor(value) : value, language, key === "resource.population" ? 0 : 1) +
                          " / " +
                          formatNumber(target, language, 1)}
                    </span>
                  );
                })}
              </div>
              <details open className="progress-reforms" key={view.eraId}>
                <summary>{translate(language, "campaign.reforms")}</summary>
                {view.progress.reforms.map((route, index) => (
                  <div className="progress-checks" key={index}>
                    {index > 0 && (
                      <span>{translate(language, "campaign.reformsOr")}</span>
                    )}
                    {route.map(
                      ({
                        policyId,
                        key,
                        setting,
                        value,
                        target,
                        direction,
                        met,
                      }) => (
                        <span key={key} data-done={met}>
                          {met ? "✓ " : "◌ "}
                          {translate(
                            language,
                            direction === "left"
                              ? "campaign.reformMax"
                              : "campaign.reformMin",
                            {
                              policy: translate(language, "policy." + policyId),
                              pole: translate(language, key),
                              target,
                            },
                          )}
                          <br />
                          {translate(language, "campaign.reformValues", {
                            setting,
                            effective: formatNumber(
                              (direction === "left"
                                ? Math.ceil(value * 10)
                                : Math.floor(value * 10)) / 10,
                              language,
                              1,
                            ),
                          })}
                        </span>
                      ),
                    )}
                  </div>
                ))}
              </details>

            </section>
          </div>
        </>
      ) : tab === "world" ? (
        <World view={view} language={language} />
      ) : tab === "history" ? (
        <Chronicle view={view} language={language} />
      ) : (
        <Spirit view={view} language={language} />
      )}
    </section>
  );
}

function Dialog({
  title,
  children,
  onDismiss,
}: {
  title: string;
  children: ReactNode;
  onDismiss?: () => void;
}) {
  const element = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const modal = element.current;
    if (modal && !modal.open) {
      modal.showModal();
      heading.current?.focus();
    }
    return () => modal?.close();
  }, []);
  return (
    <dialog
      ref={element}
      className="campaign-dialog"
      onCancel={(event) => {
        event.preventDefault();
        onDismiss?.();
      }}
      onClose={(event) => {
        const modal = event.currentTarget;
        if (modal.isConnected && !modal.open) {
          if (onDismiss) onDismiss();
          else modal.showModal();
        }
      }}
      aria-label={title}
    >
      <h2 ref={heading} tabIndex={-1}>
        {title}
      </h2>
      {children}
    </dialog>
  );
}

export function CampaignDialogs({
  view,
  snapshot,
  language,
  onEnd, onReplay,
  onDiscard,
  onExport,
  leaving,
  endFailed,
}: Props & {
  snapshot: Snapshot;
  onEnd: () => void; onReplay:()=>void;
  onDiscard: () => void;
  onExport: () => void;
  leaving: boolean;
  endFailed: boolean;
}) {
  const send = useGameStore((state) => state.sendAction);
  const absence = useGameStore((state) => state.absence);
  const clearAbsence = useGameStore((state) => state.clearAbsence);
  const influence = useGameStore((state) => state.snapshot?.influence ?? 0);
  const setSpeed = useGameStore((state) => state.setSpeed);
  const lastRunningSpeed = useGameStore((state) => state.lastRunningSpeed);
  const [closedDecision, setClosedDecision] = useState("");
  const [openedDecision, setOpenedDecision] = useState("");
  const event = view.event;
  const decisionId = event ? event.id + ":" + event.openedAt : "";
  const cardVisible = !!event && !absence && !view.outcome && !view.hearing && (event.id === "ledger" && view.rules === "trial" ||
    (event.decisive ? closedDecision !== decisionId : openedDecision === decisionId));
  useTrialLog((view.rules === "trial" || view.rules === "winterStudy") ? view.id : undefined, event?.id, decisionId, cardVisible, snapshot.speed);
  const lastDecision = view.outcome
    ? [...view.chronicle]
        .reverse()
        .find((entry) => entry.key === "log.response" && entry.consequenceKey)
    : undefined;
  const summary = {
    name: view.identity.name,
    population: formatNumber(Math.floor(snapshot.population), language),
    era: translate(language, "era." + view.eraId),
    year: historicalYear(snapshot.year, language),
    value: view.legacy,
  };
  if (absence)
    return (
      <Dialog key="absence" title={translate(language, "absence.title")}>
        <p>
          {translate(language, "absence.body", {
            years: formatNumber(absence.years, language, 1),
          })}
        </p>
        <p>
          {translate(language, "absence.population", {
            before: formatNumber(absence.populationBefore, language),
            after: formatNumber(absence.populationAfter, language),
          })}
        </p>
        <p>
          {translate(language, "absence.legitimacy", {
            before: formatNumber(absence.legitimacyBefore, language),
            after: formatNumber(absence.legitimacyAfter, language),
          })}
        </p>
        <p>
          {translate(language, "absence.duration", {
            away: minutesSeconds(absence.awaySeconds),
            active: minutesSeconds(absence.recoveredSeconds),
            speed: absence.speed,
          })}
        </p>
        <p>
          {translate(language, "absence.influence", {
            before: formatNumber(absence.influenceBefore, language, 1),
            after: formatNumber(absence.influenceAfter, language, 1),
          })}
        </p>
        <p>
          {translate(language, "absence.events", { count: absence.entries })}
        </p>
        {absence.doctrineCost > 0 && (
          <p>
            {translate(language, "absence.doctrineCost", {
              cost: formatNumber(absence.doctrineCost, language, 1),
            })}
          </p>
        )}
        {absence.stopped && (
          <p>
            {event?.decisive
              ? translate(language, "absence.pendingDecision", {
                  event: translate(language, "event." + event.id + ".title"),
                })
              : translate(language, "absence.stopped")}
          </p>
        )}
        {!view.progress.nextId && view.progress.ready && !view.actionBlock && (
          <p>{translate(language, "absence.finalReady")}</p>
        )}
        <button type="button" onClick={clearAbsence}>
          {translate(
            language,
            absence.stopped && event?.decisive
              ? "absence.closeDecision"
              : "absence.close",
          )}
        </button>
      </Dialog>
    );
  if(view.hearing){
    const hearing=view.hearing;
    return <Dialog key={hearing.token} title={translate(language,hearing.kind==="ledger"?"hearing.ledger":"hearing.title")}>
      <p>{translate(language,hearing.kind==="ledger"?"hearing.ledgerIntro":"hearing.intro")}</p>
      {hearing.kind!=="ledger" && view.deferred.filter(cost=>cost.due<=hearing.target).map(cost=><p key={cost.source+cost.due}>
        {translate(language,cost.source)} · {translate(language,"family."+cost.family)} +{cost.points}</p>)}
      <div className="hearing-options">{hearing.options.map(option=><button key={option.id} type="button"
        onClick={()=>{if(view.rules==="winterStudy")logTrialRemedy(view.id,option.id,hearing.options.map(item=>item.id),hearing.target);send({type:"RECKON",token:hearing.token,remedy:option.id});}}>
        <strong>{translate(language,option.id==="carry" && hearing.kind==="ledger"?"hearing.collect":"remedy."+option.id)}</strong>
        <span>{translate(language,"price."+option.id+(option.id==="carry" && hearing.kind==="ledger"?".ledger":option.id==="departure" && hearing.target>2?".late":""))}</span>
        <small>{option.crises.map(crisis=>translate(language,"family."+crisis.family)+" "+formatNumber(crisis.severity,language,1)+"/100").join(" · ")}</small>
        {option.population!==1 && <small>{translate(language,"resource.population")} {formatNumber((option.population-1)*100,language,1,true)}%</small>}
        {option.fatal && <strong>{translate(language,"outcome.collapse")}</strong>}
      </button>)}</div>
    </Dialog>;
  }
  if ((view.studyFinished || (view.rules === "trial" && event?.id === "ledger")) && !view.outcome) {
    return <Dialog title={translate(language, "trial.complete")}>
      <p>{translate(language, "trial.bronze")}</p>
      <button onClick={() => exportTrialLog(view.id)}>{translate(language, "trial.export")}</button>
      <button onClick={onEnd} disabled={leaving}>{translate(language, "outcome.end")}</button>
      {endFailed && <><button onClick={onExport}>{translate(language, "slot.export")}</button>
        <button onClick={onDiscard}>{translate(language, "slot.discardExit")}</button></>}
    </Dialog>;
  }
  if (view.outcome) {
    const outcome = view.outcome;
    const end =
      outcome.kind === "collapse" || outcome.kind === "extinction" || outcome.kind === "transcendence";
    const title = translate(
      language,
      outcome.kind === "fragment" || outcome.kind === "dark"
        ? "outcome.heading." + outcome.kind
        : "outcome." + outcome.kind,
    );
    const rival =
      outcome.kind === "conquest"
        ? view.rivals.find(({ id }) => id === outcome.rival)
        : undefined;
    const priorCrisis = [...view.crises].sort(
      (left, right) => right.severity - left.severity,
    )[0];
    return (
      <Dialog key={outcome.kind} title={title}>
        {(view.rules === "trial" || view.rules === "winterStudy") && <button onClick={() => exportTrialLog(view.id)}>{translate(language, "trial.export")}</button>}
        <p>
          {translate(
            language,
            outcome.kind === "dark" && view.stage === 0
              ? "outcome.body.darkFirst"
              : "outcome.body." + outcome.kind,
            {
              ...summary,
              rival: rival?.name ?? translate(language, "outcome.unknownRival"),
              family: outcome.kind === "collapse" ? translate(language, "family." + outcome.family) : priorCrisis
                ? translate(language, "family." + priorCrisis.family)
                : translate(language, "outcome.unrest"),
            },
          )}
        </p>
        {end ? (
          <>
            <p>{translate(language, "outcome.summary", summary)}</p>
            {view.chronicle.at(-1)?.key === "log.debtCollapse" && outcome.kind === "collapse"
              ? view.chronicle.filter(entry => entry.key === "log.debtDue" && entry.result === "family." + outcome.family &&
                entry.id > ([...view.chronicle].reverse().find(e => e.key === "log.era" || e.key === "log.migrate")?.id ?? 0))
                .map(entry => <p key={entry.id}>{chronicleText(entry, language)}</p>)
              : lastDecision && (
              <p className="ending-decision">
                {chronicleText(lastDecision, language)}
              </p>
            )}
            {view.rules.startsWith("winter") && outcome.kind==="collapse" && <>
              <details><summary>{translate(language,"hearing.review")}</summary>
              {view.chronicle.filter(e=>["log.response","log.remedy","log.debtDue","log.collapse","log.debtCollapse"].includes(e.key)).slice(-7).map(e=><p key={e.id}>{chronicleText(e,language)}</p>)}</details>
              <button onClick={onReplay} disabled={leaving}>{translate(language,"hearing.replay")}</button></>}
            <button type="button" onClick={onEnd} disabled={leaving}>
              {translate(
                language,
                endFailed ? "slot.retryExit" : "outcome.end",
              )}
            </button>
            {endFailed && (
              <>
                <p role="alert">{translate(language, "slot.endFailed")}</p>
                <button type="button" onClick={onExport}>
                  {translate(language, "slot.export")}
                </button>
                <button type="button" onClick={onDiscard} disabled={leaving}>
                  {translate(language, "slot.discardExit")}
                </button>
              </>
            )}
          </>
        ) : outcome.kind === "fragment" ? (
          <>
            <p>{translate(language, "outcome.fragment")}</p>
            {outcome.names.map((name, choice) => (
              <button
                type="button"
                key={name}
                onClick={() => send({ type: "OUTCOME", choice })}
              >
                {name}
              </button>
            ))}
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => send({ type: "OUTCOME", choice: 0 })}
            >
              {translate(
                language,
                outcome.kind === "dark" ? "outcome.dark" : "outcome.migrate",
              )}
            </button>
            {outcome.kind === "conquest" && (
              <button
                type="button"
                onClick={() => send({ type: "OUTCOME", choice: 1 })}
              >
                {translate(language, "outcome.dormant")}
              </button>
            )}
          </>
        )}
      </Dialog>
    );
  }
  if (
    event &&
    (event.decisive
      ? closedDecision === decisionId
      : openedDecision !== decisionId)
  )
    return (
      <button
        className="decision-return"
        type="button"
        onClick={() => {
          setClosedDecision("");
          setOpenedDecision(decisionId);
        }}
      >
        <span aria-hidden="true">{subjectSymbols[event.family]} </span>
        {translate(language, "event.consider", {
          name: translate(language, "event." + event.id + ".title"),
        })}
        {!event.decisive && (
          <small>
            {translate(language, "event.timeLeft", {
              time: clockAtNormalSpeed(
                event.openedAt +
                  campaignBalance.decisionWindowTicks -
                  snapshot.tick,
              ),
            })}
          </small>
        )}
      </button>
    );
  if (event)
    return (
      <Dialog
        key={decisionId}
        title={translate(language, "event." + event.id + ".title")}
        onDismiss={() => {
          setClosedDecision(decisionId);
          setOpenedDecision("");
        }}
      >
        <EventScene
          family={event.family}
          stage={view.stage}
          icon={incidentSymbols[event.id] ?? "🏘️"}
        />
        <p className="event-family">
          <span aria-hidden="true">{subjectSymbols[event.family]} </span>
          {translate(language, "family." + event.family)}
          {event.decisive ? " · " + translate(language, "event.severe") : ""}
        </p>
        <p>{translate(language, "event." + event.id + ".body")}</p>
        {!event.decisive && (
          <p className="event-deadline">
            {translate(language, "event.fallback", {
              time: clockAtNormalSpeed(
                event.openedAt +
                  campaignBalance.decisionWindowTicks -
                  snapshot.tick,
              ),
              choice: translate(language, event.responses.find(option => option.choice === event.fallbackIndex)!.labelKey),
            })}{" "}
            <button
              type="button"
              className="secondary"
              onClick={() =>
                setSpeed(snapshot.speed === 0 ? lastRunningSpeed : 0)
              }
            >
              {translate(
                language,
                snapshot.speed === 0 ? "event.resumeClock" : "event.pauseClock",
              )}
            </button>
          </p>
        )}
        {view.rules.startsWith("winter") && event.id==="winter" && <p>{translate(language,"hearing.warning")}</p>}
        {view.rules.startsWith("winter") && view.eraId==="neolithic" && view.marks.field && <p>{translate(language,"hearing.failedCrop")}</p>}
        <div className={"event-responses" + (view.rules.startsWith("winter") ? " winter-cards" : "")}>
          {event.responses.map((response) => (
            <button
              type="button"
              className="event-option"
              data-choice={response.choice}
              key={response.choice}
              disabled={influence < response.cost}
              onClick={() =>
                send({
                  type: "RESPOND",
                  choice: response.choice,
                  eventId: event.id,
                  openedAt: event.openedAt,
                })
              }
            >
              <strong>{translate(language, response.labelKey)}</strong>
              <span>
                {response.cost
                  ? translate(language, "event.cost", { cost: response.cost })
                  : translate(language, view.rules.startsWith("winter") ? "hearing.zero" : "event.noCost")}
              </span>
              <small>{translate(language, response.consequenceKey)}</small>
              {view.rules.startsWith("winter") && event.id==="winter" && (response.choice===0 || response.choice===3) &&
                <small>{translate(language,"winter.trace."+response.choice)}</small>}
              {event.severity !== undefined && response.recovery > 0 && event.severity > 0 && (
                <small>{translate(language, "event.crisisRelief", {
                  family: translate(language, "family." + event.family),
                  before: Math.floor(event.severity),
                  after: Math.floor(Math.max(0, event.severity - response.recovery)),
                })}</small>
              )}
              {(response.requires || (response.founds && !view.heritage.includes(response.founds))) && (
                <small>{translate(language, response.requires ? "heritage.requires" : "heritage.founds", {
                  name: translate(language, "heritage." + (response.requires ?? response.founds)),
                })}</small>
              )}
              {response.founds && <small>{translate(language, isTradition(response.founds) ? "heritage.duration" : "heritage.lasting")}</small>}
              {response.requires && isTradition(response.requires) && <small>{translate(language, "heritage.renew")}</small>}
              {response.defer && campaignEras[view.stage+(response.defer.afterEras??1)] && <small>{translate(language, "debt.preview", {
                reason: translate(language, "deferred." + event.id + "." + response.choice),
                era: translate(language, "era." + campaignEras[view.stage+(response.defer.afterEras??1)]!.id), family: translate(language, "family." + response.defer.family),
                points: response.defer.points, total: response.defer.points + view.deferred.reduce((sum, entry) =>
                  sum + (entry.due === view.stage + (response.defer!.afterEras??1) && entry.family === response.defer!.family ? entry.points : 0), 0),
              })}</small>}
              {response.repay && view.deferred.some(entry => entry.family === response.repay!.family) && <small>{translate(language, "debt.repay", {
                family: translate(language, "family." + response.repay.family),
                points: Math.min(response.repay.points, view.deferred.reduce((sum, entry) =>
                  sum + (entry.family === response.repay!.family ? entry.points : 0), 0)),
              })}</small>}
              {response.risk && (
                <small>{translate(language, response.risk.after === 100 ? "event.collapseRisk" : view.rules.startsWith("winter") ? "hearing.risk" : "event.strain", {
                  family: translate(language, "family." + response.risk.family),
                  before: Math.floor(response.risk.before),
                  after: Math.floor(response.risk.after),
                })}</small>
              )}
            </button>
          ))}
        </div>
        <details className="event-numbers">
          <summary>{translate(language, "event.details")}</summary>
          {event.responses.map((response) => (
            <p key={response.labelKey}>
              {translate(language, response.labelKey)} ·{" "}
              {translate(language, "event.targetEffects", {
                effects: Object.entries(response.effects)
                  .map(
                    ([key, n]) =>
                      translate(language, "attribute." + key) +
                      " " +
                      formatNumber(n, language, 1, true),
                  )
                  .join(", "),
                duration: clockAtNormalSpeed(response.durationTicks),
              })}
              {response.recovery > 0 &&
                " · " +
                  translate(language, "event.recovery", {
                    value: response.recovery,
                  })}
            </p>
          ))}
        </details>
        <button
          className="secondary"
          type="button"
          onClick={() => {
            setClosedDecision(decisionId);
            setOpenedDecision("");
          }}
        >
          {translate(language, "event.close")}
        </button>
      </Dialog>
    );
  return null;
}
