# T08: Ponte Web Worker e store

**Dipende da:** T05, T06 · **Stima:** M

## Obiettivo
L'engine gira in un Web Worker con il suo ciclo temporale; la UI riceve istantanee dello stato e invia comandi
attraverso uno store Zustand.

## Contesto
- `docs/TECH.md` → "Architettura" e "Regole architetturali".
- `PLANS.md` → "Tempo", "Comandi".

## Da fare
1. `src/worker/protocol.ts`: tipi dei messaggi.
   - UI → Worker: `INIT { seed }`, `COMMAND { command }` e `REQUEST_PREVIEW { policyId, value, requestId }`. Il payload di `COMMAND` è l'unione `{ type: 'SET_POLICY'; policyId: string; value: number } | { type: 'SET_SPEED'; speed: 0 | 1 | 2 | 4 }`. Il Worker assegna il tick ai soli cambi di politica.
   - Worker → UI: `{ type: 'SNAPSHOT'; snapshot: Snapshot }`, `{ type: 'COMMAND_RESULT'; ... }`, `{ type: 'PREVIEW'; requestId; preview }`, `{ type: 'ERROR'; message }`.
   - `Snapshot`: tutti i dati che servono alla UI (attributi con valore, zona, pressione, attivo, storico, spiegazione del target;
     politiche con target ed effective; anno, era, velocità, popolazione, capacità, Influenza, Legittimità, livello di Complessità).
2. `src/worker/simulation.worker.ts`:
   - Carica il contenuto, crea la partita su `INIT`.
   - Ciclo basato su `setInterval` o `setTimeout` a 100 ms: a ogni giro esegue `speed` tick (0 = pausa).
     **Il tempo reale serve solo a decidere quanti tick eseguire**: l'engine resta deterministico.
   - Applica `SET_SPEED` alla ricezione anche se il gioco è in pausa. Assegna ai `SET_POLICY` il tick corrente + 1 e applicali al primo tick utile. Ricevi e rispondi alle richieste di anteprima anche in pausa.
   - Invia `COMMAND_RESULT` al momento dell'applicazione o del rifiuto di un cambio di politica. Invia gli `SNAPSHOT` al massimo 5 volte al secondo, includendo gli aggiornamenti dopo i comandi.
3. `src/worker/client.ts`: crea il Worker (`new Worker(new URL(...), { type: 'module' })`) ed espone `init`, `send`, `requestPreview` (Promise).
4. `src/ui/store/gameStore.ts` (Zustand): ultimo snapshot, ultimo esito di comando, azioni `setPolicy`, `setSpeed`, `previewPolicy`.
5. Test: il protocollo e la costruzione dello snapshot (funzione pura `buildSnapshot(state, content, speed)`) si testano in Node.
   Il Worker vero si verifica a mano (vedi sotto).

## Fuori ambito
- Componenti visivi (T09); salvataggi e gioco offline (Fase 2).

## Criteri di accettazione
- [x] `buildSnapshot` è pura e testata; nessun import di React nel Worker o nell'engine.
- [x] Con l'app avviata, gli snapshot del Worker aggiornano anno e tick nel browser.
- [x] `setSpeed(0)` ferma l'anno. Da fermo, `setSpeed(1)` riprende il tempo e applica le politiche in coda al primo tick utile. `setSpeed(4)` avanza circa 4 volte più in fretta di `setSpeed(1)`.
- [x] Un `setPolicy` senza Influenza sufficiente produce un `COMMAND_RESULT` con `ok: false`.
- [x] `npm run lint` e `npm test` passano; `PLANS.md` aggiornato.
