# T05: Politiche, Influenza e Legittimità

**Dipende da:** T04 · **Stima:** M

## Obiettivo
Il giocatore può spostare i cursori delle politiche: il cambio costa Influenza, arriva con ritardo e rampa,
e modifica gli attributi. Influenza e Legittimità vengono calcolate a ogni tick.

## Contesto
- `PLANS.md` → "Comandi", "Politiche", "Influenza e Legittimità".
- `docs/GAME_DESIGN.md` §4.1–4.2.

## Da fare
1. `src/engine/systems/policies.ts`:
   - `applySetPolicy(state, content, cmd): { state; result: { ok: true } | { ok: false; reason: 'insufficient_influence' | 'unknown_policy' | 'locked' } }`.
     Valida `value` (0–100, arrotondato a intero), calcola il costo, scala l'Influenza, imposta `target` e `changedAtYear`.
   - `updatePolicies(state, content, dt)`: `effective` insegue `target` dopo il ritardo, con la rampa.
   - `previewPolicyChange(state, content, policyId, value)`: `{ cost, effects: { attribute, deltaTarget }[], delayYears, rampYears }`
     calcolato confrontando i contributi alla posizione attuale e a quella nuova (servirà al tooltip).
2. `src/engine/systems/influence.ts`: `updateLegitimacy` e `updateInfluence` come da contratto (attributi dormienti = `base`).
3. In `step`, ordine per tick: comandi → politiche → legittimità e Influenza → attributi.
   `step` restituisce anche gli esiti dei comandi: firma `step(state, commands, content): { state; commandResults }`.
   Aggiorna i test di T04 di conseguenza.
4. Test unitari e di scenario.

## Fuori ambito
- Costo di mantenimento delle politiche e impopolarità (servono i gruppi sociali, Fase 2).
- Sblocco delle politiche per era oltre al controllo `eraMin`.

## Criteri di accettazione
- [x] Con Influenza insufficiente `applySetPolicy` rifiuta il comando senza modificare la politica né spendere Influenza. `step` prosegue con l'aggiornamento ordinario del tick (test).
- [x] `effective` non si muove prima di `delayYears` e raggiunge il target in circa `rampYears` (test, tolleranza 1 tick).
- [x] Cambiare di nuovo il target durante la rampa fa ripartire il ritardo (test).
- [x] Scenario: `fire` portata a 100 → dopo 500 anni `environment` è più basso e `sustenance` più alto rispetto a una partita identica senza il comando (test).
- [x] `previewPolicyChange` restituisce gli stessi delta che si osservano nei target dopo la rampa completa (test).
- [x] L'Influenza non supera mai `influenceCap` e non diventa negativa (test).
- [x] `npm run lint` e `npm test` passano; `PLANS.md` aggiornato.
