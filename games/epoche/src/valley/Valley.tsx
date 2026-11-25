import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  destination,
  jobs,
  jobSite,
  type Job,
  options,
  replay,
  sites,
  type Book,
  type Order,
  type Site,
  type Turn,
} from "./game";
import { label, type Lang } from "../i18n/valley";
import { ValleyArt } from "./ValleyArt";
import "./valley.css";

const prefix = "epoche.valley.v1.";
const coords: Record<Site, [number, number]> = {
  terrace: [24, 20],
  camp: [22, 52],
  bank: [48, 73],
  boat: [83, 24],
};
const seasons = ["I", "II", "III", "IV", "V"];
const initialSeed = () => crypto.getRandomValues(new Uint32Array(1))[0]!;
const fresh = (seed = initialSeed()): Book => ({ version: 1, seed, turns: [] });
function getSlots() {
  try {
    return Object.keys(localStorage)
      .filter((k) => k.startsWith(prefix))
      .map((k) => k.slice(prefix.length))
      .sort()
      .reverse();
  } catch {
    return [];
  }
}
function readLanguage(): Lang {
  try {
    return localStorage.getItem("epoche-language") === "en" ? "en" : "it";
  } catch {
    return "it";
  }
}
function newSlot() {
  return Date.now().toString(36) + "-" + crypto.randomUUID().slice(0, 8);
}
function replaceSlot(id: string) {
  const u = new URL(location.href);
  u.searchParams.set("valle", id);
  history.replaceState(null, "", u);
}
function start() {
  const requested = new URLSearchParams(location.search).get("valle");
  const id = requested || getSlots()[0] || newSlot();
  try {
    const raw = localStorage.getItem(prefix + id);
    if (raw) return { id, book: replay(JSON.parse(raw)).book, error: false };
    if (requested) return { id: newSlot(), book: fresh(), error: true };
  } catch {
    return { id: newSlot(), book: fresh(), error: true };
  }
  return { id, book: fresh(), error: false };
}
function note(key: string) {
  return ["common", "private", "glean"].includes(key) ? "e" + key : key;
}
const ico: Record<string, string> = {
  wood: "▰",
  food: "◒",
  grain: "❧",
  terrace: "⌁",
  bank: "≋",
  camp: "⌂",
  boat: "⚓",
};
export default function Valley() {
  const [initial] = useState(start);
  const [slot, setSlot] = useState(initial.id),
    [book, setBook] = useState(initial.book);
  const [lang, setLang] = useState<Lang>(() => readLanguage());
  const [persist, setPersist] = useState(true),
    [error, setError] = useState(initial.error);
  const [selected, select] = useState<Order | null>(null),
    [inspect, setInspect] = useState<Site | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [busy, setBusy] = useState(false);
  const [showReport, report] = useState(false),
    [panel, setPanel] = useState<"journal" | "archive" | null>(null);
  const [speed, setSpeed] = useState(1);
  const wk = useRef<Worker | null>(null),
    timer = useRef<number | undefined>(undefined),
    lock = useRef(false);
  const reportHeading = useRef<HTMLHeadingElement>(null);
  const { history } = replay(book);
  const v = history[history.length - 1]!,
    choices = options(v);
  const t = (s: string) => label(lang, s);
  useEffect(() => {
    replaceSlot(slot);
    try {
      localStorage.setItem(prefix + slot, JSON.stringify(book));
      setPersist(true);
    } catch {
      setPersist(false);
    }
  }, [slot, book]);
  useEffect(() => {
    const w = new Worker(new URL("./worker.ts", import.meta.url), {
      type: "module",
    });
    wk.current = w;
    const fail = () => {
      lock.current = false;
      setBusy(false);
      setError(true);
    };
    w.onerror = fail;
    w.onmessage = (e) => {
      lock.current = false;
      setBusy(false);
      if (!e.data.ok) {
        fail();
        return;
      }
      setBook(e.data.book);
      select(null);
      setInspect(null);
      setJob(null);
      report(true);
    };
    return () => {
      w.terminate();
      clearTimeout(timer.current);
    };
  }, []);
  useEffect(() => {
    if (showReport) reportHeading.current?.focus();
  }, [showReport]);
  function openBook(b: Book, id = newSlot()) {
    if (lock.current) return;
    setSlot(id);
    setBook(b);
    select(null);
    setInspect(null);
    report(false);
    setPanel(null);
    setError(false);
    setJob(null);
  }
  function choose(o: Order) {
    if (busy || showReport || v.ending) return;
    select(o);
    setInspect(destination[o]);
    const available = jobs(v, o);
    setJob(available.length === 1 ? available[0]! : null);
  }
  function place(s: Site) {
    if (busy || v.ending || showReport) return;
    if (selected) {
      const candidate = jobs(v, selected).find(
        (j) => jobSite[j] === s && j !== "together",
      );
      if (candidate) {
        setJob(candidate);
        return;
      }
    }
    const matching = choices.filter((o) => destination[o] === s);
    if (matching.length === 1) choose(matching[0]!);
    else {
      setInspect(s);
      select(null);
      setJob(null);
    }
  }
  function commit() {
    if (!selected || !job || lock.current) return;
    lock.current = true;
    setBusy(true);
    setError(false);
    const turn: Turn = { order: selected, job, deliver: job === "trade" };
    timer.current = window.setTimeout(
      () => wk.current?.postMessage({ book, turn }),
      matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 950 / speed,
    );
  }
  function exportBook() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(book)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "epoche-valle-" + book.seed + ".json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  }
  const jobLabel = (j: Job) =>
    t(j === "mend" && v.season === 1 ? "jsalvage" : "j" + j);
  const jobHint = (j: Job) =>
    v.season === 0 && selected === "shelter"
      ? t(j === "guard" ? "guardHint" : "gatherFirst")
      : t(j === "mend" && v.season === 1 ? "hjsalvage" : "hj" + j);
  const selectedJobs = selected ? jobs(v, selected) : [];
  const last = book.turns.at(-1);
  const primarySite = selected
    ? destination[selected]
    : last
      ? destination[last.order]
      : "camp";
  const lastJob = selected ? job : last?.job;
  const secondSite =
    lastJob && lastJob !== "together" ? jobSite[lastJob] : primarySite;
  const site = selected ? destination[selected] : inspect;
  const origin: Site =
    v.season === 0 ? "bank" : v.season === 2 && v.pledged ? "boat" : "camp";
  const route = site && coords[site],
    from = coords[origin];
  const log = (
    <ol className="v-log">
      {book.turns.map((turn, i) => (
        <li key={i}>
          <small>
            {seasons[i]} · {t("s" + i)}
          </small>
          <h3>{t(turn.order)}</h3>
          {turn.job && (
            <small>
              {t("ordersTwo")} ·{" "}
              {t(turn.job === "mend" && i === 1 ? "jsalvage" : "j" + turn.job)}
            </small>
          )}
          {history[i + 1]!.events.map((k) => (
            <p key={k}>{t(note(k))}</p>
          ))}
        </li>
      ))}
    </ol>
  );
  return (
    <main className="valley" lang={lang}>
      <header className="v-head">
        <a href="?" className="v-brand">
          EPOCHE
        </a>
        <span className="v-place">
          {t("valley")} · {t("proto")}
        </span>
        <div className="v-tools">
          <button
            disabled={busy}
            onClick={() => setPanel(panel === "archive" ? null : "archive")}
          >
            {t("back")}
          </button>
          <button
            disabled={busy}
            onClick={() => setPanel(panel === "journal" ? null : "journal")}
          >
            {t("diaryLink")}
          </button>
          <select
            aria-label={t("language")}
            value={lang}
            onChange={(e) => {
              const value = e.target.value as Lang;
              setLang(value);
              try {
                localStorage.setItem("epoche-language", value);
              } catch {
                /* Session language still works. */
              }
            }}
          >
            <option value="it">IT</option>
            <option value="en">EN</option>
          </select>
        </div>
      </header>
      {(error || !persist) && (
        <p role="alert">{t(error ? "error" : "saveError")}</p>
      )}
      {panel && (
        <section className="v-drawer">
          <button onClick={() => setPanel(null)}>{t("close")}</button>
          <h2>{t(panel === "archive" ? "archive" : "journal")}</h2>
          {panel === "journal" ? (
            book.turns.length ? (
              log
            ) : (
              <p>{t("empty")}</p>
            )
          ) : (
            <div className="v-slots">
              {getSlots().map((id) => {
                try {
                  const b = replay(
                    JSON.parse(localStorage.getItem(prefix + id)!),
                  ).book;
                  return (
                    <button key={id} onClick={() => openBook(b, id)}>
                      {t("world")} {b.seed} · {b.turns.length}/5 · {t("resume")}
                    </button>
                  );
                } catch {
                  return null;
                }
              })}
              <button onClick={() => openBook(fresh())}>{t("new")}</button>
              <label>
                {t("import")}{" "}
                <input
                  type="file"
                  accept=".json"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      try {
                        if (f.size > 32768) throw Error();
                        openBook(replay(JSON.parse(await f.text())).book);
                      } catch {
                        setError(true);
                      }
                    }
                  }}
                />
              </label>
            </div>
          )}
          <button onClick={exportBook}>{t("export")}</button>
        </section>
      )}
      <div className="v-layout">
        <section
          aria-label={t("valley")}
          className={"v-map season-" + v.season + (busy ? " moving" : "")}
          style={{ "--travel": 950 / speed + "ms" } as CSSProperties}
        >
          <div className="v-atlas">
            <div className="v-terrain" />
            <div className="v-wash" />
            <ValleyArt v={v} crews={[primarySite, secondSite]} />
            <svg
              className="v-trails"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="overflow-fade">
                  <stop offset="0%" stopColor="#709f9c" stopOpacity=".62" />
                  <stop offset="52%" stopColor="#428b89" stopOpacity=".61" />
                  <stop offset="100%" stopColor="#347f7f" stopOpacity="0" />
                </linearGradient>
              </defs>
              {v.flood === "high" && v.season === 1 && (
                <path
                  className="v-inundation"
                  d="M55 41 C51 46 54 56 52 61 S45 65 44 70 Q42 74 48 76 Q54 76 59 80 Q65 85 67 91 Q68 96 61 100 L79 100 Q87 92 91 83 Q92 71 81 60 Q67 48 55 41Z"
                />
              )}
              {route && (
                <path
                  className="v-route"
                  d={`M${from[0]} ${from[1]} Q${(from[0] + route[0]) / 2 + 4} ${(from[1] + route[1]) / 2 - 7} ${route[0]} ${route[1]}`}
                />
              )}
            </svg>
            {sites.map((s) => (
              <button
                key={s}
                type="button"
                className={
                  "v-pin " +
                  ((
                    selected && selectedJobs.length > 1
                      ? selectedJobs.some((j) => jobSite[j] === s)
                      : choices.some((o) => destination[o] === s)
                  )
                    ? "active "
                    : "") +
                  (s === site ? "selected" : "")
                }
                aria-pressed={s === site}
                disabled={busy || showReport || !!v.ending}
                style={{ left: coords[s][0] + "%", top: coords[s][1] + "%" }}
                onClick={() => place(s)}
              >
                <b aria-hidden="true">{ico[s]}</b>
                <span>{t(s)}</span>
              </button>
            ))}
            {v.season > 0 && (
              <span
                className="v-token"
                style={{
                  left: coords[v.timberSite][0] + "%",
                  top: coords[v.timberSite][1] + 8 + "%",
                }}
              >
                {ico.wood} {v.wood}
              </span>
            )}
            {v.depot !== "none" && (
              <span className={"v-depot " + v.depot}>
                {t(v.depot === "common" ? "publicStore" : "homeStore")}
                {v.host ? " · " + t("guestHere") : ""}
              </span>
            )}
            {(v.pledged || v.trust === "broken" || v.trust === "neutral") && (
              <span className="v-marker v-boatnote">
                {t(v.pledged ? "reserved" : "gone")}
              </span>
            )}
            {v.ending === "harvest" && (
              <span className="v-marker v-field">❧ {t("bed")}</span>
            )}
          </div>
          <div className="v-mapfoot">
            <span>{t("title")}</span>
            <small>
              {t("world")} {book.seed}
            </small>
          </div>
        </section>
        <aside className="v-story">
          <div className="v-stock">
            {(["wood", "food", "grain"] as const).map((k) => (
              <div key={k}>
                <span>
                  {ico[k]} {t(k)}
                </span>
                <b>{v[k]}</b>
              </div>
            ))}
          </div>
          {v.ending || showReport ? (
            <section className="v-report">
              <small>
                {t(v.ending ? "outcome" : "result")} · {seasons[v.season - 1]}
              </small>
              <h1 ref={reportHeading} tabIndex={-1}>
                {t(v.ending ?? "s" + (v.season - 1))}
              </h1>
              {v.events.map((k) => (
                <p key={k}>{t(note(k))}</p>
              ))}
              {v.ending && (
                <div className="v-memories">
                  <p>
                    {t("timberPath")} · {t(v.timberSite)} ·{" "}
                    {t(note(history[1]!.events[0]!))}
                  </p>
                  <p>
                    {t(
                      v.host
                        ? v.ending === "harvest"
                          ? "fieldGuest"
                          : "guestJourney"
                        : "familyLeft",
                    )}
                  </p>
                  <p>
                    {t(
                      v.trust === "kept"
                        ? "pastKept"
                        : v.trust === "broken"
                          ? "pastBroken"
                          : "pastNeutral",
                    )}
                  </p>
                  {v.flood === "high" && (
                    <p>{t(v.repaired ? "houseFixed" : "openHome")}</p>
                  )}
                  {v.ending === "dispersal" && (
                    <p>
                      {v.hungry >= 2
                        ? t("hunger")
                        : t(v.grain ? "sickExit" : "seedExit")}{" "}
                      {v.trust !== "kept" && t("noFerry")}
                    </p>
                  )}
                </div>
              )}
              {v.season === 1 && <p>{t(v.flood)}</p>}
              {v.ending ? (
                <>
                  <button
                    className="v-go"
                    onClick={() => openBook(fresh(book.seed))}
                  >
                    {t("restart")}
                  </button>
                  <button onClick={() => openBook(fresh())}>{t("new")}</button>
                  <button onClick={() => setPanel("journal")}>
                    {t("diaryLink")}
                  </button>
                </>
              ) : (
                <button className="v-go" onClick={() => report(false)}>
                  {t("next")}
                </button>
              )}
            </section>
          ) : (
            <>
              <small className="v-kicker">
                {t("season")} {seasons[v.season]} / V
              </small>
              <h1>{t("s" + v.season)}</h1>
              <p className="v-intro">{t("q" + v.season)}</p>
              {v.season === 0 && (
                <p className="v-signal">{t(v.cloudy ? "cloudy" : "clear")}</p>
              )}
              {v.flood === "high" &&
                (v.season === 1 ||
                  v.season === 2 ||
                  (v.season === 3 && v.depot !== "private" && !v.repaired)) && (
                  <p className="v-signal">
                    {t(v.season === 3 ? "wetNow" : "wetWarning")}
                  </p>
                )}
              {v.hungry > 0 && <p className="v-signal">{t("hungry")}</p>}
              {v.season === 4 && (
                <p className="v-signal">
                  {t(v.sick ? "illCrew" : "crew")}
                  {v.host ? " · " + t("helpCrew") : ""}
                </p>
              )}
              {inspect && !choices.some((o) => destination[o] === inspect) && (
                <p role="status">{t("inspect")}</p>
              )}
              <h3 className="v-crewhead">{t("ordersOne")}</h3>
              <div className="v-choices" aria-label={t("plan")}>
                {choices.map((o) => (
                  <button
                    key={o}
                    data-order={o}
                    className={selected === o ? "chosen" : ""}
                    disabled={busy}
                    aria-pressed={selected === o}
                    onClick={() => choose(o)}
                  >
                    <span>{ico[destination[o]]}</span>
                    {t(o)}
                  </button>
                ))}
              </div>
              {selected ? (
                <div className="v-preview">
                  <p>{t("d" + selected)}</p>
                  <h3 className="v-crewhead">{t("ordersTwo")}</h3>
                  <div className="v-jobs">
                    {selectedJobs.map((j) => (
                      <button
                        key={j}
                        data-job={j}
                        disabled={busy}
                        aria-pressed={job === j}
                        onClick={() => setJob(j)}
                      >
                        {jobLabel(j)}
                      </button>
                    ))}
                  </div>
                  <p>{job ? jobHint(job) : t("pendingCrew")}</p>
                  {v.pledged && job && job !== "trade" && <p>{t("refuse")}</p>}
                  <button
                    className="v-undo"
                    disabled={busy}
                    onClick={() => {
                      select(null);
                      setInspect(null);
                      setJob(null);
                    }}
                  >
                    {t("undo")}
                  </button>
                </div>
              ) : (
                <p className="v-hint">{t("pick")}</p>
              )}
              <button
                className="v-go"
                disabled={!selected || !job || busy}
                onClick={commit}
              >
                {t("go")} →
              </button>
            </>
          )}
        </aside>
      </div>
      <footer>
        <small>{t("upkeep")}</small>
        <label>
          {t("speed")}{" "}
          <select
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
          >
            {[1, 2, 4, 10, 25].map((n) => (
              <option key={n} value={n}>
                {n}×
              </option>
            ))}
          </select>
        </label>
      </footer>
    </main>
  );
}
