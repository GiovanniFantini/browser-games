# PLANS.md: piano di esecuzione

I percorsi dei compiti e i comandi npm si riferiscono a `games/epoche/`. Per lo stato, aggiorna questa tabella dopo aver verificato i criteri della scheda.

## Obiettivo della Fase 1: motore minimo
Alla fine della Fase 1 si gioca la **Preistoria a schermo con soli numeri**:
schede attributi, cursori delle politiche, pausa/velocità, tempo che scorre, attributi che reagiscono in modo
comprensibile. Nessuna mappa, nessun evento, nessun salvataggio (arrivano nella Fase 2).

**Domanda a cui la Fase 1 deve rispondere:** muovendo i cursori, la civiltà reagisce in modo leggibile
e la crescita crea pressioni (attributi che escono dalla zona sana)?

## Stato dei compiti

| ID | Compito | Dipende da | Stato |
|---|---|---|---|
| T01 | [Setup del progetto](docs/tasks/T01-project-setup.md) | — | ✅ |
| T02 | [Nucleo dell'engine: Rng, hash, comandi, tick](docs/tasks/T02-engine-core.md) | T01 | ✅ |
| T03 | [Schemi del contenuto e dati della Preistoria](docs/tasks/T03-content-schema.md) | T01 | ✅ |
| T04 | [Stato di gioco e sistema degli attributi](docs/tasks/T04-attributes-system.md) | T02, T03 | ✅ |
| T05 | [Politiche, Influenza e Legittimità](docs/tasks/T05-policies-influence.md) | T04 | ✅ |
| T06 | [Popolazione e Complessità](docs/tasks/T06-population-complexity.md) | T04 | ✅ |
| T07 | [Simulatore headless e test di determinismo](docs/tasks/T07-headless-sim.md) | T05, T06 | ✅ |
| T08 | [Ponte Web Worker e store](docs/tasks/T08-worker-bridge.md) | T05, T06 | ✅ |
| T09 | [Interfaccia grezza](docs/tasks/T09-raw-ui.md) | T08 | ✅ |
| T10 | [Verifica locale della Fase 1](docs/tasks/T10-local-verification.md) | T07, T09 | ✅ |

Legenda: ⬜ da fare · 🟨 in corso · ✅ fatto · ⛔ bloccato

Ordine dei prerequisiti: T01, T02 e T03, T04, T05 e T06. Da lì T07 verifica il motore e T08 precede T09. T10 verifica insieme il simulatore e il prototipo giocabile.

---

## Contratti tecnici
Questi tipi e formule sono il **contratto** tra i compiti. Si possono raffinare, ma ogni modifica va scritta
nel Registro decisioni.

### Dipendenze ammesse in Fase 1
`typescript`, `vite`, `react`, `react-dom`, `zustand`, `zod`, `vitest`, `eslint` (+ `typescript-eslint`,
`eslint-plugin-react-hooks`), `prettier`, `tsx` (per il simulatore). Niente PixiJS, Dexie, librerie di grafici.

### Tempo
```ts
export const TICKS_PER_SECOND = 10;           // a velocità 1×
// Anni storici per tick: dall'era corrente (content). Preistoria: 200 anni/minuto → 200 / 600 = 1/3 anno per tick.
yearsPerTick = era.yearsPerMinute / (60 * TICKS_PER_SECOND);
```
- La velocità (1×/2×/4×/10×/25×) **non** cambia `yearsPerTick`: cambia quanti tick esegue il Worker per secondo reale.
- L'anno corrente è `state.year` (numero decimale, negativo = a.C.). Partenza Preistoria: `-300000`.

### Rng
```ts
interface Rng { next(): number; /* [0,1) */ int(min: number, max: number): number; getState(): number; }
createRng(seed: number): Rng   // mulberry32; lo stato è serializzabile in GameState.rngState
```

### Comandi
```ts
type Command =
  | { type: 'SET_POLICY'; policyId: string; value: number; tick: number }   // value 0..100
  | { type: 'SET_SPEED'; speed: 0 | 1 | 2 | 4 | 10 | 25; tick: number };              // 0 = pausa
```
- `state.tick` indica l'ultimo tick completato. All'inizio del tick successivo, `step()` applica i `SET_POLICY` dovuti in ordine di arrivo. L'anno avanza al termine del tick di `yearsPerTick`.
- Il Worker applica `SET_SPEED` alla ricezione, anche durante la pausa. La velocità resta fuori dalla coda della simulazione e dall'hash dello stato.
- Mentre il tempo è in pausa, le anteprime restano disponibili e i `SET_POLICY` in coda si applicano alla ripresa, al primo tick utile.

### Stato di gioco
```ts
interface GameState {
  version: 1;
  seed: number;
  rngState: number;
  tick: number;
  year: number;
  eraId: string;                                  // 'prehistory'
  attributes: Record<AttributeId, AttributeState>;
  policies: Record<PolicyId, PolicyState>;
  population: number;
  complexity: number;                             // 0..∞, vedi T06
  complexityTierId: string;                       // 'band' | 'tribe' | ...
  influence: number;
  legitimacy: number;                             // 0..100
}
interface AttributeState {
  value: number;        // 1..20, decimale
  pressure: number;     // ≥ 0, accumulo fuori dalla zona sana
  active: boolean;      // false = dormiente nell'era corrente
  history: number[];    // ultimi 100 campioni (1 campione ogni `historySampleYears`)
}
interface PolicyState {
  target: number;       // 0..100, impostato dal giocatore
  effective: number;    // 0..100, insegue target con ritardo e rampa
  changedAtYear: number;
}
```
`step` è pura. Da T04 restituisce `GameState`. T05 aggiunge gli esiti dei comandi e restituisce `{ state: GameState, commandResults }`. T06 completa l'ordine dei sistemi nel tick.

### Aggiornamento degli attributi (per tick)
```
dt = yearsPerTick
for attr in attributiAttivi (ordinati per id):
  target = attr.base
         + Σ contributoPolitiche(attr)
         + Σ influenze(attr)
  target = clamp(target, 1, 20)
  value += (target - value) * (1 - exp(-attr.adaptRate * dt))
  value  = clamp(value, 1, 20)
```
- **Calcolo in due fasi**: tutti i `target` si calcolano leggendo i valori del tick **precedente**, poi si aggiornano i valori.
- `contributoPolitiche`: per ogni effetto della politica sull'attributo,
  `lerp(effect.at0, effect.at100, policy.effective / 100)`.
- `influenze`: per ogni `Influence { from, to, weight, mode }`:
  - `linear`: `weight * (value(from) - 10.5)`
  - `belowZone`: `weight * max(0, zone(from).min - value(from))`
  - `aboveZone`: `weight * max(0, value(from) - zone(from).max)`
  - `aboveThreshold` (solo per sorgenti speciali come `population_pressure`): `weight * max(0, value(from) - threshold)`
- Sorgenti speciali ammesse in `from`: `population_pressure` (vedi Popolazione). Sono calcolate prima degli attributi.
- **Pressione**: `d = distanza dalla zona sana (0 se dentro)`;
  se `d > 0`: `pressure += d * dt * pressureGain`; altrimenti `pressure = max(0, pressure - dt * pressureDecay)`.
  In Fase 1 la pressione si calcola e si mostra, non genera eventi.

### Politiche
```
// effective insegue target solo dopo il ritardo
if (year >= changedAtYear + policy.delayYears):
  step = (100 / policy.rampYears) * dt
  effective = moveTowards(effective, target, step)
```
- Costo di un cambio: `|nuovoTarget - targetAttuale| * policy.costPerPoint` Influenza. Se l'Influenza non basta,
  il comando viene **rifiutato** (lo stato non cambia; il Worker notifica la UI).
- Cambiare il target mentre `effective` sta ancora inseguendo **azzera il ritardo** (`changedAtYear = year`).

### Influenza e Legittimità
```
legitimacy = clamp(50 + 3*(Coesione - 10.5) + 2*(Stabilità - 10.5) - Σ costoImpopolarità, 0, 100)
influence += era.influenceRegenPerYear * (legitimacy / 100) * dt
influence  = min(influence, era.influenceCap)
```
In Preistoria Stabilità è dormiente: se un attributo è dormiente vale il suo `base`.
In Fase 1 `costoImpopolarità` vale 0 e la Legittimità modula la rigenerazione dell'Influenza. Gli effetti sociali sull'efficacia delle politiche appartengono alle fasi successive.

### Popolazione e Complessità
```
capacity = era.baseCapacity * (Sostentamento / 10) * (Ambiente / 10)
healthFactor = max(0, (Salute - 8) / 10)
growth   = era.baseGrowthPerYear * healthFactor * (1 - population / capacity)
population += population * growth * dt      // min 10
complexity = log10(population) * era.complexityMultiplier
complexityTierId = livello più alto con complexity >= tier.threshold
```
All'inizio del tick la pressione demografica usa popolazione, Sostentamento e Ambiente dello stato precedente. `populationPressure = population / capacity` riduce i target di Sostentamento e Ambiente oltre 0,8. Il passo demografico usa gli attributi aggiornati. Con Salute ≤ 8 la crescita si ferma, anche se la popolazione supera la capacità.

> Tutte le costanti sono **segnaposto** in `src/content/`. Il bilanciamento vero arriva dal prototipo su foglio
> di calcolo e dal simulatore (T07).

### Hash dello stato
`hashState(state)`: JSON con chiavi ordinate, numeri arrotondati a 6 decimali, FNV-1a 32 bit, esadecimale.
Esclude `history` e qualsiasi stato della UI. Il test di determinismo confronta direttamente anche lo storico.

---

## Registro decisioni
| Data | Decisione | Motivo |
|---|---|---|
| 2026-11-23 | Fase 1 senza mappa, eventi né salvataggi | Validare prima il cuore numerico |
| 2026-11-23 | mulberry32 come PRNG | Semplice, veloce, stato in un solo intero |
| 2026-11-23 | Calcolo degli attributi in due fasi | Evita dipendenze dall'ordine di aggiornamento |
| 2026-11-23 | Crescita base 0.01/anno, pressione demografica da 0.8 (pesi −4 e −6) | Simulazione preliminare: con valori più bassi la crescita non creava mai problemi |
| 2026-11-23 | `SET_SPEED` gestito subito nel Worker, `SET_POLICY` al primo tick utile | Ripresa dalla pausa senza toccare il determinismo |
| 2026-11-23 | Fattore Salute con minimo zero | Impedisce che la popolazione cresca oltre capacità con Salute sotto 8 |

## Note e scoperte
- Verifica documentale del 23/11/2026. Con i dati T03 e le formule di questo piano, una simulazione di controllo separata mantiene gli attributi attivi in zona dopo 1000 anni in `idle`. In `growth` il primo calo di Ambiente sotto 10 avviene intorno all'anno 1180. T10 usa 3000 anni per `growth`, come T06. Questi risultati controllano il piano e andranno riprodotti da T07 e T10 sul motore di Epoche.

## Verifica della Fase 1

- Node.js 24.20.0. Lint, 23 test Vitest, build e `sim:check` completati in locale. La build Vite segnala due annotazioni in commenti di Zod e genera il pacchetto.
- La prova di isolamento ha rifiutato import React, `Math.random()`, `Date.now()` e `new Date()` in un file di verifica temporaneo.
- Il replay di 3000 anni usa 12 comandi e confronta hash e storici per tre semi. Una variazione di bilanciamento cambia l'hash. Azzerare il contributo della pressione demografica fa fallire il controllo `growth`.
- Chrome ha verificato Worker, layout a 1920×1080 e 1366×768, anteprima con un costo di 5 Influenza per il fuoco da 50 a 100, invio al rilascio, coda in pausa, ripresa, rifiuto per Influenza insufficiente, ritardo ed effetto sul valore di Ambiente, zona sana, tooltip e cambio lingua persistente. In due finestre di uguale durata si sono osservati 16 tick a 1× e 64 a 4×. La build statica ha superato anche la prova di avvio, Worker e attuazione di una politica in Chrome. Evidenze locali in `artifacts/epoche/fase-1/`.

Ogni strategia è stata simulata per 2.000 anni su 20 semi, con zero comandi rifiutati.

| Strategia | Popolazione media finale | Durata |
|---|---:|---:|
| idle | 179,26 | 2,55 s |
| growth | 152,47 | 6,32 s |
| tradition | 173,66 | 5,10 s |
| random | 162,26 | 6,40 s |

Nel caso `growth` Ambiente chiude a 8,24 e passa il 41% della simulazione sotto la zona sana. I dati delle politiche e le formule della Fase 1 restano il riferimento per la tappa successiva.

## Verifica della candidata browser

Il recupero offline conserva lo stato prima di un esito irreversibile, insieme agli ordini che devono ancora essere applicati. L’uscita dopo un errore di salvataggio conserva la sessione per un nuovo tentativo o per l’esportazione.

Il passaggio d’era richiede riforme già attuate. Le occasioni narrative sono relative all’ingresso nell’era, così anche chi avanza appena possibile trova più dilemmi. Le condizioni usano i dati locali della civiltà e il ritmo di gioco. I riscontri del motore, delle build e delle prove nel browser sono nelle [verifiche della campagna](docs/CAMPAIGN_VERIFICATION.md).

## Campagna browser 1.0, primo giro

La build epoche-020-giro1-dabdb079 proviene dallo snapshot E001 del sorgente locale. La revisione di Opus è rinviata. Il simulatore narrativo registra tick di ingresso nell'era e tick di apertura dei dilemmi per consentire il confronto del ritmo prima e dopo gli interventi. Stato dei singoli task nell'[indice](docs/tasks/README.md), prove e protocollo nel [resoconto](docs/tasks/primo-giro.md). Le sessioni con persone e la decisione sulle condizioni di distribuzione restano aperte.

Per le verifiche successive al primo giro è stata archiviata la build tecnica epoche-020-locale-2dce5dcada57. Include gli avvisi di compatibilità nella schermata iniziale. Le verifiche locali coprono anche la matrice dei salvataggi, i segnali audio e il recupero su entrambe le famiglie di browser previste. [Stato, risultati e attività rinviate](docs/tasks/verifiche-locali.md).

I [due giri simulati con agenti](docs/tasks/playtest-agenti.md) hanno portato a correzioni locali dell’interfaccia e del resoconto del Worker. Il formato dei salvataggi resta alla versione 1. Giovanni ha confermato la campagna locale. Playtest con persone e revisione di Opus sono rinviati.

## Revisione della leggibilità dopo la prova di Giovanni

La vista iniziale della civiltà mostra condizione e andamento degli attributi attivi. La casella «Mostra le statistiche» apre la lettura numerica. La carta disegna i territori della partita e associa ogni popolo a nome, simbolo e colore. La scheda delle politiche spiega il contesto dell'era e ricava l'anteprima dei prossimi cursori dal catalogo della campagna.

Verifica locale in Chrome a 1366×768 in italiano e a 1920×1080 in inglese. Provati il cambio di vista statistica, l'anteprima del Neolitico, la selezione di un vicino sulla mappa e il ritorno al proprio popolo da tastiera. Nessun errore JavaScript durante le due prove. Superati 54 test automatici.

## Accesso alla campagna dalla raccolta

La scheda della raccolta apre direttamente la campagna completa. In Chrome a 1366×768 sono stati verificati l’accesso dalla raccolta, i tre slot, la creazione di una partita, il salvataggio e la ripresa dopo il ricaricamento. Compilazione, lint e 54 test superati.

## Decisioni leggibili durante la partita

Le politiche delle dieci ere presentano una domanda e tre posizioni illustrate. Il valore esatto, gli effetti, la durata e il costo si possono confrontare prima della conferma. Il Worker conserva la posizione degli ordini in attesa e la cronaca registra la scelta e il raggiungimento del valore effettivo.

I 65 imprevisti mostrano una scena e le conseguenze narrative delle tre risposte, disponibili in italiano e inglese. In partita un evento ordinario lascia scorrere il tempo. Dopo 600 tick il consiglio applica la risposta gratuita. Il giocatore può mettere in pausa per leggere. Un evento decisivo apre subito la scelta e attende la risposta. Nell’insediamento gli avvisi seguono la posizione di campi, bosco, fiume o villaggio secondo il fatto registrato.

Chrome, con salvataggi di prova del Neolitico: verificati tastiera, scelta rapida, annullamento, conferma in pausa, attuazione alla ripresa, avviso nel villaggio, cronaca e risposte a eventi ordinari e decisivi. La prova a 1366×768 usa l’italiano; quella a 1920×1080 usa l’inglese. I test mirati coprono anche la scadenza della scelta ordinaria, la risposta superata e l’avviso di completamento dei campi.

Il 24 novembre 2026 Chrome a 1366×768 ha verificato i controlli 10× e 25×, i tasti 4 e 5, la pausa e la ripresa. Tra due aggiornamenti consecutivi del Worker sono trascorsi rispettivamente 20 e 50 tick.

Il 24 novembre 2026 i dilemmi hanno acquisito conseguenze cumulative sulle quattro famiglie di crisi e un esito terminale di dissoluzione. A 1366×768 Chrome ha verificato la pausa automatica a 25×, l’avviso sulla scelta fatale e il riepilogo con la causa e l’ultima risposta. Il confronto prima e dopo è nelle [verifiche della campagna](docs/CAMPAIGN_VERIFICATION.md).

Il 24 novembre 2026 il catalogo è passato a dilemmi da due a quattro risposte. Il consiglio usa la prima opzione gratuita alla scadenza. Costi e conseguenze sono calibrati per singola risposta anche nelle ere successive. Il confronto sui 25 mondi e la verifica in Chrome sono nelle [verifiche della campagna](docs/CAMPAIGN_VERIFICATION.md).

Il 24 novembre 2026 il diorama è passato a una valle fissa con lotti persistenti. Tre retaggi indipendenti dai punti Eredità collegano scelte di ere diverse. Le risposte conservano il proprio indice anche quando il motore filtra le opzioni vincolate a un retaggio. Le prove su cambio d’era e salvataggio sono nelle [verifiche della campagna](docs/CAMPAIGN_VERIFICATION.md).

Il 24 novembre 2026 i retaggi permanenti comprendono anche infrastrutture, scoperte e memoria civica delle ere successive. La fiera e la scuola serale conservano l’ultima era di rinnovo nel salvataggio. Invecchiano soltanto quando si supera la massima era già raggiunta.

Il 24 novembre 2026 i dilemmi del Futuro applicano una pressione locale all’apertura. Quando gli habitat superano la capacità sanitaria, parte del carico ricade sull’amministrazione. Le opzioni congestionate condividono la stessa previsione nel motore, nell’interfaccia e nel simulatore.

Il 24 novembre 2026 tre dilemmi sono diventati decisioni urgenti con un danno esplicito per ogni risposta. A 1366×768 Chrome ha verificato due esiti opposti dello stesso inverno a Influenza zero, una volta con risorse e una volta con clan a gravità 90.

## Revisione del gameplay

[Stato dei 40 task e verifiche](artifacts/revisione-gameplay/Stato.md). La prova su carta con tre partecipanti precede lo sviluppo dei rimedi al cambio di era.

## Prova dei rimedi dell’inverno

[Prova con i tre agenti](artifacts/revisione-gameplay/inverno/Prova.md). [Confronto delle partite](artifacts/revisione-gameplay/inverno/Confronto.md). La campagna ordinaria e il controllo restano disponibili accanto alle nuove modalità, con salvataggi separati.
