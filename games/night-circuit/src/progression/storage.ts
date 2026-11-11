import { catalog } from './catalog';
import { freshProfile, parseProfile, type Profile } from './profile';

export const SAVE_KEY = 'night-circuit:v2:auto';
const BACKUP_KEY = 'night-circuit:v2:backup';
export class ProfileStore {
  profile = freshProfile();
  status = `Nuovo profilo. ${catalog.initialCredits.toLocaleString('it-IT')} crediti iniziali.`;
  infiniteCredits = false;
  private blocked = false;
  private lastAutoRaw: string | null = null;
  constructor(
    private readonly storage: Pick<Storage, 'getItem' | 'setItem'> | null,
  ) {
    try {
      const raw = storage?.getItem(SAVE_KEY);
      this.lastAutoRaw = raw ?? null;
      if (raw) {
        this.profile = parseProfile(raw);
        this.status = 'Autosave caricato.';
      } else if (!storage)
        this.status =
          'Memoria locale non disponibile. Esporta il profilo per conservarlo.';
    } catch {
      this.blocked = true;
      this.status =
        'Autosave illeggibile o non supportato, conservato intatto. Importa un profilo valido o ripristina la copia precedente. I progressi attuali restano in memoria.';
    }
  }
  commit(change: (profile: Profile) => void, options?: { backup?: boolean }) {
    if (options?.backup && this.blocked)
      throw Error('Recupera un profilo valido prima di sostituire un’auto.');
    const next = parseProfile(JSON.stringify(this.profile));
    if (import.meta.env.DEV && this.infiniteCredits) next.credits = 1e9;
    change(next);
    if (import.meta.env.DEV && this.infiniteCredits) next.credits = 1e9;
    const validated = parseProfile(JSON.stringify(next));
    if (options?.backup) {
      this.replace(validated);
      return;
    }
    this.profile = validated;
    this.save();
  }
  private checkCurrent() {
    if (this.storage && this.storage.getItem(SAVE_KEY) !== this.lastAutoRaw) {
      this.blocked = true;
      this.status =
        'Profilo aggiornato in un’altra scheda. Esporta i progressi in memoria e ricarica prima di salvare.';
      return false;
    }
    return true;
  }
  save() {
    if (this.blocked) return;
    try {
      if (!this.storage) throw Error();
      if (!this.checkCurrent()) return;
      const raw = JSON.stringify(this.profile);
      this.storage.setItem(SAVE_KEY, raw);
      this.lastAutoRaw = raw;
      this.status = 'Salvato automaticamente su questo browser.';
    } catch {
      this.status =
        'Salvataggio locale non riuscito. Progressi in memoria: esporta il profilo per conservarli.';
    }
  }
  manual(slot: number) {
    this.checkSlot(slot);
    if (!this.storage) throw Error('Memoria locale non disponibile.');
    this.storage.setItem(
      `night-circuit:v2:slot-${slot}`,
      JSON.stringify(this.profile),
    );
    this.status = `Slot ${slot} salvato.`;
  }
  slot(slot: number): Profile | null {
    this.checkSlot(slot);
    const raw = this.storage?.getItem(`night-circuit:v2:slot-${slot}`);
    return raw ? parseProfile(raw) : null;
  }
  load(slot: number) {
    const p = this.slot(slot);
    if (!p) throw Error('Slot vuoto.');
    this.replace(p);
  }
  replace(profile: Profile) {
    const next = parseProfile(JSON.stringify(profile));
    // Preserve the current playable state before applying an explicit load/import.
    if (!this.storage)
      throw Error(
        'Importazione non applicata: memoria locale non disponibile.',
      );
    if (!this.checkCurrent()) throw Error(this.status);
    this.storage.setItem(BACKUP_KEY, JSON.stringify(this.profile));
    const raw = JSON.stringify(next);
    this.storage.setItem(SAVE_KEY, raw);
    this.lastAutoRaw = raw;
    this.profile = next;
    this.blocked = false;
    this.status = 'Profilo caricato. Copia precedente disponibile.';
  }
  restore() {
    const raw = this.storage?.getItem(BACKUP_KEY);
    if (!raw) throw Error('Nessuna copia precedente disponibile.');
    this.replace(parseProfile(raw));
  }
  export() {
    return JSON.stringify(this.profile, null, 2);
  }
  private checkSlot(slot: number) {
    if (!Number.isInteger(slot) || slot < 1 || slot > 3)
      throw Error('Slot non valido.');
  }
}

export function browserStore() {
  try {
    return new ProfileStore(window.localStorage);
  } catch {
    return new ProfileStore(null);
  }
}
