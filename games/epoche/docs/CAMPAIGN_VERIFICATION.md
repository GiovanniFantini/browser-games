# Verifiche della campagna

## Simulazione

La campagna copre dieci ere e 65 dilemmi. Il passaggio d’era richiede tempo di maturazione, popolazione, Sapere e riforme già attuate. In Preistoria serve la stanzialità. Nelle altre ere il giocatore può seguire una di due combinazioni, con compromessi diversi. Alla Trascendenza serve anche Innovazione. Il tempo di maturazione è uguale per il giocatore e le civiltà vicine. Il ritmo Storico usa 20 volte i tick del Rapido a parità di anni simulati.

Durante l’assenza il motore si ferma di fronte a eventi decisivi, crisi gravi o guerra in svantaggio. Se un tick produrrebbe un nuovo esito strutturale, conserva lo stato precedente e gli ordini ancora in coda. I test verificano anche gli effetti del dissenso sull’Influenza, le differenze fra trattati e obiettivi di guerra e il recupero di vecchi salvataggi con aiuti diplomatici duplicati. La suite della candidata ha superato 54 test in 9 file. [Verifiche del motore](../../../artifacts/epoche/opus-review/engine/verification.md), [esito dei test](../../../artifacts/epoche/opus-review/candidate-tests-round-3.txt)

Il confronto di bilanciamento precedente alla revisione dei dilemmi conta 60 replay, con dieci semi per ritmo e tre profili. Il profilo reattivo sceglie le riforme in base ai bisogni correnti. Il profilo fisso porta al 78% le politiche del profilo d’era. Il passivo risponde ai dilemmi e lascia fermi i cursori.

- Il profilo reattivo raggiunge la Trascendenza in tutti i semi. Nel Rapido impiega da 5.849 a 6.961 tick, circa 10–12 minuti a 1×. Nello Storico impiega da 116.971 a 139.205 tick, circa 3 ore e 15 minuti–3 ore e 52 minuti a 1×. I dieci traguardi del percorso verificano 19 riforme effettive.
- Il profilo fisso si ferma entro il Neolitico. Il passivo si ferma in Preistoria. Entrambi i profili conservano la civiltà nei limiti temporali della prova.
- Quando il profilo reattivo entra nel Bronzo, la civiltà rivale più avanzata è tra la Preistoria e il Bronzo in tutti i semi e in entrambi i ritmi.

[Rapido, 30 simulazioni](../../../artifacts/epoche/opus-review/engine/final-rapid.txt), [Storico, 30 simulazioni](../../../artifacts/epoche/opus-review/engine/final-standard.txt)

## Prima risposta o risposta casuale

Il 24 novembre 2026 sono state simulate 100 campagne in ritmo Rapido con i semi da 1 a 25. Per ogni mondo e ciascuno dei due percorsi di riforma sono state confrontate due partite. Una sceglieva la prima risposta disponibile, l’altra sorteggiava uniformemente tra le risposte accessibili con un generatore separato da quello del mondo. Entrambe avanzavano appena possibile e seguivano la stessa regola per la pace.

| Risposte | Trascendenze | Tick medi fino alla vittoria | Popolazione finale media |
| --- | ---: | ---: | ---: |
| Prima disponibile | 50/50 | 6.099 | 200.303 |
| Casuali | 50/50 | 6.128 | 192.242 |

Nelle 50 coppie l’esito finale coincide. In 412 dei 1.884 dilemmi del primo gruppo mancava l’Influenza per la prima opzione. Il confronto riguarda due percorsi che soddisfano i requisiti di avanzamento. Si può ripetere con `npx tsx tools/sim/compareResponses.ts`.

## Confronto dopo il ribilanciamento dei dilemmi

Il 24 novembre 2026 lo stesso confronto in ritmo Rapido ha mantenuto semi, condizioni iniziali, percorsi di riforma, sorteggio delle risposte e limite di 25.000 tick. La dissoluzione è un esito definitivo. Tutte le partite hanno raggiunto un esito entro il limite.

| Risposte | Vittorie prima | Vittorie dopo | Dissoluzioni dopo |
| --- | ---: | ---: | ---: |
| Prima disponibile | 50/50 | 40/50 | 10 |
| Casuali | 50/50 | 46/50 | 4 |

In 36 coppie entrambe le partite hanno raggiunto la Trascendenza. In 10 ha vinto soltanto la strategia casuale, in 4 soltanto la prima risposta disponibile. Dieci dissoluzioni sono avvenute in Preistoria, due nel Neolitico e due nell’Età industriale. Come controllo aggiuntivo, le stesse 50 combinazioni con una strategia che limita il rischio, considera il sollievo alle crisi attive e a parità di impatto risparmia Influenza hanno ottenuto 50 vittorie. Si ripete con `npx tsx tools/sim/compareResponses.ts --cautious`. [Risultati per partita](../../../artifacts/epoche/dilemmi-nov24/)

## Dilemmi a due, tre e quattro risposte

La prova del 24 novembre usa ancora il ritmo Rapido, i semi da 1 a 25 e i due percorsi di riforma. Restano uguali le regole per avanzare, chiedere la pace e scegliere le risposte. Ogni scelta casuale ha la stessa probabilità tra quelle accessibili. Tutte le 150 partite si sono concluse entro 25.000 tick.

| Strategia | Vittorie al confronto precedente | Vittorie attuali |
| --- | ---: | ---: |
| Prima disponibile | 40/50 | 40/50 |
| Casuale | 46/50 | 20/50 |
| Prudente | 50/50 | 50/50 |

Nelle partite casuali le dissoluzioni si sono distribuite tra Neolitico (2), Bronzo (4), Medioevo (2), Età moderna (9), Industriale (6), Contemporanea (1), Informazione (5) e Futuro (1). Le dieci sconfitte della prima risposta disponibile sono avvenute in Preistoria. I 65 dilemmi comprendono nove decisioni a due risposte, 48 a tre e otto a quattro. In Chrome a 1366×768 sono state verificate una decisione a due risposte con la seconda gratuita e una a quattro con la quarta costosa e potenzialmente fatale. [100 partite a confronto](../../../artifacts/epoche/dilemmi-ere-successive/confronto.ndjson), [50 partite prudenti](../../../artifacts/epoche/dilemmi-ere-successive/prudente.ndjson)

## Retaggi del villaggio

A 1366×768 una campagna locale ha scelto di cercare le risorgive durante la siccità ed è passata al Neolitico. Le due immagini mostrano la stessa inquadratura, la stessa fonte e gli stessi lotti ai lati della piazza. Dopo esportazione e importazione, il dilemma dei pozzi ha permesso di riaprire il sentiero delle risorgive. Nello stesso scenario senza la fonte comparivano solo le tre risposte ordinarie. [Preistoria](../../../artifacts/epoche/retaggio/preistoria.png), [Neolitico](../../../artifacts/epoche/retaggio/neolitico.png), [dettaglio della fonte](../../../artifacts/epoche/retaggio/fonte.png)

I test verificano tutti e tre i retaggi, l’accesso condizionale alle risposte e la conservazione anche dopo che la decisione originaria esce dalla cronaca. Nei vecchi salvataggi si recuperano i retaggi documentati dalle risposte ancora presenti nella cronaca.

## Retaggi storici e tradizioni

In Chrome a 1366×768 un salvataggio di prova preparato con scelte medievali e industriali è passato dall’Età dell’informazione al Futuro. Il registro ha mostrato la scuola nell’ultima era prima del passaggio e la sua scomparsa dopo il passaggio. Le due decisioni future hanno accettato il patto del ponte per gli attracchi e la cassa di mutuo soccorso per le infermerie. [Il ponte nel Futuro](../../../artifacts/epoche/retaggio/ponte-futuro.png)

La verifica del motore copre anche acquisizione dei cinque retaggi storici permanenti, rifiuto delle risposte quando manca il luogo, riduzione del sollievo alle crisi, rinnovo della scuola, scadenza e ripresa dal salvataggio.

## Bilanciamento con i retaggi nel Futuro

Il 24 novembre 2026 sono state ripetute le 50 combinazioni di mondo e percorso per ciascuna strategia. Ritmo Rapido, semi 1–25, due percorsi di riforma e limite di 25.000 tick. Tutte le 150 campagne hanno raggiunto un esito definitivo.

| Strategia | Vittorie precedenti | Vittorie attuali | Arrivi nel Futuro | Partite con almeno un uso | Risposte ereditate scelte |
| --- | ---: | ---: | ---: | ---: | ---: |
| Prima disponibile | 40 | 40 | 40 | 0 | 0 |
| Casuale | 20 | 21 | 27 | 10 | 11 |
| Prudente | 50 | 50 | 50 | 0 | 0 |

In tutti i 117 finali era disponibile almeno una risposta ereditata pagabile. Nei 575 dilemmi del Futuro, 232 offrivano almeno una di queste risposte. Gli 11 utilizzi comprendono tre memoriali, tre ponti medievali, due casse di mutuo soccorso, due strade romane e una carta dei diritti. Le 50 prudenti possedevano tutte la casa del mutuo soccorso e hanno sempre preferito una risposta ordinaria. La strategia prudente valuta le crisi correnti, poi il costo, senza attribuire un premio al semplice uso di un retaggio.

Per ogni arrivo nel Futuro, un secondo replay ha verificato l’identità dello stato di ingresso e lasciato intatti gli inviti già programmati. Quando il criterio originale avrebbe scelto un’opzione ereditata, il controllo ha applicato il medesimo criterio alle opzioni ordinarie pagabili. Per la strategia casuale un generatore separato e ripetibile ha sorteggiato il ripiego, preservando il flusso principale dei sorteggi. Un solo esito è cambiato: nel mondo 20, secondo percorso, la rete civile del memoriale ha portato alla Trascendenza. Il controllo ha allestito gli ambulatori e in seguito ha perso per una crisi amministrativa. Il confronto misura l’effetto della disponibilità delle risposte nel Futuro con queste strategie e questi sorteggi. Nel confronto storico tra versioni, la strategia casuale ha guadagnato 14 vittorie su combinazioni prima perse e ha perso 13 combinazioni prima vinte.

Per replicare, eseguire `npx tsx tools/sim/compareResponses.ts --heritage` e poi lo stesso comando con `--cautious`. [100 partite](../../../artifacts/epoche/confronto-retaggi/confronto.ndjson), [50 prudenti](../../../artifacts/epoche/confronto-retaggi/prudente.ndjson)

## Ribilanciamento delle crisi del Futuro

Sui medesimi semi 1–25 e sui due percorsi di riforma, tutte le 150 campagne rapide hanno raggiunto un esito definitivo. I 117 arrivi nel Futuro coincidono con quelli della prova precedente. Per ciascun arrivo il replay ha verificato lo stesso stato di ingresso e gli stessi inviti iniziali, escludendo solo la possibilità di scegliere una risposta ereditata.

| Strategia (50 partite ciascuna) | Vittorie precedenti | Vittorie attuali | Arrivi nel Futuro | Finali con almeno un uso | Vittorie nel controllo | Esiti cambiati |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Prima disponibile | 40 | 8 | 40 | 0 | 8 | 0 |
| Casuale | 21 | 19 | 27 | 11 | 17 | 2 |
| Prudente | 50 | 50 | 50 | 40 | 42 | 8 |

I retaggi sono stati scelti 52 volte in 51 finali e hanno trasformato dieci dissoluzioni in Trascendenze (10/117). Gli otto finali prudenti corrispondono a quattro mondi (3, 5, 9 e 10), ciascuno sui due percorsi. I due casuali sono il secondo percorso dei mondi 20 e 23. Nelle crisi sanitarie, le prudenti hanno usato la cassa in 40 partite e la formazione gratuita nelle altre dieci. Tra le versioni le vittorie totali sono scese da 111 a 77, soprattutto per la strategia della prima risposta disponibile.

A 1366×768 Chrome ha verificato la scelta gratuita davanti a una crisi lieve, il mutuo soccorso quando i reparti sono saturi, la pausa automatica e le due alternative fatali quando anche l’amministrazione è sovraccarica. [100 partite e controlli](../../../artifacts/epoche/futuro-retaggi-verifica/confronto.ndjson), [50 prudenti e controlli](../../../artifacts/epoche/futuro-retaggi-verifica/prudente.ndjson)

## Decisioni con un sacrificio inevitabile

In Chrome a 1366×768 il lungo inverno ha fermato la simulazione a 10×. A Influenza zero si poteva scegliere tra le riserve e l’accoglienza. Con le risorse a gravità 90 aprire le riserve concludeva la partita, con i clan a 90 era l’accoglienza a provocare la dissoluzione. In entrambi i casi il giocatore ha potuto scegliere l’altro sacrificio. I test del motore verificano l’aumento effettivo di una crisi per tutte le risposte nei tre dilemmi, comprese quelle ereditate.

Sui medesimi 25 mondi, due percorsi e tre strategie, tutte le 150 partite hanno raggiunto un esito. La prima risposta disponibile ha vinto 7/50, la casuale 21/50 e la prudente 50/50. [100 partite a confronto](../../../artifacts/epoche/compromessi/confronto.ndjson), [50 prudenti](../../../artifacts/epoche/compromessi/prudente.ndjson)

## Costi che maturano al cambio di era

Stessi 25 mondi, due percorsi di riforma, ritmo Rapido e 25.000 tick di limite. Tutte le 150 campagne hanno raggiunto un finale. La prima risposta disponibile vince 1 volta su 50, il sorteggio 9 su 50 e la prudente 34 su 50. La prudente conserva il criterio precedente basato sulla crisi immediata. Ripetendo le sue 50 partite con le stesse nuove opzioni e disattivando solo i costi rinviati, vince tutte le volte.

In otto sconfitte prudenti le decisioni preistoriche rinviano 101 punti di crisi alimentare. In altre quattro, 69 punti si sommano a una crisi preesistente di circa 31 o 56. Tutte e dodici terminano entrando nel Neolitico. Altre quattro terminano durante il Futuro, quando le finestre di attracco gratuite aggravano una crisi dello Stato che porta ancora il peso degli impegni precedenti.

Su 4.869 dilemmi, 955 mostrano due risposte, 2.765 ne mostrano tre, 927 quattro e 222 cinque. Il caso a sei risposte è stato verificato in browser nell’officina degli habitat con scuola serale e ruota. [Prime risposte e sorteggi](../../../artifacts/epoche/costi-rinviati/confronto.ndjson), [prudenti](../../../artifacts/epoche/costi-rinviati/prudente.ndjson), [controllo senza costi rinviati](../../../artifacts/epoche/costi-rinviati/controllo.ndjson)

## Censimento dei dilemmi

Tutte le 40 partite del 23 novembre 2026 raggiungono la Trascendenza. Il campione incrocia dieci semi, due ritmi e due percorsi di riforma. La Preistoria ha un percorso comune. Il simulatore sceglie quando possibile una risposta che promette un seguito e attende che quel seguito si apra durante la simulazione. Ogni riga riporta il minimo di dilemmi distinti per partita e quante partite hanno incontrato almeno un seguito.

| Era | Minimo Rapido | Minimo Storico | Seguiti Rapido | Seguiti Storico |
| --- | ---: | ---: | ---: | ---: |
| Preistoria | 12 | 12 | 20/20 | 20/20 |
| Neolitico | 4 | 4 | 20/20 | 20/20 |
| Età del bronzo | 2 | 2 | 20/20 | 20/20 |
| Antichità classica | 3 | 3 | 20/20 | 20/20 |
| Medioevo | 2 | 2 | 20/20 | 20/20 |
| Età moderna | 3 | 3 | 20/20 | 20/20 |
| Età industriale | 4 | 4 | 20/20 | 20/20 |
| Età contemporanea | 2 | 2 | 20/20 | 20/20 |
| Età dell’informazione | 3 | 3 | 20/20 | 20/20 |
| Futuro | 3 | 3 | 20/20 | 20/20 |

Le partite ordinarie incontrano 62 dei 65 dilemmi del catalogo. Quattro tracce supplementari trascorrono più tempo in ciascuna era e nel complesso aprono tutti i 65 dilemmi, compresi «Pascoli consumati», «Gli alberi giovani» e «La stagione dentro casa». Due tracce estese arrivano alla Trascendenza e due raggiungono il limite della prova in Preistoria. [Censimento Rapido](../../../artifacts/epoche/opus-review/engine/narrative-rapid.ndjson), [censimento Storico](../../../artifacts/epoche/opus-review/engine/narrative-standard.ndjson), [copertura estesa](../../../artifacts/epoche/opus-review/engine/narrative-coverage-rapid.ndjson)

## Browser e diorama

La candidata locale è stata provata a 1366×768. I riscontri includono conflitto reale tra due schede, quota IndexedDB esaurita e risposta del Worker non ricevuta. Durante questi errori il giocatore conserva la sessione e può esportarla. Il doppio Esc lascia l’esito consultabile. [Resoconto di interfaccia e audio](../../../artifacts/epoche/opus-review/check-ui.json)

A 1366×768 la tregua è stata accettata con relazione −45. Gli Scambi sono disattivati per una civiltà tributaria mentre gli Aiuti restano disponibili. In esilio Storico il pannello mostra 12:00 a 1×. Avanzamento, patti e guerra sono disattivati e associati alla spiegazione visibile. [Prova di diplomazia ed esilio](../../../artifacts/epoche/opus-review/engine/world-ui.txt), [cattura del tempo residuo](../../../artifacts/epoche/opus-review/engine/exile-progress.png)

Le anteprime e i tooltip delle cause hanno superato le verifiche a 1366×768 e 1920×1080. La sonda audio registra segnali distinti per cambio d’era e crisi. [Verifiche dei tooltip](../../../artifacts/epoche/opus-review/play/round-3/tooltips.json), [sonda audio](../../../artifacts/epoche/opus-review/check-audio-transitions.json)

Le evidenze del diorama includono una cattura per ciascuna era e sette stati visuali, tra cui siccità, epidemia, rivolta e guerra. La prova a 1366×768 controlla anche la pausa pixel per pixel e i quattro accessi alla scena. [Catture e verifiche del diorama](../../../artifacts/epoche/opus-review/play/round-2/README.md)

Le precedenti prove a 1366×768 e 1920×1080 coprivano Genesi, cambio d’era, mondo, salvataggi, ripresa dopo assenza, importazione, cronaca, dizionari e Trascendenza. Si trovano in `artifacts/epoche/campagna/`. Il playtest con persone previsto dalla roadmap resta da svolgere.

## Dati e asset

Politiche, ere, eventi e risposte appartengono al contenuto di Epoche. La simulazione è nel Worker e i salvataggi in IndexedDB. Un token di scrittura per slot impedisce a una scheda precedente di sovrascrivere la partita riaperta in un’altra scheda. [Riferimenti visivi](VISUAL_REFERENCE.md)

## Pacchetti

Opus 5.5 ha approvato la campagna locale al terzo giro. La prova finale della campagna compilata ha ripetuto i controlli di salvataggio, scorciatoie, finestre di dialogo, Mondo e audio. [Verdetto di Opus](../../../artifacts/epoche/opus-review/round-3.md), [prova della campagna compilata](../../../artifacts/epoche/opus-review/check-ui-round-3.json)
