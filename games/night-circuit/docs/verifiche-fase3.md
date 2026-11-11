# Verifica della fase 3

Data: 10 novembre 2026. Versione locale 0.3.0. Ambiente Windows, Node.js 24.20.0, npm 11.19.0.

## Perimetro

Circuito Anello dei Fonditori a due giri e sprint Rotta del Levante, quattro avversari, checkpoint, classifica, risultati e gara veloce. Le gare si svolgono nel quartiere esistente; non vengono ricreati città o motore fisico. Non sono inclusi tuning, carriera, premi, salvataggi o modalità delle fasi successive.

## Implementazione

- Catalogo, percorsi, giri, piloti, difficoltà, recupero IA, penalità, larghezza dei checkpoint e zona dopo l'arrivo in JSON.
- Racing line arrotondata dentro la rete stradale. Quattro veicoli Rapier raycast, modello visivo semplificato e colori originali. Pool riutilizzato a ogni gara.
- Guida IA con inseguimento del percorso, anticipo delle curve, livelli, piccoli errori, scia, valutazione dello spazio laterale per sorpassare e recupero di velocità moderato/regolabile.
- Checkpoint ordinati e direzionali, attraversamento continuo del piano del cancello, controllo di larghezza e rifiuto di spostamenti istantanei oltre 30 metri. R e recovery IA tornano al checkpoint già validato senza assegnare progressi.
- Conto alla rovescia con griglia ferma, giri, posizione, tempo, miglior giro, penalità, contromano/fuori percorso, percorso azzurro e avversari sulla mappa.
- Risultati provvisori e finali, riprova, abbandono e uscita. I veicoli arrivati liberano la linea attraverso una manovra fisica verso la sosta laterale.
- Sospensione dei civili durante la gara e ripristino della densità all'uscita; gli avversari vengono disattivati e nascosti nella guida libera.

## Review indipendente

Riesame di conformità e buone pratiche svolto dal secondo agente già coinvolto nelle fasi precedenti. Opus non è disponibile nella sessione. La review non ha modificato file.

Rilievi corretti:

1. Ripresa delle IA ancora in corsa dopo cambio di scheda/finestra nei risultati provvisori. Si riprende soltanto il completamento della gara: i controlli del giocatore restano disattivati e l'audio sospeso.
2. Il termine di completamento considera la penalità del giocatore, per non ritirare un avversario che potrebbe ancora battere il tempo corretto.
3. Interfaccia e geometria dei cancelli leggono giri, penalità, opzioni e larghezza dal catalogo JSON.
4. Il controllo visivo della prima esecuzione ha mostrato un blocco del traguardo da parte dei primi arrivati. Aggiunta la zona di uscita laterale e rafforzato il test affinché tutti e cinque terminino.
5. Il controllo dello screenshot della griglia ha individuato un falso avviso fuori percorso prima della partenza. Il conteggio iniziale mostra ora Attendi il via; durante la guida il controllo distingue la distanza laterale dalla posizione lungo il tracciato.

## Metodo e controlli

I test di logica coprono verso/larghezza dei cancelli, rifiuto di teletrasporti, checkpoint saltati, numero di giri, tempi e penalità, classifica e ritiri. Una regressione verifica una penalità maggiore della finestra standard di completamento.

Le prove fisiche fanno percorrere le gare a RaceDriver con il vero veicolo Rapier e ostacoli che delimitano gli isolati. Le varianti di difficoltà vengono verificate sullo stesso modello fisico.

Il controllo QA esiste soltanto nel server Vite di sviluppo e con `?qa=race`. Il test avanza il vero passo fisso a 60 Hz, usa lo stesso RaceDriver sul veicolo del giocatore e mantiene attivi sospensioni, collisioni, checkpoint e cronometro. Non assegna arrivi, non modifica i giri e non teletrasporta sui checkpoint. Il percorso di ingresso dal menu e i comandi dell'interfaccia sono eseguiti tramite il browser.

Esiti finali:

- `npm run build`: superato, TypeScript strict e Vite. Build statica di 12 file, circa 5,07 MB, incluse le licenze. Sotto il limite di 15 MB. Rimane l'avviso Vite sul singolo bundle grande, contenente anche il motore fisico WebAssembly compatibile.
- `npm test`: 24 test superati in 9 file. Le prove fisiche completano entrambe le gare in tutte e tre le difficoltà.
- `npm run lint`: superato.
- `npm run format:check`: superato. Controllo mirato di nomi reali di automobili, giochi e città, segnaposto incompleti e trattino lungo: nessuna occorrenza nei sorgenti, testi e metadati controllati del nuovo gioco.
- Suite browser complessiva: 6 scenari superati, con regressioni di guida libera/GPS e tutte le gare della fase 3. Circa 11,9 minuti sul backend locale di test.
- Verifica mirata successiva sulla versione finale: superati avvio dal ritrovo, messaggio corretto durante il conto alla rovescia, stato dei pulsanti durante/dopo la gara, spiegazione della mappa di gara e gestione del menu dopo un evento sintetico di perdita del contesto grafico. Quest'ultimo verifica l'interfaccia di recupero, non un guasto reale della GPU.
- Circuito e sprint completati realmente da tutti e cinque i partecipanti, senza ritiri nei due scenari finali. Verificati anche pausa/ripresa dei risultati provvisori, penalità e ritorno del traffico civile.
- Verificata l'assenza dell'oggetto `__nightCircuitQA` e del relativo controllo dalla build distribuibile.

Screenshot disponibili in `artifacts/phase3-grid.png`, `artifacts/phase3-circuit-results.png` e `artifacts/phase3-sprint-results.png`. Layout e leggibilità sono controllati sulle immagini. Gli artefatti locali sono esclusi da Git.

Il conteggio di 6 scenari riguarda i casi distinti della suite complessiva; il controllo mirato successivo ripete ed estende il caso del ritrovo sulla versione finale. Non è un settimo scenario diverso.

## Limiti effettivi

L'IA è arcade e usa recovery all'ultimo checkpoint se non progredisce. Non rappresenta ancora una simulazione avanzata di piloti o traffico agonistico. Il traffico civile è intenzionalmente sospeso durante questi due eventi. Tutte le auto da gara condividono la base Orvane Silex C1.

I tempi e i risultati appartengono alla sessione: nessun premio e nessuna progressione persistente. L'obiettivo dei 60 fps su GPU integrata non è certificato su tale hardware. Anche il gamepad fisico resta da provare; tastiera e mappatura standard sono implementate, con regressione automatica sulla gestione dei pulsanti.

Le limitazioni già registrate per grafica, quartieri e settori residenti delle fasi precedenti restano valide. Non è stata configurata alcuna pubblicazione.
