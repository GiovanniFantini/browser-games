# T04: Stato di gioco e sistema degli attributi

**Dipende da:** T02, T03 · **Stima:** M

## Obiettivo
Il tipo `GameState`, la creazione di una nuova partita e il primo sistema vero: gli attributi che si muovono
verso il loro valore obiettivo, con influenze reciproche, pressione fuori dalla zona sana e storico.

## Contesto
- `PLANS.md` → "Stato di gioco", "Aggiornamento degli attributi", "Tempo".
- `docs/STATS.md` (principi), `docs/SYSTEMS.md` §2 e §5.

## Da fare
1. `src/engine/state/gameState.ts`: tipi `GameState`, `AttributeState`, `PolicyState` come da contratto.
2. `src/engine/state/newGame.ts`: `createNewGame(content, seed, eraId = 'prehistory'): GameState`.
   Attributi al valore `base`, `active` secondo l'era, `history` vuoto; politiche al `default` (target = effective);
   popolazione, Influenza dall'era; `legitimacy` 50; `complexity` 0 e livello `band`.
3. `src/engine/systems/attributes.ts`:
   - `computeTargets(state, content, specialSources): Record<AttributeId, number>` (legge solo lo stato precedente).
   - `explainTarget(state, content, attributeId)`: elenco dei contributi `{ source: 'base'|'policy'|'influence', id, amount }`
     la cui somma (prima del clamp) è il target. Servirà per il tooltip "perché".
   - `updateAttributes(state, content, dt)`: due fasi, poi pressione e campionamento dello storico
     (un campione ogni `historySampleYears` anni; max 100 campioni, i più vecchi vengono scartati).
   - Gli attributi dormienti non cambiano e valgono `base` quando sono letti da un'influenza.
   - Per ora `specialSources` arriva come parametro (`{ population_pressure: number }`); T06 lo calcolerà davvero.
4. `src/engine/step.ts`: `step(state, commands, content): GameState` aggiorna gli attributi per il tick successivo. Il risultato avanza `tick` di 1 e `year` di `yearsPerTick`. I comandi `SET_POLICY` vengono ignorati fino a T05.
   `step` non muta l'oggetto in ingresso.
5. Test unitari e un test "di scenario": 1000 anni senza comandi → valori stabili, dentro 1–20, nessun `NaN`.

## Fuori ambito
- Effetti delle politiche (T05): in questa fase `contributoPolitiche` usa `effective` ma nessuno lo cambia.
- Popolazione e Complessità (T06).

## Criteri di accettazione
- [x] Un attributo con target fisso converge verso il target (test con contenuto di prova).
- [x] La somma di `explainTarget` è uguale al target prima del clamp (test su tutti gli attributi attivi).
- [x] L'ordine di aggiornamento non influisce sul risultato (test: stesso esito invertendo l'ordine degli attributi nel contenuto).
- [x] La pressione cresce fuori zona e cala dentro, senza diventare negativa (test).
- [x] Lo storico non supera 100 campioni e campiona alla cadenza giusta (test).
- [x] `step` non muta lo stato in ingresso (test con `structuredClone` + confronto).
- [x] `npm run lint` e `npm test` passano; `PLANS.md` aggiornato.
