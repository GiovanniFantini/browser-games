# T01: Setup del progetto

**Dipende da:** — · **Stima:** S

## Obiettivo
Un progetto Vite + React + TypeScript funzionante, con test, lint e struttura delle cartelle pronta.

## Contesto
- `AGENTS.md` (comandi, struttura, regole).
- `PLANS.md` → "Dipendenze ammesse in Fase 1".
- `docs/TECH.md` → "Struttura delle cartelle".

## Da fare
1. Inizializza il progetto Vite + React + TypeScript in `games/epoche/`. Conserva i documenti già presenti.
   Crea qui `package.json` con `name: 'epoche'` e `private: true`, oltre al lockfile. Usa la versione di Node indicata dal [README di BrowserGames](../../../../README.md).
2. `tsconfig` con `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`.
   Alias di percorso: `@engine/*`, `@content/*`, `@ui/*`, `@worker/*`.
3. Installa le dipendenze ammesse (solo quelle).
4. Configura Vitest (ambiente `node` di default) ed ESLint (flat config) con `typescript-eslint` e `react-hooks`.
5. **Regola ESLint di isolamento**: in `src/engine/**` vieta l'import di `react`, `react-dom`, `zustand`, `pixi.js`
   e di percorsi `@ui/*`, `@worker/*`, `src/ui`, `src/worker`, `src/map` (`no-restricted-imports`).
   Vieta anche `Math.random`, `Date.now`, `performance.now` e `new Date` in `src/engine/**`
   (`no-restricted-properties` / `no-restricted-syntax`).
6. Script in `package.json`: `dev`, `build`, `test` (`vitest run`), `test:watch`, `lint` (`eslint . && tsc --noEmit`), `format`.
   Lo script `sim` verrà aggiunto in T07.
7. Crea le cartelle della struttura con un `index.ts` vuoto o un `.gitkeep`: `src/engine/core`, `src/engine/systems`,
   `src/engine/state`, `src/content`, `src/worker`, `src/ui`, `src/i18n`, `tools/sim`, `tests`.
8. Pagina iniziale minima: titolo "Epoche" e un testo preso da `src/i18n/it.json` (crea anche `en.json`).
   Un semplice helper `t(key)` con lingua fissata a `it` basta per ora.
9. Un test di esempio che passa (`src/engine/core/sanity.test.ts`).

## Fuori ambito
- Qualsiasi logica di gioco.
- Librerie i18n esterne, PixiJS, Dexie.
- Script e configurazioni comuni della raccolta, CI/CD e integrazione nel catalogo pubblico.

## Criteri di accettazione
- [x] `npm install && npm run dev` mostra la pagina con il titolo letto da `it.json`.
- [x] `npm test` passa con almeno un test.
- [x] `npm run lint` passa.
- [x] Un file di prova in `src/engine/` che importa `react` o usa `Math.random()` fa fallire il lint (verificato e poi rimosso; descritto nella PR).
- [x] `npm run build` produce `games/epoche/dist/` senza errori. Pacchetto e lockfile appartengono a Epoche.
- [x] `PLANS.md` aggiornato (stato T01 ✅).

## Come verificare
Dalla radice di BrowserGames, entra in `games/epoche`. Esegui i comandi nell'ordine e apri nel browser l'indirizzo stampato da Vite.

```powershell
Set-Location games/epoche
npm install
npm run lint
npm test
npm run build
npm run dev
```
