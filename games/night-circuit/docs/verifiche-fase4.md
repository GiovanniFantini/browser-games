# Verifica della fase 4

Data: 10 novembre 2026. Versione locale 0.4.0. Windows, Node.js 24.20.0, npm 11.19.0.

## Perimetro

Tuning prestazioni e garage: catalogo JSON di undici categorie con tre livelli ciascuna, confronto delle statistiche, negozio, auto indipendenti e profili persistenti. Sono inclusi i crediti necessari a sostenere gli acquisti, assegnati dalle due gare esistenti alla classifica definitiva. Reputazione, sponsor, estetica, foto, ulteriori modalità e modelli restano nelle fasi successive.

## Implementazione

- Acquisti in ordine, controllo saldo, nessun secondo addebito per componenti posseduti; installazione e ritorno alla serie gratuiti. Le transazioni si applicano a una copia validata del profilo.
- Forza motrice, rapporti, massa del collider e inerzia Rapier, molle/smorzatori, aderenza laterale, freni e nitro leggono la configurazione equipaggiata. Le IA restano di serie.
- Scarico e motore modificano il filtro del suono procedurale; la sovralimentazione modifica armoniche e apertura del filtro. Non sono stati aggiunti campioni audio esterni.
- Anteprima 3D riutilizzata tra le modifiche, rotazione e zoom; rendering dell’anteprima limitato a 20 Hz e fermato alla chiusura del garage. La guida è sospesa nel garage.
- Banco prova con curve teoriche di forza motrice e potenza alle ruote, calcolate con la stessa funzione della trasmissione. Limiti teorici e indici vengono distinti dalle prestazioni realmente raggiunte.
- Tre posti per esemplari del modello iniziale. Parti possedute ed equipaggiate appartengono a ciascun esemplare.
- Premi soltanto finali, identificativo univoco di gara e registro delle liquidazioni per evitare duplicati. Uscire dalla classifica provvisoria rinuncia al premio; un ritiro vale zero.
- Autosave, tre slot manuali, import/export JSON, whitelist e controllo delle relazioni interne, migrazione v1 di interscambio, copia precedente e gestione di dati corrotti o scritture fallite.

## Review e controlli

Review indipendente in sola lettura dal secondo agente già coinvolto. Opus non è disponibile nella sessione. Rilievi: comandi con focus sul file di importazione, scala RPM rispetto al limitatore, limite coerente di import/export, statistiche base nel JSON e strumenti di sviluppo per l’economia.

I test di logica coprono acquisti ripetuti, ordine dei livelli, saldo insufficiente, installazione senza addebito, tre auto indipendenti, premio unico, record, ritiri, migrazione, dati incompatibili, autosave corrotto, slot, ripristino e disco pieno. Il confronto fisico usa il vero Rapier: accelera per cinque secondi con auto di serie/elaborata e confronta lo spazio d’arresto da una velocità iniziale uguale con freni di serie/potenziati. Verifica anche la massa effettiva del corpo rigido.

Le prove browser interagiscono con il negozio e i file reali, cambiano componenti e auto, salvano/caricano slot, ricaricano la pagina, scaricano JSON, rifiutano file non validi e applicano una migrazione. Circuito e sprint vengono percorsi con il vero passo fisico tramite il controllo QA già documentato, verificando premi dopo tutti gli arrivi e assenza di un secondo pagamento.

## Esiti verificati

- `npm run build`: superato con TypeScript strict. Build statica di 12 file, 5.120.901 byte, sotto 15 MB. Rimane l’avviso Vite per il bundle grande che contiene anche il motore fisico WebAssembly.
- `npm test`: 34 test superati in 11 file. Comprendono accelerazione/frenata con Rapier, tutte le regole economiche introdotte e il roundtrip JSON del registro massimo di 10.000 identificativi da 80 caratteri.
- `npm run lint` e `npm run format:check`: superati.
- Otto scenari browser distinti verificati: tre su guida/GPS, tre su gare e due nuovi su garage/salvataggi. Le sei regressioni sono passate nella suite complessiva; i due scenari del garage sono passati nella verifica mirata successiva alle correzioni.
- Il test del garage copre tutte le categorie e le tre schede per categoria, acquisto/installazione/serie senza doppio addebito, esemplari indipendenti, tre slot, ripristino, ricarica della pagina e ingresso con E vicino al garage dopo aver percorso la strada.
- Import/export verifica un download JSON reale, rifiuto di saldo negativo, anteprima prima dell’applicazione, migrazione v1, tre posti pieni, chiusura con focus sul selettore file e layout a 800 pixel senza scorrimento orizzontale.
- Entrambe le gare pagano dopo il completamento fisico di tutti i partecipanti. L’avanzamento successivo non produce un secondo pagamento. Verificati record e saldo persistiti.
- Prova aggiuntiva sulla build statica servita con `npm run preview`: caricamento WebGL, garage, acquisto, persistenza dopo ricarica, importazione non valida, chiusura con Esc e assenza dei comandi di sviluppo. Superata, senza errori JavaScript.
- Controllo dei sorgenti distribuibili: assenti oggetto QA, etichette e binding degli strumenti di sviluppo dell’economia.

Gli screenshot `artifacts/phase4-garage.png` e `artifacts/phase4-garage-narrow.png` sono stati aperti e controllati. Eliminata la trasparenza che rendeva visibili i testi del menu sottostante e corretta l’altezza del modello nello studio. Gli artefatti sono locali ed esclusi da Git.

## Limiti

Il garage contiene un solo modello acquistabile in più esemplari. Le curve sono una rappresentazione del modello arcade, senza simulazione di un motore termodinamico o banco misurato. La taratura fine è facoltativa e non implementata.

La suite browser usa rendering software: verifica comportamento e layout, non certifica 60 fps su GPU integrata. Il gamepad fisico e l’ascolto su hardware audio dell’utente restano da verificare. La sintesi e i modificatori audio sono collegati nel codice, senza valutazione acustica soggettiva automatica.

Lo strumento di economia si apre con F3 nel garage soltanto in sviluppo. Il toggle Crediti infiniti consente di provare acquisti e configurazioni senza esaurire il saldo; non viene usato per verificare i premi delle gare.

Nessuna pipeline, dipendenza, pubblicazione o servizio esterno introdotto.
