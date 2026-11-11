import { displaySpeed, speedUnit, preferences } from '../core/preferences';
import { careerData, careerLevel } from '../progression/career';
import {
  catalog,
  calculateStats,
  summary,
  type CarStats,
} from '../progression/catalog';
import {
  activeCar,
  buyCar,
  tradeCar,
  tradeInValue,
  buyPart,
  equipPart,
  parseProfile,
  MAX_SAVE_BYTES,
  type Profile,
} from '../progression/profile';
import { ProfileStore } from '../progression/storage';
import { GaragePreview } from './garage-preview';
import { updatePowertrain } from '../vehicle/drivetrain';
import { formatRaceTime } from './races';
import './garage.css';
import races from '../data/races.json';
import { AppearanceEditor } from './appearance-editor';

const money = (n: number) =>
  `${n.toLocaleString(preferences.language === 'en' ? 'en-GB' : 'it-IT')} CR`;
function statsText(stats: CarStats) {
  const s = summary(stats);
  return `<span>SPINTA <b>${s.acceleration}</b></span><span>TENUTA <b>${s.handling}</b></span><span>FRENI <b>${s.braking}</b></span><span>LIMITE TEORICO <b>${displaySpeed(stats.maxSpeed)} ${speedUnit()}</b></span><span>MASSA <b>${Math.round(stats.mass)} kg</b></span><span>NITRO <b>${stats.nitroDuration.toFixed(1)} s / ×${stats.nitroMultiplier.toFixed(2)}</b></span>`;
}
function dyno(stats: CarStats) {
  const force: string[] = [],
    power: string[] = [];
  let maxPower = 0;
  for (let i = 0; i <= 40; i++) {
    const speed = (stats.maxSpeed * i) / 40;
    const state = {
      gear: 1,
      rpm: 950,
      nitro: 1,
      boosting: false,
      drive: 0,
      braking: 0,
    };
    updatePowertrain(state, speed, 1, 0, false, true, 0, stats);
    const kw = (state.drive * speed) / 1000;
    maxPower = Math.max(maxPower, kw);
    force.push(`${10 + i * 7},${110 - (state.drive / stats.engineForce) * 90}`);
    power.push(
      `${10 + i * 7},${110 - (kw / ((stats.engineForce * stats.maxSpeed) / 1000)) * 200}`,
    );
  }
  return `<svg viewBox="0 0 310 130" role="img" aria-label="Curve teoriche di forza motrice e potenza alle ruote in funzione della velocità"><path d="M10 10V110H295" fill="none" stroke="#627483"/><polyline points="${force.join(' ')}" fill="none" stroke="#b5e873" stroke-width="2"/><polyline points="${power.join(' ')}" fill="none" stroke="#75d9ee" stroke-width="2"/></svg><p>Forza motrice (verde): ${Math.round(stats.engineForce)} N di picco. Potenza alle ruote (azzurro): ${maxPower.toFixed(1)} kW di picco teorico. Velocità 0–${displaySpeed(stats.maxSpeed)} ${speedUnit()}.</p><p>Curve del modello arcade, senza nitro, resistenze o slittamento. La velocità reale dipende dalla guida. Indici: Silex C1 di serie = 100.</p>`;
}

export class GarageUI {
  readonly root = document.createElement('div');
  open = false;
  private showroom = false;
  private selectedModel = 'silex-c1';
  private tradeTarget: string | null = null;
  private category = catalog.categories[0].id;
  private preview?: GaragePreview;
  private pending: Profile | null = null;
  private importGeneration = 0;
  private debugVisible = false;
  private mode: 'performance' | 'appearance' = 'performance';
  private editor?: AppearanceEditor;
  private returnFocus: HTMLElement | null = null;
  private readonly status: HTMLElement;
  private readonly content: HTMLElement;
  private readonly wallet: HTMLElement;
  private readonly opener: HTMLButtonElement;
  private readonly prompt: HTMLButtonElement;
  onOpen: () => void = () => {};
  onClose: () => void = () => {};
  onChange: () => void = () => {};

  constructor(readonly store: ProfileStore) {
    this.root.id = 'garage';
    this.root.hidden = true;
    this.root.setAttribute('role', 'dialog');
    this.root.setAttribute('aria-modal', 'true');
    this.root.setAttribute('aria-labelledby', 'garage-heading');
    this.root.innerHTML = `<section class="garage-shell"><header><div><span class="eyebrow">OFFICINA TORQEN / OLD DOCKS</span><h2 id="garage-heading">Costruisci la tua risposta.</h2></div><div><span id="garage-wallet"></span><button id="garage-mode">ESTETICA E FOTO</button><button id="garage-close">TORNA <kbd>ESC</kbd></button></div></header><p id="garage-status" role="status" aria-live="polite"></p><div id="garage-content"></div></section>`;
    document.querySelector('#interface')!.append(this.root);
    this.status = this.root.querySelector('#garage-status')!;
    this.content = this.root.querySelector('#garage-content')!;
    this.wallet = this.root.querySelector('#garage-wallet')!;
    this.root.querySelector<HTMLButtonElement>('#garage-close')!.onclick = () =>
      this.onClose();
    this.root.querySelector<HTMLButtonElement>('#garage-mode')!.onclick =
      () => {
        this.mode = this.mode === 'performance' ? 'appearance' : 'performance';
        this.preview?.resetPose();
        this.render();
      };
    this.opener = document.createElement('button');
    this.opener.id = 'open-garage';
    this.opener.innerHTML = 'GARAGE <kbd>H</kbd>';
    document.querySelector('.top-actions')!.prepend(this.opener);
    this.opener.onclick = () => this.onOpen();
    const menu = document.createElement('button');
    menu.id = 'start-garage';
    menu.className = 'start-quick';
    menu.textContent = 'GARAGE E OFFICINA ↗';
    menu.onclick = () => this.onOpen();
    document.querySelector('#start')!.after(menu);
    this.prompt = document.createElement('button');
    this.prompt.id = 'garage-interact';
    this.prompt.hidden = true;
    this.prompt.textContent = 'OFFICINA / GARAGE · PREMI E PER ENTRARE';
    this.prompt.onclick = () => this.onOpen();
    document.querySelector('#interface')!.append(this.prompt);
    this.root.addEventListener('keydown', (event) => {
      if (event.key !== 'Tab') return;
      const controls = [
        ...this.root.querySelectorAll<HTMLElement>(
          'button:not(:disabled),select,input,a[href]',
        ),
      ].filter((el) => !el.hidden && el.getClientRects().length);
      const first = controls[0],
        last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    });
    document.querySelector('.build-label')!.innerHTML =
      'CARRIERA + STILE <span>FASE 7 / 8</span>';
  }
  setAvailable(available: boolean) {
    this.opener.disabled = !available;
    this.root.ownerDocument.querySelector<HTMLButtonElement>(
      '#start-garage',
    )!.disabled = !available;
  }
  focusCatalog() {
    this.root.querySelector('.garage-cars')?.scrollIntoView({ block: 'start' });
    this.root
      .querySelector<HTMLSelectElement>('#garage-model')
      ?.focus({ preventScroll: true });
  }
  nearby(show: boolean) {
    this.prompt.hidden = !show || this.open;
  }
  show(style = false) {
    this.showroom = false;
    this.tradeTarget = null;
    this.mode = style ? 'appearance' : 'performance';
    this.returnFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    this.open = true;
    this.root.hidden = false;
    this.prompt.hidden = true;
    this.render();
    this.root.querySelector<HTMLButtonElement>('#garage-close')!.focus();
  }
  toggleDebug() {
    if (import.meta.env.DEV) {
      if (this.mode === 'appearance') {
        this.status.textContent =
          'Gli strumenti economia sono nella sezione Prestazioni. La tua anteprima resta aperta.';
        return;
      }
      this.debugVisible = !this.debugVisible;
      this.render();
    }
  }
  closePhoto() {
    if (!this.preview?.isPhoto) return false;
    this.preview.closePhoto();
    return true;
  }
  hide() {
    this.editor?.dispose();
    this.preview?.closePhoto();
    this.preview?.resetPose();
    this.mode = 'performance';
    this.importGeneration++;
    this.open = false;
    this.pending = null;
    this.root.hidden = true;
    this.preview?.stop();
    this.returnFocus?.focus();
  }
  private run(operation: () => void, message?: string) {
    try {
      operation();
      this.onChange();
      this.render();
      this.status.textContent = message
        ? `${message} ${this.store.status}`
        : this.store.status;
    } catch (error) {
      this.status.textContent =
        error instanceof Error ? error.message : 'Operazione non riuscita.';
    }
  }
  private attachPreview(oldHost: HTMLElement | null) {
    if (oldHost && this.preview)
      this.content.querySelector('#garage-preview')!.replaceWith(oldHost);
    else {
      try {
        this.preview = new GaragePreview(
          this.content.querySelector('#garage-preview')!,
        );
      } catch {
        this.content.querySelector('#garage-preview')!.textContent =
          'Anteprima non disponibile. Configurazione e guida restano accessibili.';
      }
    }
    this.preview?.start();
    this.preview?.setAppearance(
      activeCar(this.store.profile).appearance,
      this.showroom && this.mode === 'performance'
        ? this.selectedModel
        : activeCar(this.store.profile).model,
    );
  }
  async exportCover(title: string, edition: string) {
    const car = activeCar(this.store.profile);
    this.preview?.setAppearance(car.appearance, car.model);
    this.preview?.resetPose();
    return (await this.preview?.exportCover(title, edition)) ?? false;
  }
  refreshProgress() {
    this.wallet.textContent = money(this.store.profile.credits);
    this.status.textContent = this.store.status;
  }
  private renderAppearance(oldHost: HTMLElement | null) {
    this.content.innerHTML = `<div class="appearance-layout"><aside class="appearance-studio"><div id="garage-preview"></div><p>Trascina per ruotare. Rotella per zoom. Anteprima della tua configurazione.</p><div class="studio-controls"><button data-view="0">TRE QUARTI</button><button data-view="1">POSTERIORE</button><button data-view="2">FIANCO</button><button data-view="3">DALL’ALTO</button></div><div class="studio-pose"><label><input type="checkbox" data-pose="doors"> Porte verticali</label><label><input type="checkbox" data-pose="hood"> Cofano</label><label><input type="checkbox" data-pose="hatch"> Portellone</label></div><div class="studio-controls"><button id="studio-jump">SALTO IDRAULICO</button><button id="studio-photo">MODALITÀ FOTO</button></div><p>Aperture e salto sono disponibili nello studio. Le foto possono includere anche modifiche in anteprima.</p></aside><section id="appearance-editor"></section></div>`;
    this.attachPreview(oldHost);
    if (!this.preview) return;
    this.editor = new AppearanceEditor(
      this.content.querySelector('#appearance-editor')!,
      this.store,
      this.preview,
      () => {
        this.onChange();
        this.wallet.textContent = money(this.store.profile.credits);
        this.status.textContent = this.store.status;
      },
    );
    this.content
      .querySelectorAll<HTMLInputElement>('[data-pose]')
      .forEach(
        (input) =>
          (input.onchange = () =>
            this.preview!.setPose(
              input.dataset.pose as 'doors' | 'hood' | 'hatch',
              input.checked,
            )),
      );
    this.content
      .querySelectorAll<HTMLButtonElement>('[data-view]')
      .forEach(
        (button) =>
          (button.onclick = () =>
            this.preview!.view(Number(button.dataset.view))),
      );
    this.content.querySelector<HTMLButtonElement>('#studio-jump')!.onclick =
      () => this.preview!.jump();
    this.content.querySelector<HTMLButtonElement>('#studio-photo')!.onclick =
      () => {
        this.editor?.flush();
        this.preview!.photo();
      };
  }
  private render() {
    this.pending = null;
    this.importGeneration++;
    this.editor?.dispose();
    this.editor = undefined;
    this.preview?.stop();
    const oldHost = this.content.querySelector<HTMLElement>('#garage-preview');
    const p = this.store.profile,
      car = activeCar(p),
      stats = calculateStats(
        car.equipped,
        this.showroom ? this.selectedModel : car.model,
      ),
      category = catalog.categories.find((c) => c.id === this.category)!;
    const level = careerLevel(p.career);
    if (
      (careerData.models.find((m) => m.id === this.selectedModel)?.level ?? 1) >
      (p.career.started ? level : 1)
    )
      this.selectedModel = 'silex-c1';
    const selected = careerData.models.find(
      (m) => m.id === this.selectedModel,
    )!;
    this.wallet.textContent = money(p.credits);
    this.status.textContent = this.store.status;
    this.root.querySelector('#garage-mode')!.textContent =
      this.mode === 'performance' ? 'ESTETICA E FOTO' : 'PRESTAZIONI';
    if (this.mode === 'appearance') {
      this.renderAppearance(oldHost);
      return;
    }
    this.content.innerHTML = `<div class="garage-layout"><aside class="garage-car"><div id="garage-preview"></div><span class="eyebrow">${careerData.models.find((m) => m.id === (this.showroom ? this.selectedModel : car.model))!.name} / AUTO ${car.id.slice(-1)}</span><p>${this.showroom ? 'Anteprima con i componenti attuali. Le nuove auto si acquistano di serie; le sostituzioni trasferiscono i componenti. Auto attiva invariata.' : 'Auto attiva.'} Trascina per ruotare. Rotella per lo zoom.</p><div class="garage-stats">${statsText(stats)}</div><details><summary>BANCO PROVA / CURVE TEORICHE</summary>${dyno(stats)}</details></aside><section class="garage-parts"><nav aria-label="Categorie prestazioni">${catalog.categories.map((c) => `<button data-category="${c.id}" aria-pressed="${c.id === this.category}">${c.name} <span>${car.equipped[c.id]}/3</span></button>`).join('')}</nav><h3>${category.name} / ${category.brand}</h3><p>${category.description} I livelli si acquistano in ordine. I componenti restano su questa auto.</p><div class="part-cards">${category.tiers
      .map((tier) => {
        const equipped = car.equipped[category.id] === tier.level,
          owned = car.owned[category.id] >= tier.level,
          locked = p.career.started && tier.level > level && !owned;
        const future = calculateStats(
          {
            ...car.equipped,
            [category.id]: tier.level,
          },
          car.model,
        );
        return `<article><span class="eyebrow">LIVELLO ${tier.level}</span><h4>${category.brand} ${tier.level}</h4><div class="garage-stats">${statsText(future)}</div><p>${owned ? 'Già posseduto' : money(tier.price)}</p><button data-tier="${tier.level}" ${equipped || locked || (!owned && (car.owned[category.id] !== tier.level - 1 || p.credits < tier.price)) ? 'disabled' : ''}>${locked ? 'SERVE LIVELLO CARRIERA ' + tier.level : equipped ? 'INSTALLATO' : owned ? 'INSTALLA' : car.owned[category.id] !== tier.level - 1 ? 'SERVE LIVELLO PRECEDENTE' : p.credits < tier.price ? 'CREDITI INSUFFICIENTI' : 'ACQUISTA E INSTALLA'}</button></article>`;
      })
      .join(
        '',
      )}</div><button id="garage-stock" ${car.equipped[category.id] === 0 ? 'disabled' : ''}>RIMONTA COMPONENTE DI SERIE / GRATIS</button><p>Ogni scheda mostra le statistiche dell’auto con quel componente. Acquisto e installazione applicano subito la configurazione alla guida.</p></section></div>${import.meta.env.DEV && this.debugVisible ? `<section class="garage-debug"><h3>F3 / Sviluppo economia</h3><p>Strumento di test locale. Modifica anche i dati esportati.</p><button id="debug-credits">CREDITI INFINITI: ${this.store.infiniteCredits ? 'ON' : 'OFF'}</button></section>` : ''}<section class="garage-cars"><h3>Il tuo garage / ${p.cars.length} di ${catalog.capacity} posti</h3><p>51 auto originali di 12 costruttori, con dimensioni e prestazioni proprie. I nuovi modelli si sbloccano ai livelli carriera 2 e 3. Puoi conservare tre auto con elaborazioni indipendenti.</p><label>Modello da acquistare <select id="garage-model">${careerData.models.map((m) => `<option value="${m.id}" ${m.id === this.selectedModel ? 'selected' : ''} ${m.level > (p.career.started ? level : 1) ? 'disabled' : ''}>${m.name} / LIV. ${m.level} / ${money(m.price)}</option>`).join('')}</select></label><p>${careerData.makers.find((m) => m.id === selected.maker)!.description}</p><p>${selected.description}</p><p>${selected.width.toFixed(2)} × ${selected.length.toFixed(2)} m. ${displaySpeed(calculateStats(car.equipped, selected.id).maxSpeed)} ${speedUnit()} teorici.</p><div>${Array.from(
      { length: catalog.capacity },
      (_, i) => {
        const slot = p.cars[i];
        const credit = slot ? tradeInValue(slot) : 0;
        const difference = selected.price - credit;
        const trade =
          slot && selected.id !== slot.model
            ? `<p>Ritiro ${money(credit)}. ${difference >= 0 ? 'Differenza ' + money(difference) : 'Rimborso ' + money(-difference)}. Componenti e aspetto restano su questo posto.</p>${this.tradeTarget === slot.id ? `<p>Sostituire con ${selected.name}? Il profilo attuale sarà nella copia precedente recuperabile.</p><button data-confirm-trade="${slot.id}" ${p.credits < difference ? 'disabled' : ''}>CONFERMA SOSTITUZIONE</button><button data-cancel-trade>ANNULLA</button>` : `<button data-trade-car="${slot.id}" ${p.credits < difference ? 'disabled' : ''}>PREPARA SOSTITUZIONE</button>`}`
            : '';
        return `<article><span class="eyebrow">POSTO AUTO ${i + 1}</span><h4>${slot ? careerData.models.find((m) => m.id === slot.model)!.name : 'Posto libero'}</h4>${slot ? `<button data-car="${slot.id}" ${slot.id === p.activeCar ? 'disabled' : ''}>${slot.id === p.activeCar ? 'AUTO ATTIVA' : 'USA QUESTA AUTO'}</button>${trade}` : `<button data-buy-car ${p.credits < selected.price ? 'disabled' : ''}>ACQUISTA / ${money(selected.price)}</button>`}</article>`;
      },
    ).join(
      '',
    )}</div></section><section class="garage-saves"><h3>Salvataggi</h3><p>Autosave dopo acquisti, configurazioni e classifiche finali. Questi dati appartengono a questo browser e indirizzo. Caricare o importare sostituisce il profilo, conservando una copia precedente.</p><div class="manual-slots">${[
      1, 2, 3,
    ]
      .map((slot) => {
        let label = 'Vuoto';
        try {
          const saved = this.store.slot(slot);
          if (saved)
            label = `${money(saved.credits)} / ${saved.cars.length} auto`;
        } catch {
          label = 'Illeggibile';
        }
        return `<article><h4>Slot ${slot}</h4><p>${label}</p><button data-save="${slot}">SALVA SLOT ${slot}</button><button data-load="${slot}" ${label === 'Vuoto' || label === 'Illeggibile' ? 'disabled' : ''}>CARICA SLOT ${slot}</button></article>`;
      })
      .join(
        '',
      )}</div><div class="save-actions"><button id="save-retry">RIPROVA AUTOSAVE</button><button id="save-export">ESPORTA JSON</button><label class="file-label">IMPORTA JSON <input id="save-import" type="file" accept="application/json,.json"></label><button id="save-backup">RIPRISTINA COPIA PRECEDENTE</button></div><div id="import-preview" hidden><p></p><button id="import-apply">APPLICA PROFILO IMPORTATO</button><button id="import-cancel">ANNULLA</button></div><h4>Ultime gare e record</h4><ul>${
      Object.entries(p.bestTimes)
        .map(
          ([id, time]) =>
            `<li>${races.events.find((e) => e.id === id)!.name}: ${formatRaceTime(time)}</li>`,
        )
        .join('') || '<li>Nessun tempo registrato.</li>'
    }</ul><h4>Record drift</h4><ul>${
      Object.entries(p.bestScores)
        .map(
          ([id, score]) =>
            `<li>${races.events.find((e) => e.id === id)!.name}: ${score} punti</li>`,
        )
        .join('') || '<li>Nessun punteggio registrato.</li>'
    }</ul><p>${p.ghost ? `Fantasma disponibile: ${formatRaceTime(p.ghost.duration)}.` : ''}</p><p>${p.results.length} risultati recenti conservati. Premi e record vengono assegnati alla classifica finale. Un ritiro non dà crediti.</p></section>`;
    this.attachPreview(oldHost);
    const buttons = (
      selector: string,
      fn: (button: HTMLButtonElement) => void,
    ) =>
      this.content
        .querySelectorAll<HTMLButtonElement>(selector)
        .forEach((button) => (button.onclick = () => fn(button)));
    if (import.meta.env.DEV)
      buttons('#debug-credits', () =>
        this.run(() => {
          this.store.infiniteCredits = !this.store.infiniteCredits;
          this.store.commit(() => {});
        }),
      );
    buttons('[data-category]', (b) => {
      this.category = b.dataset.category!;
      this.render();
      this.content
        .querySelector<HTMLButtonElement>(`[data-category="${this.category}"]`)!
        .focus();
    });
    buttons('[data-tier]', (b) =>
      this.run(
        () =>
          this.store.commit((p) => {
            const tier = Number(b.dataset.tier);
            if (activeCar(p).owned[this.category] >= tier)
              equipPart(p, this.category, tier);
            else buyPart(p, this.category, tier);
          }),
        'Configurazione applicata.',
      ),
    );
    buttons('#garage-stock', () =>
      this.run(() => this.store.commit((p) => equipPart(p, this.category, 0))),
    );
    buttons('[data-car]', (b) =>
      this.run(() =>
        this.store.commit((p) => {
          p.activeCar = b.dataset.car!;
        }),
      ),
    );
    this.content.querySelector<HTMLSelectElement>('#garage-model')!.onchange = (
      e,
    ) => {
      this.showroom = true;
      this.selectedModel = (e.target as HTMLSelectElement).value;
      this.tradeTarget = null;
      this.render();
    };
    buttons('[data-trade-car]', (b) => {
      this.tradeTarget = b.dataset.tradeCar!;
      this.render();
      this.content
        .querySelector<HTMLButtonElement>('[data-confirm-trade]')
        ?.focus();
    });
    buttons('[data-cancel-trade]', () => {
      this.tradeTarget = null;
      this.render();
    });
    buttons('[data-confirm-trade]', (b) =>
      this.run(() => {
        this.store.commit(
          (p) => tradeCar(p, b.dataset.confirmTrade!, this.selectedModel),
          { backup: true },
        );
        this.tradeTarget = null;
      }, 'Auto sostituita. Componenti e aspetto conservati.'),
    );
    buttons('[data-buy-car]', () =>
      this.run(() => this.store.commit((p) => buyCar(p, this.selectedModel))),
    );
    buttons('[data-save]', (b) =>
      this.run(() => this.store.manual(Number(b.dataset.save))),
    );
    buttons('[data-load]', (b) =>
      this.run(() => this.store.load(Number(b.dataset.load))),
    );
    buttons('#save-backup', () => this.run(() => this.store.restore()));
    buttons('#save-retry', () => this.run(() => this.store.save()));
    buttons('#save-export', () => {
      const url = URL.createObjectURL(
        new Blob([this.store.export()], { type: 'application/json' }),
      );
      const link = document.createElement('a');
      link.href = url;
      link.download = 'night-circuit-profilo.json';
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
    this.content.querySelector<HTMLInputElement>('#save-import')!.onchange =
      async (event) => {
        const generation = ++this.importGeneration;
        this.pending = null;
        const preview =
          this.content.querySelector<HTMLElement>('#import-preview')!;
        preview.hidden = true;
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) return;
        try {
          if (file.size > MAX_SAVE_BYTES)
            throw Error('File troppo grande (massimo 2 MB).');
          const pending = parseProfile(await file.text());
          if (!this.open || generation !== this.importGeneration) return;
          this.pending = pending;
          preview.hidden = false;
          preview.querySelector('p')!.textContent =
            `Profilo valido: ${money(pending.credits)}, ${pending.cars.length} auto. Applicandolo sostituirai il profilo attuale.`;
          preview.querySelector<HTMLButtonElement>('#import-apply')!.focus();
        } catch (error) {
          if (!this.open || generation !== this.importGeneration) return;
          this.status.textContent =
            error instanceof Error ? error.message : 'File non valido.';
        }
      };
    buttons('#import-apply', () =>
      this.run(() => {
        if (!this.pending) throw Error('Nessun profilo da importare.');
        this.store.replace(this.pending);
        this.pending = null;
      }),
    );
    buttons('#import-cancel', () => {
      this.pending = null;
      this.render();
    });
  }
}
