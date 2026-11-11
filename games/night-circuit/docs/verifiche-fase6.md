# Verifiche della fase 6

Data: 10 novembre 2026. Versione locale 0.6.0. Nessuna pubblicazione, pipeline o dipendenza aggiunta.

## Perimetro

Drift su circuito e discesa, drag manuale con traffico e guasto al limitatore, sprint a checkpoint con tempo aggiuntivo, sfide a distacco, torneo di tre gare e fantasma del proprio miglior giro pulito. Nove eventi visibili comprendendo circuito e sprint precedenti. Carriera e città completa restano nelle fasi 7 e 8.

Il pendio di Vetracava è una strada evento sopraelevata con collisioni, pendenze e protezioni. Non costituisce il quartiere Hillcrest completo. Il pilota incontrabile nella guida libera percorre realmente Old Docks; F avvia la sfida dalle posizioni correnti, con conto alla rovescia e auto ferme.

## Metodo

Node.js 24.20.0, npm 11.19.0, Chromium Playwright su Windows, viewport 1280 × 800, WebGL software. I controlli browser usano il ciclo Rapier effettivo a 60 Hz attraverso il controllo QA disponibile soltanto nel server di sviluppo. Non assegnano arrivi, checkpoint o punti e non spostano l’auto sui traguardi. Il pilota drift applica sterzo, acceleratore e freno a mano. L’IA e il pilota drag cambiano davvero marcia.

Le prove fisiche del drift percorrono anche il pendio con la stessa geometria e i collider usati dal gioco. Lo scoring usa velocità, slittamento, contatto a terra, avanzamento e urti reali.

## Controlli

- 54 test automatici in 14 file: logiche precedenti, cambio manuale, lancio, guasto isolato al drag, drift e collisioni, deadline interpolata, fantasma validato, torneo e migrazioni. Due prove completano i percorsi drift con Rapier.
- Browser: gare complete, premi e risultati; ghost salvato e riprodotto dopo ricarica; drag con sei civili, cambiate e guasto; punteggio reale su entrambi i percorsi drift; sfida F sul posto; tre tappe della coppa con ripresa dopo ricarica e classifica finale.
- Casi limite browser: R non sostituisce il fantasma pulito, abbandono coppa senza premio, sprint fermo fino alla scadenza, ritorno dal drag a una griglia normale.
- Regressioni browser delle fasi precedenti: guida, città/navigazione, gare circuito/sprint, prestazioni/salvataggi, estetica e foto.
- Build TypeScript/Vite, ESLint e formattazione. Verifica separata della build distribuibile per migrazione e assenza del controllo QA.

## Correzioni emerse durante la verifica

Il freno a mano precedente produceva angoli insufficienti per il drift. Grip, rigidità e smorzamento laterale durante il freno a mano sono ora parametri del veicolo; il comportamento di aderenza normale resta distinto. Le curve del pendio usano un raggio compatibile con la larghezza della carreggiata, evitando sovrapposizioni e blocchi contro le protezioni.

Il buffer neutro dei comandi è congelato e il drag usa un buffer dedicato: una gara successiva non eredita acceleratore o sterzo. Il guasto non si applica alla guida manuale libera né revoca un arrivo valido durante l’attesa degli avversari. Le scadenze confrontano il tempo interpolato del traguardo/checkpoint, comprese le penalità.

Abbandonare la coppa cancella l’intero torneo in corso. La liquidazione è unica per coppia identificativo coppa/tappa; punteggio aggregato, premio finale e salvataggio sono applicati nella stessa transazione. La migrazione v4 conserva aspetto e prestazioni dei profili precedenti, con limite di importazione di 2 MB.

Una rilettura indipendente ha controllato modalità, orchestrazione gare, fantasma e parser dei profili. Il modello Opus richiesto in precedenza non è disponibile; non viene attribuita la review a quel modello.

## Esiti finali

- Build TypeScript strict/Vite superata: 12 file, 5.191.241 byte, inferiore a 15 MB. Rimane l’avviso Vite per il singolo bundle grande, comprendente il motore fisico WebAssembly.
- 54 test superati in 14 file. ESLint e controllo Prettier superati sulla versione 0.6.0.
- Quindici scenari browser verificati. La suite completa ha superato 14 scenari in 22,3 minuti; il controllo aggiuntivo X/Z chiedeva la prima cambiata durante il breve intervallo di lancio, ancora attivo. Corretta l’attesa del test, la ripetizione mirata ha superato drag e sfida/torneo in 3,2 minuti. Il primo passaggio dei quattro scenari principali della fase 6 era già interamente riuscito.
- Barra del distacco verificata durante la sfida. Le classifiche lunghe aprono sul titolo e consentono di scorrere fino alle azioni. La sfida mostra il proprio obiettivo invece del numero di giri interno usato dalla simulazione.
- Prova aggiuntiva sulla build statica con `npm run preview`: migrazione automatica v3, conservazione di motore elaborato, kit, cerchi e record, modifica di colore senza addebiti, salvataggio v4, ricarica, nove eventi, conto alla rovescia drag, cambiata reale da tastiera, cambio manuale obbligatorio, ritorno alla guida automatica e apertura della sfida con barra del distacco. Superata senza errori JavaScript e senza strumenti DEV, anche con `?qa=race`.
- Nessun identificativo del controllo QA o dello strumento crediti nella build prodotta. Controllo mirato su sorgenti, test, documenti e metadati senza occorrenze dei marchi cercati, segnaposto incompleti o trattino lungo.

Immagini locali controllate: risultati del drift in discesa, sfida in corso con barra del distacco, classifica finale della coppa e drag della build statica con elaborazioni conservate dalla migrazione. Gli artefatti in `artifacts/` sono esclusi da Git.

## Limiti della verifica

Il rendering software verifica funzionamento e interfaccia, senza certificare 60 fps su GPU integrata. Il gamepad fisico non è stato provato in questa sessione. IA e traffico mantengono il modello arcade documentato. La radio, il catalogo completo di auto, i rivali di carriera, gli altri quartieri e la localizzazione completa restano fuori dalla fase 6.
