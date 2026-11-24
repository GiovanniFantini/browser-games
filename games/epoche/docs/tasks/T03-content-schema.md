# T03: Schemi del contenuto e dati della Preistoria

**Dipende da:** T01 · **Stima:** M

## Obiettivo
Definire con Zod gli schemi di attributi, influenze, politiche ed ere, e scrivere i dati (segnaposto) della Preistoria.
Il contenuto è caricato e validato in un unico punto.

## Contesto
- `docs/STATS.md` (attributi e zone sane), `docs/ERAS.md` (Era 1), `docs/SYSTEMS.md` §2–3.
- `PLANS.md` → contratti "Aggiornamento degli attributi", "Politiche", "Influenza e Legittimità", "Popolazione e Complessità".

## Da fare
1. `src/content/schema.ts` con schemi Zod e tipi derivati (`z.infer`):
   - `AttributeDef { id, group: 'material'|'social'|'power', nameKey, base, zone: {min,max}, adaptRate, pressureGain, pressureDecay }`
   - `InfluenceDef { from, to, weight, mode: 'linear'|'belowZone'|'aboveZone'|'aboveThreshold', threshold? }`
     (`threshold` obbligatorio solo con `aboveThreshold`)
   - `PolicyDef { id, eraMin, nameKey, leftLabelKey, rightLabelKey, tradeoffKey, default, delayYears, rampYears, costPerPoint, effects: { attribute, at0, at100 }[] }`
   - `ComplexityTierDef { id, nameKey, threshold }`
   - `EraDef { id, nameKey, startYear, yearsPerMinute, activeAttributes: string[], influenceRegenPerYear, influenceCap, startInfluence, baseCapacity, baseGrowthPerYear, startPopulation, complexityMultiplier, historySampleYears }`
   - `ContentBundle { attributes, influences, policies, complexityTiers, eras }`
2. File di dati: `src/content/attributes.ts`, `influences.ts`, `policies/prehistory.ts`, `complexity.ts`, `eras/prehistory.ts`.
3. `src/content/index.ts`: `loadContent(): ContentBundle` che valida tutto e fa **controlli incrociati**:
   ogni `attribute`/`from`/`to` esiste (o è una sorgente speciale come `population_pressure`), ogni `activeAttributes`
   esiste, ID unici, `zone.min < zone.max`, chiavi i18n presenti in `it.json` **e** `en.json`.
   In caso di errore lancia un'eccezione con un messaggio che indica file e ID.
4. Aggiungi a `src/i18n/it.json` ed `en.json` tutte le chiavi usate.
5. Test: il contenuto reale si carica; dati volutamente sbagliati producono errori chiari.

## Dati segnaposto (da usare così, il bilanciamento arriverà dopo)

### Attributi (tutti i 14; ID in inglese)
| id | gruppo | base | zona | attivo in Preistoria |
|---|---|---|---|---|
| sustenance | material | 10 | 10–17 | ✔ |
| prosperity | material | 5 | 8–16 | |
| infrastructure | material | 3 | 8–16 | |
| health | material | 10 | 9–18 | ✔ |
| environment | material | 15 | 10–20 | ✔ |
| cohesion | social | 11 | 9–16 | ✔ |
| stability | social | 10 | 8–15 | |
| faith | social | 8 | 6–14 | ✔ |
| culture | social | 4 | 6–18 | |
| knowledge | social | 6 | 6–20 | ✔ |
| freedom | social | 10 | 6–16 | |
| military | power | 8 | 6–14 | ✔ |
| innovation | power | 4 | 6–18 | |
| prestige | power | 3 | 5–17 | |

Per tutti: `adaptRate: 0.01` (per anno), `pressureGain: 1`, `pressureDecay: 0.5`.

### Influenze
| from | to | mode | weight | threshold |
|---|---|---|---|---|
| sustenance | health | linear | 0.3 | |
| sustenance | cohesion | belowZone | -0.5 | |
| health | cohesion | belowZone | -0.3 | |
| knowledge | sustenance | linear | 0.15 | |
| faith | knowledge | aboveZone | -0.5 | |
| military | cohesion | aboveZone | -0.4 | |
| cohesion | military | belowZone | -0.3 | |
| population_pressure | sustenance | aboveThreshold | -4 | 0.8 |
| population_pressure | environment | aboveThreshold | -6 | 0.8 |

### Politiche della Preistoria (default 50, `eraMin: 'prehistory'`)
| id | sinistra ↔ destra | delay | ramp | costo/punto | effetti (attributo: at0 → at100) |
|---|---|---|---|---|---|
| settlement | Nomadismo ↔ Stanzialità | 20 | 200 | 0.2 | sustenance 0→+1.5 · environment +1→−2 · health +0.5→−1 · cohesion −0.5→+1 |
| subsistence | Caccia ↔ Raccolta | 10 | 100 | 0.15 | military +2→−1 · sustenance −0.5→+1 · knowledge 0→+1 · environment −1→0 |
| elders | Marginali ↔ Centrali | 10 | 150 | 0.15 | knowledge −1→+2 · cohesion −1→+1.5 · faith 0→+1 · military +0.5→−0.5 |
| exogamy | Chiusura ↔ Apertura | 20 | 200 | 0.2 | health −1.5→+1 · cohesion +1.5→−1 · knowledge −0.5→+1 |
| fire | Prudente ↔ Intensivo | 5 | 80 | 0.1 | sustenance −1→+1.5 · health −0.5→+1 · environment +0.5→−2.5 |
| rites | Semplici ↔ Elaborati | 10 | 120 | 0.15 | faith −1→+2.5 · cohesion −0.5→+1.5 · sustenance +0.3→−0.7 |

Testi del compromesso (`tradeoffKey`), es. `settlement`: "Più cibo · Più malattie e meno foreste".

### Livelli di Complessità
| id | threshold |
|---|---|
| band | 0 |
| tribe | 2.2 |
| chiefdom | 3 |
| state | 4 |

### Era `prehistory`
`startYear: -300000`, `yearsPerMinute: 200`, `influenceRegenPerYear: 0.05`, `influenceCap: 100`, `startInfluence: 30`,
`baseCapacity: 150`, `baseGrowthPerYear: 0.01`, `startPopulation: 40`, `complexityMultiplier: 1`, `historySampleYears: 10`.

> Questi valori sono stati verificati con una simulazione preliminare (23/11/2026): senza interventi la civiltà
> ristagna senza crollare; con `settlement` e `fire` a 100 la popolazione cresce oltre la capacità e Ambiente esce
> dalla zona sana entro 3000 anni nello scenario di verifica di T06. Conserva i dati di partenza per il confronto con T07.

## Fuori ambito
- Eventi, gruppi sociali, altre ere.
- Logica che usa questi dati (T04–T06).

## Criteri di accettazione
- [x] `loadContent()` restituisce un bundle valido con 14 attributi, 9 influenze, 6 politiche, 4 livelli, 1 era.
- [x] Test: un'influenza verso un attributo inesistente produce un errore che cita l'ID.
- [x] Test: una chiave i18n mancante in `en.json` produce un errore che cita la chiave.
- [x] Test: `aboveThreshold` senza `threshold` non passa la validazione.
- [x] Nessun numero di bilanciamento fuori da `src/content/`.
- [x] `npm run lint` e `npm test` passano; `PLANS.md` aggiornato.
