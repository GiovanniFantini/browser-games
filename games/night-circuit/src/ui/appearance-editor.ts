import careerData from '../data/career.json';
import { activeCar, applyAppearance } from '../progression/profile';
import type { ProfileStore } from '../progression/storage';
import {
  appearanceCost,
  aestheticScore,
  visualCatalog,
  type Appearance,
  type VinylLayer,
  type VinylSide,
  type VisualSlot,
} from '../tuning/appearance';
import { visibleLayers, layerTransform } from '../tuning/vinyl';
import type { GaragePreview } from './garage-preview';
import './appearance.css';

const credits = (n: number) =>
  n ? `${n.toLocaleString('it-IT')} CR` : 'GRATIS';
const sideNames = {
  left: 'Sinistra',
  right: 'Destra',
  hood: 'Cofano',
  roof: 'Tetto',
};
export class AppearanceEditor {
  private readonly draft: Appearance;
  private selected = '';
  private side: VinylSide = 'left';
  private timer?: ReturnType<typeof setTimeout>;
  private dragging = false;
  private readonly status: HTMLElement;
  constructor(
    private readonly host: HTMLElement,
    private readonly store: ProfileStore,
    private readonly preview: GaragePreview,
    private readonly onApplied: () => void,
  ) {
    this.draft = structuredClone(activeCar(store.profile).appearance);
    const single =
      careerData.models.find((m) => m.id === activeCar(store.profile).model)!
        .family === 'single';
    const slots = (keys: VisualSlot[]) =>
      keys
        .map(
          (key) =>
            `<label>${visualCatalog.slots[key].name}<select data-part="${key}">${visualCatalog.slots[key].options.map((o) => `<option value="${o.id}" ${o.id === this.draft.parts[key] ? 'selected' : ''}>${o.name} / ${credits(o.price)}</option>`).join('')}</select></label>`,
        )
        .join('');
    const color = (key: keyof Appearance, name: string) =>
      `<label class="visual-color">${name}<input type="color" data-field="${key}" value="${this.draft[key]}"></label>`;
    host.innerHTML = `<nav class="appearance-tabs" aria-label="Personalizzazione"><button data-visual-tab="body" aria-pressed="true">CARROZZERIA</button><button data-visual-tab="color" aria-pressed="false">COLORI E LUCI</button><button data-visual-tab="vinyl" aria-pressed="false">VINILI</button></nav><p>Anteprima libera. Applica per acquistare e salvare. Tornare alle prestazioni o uscire scarta le modifiche non applicate. Colori e regolazioni sono inclusi; i pezzi già acquistati si reinstallano gratis.</p>${single ? '<p>Monoposto: Tetto e i vinili su Tetto personalizzano la copertura dietro il sedile.</p>' : ''}
    <section data-visual-panel="body"><h3>Linee e dettagli</h3><div class="visual-fields">${slots(['kit', 'front', 'rear', 'skirts', 'spoiler', 'hood', 'roof', 'mirrors', 'fuel', 'exhaust', 'audio'])}<label>Cerchi Velyra<select data-field="wheel">${visualCatalog.wheels.map((w) => `<option value="${w.id}" ${w.id === this.draft.wheel ? 'selected' : ''}>${w.name} / ${credits(w.price)}</option>`).join('')}</select></label><label>Diametro cerchi <output data-output="diameter"></output><input data-field="diameter" type="range" min="17" max="22" step="0.5" value="${this.draft.diameter}"></label><label class="visual-check"><input type="checkbox" data-field="spinner" ${this.draft.spinner ? 'checked' : ''}> Spinner / ${credits(visualCatalog.spinnerPrice)}</label></div><p>Il diametro cambia il rapporto cerchio/pneumatico mantenendo il raggio esterno. L’estetica non cambia collisioni o prestazioni.</p></section>
    <section data-visual-panel="color" hidden><h3>Superfici e illuminazione</h3><div class="visual-fields">${slots(['finish', 'neon', 'lights'])}${color('paint', 'Vernice primaria')}${color('secondary', 'Riflesso secondario / perlata e cangiante')}${color('rims', 'Colore cerchi')}${color('calipers', 'Pinze freno')}${color('headColor', 'Fari anteriori')}${color('tailColor', 'Fanali posteriori')}${color('neonColor', 'Neon sottoscocca')}${color('hudColor', 'Indicatori velocità e giri')}${color('nitroColor', 'Indicatore nitro')}<label>Oscuramento vetri <output data-output="tint"></output><input data-field="tint" type="range" min="0" max="0.9" step="0.05" value="${this.draft.tint}"></label></div><p>Perlata e cangiante cambiano riflesso con l’angolo della telecamera. I colori degli indicatori vengono applicati anche durante la guida.</p></section>
    <section data-visual-panel="vinyl" hidden><h3>Disegna la tua firma</h3><p>Fino a dodici strati, sopra quelli precedenti. Trascina la forma nel riquadro o usa le regolazioni. Sui lati il vinile occupa la fascia inferiore della carrozzeria. Editor: ${credits(visualCatalog.vinylUnlockPrice)}, una sola volta per auto.</p><div class="vinyl-add"><label>Forma<select id="vinyl-shape">${visualCatalog.shapes.map((s) => `<option value="${s.id}">${s.name}</option>`).join('')}</select></label><label>Superficie<select id="vinyl-side">${Object.entries(
      sideNames,
    )
      .map(([key, name]) => `<option value="${key}">${name}</option>`)
      .join(
        '',
      )}</select></label><button id="vinyl-add">AGGIUNGI STRATO</button></div><div class="vinyl-views">${Object.entries(
      sideNames,
    )
      .map(([key, name]) => `<button data-vinyl-view="${key}">${name}</button>`)
      .join(
        '',
      )}</div><svg id="vinyl-workspace" viewBox="0 0 520 180" role="img" aria-label="Editor vinili, trascina lo strato selezionato"></svg><div id="vinyl-layers"></div><div class="layer-actions"><button id="vinyl-duplicate">DUPLICA</button><button id="vinyl-down">SPOSTA SOTTO</button><button id="vinyl-up">SPOSTA SOPRA</button><button id="vinyl-remove">ELIMINA</button></div><div class="visual-fields vinyl-adjust">${[
      ['x', 'Posizione orizzontale', 0, 100],
      ['y', 'Posizione verticale', 0, 100],
      ['scaleX', 'Larghezza', 5, 200],
      ['scaleY', 'Altezza', 5, 200],
      ['rotation', 'Rotazione', -180, 180],
      ['opacity', 'Opacità', 10, 100],
    ]
      .map(
        ([key, name, min, max]) =>
          `<label>${name}<output data-layer-output="${key}"></output><input type="range" data-layer="${key}" min="${min}" max="${max}" step="1"></label>`,
      )
      .join(
        '',
      )}<label class="visual-color">Colore strato<input type="color" data-layer="color"></label><label class="visual-check"><input type="checkbox" data-layer="mirror"> Specchia sull’altro lato</label></div></section>
    <footer class="appearance-apply"><span id="appearance-score"></span><button id="appearance-apply"></button><button id="appearance-reset">SCARTA ANTEPRIMA</button><p id="appearance-status" role="status" aria-live="polite"></p></footer>`;
    this.status = host.querySelector('#appearance-status')!;
    host.querySelectorAll<HTMLButtonElement>('[data-visual-tab]').forEach(
      (button) =>
        (button.onclick = () => {
          host
            .querySelectorAll<HTMLElement>('[data-visual-panel]')
            .forEach(
              (panel) =>
                (panel.hidden =
                  panel.dataset.visualPanel !== button.dataset.visualTab),
            );
          host
            .querySelectorAll('[data-visual-tab]')
            .forEach((b) =>
              b.setAttribute('aria-pressed', String(b === button)),
            );
        }),
    );
    host
      .querySelectorAll<HTMLInputElement | HTMLSelectElement>(
        '[data-field],[data-part]',
      )
      .forEach(
        (control) =>
          (control.oninput = () => {
            if (control.dataset.part)
              this.draft.parts[control.dataset.part as VisualSlot] = Number(
                control.value,
              );
            else {
              const key = control.dataset.field as keyof Appearance;
              if (key === 'spinner')
                this.draft.spinner = (control as HTMLInputElement).checked;
              else if (key === 'wheel' || key === 'diameter' || key === 'tint')
                this.draft[key] = Number(control.value);
              else this.draft[key as 'paint'] = control.value;
            }
            this.update();
          }),
      );
    host.querySelector<HTMLButtonElement>('#appearance-apply')!.onclick =
      () => {
        try {
          store.commit((p) => applyAppearance(p, this.draft));
          this.onApplied();
          this.status.textContent = `Configurazione applicata. ${store.status}`;
          this.update();
        } catch (error) {
          this.status.textContent =
            error instanceof Error ? error.message : 'Acquisto non riuscito.';
        }
      };
    host.querySelector<HTMLButtonElement>('#appearance-reset')!.onclick =
      () => {
        Object.assign(
          this.draft,
          structuredClone(activeCar(store.profile).appearance),
        );
        this.selected = '';
        host
          .querySelectorAll<HTMLInputElement | HTMLSelectElement>(
            '[data-field],[data-part]',
          )
          .forEach((control) => {
            if (control.dataset.part)
              control.value = String(
                this.draft.parts[control.dataset.part as VisualSlot],
              );
            else if (control.dataset.field === 'spinner')
              (control as HTMLInputElement).checked = this.draft.spinner;
            else
              control.value = String(
                this.draft[control.dataset.field as 'paint'],
              );
          });
        this.layers();
        this.update();
      };
    host.querySelector<HTMLButtonElement>('#vinyl-add')!.onclick = () => {
      if (this.draft.vinyls.length >= 12) return;
      const layer: VinylLayer = {
        id: crypto.randomUUID(),
        shape: host.querySelector<HTMLSelectElement>('#vinyl-shape')!.value,
        side: host.querySelector<HTMLSelectElement>('#vinyl-side')!
          .value as VinylSide,
        x: 0.5,
        y: 0.5,
        scaleX: 0.5,
        scaleY: 0.7,
        rotation: 0,
        color: '#f0edf5',
        opacity: 1,
        mirror: false,
      };
      this.draft.vinyls.push(layer);
      this.selected = layer.id;
      this.side = layer.side;
      this.layers();
      this.update();
    };
    host.querySelectorAll<HTMLButtonElement>('[data-vinyl-view]').forEach(
      (b) =>
        (b.onclick = () => {
          this.side = b.dataset.vinylView as VinylSide;
          this.workspace();
          this.preview.view(
            this.side === 'left'
              ? 4
              : this.side === 'right'
                ? 2
                : this.side === 'roof'
                  ? 3
                  : 0,
          );
        }),
    );
    host.querySelectorAll<HTMLInputElement>('[data-layer]').forEach(
      (control) =>
        (control.oninput = () => {
          const layer = this.layer();
          if (!layer) return;
          const key = control.dataset.layer!;
          if (key === 'color') layer.color = control.value;
          else if (key === 'mirror') layer.mirror = control.checked;
          else
            layer[key as 'x'] =
              Number(control.value) / (key === 'rotation' ? 1 : 100);
          this.syncLayer();
          this.workspace();
          this.update();
        }),
    );
    host.querySelector<HTMLButtonElement>('#vinyl-remove')!.onclick = () => {
      this.draft.vinyls = this.draft.vinyls.filter(
        (l) => l.id !== this.selected,
      );
      this.selected = this.draft.vinyls.at(-1)?.id ?? '';
      this.layers();
      this.update();
    };
    host.querySelector<HTMLButtonElement>('#vinyl-duplicate')!.onclick = () => {
      const l = this.layer();
      if (!l || this.draft.vinyls.length >= 12) return;
      const copy = {
        ...l,
        id: crypto.randomUUID(),
        x: Math.min(1, l.x + 0.05),
      };
      this.draft.vinyls.push(copy);
      this.selected = copy.id;
      this.layers();
      this.update();
    };
    for (const [id, direction] of [
      ['vinyl-down', -1],
      ['vinyl-up', 1],
    ] as const)
      host.querySelector<HTMLButtonElement>(`#${id}`)!.onclick = () => {
        const index = this.draft.vinyls.findIndex(
            (l) => l.id === this.selected,
          ),
          next = index + direction;
        if (index < 0 || next < 0 || next >= this.draft.vinyls.length) return;
        [this.draft.vinyls[index], this.draft.vinyls[next]] = [
          this.draft.vinyls[next],
          this.draft.vinyls[index],
        ];
        this.layers();
        this.update();
      };
    const workspace = host.querySelector<SVGSVGElement>('#vinyl-workspace')!;
    workspace.onpointerdown = (event) => {
      const id = (event.target as Element)
        .closest('[data-vinyl-id]')
        ?.getAttribute('data-vinyl-id');
      if (id) {
        this.selected = id;
        this.layers();
      }
      if (
        !this.layer() ||
        !visibleLayers(this.draft.vinyls, this.side).some(
          (l) => l.id === this.selected,
        )
      )
        return;
      this.dragging = true;
      workspace.setPointerCapture(event.pointerId);
      this.move(event, workspace);
    };
    workspace.onpointermove = (event) => {
      if (this.dragging) this.move(event, workspace);
    };
    workspace.onpointerup = workspace.onpointercancel = () => {
      this.dragging = false;
    };
    this.layers();
    this.update();
  }
  flush() {
    clearTimeout(this.timer);
    this.preview.setAppearance(this.draft, activeCar(this.store.profile).model);
  }
  dispose() {
    clearTimeout(this.timer);
    this.dragging = false;
  }
  private layer() {
    return this.draft.vinyls.find((l) => l.id === this.selected);
  }
  private update() {
    const car = activeCar(this.store.profile),
      cost = appearanceCost(this.draft, car.visualOwned),
      same = JSON.stringify(this.draft) === JSON.stringify(car.appearance);
    const apply =
      this.host.querySelector<HTMLButtonElement>('#appearance-apply')!;
    apply.textContent = same
      ? 'CONFIGURAZIONE APPLICATA'
      : cost > this.store.profile.credits
        ? `SERVONO ${credits(cost)}`
        : `APPLICA / ${credits(cost)}`;
    apply.disabled = same || cost > this.store.profile.credits;
    this.host.querySelector('#appearance-score')!.textContent =
      `INDICE ESTETICO ${aestheticScore(this.draft).toFixed(1)} / 10`;
    this.host.querySelector('[data-output="diameter"]')!.textContent =
      `${this.draft.diameter}″`;
    this.host.querySelector('[data-output="tint"]')!.textContent =
      `${Math.round(this.draft.tint * 100)}%`;
    clearTimeout(this.timer);
    this.timer = setTimeout(
      () =>
        this.preview.setAppearance(
          this.draft,
          activeCar(this.store.profile).model,
        ),
      120,
    );
  }
  private layers() {
    const list = this.host.querySelector<HTMLElement>('#vinyl-layers')!;
    list.innerHTML =
      this.draft.vinyls
        .map(
          (l, i) =>
            `<button data-layer-id="${l.id}" aria-pressed="${l.id === this.selected}">${i + 1}. ${visualCatalog.shapes.find((s) => s.id === l.shape)!.name} / ${sideNames[l.side]}</button>`,
        )
        .join('') ||
      '<p>Nessuno strato. Scegli forma e superficie per iniziare.</p>';
    list.querySelectorAll<HTMLButtonElement>('button').forEach(
      (b) =>
        (b.onclick = () => {
          this.selected = b.dataset.layerId!;
          this.side = this.layer()!.side;
          this.layers();
        }),
    );
    this.syncLayer();
    this.workspace();
    this.host.querySelector<HTMLButtonElement>('#vinyl-add')!.disabled =
      this.draft.vinyls.length >= 12;
  }
  private syncLayer() {
    const l = this.layer();
    this.host
      .querySelectorAll<HTMLInputElement>('[data-layer]')
      .forEach((control) => {
        control.disabled = !l;
        if (!l) return;
        const key = control.dataset.layer!;
        if (key === 'mirror') {
          control.checked = l.mirror;
          control.disabled = l.side === 'hood' || l.side === 'roof';
        } else if (key === 'color') control.value = l.color;
        else {
          control.value = String(
            l[key as 'x'] * (key === 'rotation' ? 1 : 100),
          );
          this.host.querySelector(`[data-layer-output="${key}"]`)!.textContent =
            String(Math.round(Number(control.value)));
        }
      });
    for (const id of [
      'vinyl-remove',
      'vinyl-up',
      'vinyl-down',
      'vinyl-duplicate',
    ])
      this.host.querySelector<HTMLButtonElement>(`#${id}`)!.disabled =
        !l || (id === 'vinyl-duplicate' && this.draft.vinyls.length >= 12);
  }
  private workspace() {
    const svg = this.host.querySelector('#vinyl-workspace')!;
    svg.innerHTML = `<rect width="520" height="180" fill="#142736"/><path d="M15 155V25H505V155Z M15 90H505 M260 25V155" fill="none" stroke="#375466" stroke-dasharray="5 5"/>${visibleLayers(
      this.draft.vinyls,
      this.side,
    )
      .map((l) => {
        const t = layerTransform(l, this.side, 520, 180),
          shape = visualCatalog.shapes.find((s) => s.id === l.shape)!;
        return `<g data-vinyl-id="${l.id}" transform="translate(${t.x} ${t.y}) rotate(${(t.angle * 180) / Math.PI}) scale(${t.sx} ${t.sy}) translate(-50 -50)"><path d="${shape.path}" fill="${l.color}" fill-rule="${'rule' in shape ? 'evenodd' : 'nonzero'}" opacity="${l.opacity}" stroke="${l.id === this.selected ? '#75d9ee' : 'none'}" stroke-width="1.5"/></g>`;
      })
      .join('')}`;
    this.host
      .querySelectorAll<HTMLButtonElement>('[data-vinyl-view]')
      .forEach((b) =>
        b.setAttribute(
          'aria-pressed',
          String(b.dataset.vinylView === this.side),
        ),
      );
  }
  private move(event: PointerEvent, svg: SVGSVGElement) {
    const matrix = svg.getScreenCTM();
    if (!matrix) return;
    const l = this.layer()!,
      point = new DOMPoint(event.clientX, event.clientY).matrixTransform(
        matrix.inverse(),
      );
    const x = Math.max(0, Math.min(1, point.x / 520));
    l.x = l.side !== this.side ? 1 - x : x;
    l.y = Math.max(0, Math.min(1, point.y / 180));
    this.syncLayer();
    this.workspace();
    this.update();
  }
}
