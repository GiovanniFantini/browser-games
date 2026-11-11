import { preferences, displaySpeed, speedUnit } from '../core/preferences';
import { ProfileStore } from '../progression/storage';
import { activeCar } from '../progression/profile';
import {
  careerData,
  careerLevel,
  startCareer,
  acceptSponsor,
  claimSponsor,
  coverLock,
  districtUnlocked,
  messageText,
} from '../progression/career';
import { aestheticScore } from '../tuning/appearance';
import './career.css';

export class CareerUI {
  readonly root = document.createElement('div');
  private readonly opener = document.createElement('button');
  private tab = 'route';
  private returnFocus: HTMLElement | null = null;
  open = false;
  onOpen: () => void = () => {};
  onClose: () => void = () => {};
  onChange: () => void = () => {};
  onRace: (id: string) => void = () => {};
  onTravel: (id: string) => void = () => {};
  onCover: (id: string) => void = () => {};
  constructor(readonly store: ProfileStore) {
    this.root.id = 'career-phone';
    this.root.hidden = true;
    this.root.setAttribute('role', 'dialog');
    this.root.setAttribute('aria-modal', 'true');
    this.root.setAttribute('aria-labelledby', 'career-heading');
    document.querySelector('#interface')!.append(this.root);
    this.opener.id = 'open-career';
    this.opener.onclick = () => this.onOpen();
    document.querySelector('.top-actions')!.prepend(this.opener);
    const start = document.createElement('button');
    start.id = 'start-career';
    start.className = 'start-quick';
    start.textContent = 'CARRIERA / TELEFONO ↗';
    start.onclick = () => this.onOpen();
    document.querySelector('#start')!.after(start);
    this.root.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;
      const controls = [
        ...this.root.querySelectorAll<HTMLElement>(
          'button:not(:disabled),select,input',
        ),
      ].filter((el) => el.getClientRects().length);
      if (e.shiftKey && document.activeElement === controls[0]) {
        e.preventDefault();
        controls.at(-1)?.focus();
      } else if (!e.shiftKey && document.activeElement === controls.at(-1)) {
        e.preventDefault();
        controls[0]?.focus();
      }
    });
    this.refresh();
  }
  setAvailable(value: boolean) {
    this.opener.disabled = !value;
    document.querySelector<HTMLButtonElement>('#start-career')!.disabled =
      !value;
  }
  show() {
    this.returnFocus = document.activeElement as HTMLElement;
    this.open = true;
    this.root.hidden = false;
    this.render();
    this.root.querySelector<HTMLButtonElement>('#career-close')!.focus();
  }
  hide() {
    this.open = false;
    this.root.hidden = true;
    this.returnFocus?.focus();
  }
  refresh() {
    const c = this.store.profile.career;
    this.opener.innerHTML = `TEL <kbd>P</kbd> · ${c.fame} REP${c.messages.some((m) => !m.read) ? ' ●' : ''}`;
    if (this.open) {
      const tab =
        document.activeElement instanceof HTMLElement
          ? document.activeElement.dataset.phoneTab
          : undefined;
      this.render();
      this.root
        .querySelector<HTMLButtonElement>(
          tab ? `[data-phone-tab="${tab}"]` : '#career-close',
        )
        ?.focus({ preventScroll: true });
    }
  }
  private run(change: () => void) {
    try {
      change();
      this.onChange();
      this.refresh();
      this.root.querySelector('#career-status')!.textContent =
        this.store.status;
    } catch (e) {
      this.root.querySelector('#career-status')!.textContent =
        e instanceof Error ? e.message : 'Operazione non riuscita.';
    }
  }
  private render() {
    const p = this.store.profile,
      c = p.career,
      level = careerLevel(c),
      style = aestheticScore(activeCar(p).appearance),
      current = careerData.districts.find((d) => d.id === c.district)!;
    const rival = careerData.rivals[c.defeated.length];
    this.root.innerHTML = `<section class="phone-shell"><header><div><span class="eyebrow">PORT RIDERS / LINEA NOTTURNA</span><h2 id="career-heading">La tua firma.</h2></div><button id="career-close">TORNA <kbd>P / ESC</kbd></button></header><p id="career-wallet">${p.credits.toLocaleString(preferences.language === 'en' ? 'en-GB' : 'it-IT')} CR · <span>${c.fame} REP</span> · LIV. ${level} / ${careerData.levels[level - 1].name} · ESTETICA ${style.toFixed(1)}/10</p><p id="career-status" role="status">${this.store.status}</p>${
      !c.started
        ? `<article><h3>Comincia dai moli.</h3><p>Guadagna reputazione con i risultati e l’aspetto applicato della tua auto. Batti quattro rivali per aprire la città. I componenti nuovi seguono i livelli carriera; tutti i pezzi già posseduti restano tuoi. Le gare veloci rimangono disponibili.</p><button id="career-begin">INIZIA CARRIERA</button></article>`
        : `<nav aria-label="Telefono">${[
            ['route', 'Percorso'],
            ['sponsors', 'Sponsor'],
            ['covers', 'Riviste'],
            [
              'messages',
              `Messaggi (${c.messages.filter((m) => !m.read).length})`,
            ],
            ['districts', 'Quartieri'],
          ]
            .map(
              ([id, name]) =>
                `<button data-phone-tab="${id}" aria-pressed="${this.tab === id}">${name}</button>`,
            )
            .join('')}</nav>
      <section ${this.tab === 'route' ? '' : 'hidden'}><h3>${current.name} / ${c.defeated.length} di 4 rivali battuti</h3><p>${current.description}</p><button data-career-race="${c.district === 'old-docks' ? 'sprint-quays' : `career-${c.district}`}">GARA DEL QUARTIERE</button>${c.district === 'hillcrest' ? '<button data-career-race="drift-hills">DRIFT IN DISCESA</button>' : ''}<p>Un arrivo assegna 40 REP, una vittoria 60 REP. L’indice estetico aggiunge fino a 40 REP. Ogni rivale battuto assegna 80 REP più il bonus estetico.</p>${rival ? `<article><span class="eyebrow">PROSSIMO RIVALE / ${careerData.districts.find((d) => d.id === rival.district)!.name}</span><h3>${rival.name}</h3><p>${rival.profile}</p><p>Servono ${rival.fame} REP. Vittoria necessaria per sbloccare il quartiere successivo.</p><button data-career-race="${rival.event}" ${c.fame < rival.fame ? 'disabled' : ''}>SFIDA ${rival.name.toUpperCase()}</button></article>` : '<article><h3>Le quattro firme.</h3><p>Carriera principale completata. Tutti i quartieri sono aperti; puoi continuare gare, sponsor e servizi fotografici.</p></article>'}<p>LIVELLO 2: 160 REP. LIVELLO 3: 400 REP. Componenti e modelli del catalogo seguono il livello indicato.</p></section>
      <section ${this.tab === 'sponsors' ? '' : 'hidden'}><h3>Contratti sponsor</h3><p>Un contratto attivo alla volta. Gli obiettivi contano dall’accettazione e restano salvati. Il ritiro non conta come arrivo.</p>${careerData.sponsors.map((s) => `<article><h3>${s.name}</h3><p>${s.kind === 'speed' ? `Raggiungi ${displaySpeed(s.target / 3.6)} ${speedUnit()} dopo aver accettato il contratto.` : s.description}</p><p>${s.reward} CR + ${s.reputation} REP · Accesso ${s.fame} REP</p>${c.sponsorsDone.includes(s.id) ? '<p>CONCLUSO / PREMIO RICEVUTO</p>' : c.activeSponsor === s.id ? `<p>PROGRESSO ${s.kind === 'speed' ? displaySpeed(c.sponsorProgress / 3.6) : c.sponsorProgress} / ${s.kind === 'speed' ? displaySpeed(s.target / 3.6) : s.target}${s.kind === 'speed' ? ' ' + speedUnit() : ''}</p><button id="sponsor-claim" ${c.sponsorProgress < s.target ? 'disabled' : ''}>RISCUOTI PREMIO</button>` : `<button data-sponsor="${s.id}" ${c.fame < s.fame || c.activeSponsor ? 'disabled' : ''}>ACCETTA CONTRATTO</button>`}</article>`).join('')}</section>
      <section ${this.tab === 'covers' ? '' : 'hidden'}><h3>Servizi per le riviste</h3><p>La copertina fotografa l’auto con la configurazione applicata. Si esporta un PNG originale e si riceve il premio una volta per rivista.</p>${careerData.magazines.map((m) => `<article><span class="eyebrow">${m.edition}</span><h3>${m.name}</h3><p>${m.fame} REP · ESTETICA ${m.style}/10 · ${m.reward} CR + ${m.reputation} REP</p><button data-cover="${m.id}" ${coverLock(p, m.id) ? 'disabled' : ''}>${c.covers.includes(m.id) ? 'SERVIZIO COMPLETATO' : 'SCATTA COPERTINA'}</button></article>`).join('')}</section>
      <section ${this.tab === 'messages' ? '' : 'hidden'}><h3>Messaggi</h3>${c.messages
        .map((m) => {
          const text = messageText(m.id);
          return `<article><h3>${text.title}</h3><p>${text.body}</p></article>`;
        })
        .join('')}</section>
      <section ${this.tab === 'districts' ? '' : 'hidden'}><h3>Accessi alla città</h3><p>I quartieri sbloccati sono collegati da ponti percorribili. Puoi anche usare il viaggio rapido per raggiungere il quartiere scelto. Garage, GPS e gare sono disponibili.</p>${careerData.districts.map((d, i) => `<article><h3>${d.name}</h3><p>${d.description}</p><p>${districtUnlocked(c, d.id) ? 'ACCESSO APERTO' : `Batti ${careerData.rivals[i - 1].name} per aprire il passaggio.`}</p><button data-travel="${d.id}" ${!districtUnlocked(c, d.id) || c.district === d.id ? 'disabled' : ''}>${c.district === d.id ? 'SEI QUI' : 'VIAGGIA'}</button></article>`).join('')}</section>`
    }</section>`;
    const get = (id: string) => this.root.querySelector<HTMLButtonElement>(id);
    get('#career-close')!.onclick = () => this.onClose();
    const start = get('#career-begin');
    if (start)
      start.onclick = () => this.run(() => this.store.commit(startCareer));
    for (const b of this.root.querySelectorAll<HTMLButtonElement>(
      '[data-phone-tab]',
    ))
      b.onclick = () => {
        this.tab = b.dataset.phoneTab!;
        if (this.tab === 'messages')
          this.store.commit((p) =>
            p.career.messages.forEach((m) => {
              m.read = true;
            }),
          );
        this.refresh();
      };
    for (const b of this.root.querySelectorAll<HTMLButtonElement>(
      '[data-career-race]',
    ))
      b.onclick = () => this.onRace(b.dataset.careerRace!);
    for (const b of this.root.querySelectorAll<HTMLButtonElement>(
      '[data-travel]',
    ))
      b.onclick = () => this.onTravel(b.dataset.travel!);
    for (const b of this.root.querySelectorAll<HTMLButtonElement>(
      '[data-cover]',
    ))
      b.onclick = () => this.onCover(b.dataset.cover!);
    for (const b of this.root.querySelectorAll<HTMLButtonElement>(
      '[data-sponsor]',
    ))
      b.onclick = () =>
        this.run(() =>
          this.store.commit((p) => acceptSponsor(p, b.dataset.sponsor!)),
        );
    const claim = get('#sponsor-claim');
    if (claim)
      claim.onclick = () => this.run(() => this.store.commit(claimSponsor));
  }
}
