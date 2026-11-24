# T06: Popolazione e Complessità

**Dipende da:** T04 · **Stima:** S

## Obiettivo
La popolazione cresce in base a Sostentamento, Salute e capacità dell'ambiente; la Complessità ne deriva.
Quando la popolazione si avvicina alla capacità, la pressione demografica peggiora Sostentamento e Ambiente:
il primo "bambini grandi, problemi grandi".

## Contesto
- `PLANS.md` → "Popolazione e Complessità", sorgenti speciali nelle influenze.
- `docs/SYSTEMS.md` §4 (Complessità).

## Da fare
1. `src/engine/systems/population.ts`:
   - `computeCapacity(state, content)`, `computePopulationPressure(state, content)` (= population / capacity).
   - `updatePopulation(state, content, dt)`: crescita logistica con fattore Salute non negativo e minimo di 10 abitanti.
2. `src/engine/systems/complexity.ts`: `updateComplexity(state, content)` → `complexity` e `complexityTierId`.
3. In `step`: calcola le sorgenti speciali (`population_pressure`) **prima** degli attributi e passale a `computeTargets`.
   Ordine per tick: comandi → politiche → legittimità e Influenza → sorgenti speciali → attributi → popolazione → complessità.
4. Test unitari e di scenario.

## Fuori ambito
- Famiglie di problemi legate ai livelli di Complessità (Fase 2): qui il livello si calcola e basta.
- Migrazioni, scissione della banda.

## Criteri di accettazione
- [x] Con Salute ≤ 8 la popolazione non cresce, anche quando parte sopra la capacità (test).
- [x] A capacità costante e con Salute costante sopra 8, la popolazione converge verso la capacità da entrambi i lati (test di 5000 anni).
- [x] Con `population_pressure` > 0,8 i target di Sostentamento e Ambiente scendono, e `explainTarget` mostra il contributo con ID `population_pressure` (test).
- [x] Il passaggio da `band` a `tribe` avviene quando `log10(population) >= 2.2` (test).
- [x] Scenario: partenza standard, `settlement` e `fire` a 100 → entro 3000 anni la popolazione cresce e Ambiente esce dalla zona sana (test). È la prova minima del "crescere crea problemi".
- [x] `npm run lint` e `npm test` passano; `PLANS.md` aggiornato.
