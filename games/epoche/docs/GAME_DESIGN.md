# Game Design Document: Epoche

> Versione 0.1 · Stato: bozza · Ultimo aggiornamento: novembre 2026

## 1. Visione

Un gestionale di civiltà che sta a Empire Earth come Football Manager sta a FIFA:
**stessa materia (la storia di un popolo), ma niente controllo diretto.** Il giocatore prende decisioni
di alto livello, legge dati che descrivono il *carattere* della civiltà e ne vive le conseguenze nel tempo.

Il tono è **serio e storico, con un pizzico di ironia** negli eventi e nella cronaca, come la stampa
in FM che commenta i risultati.

### Frase guida
**"Bambini grandi, problemi grandi."** Ogni traguardo raggiunto apre una nuova categoria di problemi.
Una tribù di 200 persone non conosce la burocrazia; un impero di 20 milioni sì.

### Cosa NON è
- Non è un RTS: niente unità, niente costruzione manuale, niente battaglie da controllare.
- Non è un foglio di calcolo: i dati sono sempre accompagnati da una rappresentazione visiva chiara.
- Non è un "idle game" puro: il tempo scorre da solo, ma le decisioni contano più dell'attesa.

## 2. Il giocatore: lo Spirito

Il giocatore è **lo Spirito della civiltà**: un'entità immortale che attraversa tutte le ere.
- Non invecchia e non muore: **la civiltà può crollare, lo Spirito no** (vedi §7, Trasmigrazione).
- Agisce spendendo **Influenza**, la risorsa del giocatore (§4.2).
- Ha una **Legittimità**: quanto il popolo "ascolta" la sua guida. Le politiche impopolari la erodono;
  con Legittimità bassa le politiche hanno effetto ridotto e possono comparire contro-movimenti.
- Accumula **Eredità** (meta-progressione) attraverso le ere e le civiltà guidate.

> Perché lo Spirito e non un leader? Permette una partita persistente di settimane senza il problema
> della successione, e rende sensato un gioco "dal Big Bang al futuro".

## 3. Loop di gioco

### Loop breve (secondi → minuti)
1. Il tempo scorre (velocità 1×/2×/4×/10×/25×, pausa sempre disponibile).
2. Gli attributi cambiano gradualmente in base a politiche, ambiente ed eventi.
3. Arriva una **notifica** (evento, soglia superata, rapporto dei consiglieri).
4. Il giocatore **legge** (schede, grafici, mappa), **decide** (sposta cursori, risponde a un dilemma) o **lascia correre**.

### Loop medio (minuti → ore)
- Imposti una direzione con un **pacchetto di politiche** coerente (es. "espansione agricola").
- La civiltà cresce → aumenta la **Complessità** → si aprono nuove famiglie di problemi.
- Gestisci la **crisi** di turno, che spesso è figlia del successo precedente.

### Loop lungo (giorni → settimane)
- Attraversi le **ere**: ogni passaggio cambia regole, politiche disponibili, interfaccia e aspetto della mappa.
- Ti confronti con le **civiltà IA** (commercio, diplomazia, guerra astratta).
- Cicli di ascesa, apogeo, crisi, declino o rinascita.

### Loop meta (tra partite)
- Ogni civiltà conclusa lascia **Eredità**: tratti iniziali, varianti della *Genesi*, cronache sbloccate.

## 4. Come si decide

### 4.1 Politiche a cursori (meccanica principale)

Ogni politica ha una domanda, due estremi illustrati e una posizione di equilibrio. Il cursore mostra la scelta su 100. Il costo viene addebitato quando il motore accetta la conferma; in pausa l’ordine resta in attesa. Il diorama segnala il cambiamento e la cronaca ne conserva l’esito.

Il pannello delle politiche collega le decisioni al contesto dell’era e permette di vedere quali cursori subentreranno nella successiva. Durante la partita gli attributi si leggono prima per condizione e andamento. I valori esatti sono consultabili su richiesta. La carta del mondo associa territori e popoli con colori, simboli e nomi selezionabili.

Ispirate a Democracy 4. Ogni politica è un **cursore** (es. da 0 a 100, o da un estremo all'altro:
*Isolamento ↔ Apertura*). Esempi per era:

| Era | Politiche di esempio |
|---|---|
| Preistoria | Nomadismo ↔ Stanzialità · Caccia ↔ Raccolta · Ruolo degli anziani · Tabù alimentari |
| Neolitico | Divisione del raccolto · Culto degli antenati · Espansione dei campi · Allevamento |
| Antichità | Tassazione · Leva militare · Schiavitù · Codice di leggi · Culto di stato · Opere pubbliche |
| Medioevo | Feudalesimo ↔ Centralismo · Potere del clero · Gilde · Crociate/guerre di fede |
| Moderna | Libero scambio ↔ Protezionismo · Istruzione pubblica · Diritti civili · Colonialismo |
| Industriale+ | Lavoro minorile · Sindacati · Inquinamento · Welfare · Ricerca di base |

Regole chiave:
- **Inerzia**: gli effetti arrivano gradualmente (settimane/anni di gioco), non subito. Scelte brusche costano di più.
- **Costo**: spostare un cursore costa *Influenza*; mantenerlo lontano dal "naturale" della cultura ha un costo continuo.
- **Effetti visibili e logici**: ogni politica mostra in anteprima gli attributi che tocca, con la direzione
  (▲▼) e il tempo previsto. *Mai effetti illogici* (critica ricorrente a Reigns).
- **Effetti collaterali**: ogni politica aiuta qualcosa e ne danneggia qualcos'altro, spesso con ritardo.
- **Sblocco**: le politiche si sbloccano con era, scoperte e soglie di Complessità.

### 4.2 Influenza
Risorsa del giocatore. Si rigenera nel tempo in base a **Legittimità** e **Coesione**.
Serve per: spostare cursori, rispondere ai dilemmi con opzioni "forti", sostenere politiche impopolari.

### 4.3 Eventi e dilemmi
Gli eventi **nascono dallo stato della simulazione** (soglie, combinazioni di attributi) più una piccola
componente casuale. Esempio: *Popolazione alta + Salute bassa + città dense → rischio epidemia*.
Il primo focolare resta al centro della piazza e la strada segue il vecchio sentiero fino al guado. Ogni casa conserva il proprio lotto durante le ristrutturazioni. I luoghi guadagnati rispondendo ai dilemmi attraversano le ere. La fonte apre un’altra via davanti ai pozzi torbidi o a un’estate torrida, la riserva di semi aiuta dopo l’interramento dei canali o l’impoverimento del suolo, il cerchio dell’assemblea offre una sede comune alle piazze e alle comunità con calendari diversi.

Quando una civiltà entra per la prima volta nel Futuro, il consiglio programma i dilemmi che possono richiamare i suoi retaggi. Il patto del ponte medievale permette la manutenzione condivisa degli attracchi, la cassa operaia industriale permette alle infermerie di mettere in comune i contributi. La fiera medievale e la scuola industriale passano invece da attive a in declino e poi all’ultima era. A ogni passaggio perdono un terzo del sollievo che possono portare a una crisi. La terza nuova era le cancella, salvo rinnovo mediante una scelta. Ripercorrere un’era già raggiunta non le invecchia.

Tre decisioni richiedono un sacrificio immediato: il lungo inverno, la penuria di pane e il guasto alle officine degli habitat. Ogni opzione aumenta la gravità di una crisi, comprese le risposte legate al passato. Per questi eventi la simulazione si ferma anche in assenza del giocatore. Due scelte ordinarie a costo zero espongono a danni di natura diversa.

Nel Futuro ogni incidente porta un carico locale deterministico che si aggiunge alla crisi già presente in proporzione alla capacità residua. Negli habitat, oltre la capacità delle infrastrutture sanitarie, i convogli impegnano anche l’amministrazione. Due soluzioni ordinarie cambiano effetto quando il servizio è congestionato: formare gli equipaggi a partire da gravità sanitaria 58 e attendere gli attracchi gratuiti a partire da gravità amministrativa 65. Il testo e l’anteprima mostrano la conseguenza effettiva prima della scelta. Nelle crisi minori l’intervento gratuito può risolvere il problema per intero.

Il numero di risposte varia da due a sei. Un intervento costoso può risolvere un problema immediato e aggravare una crisi altrove. Le conseguenze si accumulano per tipo di crisi. Per esempio, quando la caccia si interrompe per assistere i feriti, le scorte di cibo ne risentono. Una decisione che porta una crisi a 100 dissolve la civiltà anche con le riforme necessarie per avanzare. Il giocatore vede la gravità prevista e può conservare Influenza per finanziare una risposta diversa più avanti.

I dilemmi offrono 2–6 risposte con costi e conseguenze chiari (o volutamente incerti, se l'attributo
*Sapere* è basso: una civiltà ignorante prevede male).

### 4.4 Consiglio
Un piccolo consiglio di **figure simboliche** (sacerdote, generale, mercante, saggio…, che cambiano per era)
dà rapporti e pareri, come lo staff in FM. Non hanno statistiche da gestire (per ora): servono a
**rendere leggibile la situazione** e a dare voce ironica alla cronaca.

## 5. Le statistiche
Dettaglio completo in [`STATS.md`](STATS.md). In sintesi:
- **14 attributi visibili**, scala 1–20, raggruppati in 3 famiglie (Materiale, Sociale, Potenza).
- **6 attributi nascosti** (il "carattere" della civiltà), scoperti gradualmente.
- **Valori derivati**: Popolazione (numero assoluto), Complessità, Legittimità, Influenza.
- Ogni attributo ha una **zona sana**: troppo poco è un problema, ma anche **troppo** lo è.

## 6. Crescita e problemi: "bambini grandi, problemi grandi"
Due meccaniche combinate (dettagli in [`SYSTEMS.md`](SYSTEMS.md)):

1. **Complessità**: cresce con popolazione, territorio, tecnologia e numero di istituzioni.
   Ogni soglia sblocca **famiglie di problemi** nuove (burocrazia, corruzione, epidemie urbane, lotte di classe,
   crisi finanziarie, crisi ecologiche…) e aumenta i costi di mantenimento.
2. **Eccessi**: oltre la zona sana un attributo genera effetti negativi.
   Troppa Fede → fanatismo. Troppo Militare → colpo di stato. Troppa Prosperità → disuguaglianza e lassismo.
   Troppa Stabilità → stagnazione, l'innovazione si ferma.

## 7. Fine partita (o no): può succedere di tutto
Una partita è persistente e non ha una vittoria obbligata. Possibili esiti di una civiltà:

| Esito | Cosa succede allo Spirito |
|---|---|
| **Età buia** | La civiltà sopravvive ma regredisce; alcuni attributi crollano, si riparte da più in basso. |
| **Frammentazione** | La civiltà si divide in 2–4 stati; lo Spirito ne sceglie uno da seguire. Gli altri diventano IA. |
| **Conquista** | Lo Spirito **trasmigra** nella civiltà conquistatrice, oppure resta "dormiente" nella cultura conquistata in attesa di una rinascita. |
| **Estinzione** | Raro. Vero game over: la partita si chiude e si converte in Eredità. |
| **Trascendenza** | Finale possibile nell'era futura (da definire: colonizzazione stellare, singolarità…). |

Ogni partita produce una **Cronaca**: la storia della civiltà scritta come un libro di storia,
condivisibile (ottimo anche per il marketing).

## 8. Il mondo
- **Singolo giocatore**, con **civiltà IA** che usano la stessa simulazione (con personalità diverse).
- **Mappa del mondo** generata proceduralmente dal seme della *Genesi*.
- **Guerra astratta**: decidi postura, obiettivi e risorse; l'esito si sviluppa nel tempo su una "barra del fronte".
- **Ambientazione**: la civiltà del giocatore è **generata e unica**, costruita a partire da **archetipi
  culturali ispirati alla storia reale** (vedi [`OPEN_QUESTIONS.md`](OPEN_QUESTIONS.md) e [`INSPIRATIONS.md`](INSPIRATIONS.md)).

## 9. Tempo e persistenza
- **Tempo reale con pausa**, velocità regolabile.
- **Persistente**: quando chiudi il browser la civiltà continua, guidata dalla **Dottrina** (le istruzioni che lasci:
  "prudente", "espansiva", "difensiva"…), come quando in FM deleghi al vice.
- Al ritorno, la **Cronaca dell'assenza** riassume cosa è successo, come la casella di posta di FM.
- Il tempo offline ha un **tetto** (es. max 8 ore reali simulate) e le crisi gravi **mettono in pausa**
  la simulazione offline in attesa del giocatore. *Mai perdere una civiltà mentre dormi.*

## 10. Pubblico e piattaforma
- **Desktop browser** (Chrome, Firefox, Edge, Safari). Mobile non prioritario.
- Pubblico: chi ama FM, Democracy, Civilization, Crusader Kings, Frostpunk; giocatori "da sessione lunga".
- Sessioni tipiche: 20–60 minuti, più controlli brevi.

## 11. Monetizzazione (futura)
Non influenza le scelte di design attuali, ma le teniamo compatibili:
- Ipotesi principale: **premium** (Steam via wrapper desktop + versione browser della campagna).
- Espansioni (nuove ere, scenari, archetipi).
- **No pay-to-win, no timer pagati.** Il tempo persistente non deve diventare una leva per vendere accelerazioni.

## 12. Glossario
| Termine | Significato |
|---|---|
| Spirito | Il giocatore. |
| Influenza | Risorsa per agire. |
| Legittimità | Quanto la civiltà accetta la guida dello Spirito. |
| Complessità | Misura della "grandezza" della civiltà, fonte dei problemi. |
| Zona sana | Intervallo ideale di un attributo. |
| Dottrina | Istruzioni per la gestione automatica offline. |
| Cronaca | Il racconto generato della storia della civiltà. |
| Eredità | Meta-progressione tra partite. |
| Genesi | Prologo dal Big Bang alla nascita della specie. |
