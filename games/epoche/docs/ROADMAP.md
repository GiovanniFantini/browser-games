# Roadmap

> Regola: **prima divertente, poi bello.** Ogni fase termina con qualcosa di giocabile da provare.

## Fase 0: Design e prototipo su carta
- [x] Documenti di design iniziali
- [x] [Impostazioni della campagna locale](OPEN_QUESTIONS.md). Le decisioni commerciali sono elencate a parte.
- [x] **Prototipo su foglio di calcolo**: 6 attributi, 5 politiche, una formula di aggiornamento per anno.
      Obiettivo: verificare che "crescere crei problemi" sia *percepibile* e non frustrante.
- [x] Mockup della schermata principale (v3, `docs/reference/`)
- [x] [Riferimenti visivi](VISUAL_REFERENCE.md)

## Fase 1: Motore minimo (completata in locale)
> Suddivisa in compiti T01–T10: stato e dettagli in [`PLANS.md`](../PLANS.md) e [`docs/tasks/`](tasks/).

- [x] Setup progetto (Vite + TS + React + Vitest + ESLint)
- [x] Tick loop deterministico, PRNG, comandi
- [x] Attributi con zona sana e grafo di influenze (dati da file)
- [x] Politiche a cursore con inerzia ed effetti ritardati
- [x] Simulatore headless con report testuale
- [x] Interfaccia "grezza": schede attributi + cursori + pausa/velocità (nessuna mappa)
- [x] Verifica locale del prototipo nel browser e controllo di bilanciamento ([T10](tasks/T10-local-verification.md)).

**Traguardo:** si gioca la Preistoria a schermo con soli numeri, e già si capisce se è interessante.

## Fase 2: Vertical slice (Preistoria + Neolitico)
- [x] Eventi emergenti, catene e 41 dilemmi nelle prime due ere
- [x] Complessità e prime 3 famiglie di problemi
- [x] Gruppi sociali (3–5)
- [x] Salvataggi in IndexedDB + export/import
- [x] Offline catch-up con 3 Dottrine + Cronaca dell'assenza
- [x] Diorama di profilo in PixiJS (parallasse, pezzi modulari con stati) con i feedback visivi principali, disegni provvisori
- [x] Interfaccia in stile definitivo per le schede attributi
- [x] Passaggio d'era Preistoria → Neolitico

- [ ] Playtest delle prime ere durante il [playtest della campagna completa](#1-preparazione-e-playtest-della-campagna-completa).

## Fase 3: Mondo e conflitto
- [x] Generazione del mondo da seme
- [x] Civiltà IA (2–4) con personalità
- [x] Diplomazia base e guerra astratta
- [x] Crisi prolungate ed esiti strutturali (età buia, frammentazione)
- [x] Era 3 (Bronzo)

## Fase 4: Genesi e identità
- [x] Prologo Genesi in 4 atti come tutorial
- [x] Attributi nascosti e scoperta graduale
- [x] Archetipi culturali e generatore di nomi
- [x] Cronaca a capitoli esportabile
- [x] Musica e audio di base

## Fase 5: Contenuto
- [x] Ere 4–7 (Antichità → Industriale)
- [x] Trasmigrazione dello Spirito ed Eredità
- [x] Bilanciamento esteso con simulatore
- [ ] Riscontro del playtest sulla campagna completa.

## Fase 6: Pubblicazione

- [x] Ere 8–10
- [x] Localizzazione italiana e inglese
- [x] Progetto Tauri e testo della scheda Steam predisposti
- [ ] Installer desktop. Sul PC di verifica mancano Cargo, Rust e gli strumenti MSVC.
- [x] [Campagna pubblica su BrowserGames](https://giovannifantini.github.io/browser-games/epoche-campagna/)
- [ ] Pagina Steam. Servono l’account e gli asset commerciali.
- [ ] Approvazione del modello di monetizzazione e della licenza.

Lo stato delle singole verifiche è in [CAMPAIGN_VERIFICATION.md](CAMPAIGN_VERIFICATION.md). Il [pacchetto di distribuzione](DISTRIBUTION.md) descrive campagna browser, desktop e scheda Steam.

## Piano operativo per la 1.0 browser

Sequenza di esecuzione e criteri di chiusura nei [100 task della 1.0 browser](tasks/README.md#epoche-10-browser).

La 1.0 rende giocabile su BrowserGames la campagna desktop, da Genesi alla Trascendenza, in italiano e inglese, con entrambi i ritmi e tre slot locali. Il supporto iniziale proposto è per Chrome e Firefox desktop. Su mobile indicare l'uso da computer e su Safari indicare i browser verificati prima che il giocatore inizi una partita. La base è la candidata locale già verificata, con dieci ere e 65 dilemmi. La precedente revisione di Opus riguarda la candidata locale. [Verifiche della campagna](CAMPAIGN_VERIFICATION.md)

### 1. Preparazione e playtest della campagna completa

- Da `games/epoche`, eseguire `npm run build` e `npm exec -- vite preview --host 127.0.0.1 --port 4173 --strictPort`. Conservare lo ZIP di `dist/`, il suo SHA-256, la versione e il riferimento al sorgente esatto. Usare il commit se disponibile, altrimenti conservare uno snapshot del sorgente e il lockfile. Usare lo stesso pacchetto per l'intero giro. Per le prove osservate usare un profilo browser dedicato e persistente per partecipante, sempre su `http://127.0.0.1:4173/`. Per quelle a distanza usare un'origine HTTPS separata da BrowserGames, ad accesso limitato, senza installazioni a carico di chi prova.
- Prima del primo giro, provare in Chrome e Firefox l'avvio della campagna, la selezione del seme e dei ritmi, il salvataggio, la chiusura del browser, la riapertura dello stesso slot e l'export. Controllare che i nomi delle risorse persistenti siano propri di Epoche. Registrare le build consegnate e conservare file campione di ciascuna. La 1.0 deve importare gli export dei due giri ufficiali e della candidata. Gli slot dei tester restano sulla loro origine e si trasferiscono via JSON.
- Aggiornare la base simulata con `npm run sim:campaign -- 10 --compare` e `npm run sim:campaign -- 10 --standard --compare`. Ripetere il censimento con `npm exec -- tsx tools/sim/narrative.ts 1 10` e lo stesso comando con `--standard` in coda. Registrare durata per era, frequenza dei dilemmi, arrivo alla Trascendenza e stalli. Ricavare gli intervalli tra dilemmi dai tick degli eventi o aggiungerli al resoconto del simulatore. Usare i risultati per dimensionare le sessioni e fissare prima delle correzioni le fasce di ritmo da preservare.
- Fare un pilota con una persona per collaudare istruzioni e raccolta dei riscontri. Poi coinvolgere 5–10 persone che vedono Epoche per la prima volta, tra chi conosce i gestionali e chi li frequenta poco. Usare almeno due semi, con un seme in comune nelle prove confrontabili. Annotare anche le scelte di Genesi. Raccogliere almeno una prova in inglese.
- Nelle prove libere dire «Inizia una partita e guida la tua civiltà fin dove vuoi. Raccontami cosa stai cercando di fare». Osservare il Rapido fino alla fine della sessione e lo Storico all'avvio e al rientro. Se serve intervenire, annotare prima il punto e cosa la persona ha tentato. Registrare gli abbandoni con il motivo. In parallelo concordare almeno tre tentativi mirati Genesi–Trascendenza in Rapido e due prove di rientro nello stesso slot in Storico dopo 30–60 minuti. Provare separatamente un'assenza oltre otto ore con un salvataggio controllato. Se restano ere prive di riscontri, aprire slot dedicati, dando precedenza a Bronzo, Medioevo, Contemporanea e Futuro.
- Registrare per sessione identificativo anonimo, tipo di prova, build, browser, risoluzione, lingua, seme e ritmo. Annotare minuti attivi, ultima era, motivo della fine, richieste di aiuto, attese percepite, interruzioni per dilemmi e cosa succede al rientro. Per i blocchi segnare passaggi e ora simulata e, con il consenso della persona, conservare export o cattura. Se si perdono progressi, sospendere il giro e riprenderlo su una build identificata.
- Chiedere «Come avresti fatto avanzare la civiltà?», «Quale scelta ha cambiato la partita, e come te ne sei accorto?», «Quando avresti voluto smettere, e perché?». Al rientro chiedere «Che cosa è successo mentre eri via e cosa faresti ora?». Alla Trascendenza chiedere quale decisione si aspettavano di ritrovare nel finale.
- Produrre un resoconto per era e ritmo con i totali di prove, completamenti e abbandoni, e un elenco di interventi con evidenza e verifica da ripetere. Per procedere alla rifinitura, raccogliere almeno cinque prime prove e verificare che la maggioranza dei partecipanti sappia spiegare come avanzare e riconosca una conseguenza delle proprie scelte. Se la soglia di comprensione manca o almeno metà si ferma per noia o confusione, correggere il ciclo di gioco e ripetere il primo giro. Queste soglie proposte servono a decidere con un piccolo campione.

### 2. Correzioni e rifinitura

- Correggere prima perdita di progressi, impossibilità di avanzare o riprendere e crisi prive di una causa o contromisura leggibile. Riprodurre i casi dai salvataggi, poi riprovare le situazioni interessate. Intervenire nel punto in cui si decide, per esempio rendendo visibile il requisito di riforma e distinguendo il valore impostato da quello effettivo.
- Usare i riscontri per correggere cadenza dei dilemmi, varietà delle scelte, attese e finale. Dopo un intervento sulla progressione, ripetere i semi problematici e i replay nei due ritmi. Il profilo reattivo deve ancora arrivare alla Trascendenza in tutti i semi del campione. Verificare gli scostamenti da durata e copertura narrativa precedenti.
- Preparare Neolitico e Industriale come riferimento visivo. Mostrare senza etichette stabilità, crescita, degrado e crisi. Portare al secondo giro i segnali visivi e sonori che aiutano a leggere questi stati. Per la 1.0 chiudere la lista di interventi dopo questa prova. I criteri sono ere adiacenti distinguibili, stati riconoscibili e segnali di dilemma, crisi e cambio d'era comprensibili. Verificare sin dall'inventario i diritti d'uso degli asset della build e della copertina. Far rileggere i testi inglesi, compresi i dilemmi. [Direzione artistica](ART_DIRECTION.md)

### 3. Secondo giro sulla candidata

- Prima di consegnare la build, eseguire lint, test, build e la matrice dei salvataggi della fase 4 con gli export disponibili. Verificare che il pacchetto si apra negli stessi ambienti del primo giro.
- Coinvolgere almeno cinque persone nuove. Soglie proposte: tre completamenti in Rapido senza interventi del moderatore, almeno una campagna Storica completa, due rientri in cui è chiaro cosa è successo e come continuare. La maggioranza sa indicare una scelta significativa e vorrebbe continuare o rigiocare. Riportare quanti tentativi ci sono stati per ciascun criterio. Una partita mirata conta come completamento se parte da Genesi e arriva al finale senza aiuti. Gli slot preparati servono a verificare la situazione per cui sono stati creati.
- Richiedere zero blocchi gravi nuovi o ricorrenti. Se il campione non incontra spontaneamente una crisi grave o un esito strutturale, provarli con salvataggi dedicati. Per la crisi, la persona deve riuscire a indicare causa e una contromisura leggendo il gioco. Per l'esito strutturale deve capire come riprendere con lo Spirito. Se una soglia manca, correggere e ripetere le prove pertinenti con persone nuove. Ripetere le prove interessate anche dopo cambiamenti a progressione, salvataggi o segnali informativi.

### 4. Verifica e distribuzione su BrowserGames

- Prima di rendere accessibile la campagna, concordare con Giovanni condizioni di accesso della 1.0 e licenza. Aggiornare la guida di distribuzione con la scelta. Il playtest locale e quello riservato possono partire prima di questa decisione.
- Eseguire `npm run lint`, `npm test`, `npm run sim:check` e `npm run build`. Verificare il pacchetto in sottocartella su Chrome e Firefox, a 1366×768 e 1920×1080. Coprire Genesi, Worker, tastiera, lingue, ritmi, audio, Trascendenza e ripresa in Storico. Associare il pacchetto approvato alla revisione del sorgente e al suo SHA-256.
- Provare gli export dei due giri ufficiali e della candidata, riportando nel resoconto gli identificativi delle build supportate. Coprire inizio e fine nei due ritmi, ordini ritardati, dilemma, guerra o esilio in corso, e rientro dopo l'aggiornamento. Stato e ordini devono conservarsi, con una sola applicazione del recupero offline. Un errore di importazione o ripresa di una build supportata blocca il rilascio. File corrotti o di versione non supportata devono dare un errore leggibile e lasciare intatto lo slot. Provare conflitto tra schede, errore di scrittura e, se cambia lo schema, interruzione della migrazione con recupero della copia precedente.
- Pubblicare dopo il secondo giro superato, i diritti verificati, le prove documentate e la revisione di Opus sulle modifiche a progressione e salvataggi. Devono essere chiusi i difetti che causano perdita di progressi o impediscono avvio, avanzamento, ripresa o comprensione di una crisi grave.
- Dopo l'autorizzazione, aggiornare la scheda BrowserGames e verificare via HTTPS che i file serviti corrispondano alla candidata. Provare Worker, entrambi i ritmi e le lingue, uno slot dopo riavvio del browser, export/import e il collegamento alla campagna dal vecchio indirizzo.
- Quando ci sono partite in uso, correggere con una build compatibile oppure servire un pacchetto di recupero che legga ed esporti gli slot. Per gli aggiornamenti successivi verificare anche che la build di ripristino apra lo schema dei salvataggi già aggiornati. [Distribuzione](DISTRIBUTION.md)

### Revisione del piano

Claude Opus 5.5 ha approvato il piano al secondo giro. Le precisazioni finali riguardano le prove valide per le soglie, le build con salvataggi supportati, la verifica dei salvataggi prima del secondo giro e i browser supportati. La revisione era documentale. Playtest, matrice dei salvataggi e verifica pubblica sono attività da eseguire.

## Rischi principali
| Rischio | Mitigazione |
|---|---|
| Troppi numeri, gioco "freddo" | Mappa con feedback forti fin dalla Fase 2; Consiglio e cronaca con personalità |
| Crescita dei problemi frustrante | Prototipo su carta + simulatore; problemi sempre *leggibili* e con contromisure |
| Tempo persistente punitivo | Tetto offline, Dottrine, pausa sulle crisi decisive |
| Portata enorme (Big Bang → futuro) | Contenuto guidato dai dati; si pubblica anche con meno ere complete |
| Perdita dei salvataggi nel browser | IndexedDB + `storage.persist()` + export/import + promemoria |
