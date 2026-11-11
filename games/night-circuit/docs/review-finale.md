# Review finale con Opus locale

Stato al 11 novembre 2026: review conclusa. Codex e Opus concordano su READY TO PROD per la distribuzione statica della candidata verificata. Nessun rilievo P1 o P2 aperto.

Review richiesta da Giovanni dopo le otto fasi. Eseguita tramite Claude Code 2.1.302 installato localmente, modello confermato dal processo: claude-opus-5-5. Il reviewer ha accesso in sola lettura ai sorgenti e alla richiesta iniziale integrale. Nessuna modifica a pipeline, pubblicazione o push.

## Prima iterazione

Verdetto Opus: NOT READY TO PROD. Due rilievi P1 (HUD analogico e differenziazione visiva del catalogo), quattro P2 (identità dei quartieri, IA, prezzi e draw call dell’auto) e osservazioni P3.

## Correzioni

- Due quadranti SVG analogici, aggiornati dalla fisica a 15 Hz, scale coerenti con unità e modello, colori personalizzati e zona rossa.
- Profili della carrozzeria a sezioni, cabine e code parametrizzate in JSON, 12 firme visive per griglie/luci/dettagli e badge effettivamente usati. Immagini comparative dei 51 modelli da due angoli.
- Architetture originali su lotti riservati: mercato coperto, schermo, portale, terrazze, serra, osservatorio, hangar, terminale e radar. Rampa sopraelevata collegata alla rete di Airport Belt, con GPS e collisioni.
- IA con velocità derivata dall’auto e anticipazione della frenata in base a curvatura, grip e distanza di arresto. Rivali con modelli, colori e abilità propri e progressivi. Test carriera con acquisti e tuning reali, senza assegnare vittorie dal QA.
- Prezzi del catalogo coerenti con livello e indice prestazionale, mantenendo i tre prezzi originali per compatibilità.
- Geometrie statiche unite per materiale; ruote, porte, cofano, portellone, superfici trasparenti e componenti animati conservano i propri pivot.
- Presa d’aria e vinili superiori solidali al tetto; componenti della monoposto ridimensionati. Bloom limitato per conservare la leggibilità dell’auto.
- Mappa limitata ai quartieri aperti, checkpoint localizzati, obiettivi sponsor coerenti con mph, camere anteriori adattate alle dimensioni del modello.
- Bonus drift del nitro anche nelle gare ordinarie, curva di coppia anche in automatico, rumore motore filtrato e voce dedicata della turbina.
- Scritture dei progressi differite fuori dal passo fisico, registro gare recente compatto e protezione da sovrascrittura fra schede. Buffer GPS riutilizzato, copia delle sole adiacenze modificate e collider aggiornati solo ai cambi di stato.
- Cambiare volume o lingua non ricompila tutti i materiali. La qualità di emergenza nell’URL resta un’opzione della sessione e non sovrascrive la preferenza persistente. Il traduttore evita la ricerca delle frasi sui valori numerici.

## Evidenze

90 test di logica e fisica passati in 22 file. Build TypeScript strict/Vite, ESLint e Prettier passati. Verifica browser finale completata: 28 scenari su 28 passati, compreso il fantasma dopo ricarica. Anche il controllo della build distribuibile è passato. I timeout precedenti e la correzione dell’attesa di navigazione sono descritti nella seconda iterazione.

Artefatti locali in artifacts/review/: review Opus, prompt, immagini del catalogo, quartieri, rampa, HUD e misure. I file di diagnostica sono esclusi dalla build.

## Limiti delle misure

L’ambiente espone una GPU virtuale VMware SVGA 3D via Direct3D11. I campioni durante la guida sono vicini a 60 fps a 1280 × 800, ma non certificano il risultato su un portatile fisico con GPU integrata. Il gamepad fisico non è collegato: la guida e la rimappatura sono provate tramite Gamepad API simulata. I menu sono utilizzabili con mouse e tastiera. Le ombre della città e il traduttore vengono valutati nelle misure disponibili; non si deduce un collo di bottiglia dalla sola struttura del codice.

## Seconda iterazione

Opus ha chiuso tutti i rilievi P1 e P2 nel codice, dopo aver letto anche le immagini del catalogo e dei quartieri. Il verdetto definitivo attende la suite finale, la build distribuibile e la telemetria dopo il batching. Sono stati corretti anche i P3 aggiunti: griglie diagonali limitate alla calandra, coni degli altoparlanti e accento della monoposto allineati, vetri raccordati sotto il tetto con verifica geometrica su tutti i modelli chiusi, lotti ricavati dal JSON, separatore dei giri aggiornato con la lingua, colore dei rivali sulla minimappa e lista dei modi drift costante.

La scelta implementativa caratterizza i quartieri con architetture e temi originali. Le voci architettoniche non utilizzate di Old Docks sono state tolte: il quartiere conserva gru, bacini e container già presenti. Nella gara veloce sul pendio con Hillcrest chiuso è possibile cadere uscendo dalla piattaforma iniziale; il recupero al checkpoint avviene con R. I limiti del traduttore, delle ombre e dei menu gamepad restano documentati e non sono stati identificati come blocchi del codice.

I timeout osservati riguardavano l’attesa dell’evento generale load della pagina, con il pulsante di avvio già abilitato nella cattura del fallimento. I test ora attendono DOMContentLoaded e poi lo stato pronto del gioco. Questo stato viene abilitato soltanto dopo inizializzazione di Rapier, caricamento dei font e compilazione degli shader. Le verifiche funzionali successive sono invariate. L’esecuzione seriale completa è passata anche con questa attesa esplicita.

## Verifica conclusiva della candidata

Candidata identificata dal manifest SHA-256 in artifacts/review/source-manifest.json: e50cb706deb6b5e692502767c42ee0b523e4721cde5c7a10caf7506751c92ded, 110 file di sorgenti, test e configurazione locale. Nessun codice di gioco modificato dopo la verifica conclusiva.

- TypeScript strict, build Vite, lint e formattazione passati.
- 90 test Vitest in 22 file passati dopo le ultime correzioni.
- 28 scenari Playwright su 28 passati in sequenza, compreso il fantasma dopo ricarica (7,1 minuti). Log integrale in artifacts/review/browser-final.txt.
- Controllo della build distribuibile passato su preview: migrazione v4-v6 con elaborazioni/kit/record/punteggi/ghost/coppa conservati, carriera e sponsor, guida, finestre a 800 pixel, sostituzione a garage pieno ai prezzi aggiornati e ripristino, preferenze IT/EN/unità/radio, assenza degli strumenti QA/crediti e del teletrasporto, recupero dopo perdita del contesto WebGL. Nessun errore JavaScript o shader. Log in artifacts/review/production-final.txt.
- Build statica: 12 file, 5.396.188 byte (circa 5,40 MB), sotto il limite di 15 MB. Avviso Vite sul singolo bundle grande ancora presente; non è un errore di compilazione.

Telemetria finale completata. Opus ha confermato READY TO PROD dopo avere letto le prove finali e ricontrollato codice e immagini. Tutti i file del manifest sono stati ricontrollati dopo le prove: nessuna modifica alla candidata.

## Prestazioni osservate dopo le correzioni

Chromium headless con VMware SVGA 3D Direct3D11, viewport 1280 × 800, 15 secondi per campione durante guida reale. Non è una certificazione per GPU integrata fisica.

| Profilo e scena | FPS medi | Frame al 95° percentile | Draw call F3 nell’ultimo frame |
| --- | ---: | ---: | ---: |
| Basso, guida libera | 56.14 | 16.80 ms | 214 |
| Medio, guida libera | 55.07 | 16.80 ms | 316 |
| Alto, guida libera | 58.87 | 16.80 ms | 334 |
| Gara, medio, 4 avversari | 58.94 | 16.70 ms | 352 |

I campioni includono traffico e avanzamento fisico; i punti finali sono registrati nel JSON. La scena gara conferma cinque partecipanti nel proprio HUD. Non sono rilevati errori JavaScript o shader. Dati grezzi: artifacts/review/performance-after-batching.json e benchmark-final.txt.

Per isolare il solo effetto del batching, è stato eseguito anche un confronto alla stessa risoluzione, posizione, posa e geometria dell’auto, attivando o escludendo soltanto l’unione delle mesh nel generatore di diagnostica. Le draw call dell’auto passano da 83 a 35 senza ombre e da 141 a 52 con ombre. I triangoli del passaggio primario restano 2.112; il passaggio con ombre passa da 2.832 a 2.976 per l’unione conservativa dei caster. Dati e script in artifacts/review/car-batch-comparison.*. La copia senza batching è solo diagnostica e non viene importata dal gioco o dalla build.

Le immagini HUD nei tre profili e le immagini comparative dei 51 modelli sono state rigenerate dopo le ultime correzioni. La documentazione della fase 8 è esplicitamente contrassegnata come resoconto precedente; il riferimento corrente è questo documento.

## Valutazione Codex

READY TO PROD per la build statica, candidata e50cb706deb6b5e692502767c42ee0b523e4721cde5c7a10caf7506751c92ded. Tutti i requisiti di codice e i rilievi P1/P2 risultano coperti dalle correzioni e dalle prove disponibili. Restano i limiti hardware e i casi minori descritti sopra. La distribuzione non implica certificazione dei 60 fps su un portatile fisico con GPU integrata, né prova di un gamepad fisico. Nessuna pubblicazione è stata eseguita.
## Verdetto conclusivo Opus

READY TO PROD. La CLI locale conferma il modello claude-opus-5-5, sessione ca78670c-6133-42a9-ac71-6b32f26e3d9b. Il reviewer ha ricontrollato in sola lettura la richiesta originale, le review precedenti, le correzioni N1-N8, le immagini e i log finali. Nessun nuovo blocco identificato. Il testo integrale del verdetto indipendente è conservato in [review Opus](opus-review-finale.md).

La chiamata della terza iterazione era stata interrotta dal limite della sessione Anthropic (HTTP 429), prima di un verdetto. Non è conteggiata come approvazione. Il controllo conclusivo è stato eseguito dopo il ripristino del limite, in una nuova sessione Opus sulla stessa candidata. Il manifest è stato ricontrollato anche l’11 novembre: nessun file della candidata modificato.

Osservazioni residue non bloccanti: gli altoparlanti della monoposto si sovrappongono e sporgono di pochi centimetri a portellone aperto; i rombi delle griglie sono una scelta di stile accettata dal reviewer. Lo screenshot prestazionale della gara mostra fuori percorso perché il campione usa un input rettilineo, mentre il completamento del circuito con quattro IA è coperto dalla suite. I rimandi alla documentazione corrente sono stati aggiornati dopo il verdetto, senza modificare il codice approvato.

La conclusione riguarda la build statica e i requisiti verificabili nel codice e nell’ambiente disponibile. Restano espliciti i limiti hardware, il caso Vetracava e l’interpretazione architettonica dei quartieri descritti sopra. Non è stata eseguita alcuna pubblicazione.
