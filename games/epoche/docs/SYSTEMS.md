# Sistemi di simulazione

## 1. Tempo
- La simulazione avanza a **tick fissi** (es. 10 tick al secondo reale a velocità 1×).
- Ogni tick corrisponde a un intervallo di tempo storico che **dipende dall'era**: le ere antiche
  scorrono più in fretta (secoli in pochi minuti), quelle recenti più lentamente (anni).

| Era | Tempo storico per minuto reale (1×), indicativo |
|---|---|
| Genesi | milioni / miliardi di anni (prologo guidato, ~10–15 min totali) |
| Preistoria | ~200 anni |
| Neolitico | ~50 anni |
| Antichità | ~10 anni |
| Medioevo | ~5 anni |
| Moderna → Futuro | ~1–2 anni |

- Velocità: **pausa, 1×, 2×, 4×**. Pausa automatica (configurabile) su eventi importanti.
- **Determinismo**: stessa partenza + stesso seme + stesse azioni = stesso risultato.
  Serve per i test, il bilanciamento e la simulazione offline.

## 2. Grafo degli attributi
Ogni tick, ogni attributo si muove verso un **valore obiettivo** calcolato da:

```
obiettivo(attr) = base_era(attr)
               + Σ effetti_politiche(attr)     // con inerzia e Legittimità
               + Σ influenze_altri_attributi(attr)
               + Σ modificatori_temporanei(attr)  // eventi, crisi, guerre
               + carattere_nascosto(attr)

valore(attr) += (obiettivo - valore) * velocità_adattamento(attr, Adattabilità)
```

Esempi di influenze (dati, non codice: tutto sta in file di contenuto modificabili):
- Sostentamento ▲ → Salute ▲ (leggero), Popolazione ▲
- Popolazione ▲ (oltre capacità) → Sostentamento ▼, Ambiente ▼
- Sapere ▲ → Innovazione ▲, Fede ▼ (leggero, solo da certe ere)
- Prosperità ▲ (con Libertà bassa) → disuguaglianza → Stabilità ▼ nel lungo periodo
- Militare ▲ → Prestigio ▲, Prosperità ▼ (costo)

**Regola d'oro: ogni effetto deve essere spiegabile in una frase.** L'interfaccia mostra sempre il "perché"
di una variazione (scomposizione dei contributi, come i tooltip di Democracy).

## 3. Politiche
```ts
// Schema concettuale (in TECH.md la struttura dei file)
Policy {
  id, nome, era_min, sblocco: Condizione,
  cursore: { min, max, default, etichette: [sx, dx] },
  effetti: [{ attributo, curva: (posizione) => delta, ritardo_anni }],
  gruppi: [{ gruppo, gradimento: (posizione) => delta }],
  costo_cambio: Influenza per punto spostato,
  costo_mantenimento: (distanza dal "naturale" culturale) => Influenza/anno,
}
```
- Gli effetti hanno **ritardo** e **rampa**: una riforma agraria non sfama nessuno il giorno dopo.
- Le curve possono essere **non lineari** (es. tasse: poche = poco gettito, troppe = evasione e rivolte).

## 4. Complessità e famiglie di problemi
La **Complessità** cresce con la dimensione. Superate certe soglie si attivano **famiglie di problemi**:

| Soglia | Famiglie sbloccate (esempi) |
|---|---|
| Banda (≤ 150 persone) | Carestia, conflitti personali, predatori |
| Tribù | Faide tra clan, successione dei capi |
| Chiefdom / città | Epidemie, disuguaglianza, furti, prime guerre |
| Stato | **Burocrazia**, corruzione, rivolte fiscali, eresie |
| Impero | Secessioni, generali ribelli, inflazione, frontiere troppo lunghe |
| Nazione industriale | Lotta di classe, inquinamento, crisi finanziarie, urbanizzazione |
| Globale | Crisi climatiche, pandemie globali, disinformazione, rischi esistenziali |

Ogni famiglia contiene eventi, modificatori e nuovi "costi fissi" (es. la burocrazia consuma Influenza ogni anno).
**I problemi delle soglie precedenti non spariscono: si sommano o cambiano forma.**

## 5. Eccessi (zona sana)
Fuori dalla zona sana, ogni attributo accumula **pressione**. Quando la pressione supera un limite
scatta un evento-crisi specifico (vedi tabella in [`STATS.md`](STATS.md)). La pressione cala lentamente
quando l'attributo rientra.

## 6. Eventi
- **Emergenti** (la maggior parte): condizioni sullo stato (attributi, politiche, gruppi, era, Complessità).
- **Catene**: un evento può programmarne altri ("il raccolto scarso di oggi diventa la rivolta di domani").
- **Casuali** (pochi, per varietà): catastrofi naturali, figure geniali, scoperte fortuite.
- **Dilemmi**: eventi con scelta. Le opzioni mostrano costi in Influenza e probabili effetti.
- Durante il gioco attivo un dilemma ordinario lascia scorrere la simulazione. Il consiglio attende 600 tick e poi applica la risposta gratuita. Il giocatore può rispondere prima o mettere in pausa. I dilemmi decisivi fermano il tempo fino alla risposta.
- Nella campagna browser, ogni dilemma ha da due a sei risposte con esiti propri. Il gioco pesca i dilemmi nell'era corrente. Le conseguenze ancora aperte nello stesso periodo vengono proposte prima dell'avanzamento.
- Il testo usa la **voce della cronaca** (serio con punte ironiche), con variabili (nomi generati, luoghi).

Il calendario dei dilemmi riparte all’ingresso di ogni era. La prima riunione del consiglio cade dopo 40 tick al ritmo Rapido e 800 allo Storico. Se una questione aperta dalle condizioni della civiltà può avere un seguito, il consiglio le dà precedenza. Per le successive occasioni passano rispettivamente 105 o 2.100 tick. Fra gli eventi disponibili vengono prima le storie ancora da incontrare. Una conseguenza già promessa può anticipare la prossima riunione e viene discussa prima del passaggio d’era.

Per i problemi di case, granai e servizi locali la popolazione viene confrontata con il numero di abitanti per cui gli impianti dell’era sono dimensionati. Una rete sanitaria può quindi essere sotto carico anche se il territorio produce cibo a sufficienza. Per alcuni eventi la salute, i raccolti e le condizioni ambientali riflettono anche le differenze locali. La simulazione estrae per ogni occasione una variazione per ciascuno di questi indicatori, condivisa dagli eventi della stessa occasione e riproducibile dal seme.

```ts
Event {
  id, famiglia, peso,
  condizioni: Condizione[],      // es. Salute < 7 && Popolazione > 50k && era >= Antichità
  cooldown_anni,
  testo, varianti_testo[],
  opzioni?: [{ etichetta, costo_influenza, effetti[], eventi_seguenti[] }],
  effetti_automatici?: [...]     // per eventi senza scelta
}
```

## 7. Crisi e collasso
- Una **crisi** è uno stato prolungato (non un evento singolo) con una barra di gravità.
  Più crisi contemporanee si amplificano tra loro (moltiplicatore di "policrisi").
- Se gravità e Legittimità superano certe soglie combinate scatta un **esito strutturale**:
  età buia, frammentazione, conquista, estinzione (vedi [`GAME_DESIGN.md`](GAME_DESIGN.md) §7).
- La *Resilienza* nascosta modula soglie e velocità di ripresa.

## 8. Guerra astratta
Ispirata al sistema di "Potere" di Ozymandias: nessuna unità.
- Il giocatore decide: **dichiarare/accettare guerra**, **obiettivo** (razzia, conquista, difesa, tributo),
  **postura** (cursore *Prudente ↔ Aggressiva*), **impegno** (quanta Prosperità/Popolazione destinare).
- Il conflitto procede nel tempo su una **barra del fronte**; ogni tick confronta
  `Militare × impegno × modificatori (terreno, tecnologia, morale = Coesione, generali-evento)`.
- Effetti collaterali continui: Prosperità ▼, Popolazione ▼, Stanchezza di guerra → Stabilità ▼.
- Esiti: pace bianca, tributo, cessione di territorio, vassallaggio, annessione.
- La mappa mostra il fronte che si sposta, villaggi in fiamme, colonne di profughi (feedback visivo).

## 9. Civiltà IA
- Usano **la stessa simulazione** del giocatore (stessi attributi, stesse politiche).
- Ogni IA ha una **personalità** (pesi sulle priorità) derivata dal suo archetipo culturale e dagli attributi nascosti.
- Decisioni IA: valutazione euristica a intervalli (non ogni tick), es. ogni 5–10 anni di gioco.
- Diplomazia: relazioni (-100…+100), trattati (commercio, non aggressione, alleanza), tributi.
- Numero di IA: 3–8 per mondo, con nascita/morte di civiltà nel tempo.

## 10. Gioco offline (persistenza)
1. Alla chiusura viene salvato lo stato + timestamp.
2. Alla riapertura si calcola il tempo trascorso (con **tetto**, es. 8 ore reali).
3. La simulazione gira **in modalità veloce** (headless, nel Worker) fino a recuperare.
4. Le decisioni le prende la **Dottrina** scelta dal giocatore:
   - *Conservatrice*: mantiene le politiche, sceglie sempre l'opzione più prudente.
   - *Espansiva*: privilegia crescita e Prosperità.
   - *Difensiva*: privilegia Stabilità e Militare.
   - *(sbloccabili)* altre dottrine.
5. **Crisi gravi o dilemmi marcati come "decisivi" interrompono il recupero** e aspettano il giocatore.
6. Si mostra la **Cronaca dell'assenza**: riassunto, grafici prima/dopo, eventi principali.

Il Worker controlla lo stato prima e dopo ogni tick offline. Se il tick produrrebbe un esito irreversibile, resta valido l'ultimo stato sicuro. Gli ordini in coda vengono consumati soltanto se il tick che li ha applicati resta valido.

## 11. Cronaca
Ogni evento rilevante produce una voce di cronaca. A fine era (o su richiesta) viene generato un
**capitolo** in stile libro di storia. Esportabile come immagine/testo da condividere.

## 12. Bilanciamento
- Tutti i numeri stanno in **file di dati**, mai nel codice.
- **Simulatore headless** (`npm run sim`): fa girare N partite con IA al posto del giocatore e produce report
  (quante civiltà collassano, in che era, per quale causa, distribuzione degli attributi).
- Obiettivi di bilanciamento iniziali:
  - Nessuna strategia "fissa" deve evitare tutte le crisi per più di ~2 ere.
  - Una civiltà lasciata senza interventi sopravvive ma ristagna.
  - Il collasso totale deve essere raro (< 10% delle civiltà guidate dall'IA "media" per era).
