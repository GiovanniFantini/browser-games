# T07: Simulatore headless e test di determinismo

**Dipende da:** T05, T06 · **Stima:** M

## Obiettivo
Uno strumento da riga di comando che fa girare molte partite senza interfaccia e produce un report,
più il test che garantisce il determinismo dell'engine.

## Contesto
- `docs/SYSTEMS.md` §12 (Bilanciamento), `docs/TECH.md` → "Qualità".
- `PLANS.md` → "Hash dello stato".

## Da fare
1. `tests/determinism.test.ts`: 3 semi × uno script di comandi fisso (almeno 10 `SET_POLICY` in momenti diversi)
   × 3000 anni. Ogni combinazione eseguita due volte deve dare lo stesso `hashState` finale e gli stessi storici.
   Salva gli hash attesi in `tests/determinism.snapshot.json`. Aggiungi `npm run test:update-determinism` per rigenerarli quando si modifica intenzionalmente il comportamento e annota la modifica in `PLANS.md`.
2. `tools/sim/run.ts` (eseguito con `tsx`), script `npm run sim -- [opzioni]`:
   - `--years <n>` (default 2000), `--seeds <n>` (default 20), `--strategy <nome>` (default `idle`).
   - Strategie in `tools/sim/strategies.ts`: `idle` (nessun comando), `random` (ogni 100 anni sposta una politica
     a caso usando un `Rng` dedicato, rispettando l'Influenza), `growth` (`settlement` e `fire` verso 100),
     `tradition` (`elders` e `rites` verso 100).
   - Output in console: tabella con, per ogni attributo, media, min, max a fine partita e **% di tempo fuori zona**;
     popolazione media finale; distribuzione dei livelli di Complessità; numero di comandi rifiutati.
   - `--json <file>`: salva il report completo. Usa `artifacts/sim/` per i report locali, già ignorata da Git.
3. Prestazioni: misura il tempo e stampalo. Obiettivo: 20 semi × 2000 anni in meno di 10 secondi.

## Fuori ambito
- Grafici, interfaccia web del report.
- Ottimizzazioni premature dell'engine (solo se l'obiettivo di prestazioni non è raggiunto).

## Criteri di accettazione
- [x] `npm test` include il test di determinismo e passa.
- [x] Una variazione di bilanciamento che cambia gli stati simulati fa fallire il confronto con gli hash attesi. Registra la prova e ripristina il valore originale.
- [x] `npm run sim -- --years 2000 --seeds 20 --strategy growth` stampa il report senza errori.
- [x] Le 4 strategie producono risultati diversi tra loro (riportati nella PR).
- [x] Obiettivo di prestazioni rispettato o, se no, motivato in "Note e scoperte".
- [x] `npm run lint` e `npm test` passano; `PLANS.md` aggiornato con un riassunto dei primi risultati del simulatore.
