# EPOCHE *(titolo provvisorio)*

> Non guidi le unità. Guidi una civiltà.
> Dal Big Bang al futuro, una decisione alla volta: e ogni successo porta con sé il suo problema.

**Epoche** è un gioco gestionale di civiltà per browser, persistente e in tempo reale (con pausa).
Il giocatore è **lo Spirito** immortale di un popolo: non muove eserciti né costruisce edifici uno per uno,
ma decide le politiche del periodo e osserva come vive la comunità. La vista Civiltà mostra gli attributi attivi e segnala quelli fuori dalla zona sana. «Mostra le statistiche» apre i valori e le cause. In Mondo, selezionare un territorio o il nome di un vicino apre la sua scheda diplomatica.

Il cuore del gioco è il proverbio **"bambini grandi, problemi grandi"**: crescere sblocca nuove possibilità,
ma anche crisi nuove, più grandi e più intrecciate. Nessuna civiltà va dritta verso la prosperità.

---

Epoche fa parte di [BrowserGames](../../README.md). La campagna è giocabile in locale dalla Genesi al Futuro. La [campagna browser](https://giovannifantini.github.io/browser-games/epoche-campagna/) è disponibile su BrowserGames.

## In una riga per ogni pilastro

| Pilastro | Cosa significa |
|---|---|
| **Gestire, non micro-gestire** | Niente unità, niente click sugli edifici. Solo politiche, priorità e reazioni agli eventi. |
| **Statistiche come carattere** | 14 attributi visibili (scala 1–20, stile FM) + attributi nascosti da scoprire. |
| **Crescere costa** | La *Complessità* aumenta con la dimensione e porta problemi nuovi; ogni attributo ha una "zona sana" e gli eccessi fanno male. |
| **Il mondo va avanti** | Tempo reale persistente: la civiltà vive anche quando chiudi il browser, governata dalla dottrina che hai lasciato. |
| **Vedere cosa succede** | Diorama di profilo disegnato a mano, in stile Silksong: il villaggio cresce e soffre in modo visibile. |
| **Può succedere di tutto** | Collassi, frammentazioni, età buie, rinascite. Lo Spirito non muore: trasmigra. |

## Struttura della documentazione

| File | Contenuto |
|---|---|
| [`docs/GAME_DESIGN.md`](docs/GAME_DESIGN.md) | **Spec principale**: visione, loop di gioco, ruolo del giocatore, condizioni di fine. |
| [`docs/STATS.md`](docs/STATS.md) | Gli attributi della civiltà: visibili, nascosti, derivati, zone sane ed eccessi. |
| [`docs/SYSTEMS.md`](docs/SYSTEMS.md) | Simulazione: tempo, politiche, eventi, crisi, guerra, IA, gioco offline. |
| [`docs/ERAS.md`](docs/ERAS.md) | Le ere, dal prologo *Genesi* (Big Bang → specie) al futuro. |
| [`docs/ART_DIRECTION.md`](docs/ART_DIRECTION.md) | Direzione artistica, interfaccia, leggibilità. |
| [`docs/TECH.md`](docs/TECH.md) | Stack tecnico, architettura, salvataggi, struttura cartelle. |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | Fasi di sviluppo, dal prototipo alla pubblicazione. |
| [`docs/INSPIRATIONS.md`](docs/INSPIRATIONS.md) | Giochi di riferimento e cosa prendiamo (o evitiamo) da ciascuno. |
| [`docs/OPEN_QUESTIONS.md`](docs/OPEN_QUESTIONS.md) | Decisioni ancora aperte. |
| [`AGENTS.md`](AGENTS.md) | Istruzioni per gli agenti di programmazione (Codex, Claude Code…). |
| [`PLANS.md`](PLANS.md) | Piano di esecuzione: stato dei compiti, contratti tecnici, decisioni. |
| [`docs/tasks/`](docs/tasks/) | Schede dei compiti (Fase 1: T01–T10). |
| [`mockup-neolitico-v3.png`](docs/reference/mockup-neolitico-v3.png) | Riferimento ufficiale per la vista di partenza. |
| [Riferimenti visivi](docs/VISUAL_REFERENCE.md) | Inquadratura, livelli del paesaggio e stile. |
| [Verifiche della campagna](docs/CAMPAIGN_VERIFICATION.md) | Simulazione, browser e salvataggi. |
| [Distribuzione](docs/DISTRIBUTION.md) | Campagna browser, progetto Tauri e testo per la pagina Steam. |

## Stack (sintesi)

TypeScript, React, Zustand e Vite per l’interfaccia. Simulazione deterministica nel Web Worker, contenuto validato con Zod, diorama PixiJS, salvataggi IndexedDB tramite Dexie e test con Vitest. Vedi [l’architettura tecnica](docs/TECH.md).

## Stato

La campagna locale comprende dieci ere, civiltà vicine, 71 dilemmi, cronaca a capitoli e tre slot salvati nel browser. Genesi consente di scegliere seme, caratteristiche del mondo e ritmo. Il ritmo Rapido condensa le ere in una sessione, quello Storico è pensato per tornare alla propria civiltà nel corso di più sessioni. Per avanzare, consulta le soglie e i percorsi di riforma nella scheda Regione. Le riforme contano quando il valore effettivo dei cursori raggiunge la soglia.

Il villaggio cresce attorno alla piazza del primo focolare. Il guado, i campi e il sentiero restano nello stesso luogo e le case si rinnovano in epoche diverse. Le decisioni possono lasciare luoghi permanenti, dalla Fonte delle pietre al Ponte dei comuni e alla Casa del mutuo soccorso. Anche il fuoco, la ruota, le strade romane, la carta dei diritti della Rivoluzione francese e il memoriale delle guerre mondiali lasciano tracce attraverso le ere. Apri «Retaggi del villaggio» e seleziona un luogo per vederlo da vicino. La Fiera dei battellieri e la Scuola serale di officina durano tre ere contando quella di fondazione. Il loro aiuto contro le crisi diminuisce prima che scompaiano. Usarle in un dilemma rinnova la tradizione. Quando un dilemma offre una risposta legata al passato, indica quale luogo l’ha resa possibile.

Durante il lungo inverno, la penuria di pane e il guasto alle officine degli habitat, ogni risposta aggrava una crisi. Il tempo si ferma e restano almeno due alternative gratuite, con conseguenze diverse. Anche i retaggi cambiano il sacrificio richiesto: i maestri della scuola possono riparare i pezzi sul posto, ma i meccanici devono lasciare le serre durante il raccolto.

Nel Futuro un nuovo incidente può colpire anche un settore fino a quel momento stabile. Prima di rispondere puoi leggere quanto ogni scelta ridurrà o aggraverà la crisi. Un reparto con pochi pazienti può formare gratuitamente gli equipaggi locali. Se è già saturo, distogliere personale dalle cure fa crescere le attese. La cassa di mutuo soccorso può finanziare un intervento immediato. Quando le richieste superano la capacità delle infrastrutture, anche l’organizzazione dei convogli entra in crisi.

I dilemmi hanno da due a sei risposte. Alcune opzioni si aprono grazie ai retaggi del villaggio. Prima di decidere puoi vedere anche i costi che ricadranno sulla prossima era. Si sommano per crisi e alcune risposte successive permettono di ridurli prima del passaggio. Il costo in Influenza indica quante risorse politiche servono. Anche una risposta costosa può aggravare una crisi. Ogni opzione a rischio mostra la gravità prima e dopo la scelta. Se la porta a 100, le comunità si separano e la campagna termina per dissoluzione. Quando una risposta disponibile avrebbe questo esito, il tempo si ferma per lasciarti decidere.

Scegli una delle tre posizioni illustrate o regola il cursore fino al valore desiderato. Prima di confermare puoi leggere gli effetti previsti, il costo e i tempi. In partita i dilemmi urgenti fermano il tempo. Gli altri si aprono da un avviso e, dopo un minuto di simulazione a velocità normale, il consiglio applica la risposta gratuita. Puoi mettere in pausa mentre decidi. In pausa i cambi restano in coda anche dopo aver chiuso il gioco. Durante l’assenza, la dottrina risolve i dilemmi minori e il tempo si ferma davanti alle decisioni importanti, a una crisi grave o a un esito irreversibile imminente. Se il salvataggio finale fallisce, puoi restare in partita, esportare i progressi disponibili o uscire esplicitamente.

La scheda Insediamento mostra i percorsi di riforma con valori impostati ed effettivi. Al rientro la cronaca indica il tempo recuperato, l’Influenza spesa dalla dottrina e l’eventuale dilemma in attesa. [Esiti dei due playtest simulati](docs/tasks/playtest-agenti.md).

## Avvio locale

Dalla radice di BrowserGames:

```powershell
Set-Location games/epoche
npm install
npm run dev
```

Apri l'indirizzo stampato da Vite. Spazio mette in pausa e riprende il tempo. I tasti da 1 a 5 impostano rispettivamente 1×, 2×, 4×, 10× e 25×. A e D scorrono il diorama, M apre o chiude Mondo. Esc permette di consultare i pannelli durante un dilemma. Il selettore in alto cambia la lingua. Il controllo audio ricorda l'attivazione e il volume.

## Verifiche locali

Da `games/epoche`:

```powershell
npm run lint
npm test
npm run build
npm run sim:check
npm run sim -- --years 2000 --seeds 20 --strategy growth
npm run sim:campaign -- 3
npm run sim:campaign -- 1 --standard
```

## Licenza

Da definire. Il progetto è pensato per essere monetizzato in futuro: **non pubblicare il codice con licenza open source** finché la decisione non è presa.

La [modalità di studio](artifacts/revisione-gameplay/Stato.md) si apre aggiungendo `?studio` all’indirizzo della campagna. Usa slot separati e termina al registro del Bronzo oppure alla dissoluzione. Dal finale puoi esportare il diario locale della prova.

Dal menu iniziale puoi avviare la campagna con i rimedi dell’inverno (`?rimedi`) oppure la prova guidata fino al Bronzo (`?studio=inverno`). Ognuna usa slot propri. Prima di entrare nell’era successiva il consiglio mostra il prezzo di ogni rimedio. Il registro del Bronzo permette di condonare la quota, riaccogliere un clan o sostenere le famiglie dei malati secondo la storia del villaggio.
