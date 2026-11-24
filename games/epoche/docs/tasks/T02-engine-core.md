# T02: Nucleo dell'engine (Rng, hash, comandi, tick)

**Dipende da:** T01 · **Stima:** M

## Obiettivo
I mattoni di base della simulazione deterministica: generatore casuale con seme, hash dello stato,
tipi dei comandi, coda dei comandi e una funzione `step` generica che avanza il tempo.

## Contesto
- `PLANS.md` → contratti "Tempo", "Rng", "Comandi", "Hash dello stato".
- `docs/SYSTEMS.md` §1 (Tempo).

## Da fare
1. `src/engine/core/rng.ts`: `createRng(seed)` con algoritmo **mulberry32**; `next()`, `int(min, max)` (estremi inclusi),
   `getState()`; `restoreRng(state)` per riprendere da uno stato salvato.
2. `src/engine/core/hash.ts`: `stableStringify(value)` (chiavi ordinate, numeri arrotondati a 6 decimali,
   esclusione di chiavi indicate) e `hashState(state)` con FNV-1a 32 bit → stringa esadecimale di 8 caratteri.
3. `src/engine/core/commands.ts`: tipo `Command` come da contratto; `CommandQueue` con `enqueue(cmd)` e
   `takeForTick(tick)` che restituisce in ordine di arrivo i comandi con `cmd.tick <= tick` non ancora consumati.
4. `src/engine/core/time.ts`: `TICKS_PER_SECOND`, `yearsPerTick(yearsPerMinute)`, `formatYear(year)` che restituisce
   una struttura `{ value: number; era: 'BCE' | 'CE' }` (la formattazione testuale è compito della UI).
5. `src/engine/core/math.ts`: `clamp`, `lerp`, `moveTowards`.
6. Test unitari per ogni file.

## Fuori ambito
- Attributi, politiche, popolazione (T04–T06).
- Il tipo `GameState` completo (T04): qui basta un tipo generico di prova nei test.

## Criteri di accettazione
- [x] Stesso seme → stessa sequenza di 10.000 numeri; semi diversi → sequenze diverse (test).
- [x] `restoreRng(rng.getState())` continua la stessa sequenza (test).
- [x] `int(1, 6)` restituisce tutti i valori 1–6 e mai valori fuori intervallo su 10.000 estrazioni (test).
- [x] `hashState` non cambia se cambia l'ordine delle chiavi e cambia se cambia un valore (test).
- [x] Due valori che arrotondano allo stesso numero a sei decimali producono lo stesso hash (test).
- [x] `CommandQueue` restituisce i comandi nel tick giusto e non li restituisce due volte (test).
- [x] Nessun uso di `Math.random`/`Date` in `src/engine/` (garantito dal lint).
- [x] `npm run lint` e `npm test` passano; `PLANS.md` aggiornato.
