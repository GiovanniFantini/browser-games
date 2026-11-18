import type { ModeSession } from '../race/mode-session';
import type { Vehicle } from '../vehicle/vehicle';
import type { CupState } from '../race/tournament';
import modes from '../data/modes.json';
import { worldRaces as catalog } from '../world/world-data';
import type { RaceSession } from '../race/session';

const labels: Record<string, string> = {
  circuit: 'CIRCUITO',
  sprint: 'SPRINT',
  drift: 'DRIFT',
  downhill: 'DRIFT IN DISCESA',
  drag: 'DRAG',
  checkpoint: 'SPRINT A TEMPO',
  challenge: 'SFIDA A DISTACCO',
  timeTrial: 'PROVA A TEMPO',
  tournament: 'TORNEO',
};
export interface RaceOptions {
  speedScale: number;
  rubberBand: number;
}
export function formatRaceTime(time: number | null) {
  if (time === null) return 'In corsa';
  const ms = Math.round(time * 1000),
    minutes = Math.floor(ms / 60000),
    seconds = Math.floor(ms / 1000) % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(ms % 1000).padStart(3, '0')}`;
}

export class RaceUI {
  private readonly root = document.createElement('div');
  readonly menu: HTMLElement;
  private readonly results: HTMLElement;
  private readonly hud: HTMLElement;
  private readonly signal: HTMLElement;
  private readonly interact: HTMLButtonElement;
  private readonly standings: HTMLElement;
  private readonly resultHeading: HTMLElement;
  private readonly resultInfo: HTMLElement;
  private readonly stats: HTMLElement;
  private readonly warning: HTMLElement;
  private readonly challengeGauge = document.createElement('meter');
  private elapsed = 0;
  private table = '';
  private eventId = '';
  menuVisible = false;
  private cup: CupState | null = null;
  private cupActive = false;
  onStart: (id: string, options: RaceOptions) => void = () => {};
  onBack: () => void = () => {};
  onQuick: () => void = () => {};
  onFree: () => void = () => {};
  onAbandon: () => void = () => {};
  onInteract: () => void = () => {};
  onChallenge: () => void = () => {};
  onNextCup: () => void = () => {};
  onResetCup: () => void = () => {};
  options: RaceOptions = { ...catalog.defaults };

  constructor() {
    this.root.className = 'races';
    this.root.innerHTML = `<button id="street-challenge" hidden>SFIDA NEMI / F</button><button id="race-interact" hidden></button><div id="race-hud" hidden><span class="eyebrow">OLD DOCKS / GARA</span><h2 id="race-title"></h2><div id="race-stats"></div><div id="race-warning" role="status"></div><div id="mode-hud"></div><button id="race-abandon">ABBANDONA GARA</button></div><div id="race-signal" hidden role="status" aria-live="polite"></div>
      <div id="race-menu" class="race-dialog" hidden role="dialog" aria-modal="true" aria-labelledby="races-heading"><section class="race-card"><span class="eyebrow">PORT RIDERS / GARE VELOCI</span><h2 id="races-heading">Scegli la tua corsa.</h2><p>Scegli una modalità. Tu corri con la tua configurazione; gli avversari usano il modello di serie.</p><div class="race-settings"><label>Difficoltà <select id="race-difficulty">${catalog.difficulties.map((level) => `<option value="${level.speedScale}" ${level.speedScale === catalog.defaults.speedScale ? 'selected' : ''}>${level.name}</option>`).join('')}</select></label><label>Recupero IA <select id="race-rubber">${catalog.recoveryOptions.map((level) => `<option value="${level.value}" ${level.value === catalog.defaults.rubberBand ? 'selected' : ''}>${level.name}</option>`).join('')}</select></label></div><p id="cup-progress"></p><button id="cup-reset" hidden>RICOMINCIA TORNEO</button><div class="race-events">${catalog.events
        .filter((e) => !('hidden' in e && e.hidden))
        .map(
          (event) =>
            `<article><span class="eyebrow">${event.mode === 'circuit' ? `CIRCUITO / ${event.laps} GIRI` : labels[event.mode]}</span><h3>${event.name}</h3><p>${event.description}</p><button data-start-race="${event.id}">AVVIA ${labels[event.mode]} ↗</button></article>`,
        )
        .join(
          '',
        )}</div><p class="race-note">Attraversa i checkpoint nell’ordine indicato. R ripristina all’ultimo checkpoint con ${catalog.resetPenalty} secondi di penalità. Il drag mantiene il traffico. X/Z cambiano marcia; V cambia tipo di cambio fuori dal drag. F sfida il pilota vicino in guida libera.</p><button id="race-back">INDIETRO <kbd>ESC</kbd></button></section></div>
      <div id="race-results" class="race-dialog" hidden role="dialog" aria-modal="true" aria-labelledby="race-result-heading"><section class="race-card"><span class="eyebrow">ORDINE DI ARRIVO</span><h2 id="race-result-heading"></h2><p id="race-result-info"></p><table><thead><tr><th>POS.</th><th>PILOTA</th><th>TEMPO</th></tr></thead><tbody id="race-standings"></tbody></table><p id="mode-result"></p><div id="cup-standings"></div><button id="cup-next" hidden>PROSSIMA TAPPA</button><p id="race-reward" role="status"></p><div class="result-actions"><button id="race-retry">RIPROVA ↗</button><button id="race-other">ALTRE GARE</button><button id="race-free">TORNA ALLA GUIDA</button></div><p class="race-note">Il premio viene salvato alla classifica finale. Uscendo dalla classifica provvisoria rinunci al premio. Il ritiro non assegna crediti.</p></section></div>`;
    document.querySelector('#interface')!.append(this.root);
    const get = <T extends HTMLElement>(selector: string) =>
      this.root.querySelector<T>(selector)!;
    this.menu = get('#race-menu');
    this.results = get('#race-results');
    this.hud = get('#race-hud');
    this.signal = get('#race-signal');
    this.interact = get('#race-interact');
    this.standings = get('#race-standings');
    this.resultHeading = get('#race-result-heading');
    this.resultInfo = get('#race-result-info');
    this.stats = get('#race-stats');
    this.warning = get('#race-warning');
    this.challengeGauge.id = 'challenge-gap';
    this.challengeGauge.min = -modes.challenge.gap;
    this.challengeGauge.max = modes.challenge.gap;
    this.challengeGauge.low = -modes.challenge.gap * 0.75;
    this.challengeGauge.high = modes.challenge.gap * 0.75;
    this.challengeGauge.optimum = modes.challenge.gap;
    this.challengeGauge.setAttribute(
      'aria-label',
      'Distacco dal rivale in metri',
    );
    this.challengeGauge.hidden = true;
    get('#mode-hud').after(this.challengeGauge);
    for (const button of this.root.querySelectorAll<HTMLButtonElement>(
      '[data-start-race]',
    ))
      button.onclick = () =>
        this.onStart(button.dataset.startRace!, this.readOptions());
    get('#street-challenge').onclick = () => this.onChallenge();
    get('#cup-next').onclick = () => this.onNextCup();
    get('#cup-reset').onclick = () => this.onResetCup();
    get('#race-back').onclick = () => this.onBack();
    get('#race-retry').onclick = () => this.onStart(this.eventId, this.options);
    get('#race-other').onclick = () => this.onQuick();
    get('#race-free').onclick = () => this.onFree();
    get('#race-abandon').onclick = () => this.onAbandon();
    this.interact.onclick = () => this.onInteract();
    document
      .querySelector('.top-actions')!
      .insertAdjacentHTML(
        'afterbegin',
        '<button id="quick-races">GARE <kbd>Q</kbd></button>',
      );
    document
      .querySelector('#start')!
      .insertAdjacentHTML(
        'afterend',
        '<button id="start-quick-race" class="start-quick">GARA VELOCE ↗</button>',
      );
    document.querySelector<HTMLButtonElement>('#quick-races')!.onclick = () =>
      this.onQuick();
    document.querySelector<HTMLButtonElement>('#start-quick-race')!.onclick =
      () => this.onQuick();
    document.querySelector('.build-label')!.innerHTML =
      'CIRCUITO + SPRINT <span>FASE 3 / 8</span>';
  }
  setCupAbandon(active: boolean) {
    this.root.querySelector('#race-abandon')!.textContent = active
      ? 'ABBANDONA TORNEO'
      : 'ABBANDONA GARA';
  }
  challengeNearby(near: boolean) {
    this.root.querySelector<HTMLElement>('#street-challenge')!.hidden = !near;
  }
  cupProgress(cup: CupState | null, active: boolean, settled = false) {
    this.cup = cup;
    this.cupActive = active;
    this.root.querySelector('#cup-progress')!.textContent =
      cup && cup.round < modes.cup.rounds.length
        ? `Torneo salvato: prossima tappa ${cup.round + 1} / ${modes.cup.rounds.length}. Seleziona Coppa per riprendere.`
        : '';
    this.root.querySelector<HTMLElement>('#cup-reset')!.hidden =
      !cup || cup.round >= modes.cup.rounds.length;
    this.root.querySelector<HTMLElement>('#cup-next')!.hidden =
      !settled ||
      !active ||
      !cup ||
      cup.round === 0 ||
      cup.round >= modes.cup.rounds.length;
    this.root.querySelector<HTMLElement>('#race-retry')!.hidden =
      active && !!cup && cup.round < modes.cup.rounds.length;
    this.root.querySelector('#cup-standings')!.innerHTML =
      !active || !cup
        ? ''
        : `<h3>CLASSIFICA TORNEO / ${cup.round} DI ${modes.cup.rounds.length} TAPPE</h3><table><thead><tr><th>PILOTA</th><th>PUNTI</th><th>TEMPO TOTALE</th></tr></thead><tbody>${cup.standings.map((s) => `<tr><td>${s.id === 'player' ? 'TU' : catalog.drivers.find((d) => d.id === s.id)!.name}</td><td>${s.points}</td><td>${formatRaceTime(s.time)}</td></tr>`).join('')}</tbody></table>`;
  }
  modeInfo(session: ModeSession, car: Vehicle, ghostVisible: boolean) {
    const m = session.metrics(),
      mode = m.kind;
    this.challengeGauge.hidden = mode !== 'challenge';
    if (mode === 'challenge') {
      this.challengeGauge.value = Math.max(
        -modes.challenge.gap,
        Math.min(modes.challenge.gap, m.gap),
      );
      this.challengeGauge.setAttribute(
        'aria-valuetext',
        `${Math.round(m.gap)} metri`,
      );
    }
    let text = '';
    if (mode === 'drift' || mode === 'downhill')
      text = `DRIFT ${m.score} / ${session.route.definition.targetScore} · CATENA ${m.chain} ×${m.multiplier} · ANGOLO ${Math.round(m.angle)}° · ${Math.ceil(m.remaining)}s`;
    if (mode === 'drag')
      text = `MANUALE ${car.power.gear} / 6 · ${Math.round(car.power.rpm)} giri · ${car.power.rpm > car.stats.rpmLimit * 0.98 ? 'LIMITATORE' : car.power.rpm >= car.stats.rpmLimit * modes.drag.perfectMin && car.power.rpm <= car.stats.rpmLimit * modes.drag.perfectMax ? 'CAMBIA ORA / X' : 'X SU / Z GIÙ'} · MOTORE ${Math.round((1 - (car.power.damage ?? 0)) * 100)}% · ${car.power.shiftLabel ?? ''}`;
    if (mode === 'drag' && session.phase === 'countdown')
      text = `PARTENZA ${Math.round(car.power.rpm)} GIRI / FASCIA ${Math.round(car.stats.rpmLimit * modes.drag.launchMin)}–${Math.round(car.stats.rpmLimit * modes.drag.launchMax)} · ACCELERA A IMPULSI`;
    if (mode === 'checkpoint')
      text = `TEMPO ${m.remaining.toFixed(1)}s · +${modes.checkpoint.bonus}s AL CHECKPOINT`;
    if (mode === 'challenge')
      text = `DISTACCO ${Math.round(m.gap)} / ${modes.challenge.gap} m · TENUTA ${Math.abs(m.hold).toFixed(1)} / ${modes.challenge.holdSeconds}s · ${Math.ceil(m.remaining)}s`;
    if (mode === 'timeTrial')
      text = `${ghostVisible ? 'FANTASMA DEL MIGLIOR GIRO' : 'GIRO PULITO / FANTASMA DISPONIBILE DAL PROSSIMO TENTATIVO'} · R invalida la registrazione`;
    if (this.cupActive && this.cup)
      text += ` TORNEO / TAPPA ${Math.min(this.cup.round + 1, modes.cup.rounds.length)} DI ${modes.cup.rounds.length} · Abbandonare cancella le tappe salvate.`;
    this.root.querySelector('#mode-hud')!.textContent = text;
    this.root.querySelector('#mode-result')!.textContent =
      m.reason ||
      (mode === 'drift' || mode === 'downhill'
        ? `Punti convalidati: ${m.score}`
        : mode === 'timeTrial'
          ? session.penalty
            ? 'Giro con ripristino: fantasma non registrato.'
            : 'Solo un giro pulito più veloce aggiorna il fantasma.'
          : '');
  }
  private readOptions() {
    this.options = {
      speedScale: Number(
        this.root.querySelector<HTMLSelectElement>('#race-difficulty')!.value,
      ),
      rubberBand: Number(
        this.root.querySelector<HTMLSelectElement>('#race-rubber')!.value,
      ),
    };
    return this.options;
  }
  showMenu() {
    this.menuVisible = true;
    this.menu.hidden = false;
    this.results.hidden = true;
    this.interact.hidden = true;
    this.challengeNearby(false);
    this.root.querySelector<HTMLButtonElement>('[data-start-race]')!.focus();
  }
  hideMenu() {
    this.menuVisible = false;
    this.menu.hidden = true;
  }
  setReward(message: string) {
    this.root.querySelector('#race-reward')!.textContent = message;
  }
  setRetryAvailable(available: boolean) {
    this.root.querySelector<HTMLButtonElement>('#race-retry')!.hidden =
      !available;
  }
  start(id: string, options: RaceOptions) {
    this.setReward('Premio in attesa della classifica finale.');
    this.setQuickEnabled(false);
    this.eventId = id;
    this.options = options;
    this.hideMenu();
    this.results.hidden = true;
    this.hud.hidden = false;
    this.table = '';
    this.root.querySelector('#mode-result')!.textContent = '';
    document.querySelector('#interface')!.classList.add('in-race');
    this.root.querySelector('#race-title')!.textContent = catalog.events.find(
      (event) => event.id === id,
    )!.name;
  }
  stop() {
    this.setQuickEnabled(true);
    this.hideMenu();
    this.results.hidden = true;
    this.hud.hidden = true;
    this.signal.hidden = true;
    document.querySelector('#interface')!.classList.remove('in-race');
  }
  private setQuickEnabled(enabled: boolean) {
    for (const button of document.querySelectorAll<HTMLButtonElement>(
      '#quick-races,#start-quick-race',
    ))
      button.disabled = !enabled;
  }
  nearby(name: string | null) {
    this.interact.hidden = !name;
    if (name) this.interact.textContent = `${name} · PREMI E PER GAREGGIARE`;
  }
  update(session: RaceSession, dt: number, warning: string) {
    this.elapsed += dt;
    if (this.elapsed < 0.1) return;
    this.elapsed = 0;
    const player = session.player,
      finished = player.finishTime !== null || player.retired;
    this.signal.hidden =
      finished || !(session.phase === 'countdown' || session.elapsed < 1);
    const signal =
      session.phase === 'countdown'
        ? String(Math.ceil(session.countdown))
        : 'VAI';
    if (this.signal.textContent !== signal) this.signal.textContent = signal;
    const courseStatus =
      session.route.definition.mode === 'challenge'
        ? 'SFIDA A DISTACCO'
        : `${session.route.closed ? 'GIRO' : 'TRATTO'} ${Math.min(player.lap + 1, session.route.definition.laps)} / ${session.route.definition.laps}`;
    this.stats.textContent = `POS. ${session.ranking.indexOf(player) + 1} / ${session.racers.length}  ·  ${courseStatus}  ·  ${formatRaceTime(session.elapsed + session.penalty)}  ·  CP ${Math.min(player.gate + 1, session.route.gates.length)} / ${session.route.gates.length}`;
    this.warning.setAttribute(
      'aria-live',
      warning.startsWith('Prossimo') ? 'off' : 'polite',
    );
    if (this.warning.textContent !== warning)
      this.warning.textContent = warning;
    if (!finished) return;
    const first = this.results.hidden;
    this.results.hidden = false;
    this.hud.hidden = true;
    this.signal.hidden = true;
    const cupDone =
      this.cupActive && this.cup && this.cup.round === modes.cup.rounds.length;
    this.resultHeading.textContent = cupDone
      ? `Coppa conclusa · ${this.cup!.standings.findIndex((s) => s.id === 'player') + 1}° posto`
      : player.retired
        ? 'Gara abbandonata'
        : `${session.ranking.indexOf(player) + 1}° posto · ${session.route.definition.name}`;
    this.resultInfo.textContent = `${session.phase === 'finished' ? 'Classifica finale' : 'Classifica provvisoria, avversari ancora in corsa'} · Il tuo tempo: ${player.retired ? 'RITIRATO' : formatRaceTime(player.finishTime)} · Penalità: ${session.penalty}s${player.bestLap !== null ? ` · Miglior giro: ${formatRaceTime(player.bestLap)}` : ''}`;
    const table = session.ranking
      .map(
        (racer, index) =>
          `<tr class="${racer.id === 'player' ? 'player-result' : ''}"><td>${index + 1}</td><td>${racer.id === 'player' ? 'TU' : racer.name}</td><td>${racer.retired ? 'RITIRATO' : formatRaceTime(racer.finishTime)}</td></tr>`,
      )
      .join('');
    if (table !== this.table) {
      this.standings.innerHTML = table;
      this.table = table;
    }
    if (first) {
      this.resultHeading.tabIndex = -1;
      this.results.scrollTop = 0;
      this.resultHeading.focus({ preventScroll: true });
    }
  }
}
