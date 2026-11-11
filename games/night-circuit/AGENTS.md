# NIGHT CIRCUIT: Neon Streets

Si applicano anche le istruzioni generali della raccolta.

## Scelte confermate

Gioco arcade 3D notturno per browser desktop, ambientato nella città inventata Port Riders. Codice, dati e risorse indipendenti dagli altri giochi. TypeScript strict, Vite, Three.js/WebGL2, Rapier raycast, Web Audio e interfaccia HTML/CSS. Tastiera e gamepad standard. Niente servizi esterni, backend o pipeline.

Rispettare la roadmap in docs/requisiti.md. L'autorizzazione attuale comprende le fasi 1, 2, 3, 4, 5, 6, 7 e 8 e la successiva revisione grafica. Le otto fasi sono completate e verificate localmente; la review Codex/Opus della versione precedente è conclusa con READY TO PROD per la build statica. Per quella versione consultare docs/review-finale.md; per la nuova revisione locale consultare docs/revisione-grafica.md. Non confondere le prime gare giocabili con il gioco completo.

## Contenuti e dati

Nomi, veicoli, marchi immaginari, sagome, insegne e testi originali. Non aggiungere riferimenti a costruttori reali, modelli reali, città reali o altri giochi nei contenuti del gioco, commenti, file o metadati. Le dipendenze mantengono i loro identificativi e le licenze obbligatorie.

Nessun asset esterno, nemmeno CC0. Texture, modelli, font, icone e suoni devono essere generati nel progetto, con codice o script inclusi nel repository. Audio e musica sintetizzati localmente. Obiettivo visivo: racing arcade console dei primi anni 2000, texture 256-512 px, auto originali da 3-8k triangoli, luce ricca e satura. La nuova revisione procede per texture, edifici, illuminazione, auto. La richiesta più recente di Giovanni autorizza a continuare autonomamente attraverso tutti i passi fino al livello di dettaglio e grafica dei riferimenti in chat. Non attendere più approvazioni fra i passi; mostrare evidenze browser reali e continuare finché il risultato non è adeguato. Cataloghi, parametri delle auto, prezzi, quartieri ed eventi in JSON. Le costanti degli algoritmi restano nei rispettivi moduli.

## Verifica

La richiesta grafica più recente richiede cicli con Claude Code locale, modello Opus. Ogni review confronta screenshot reali del gioco con il riferimento fornito in chat. Proseguire autonomamente con le correzioni finché il revisore restituisce la riga esatta `raggiunto`. I precedenti verdetti funzionali READY TO PROD non approvano questo requisito grafico. Conservare immagini, prompt e risposte nelle evidenze locali ignorate; documentare esito e verifiche in docs/review-visiva.md. Non inserire il riferimento nel gioco o nella distribuzione.

Per modifiche alla guida o all'interfaccia eseguire i controlli appropriati e verificare il rendering nel browser. I test fisici usano il vero Rapier, non una simulazione fittizia. Non dichiarare raggiunti 60 fps su GPU integrata senza misure su tale hardware. Gli screenshot/test con rendering software verificano funzionalità e layout, non quel requisito prestazionale.

Tenere README, requisiti e resoconto delle verifiche coerenti con il comportamento effettivo. Non modificare configurazioni CI/CD senza l'autorizzazione esplicita richiesta dalle istruzioni generali.

Le gare usano zero, uno o quattro avversari con veicoli raycast reali, secondo la modalità, riutilizzati fra gli eventi. Checkpoint ordinati e direzionali, conteggio giri e tempi appartengono a RaceSession; non assegnare progressione dalla sola vicinanza al traguardo. Ripristino all'ultimo checkpoint già validato con penalità. Nei risultati i veicoli liberano il traguardo; la ripresa dopo cambio scheda consente alle IA ancora in gara di terminare. Drift da velocità/slittamento/contatti reali; drag con cambio manuale e traffico. Il fantasma non ha corpo fisico e registra soltanto giri puliti. Punteggi, fantasma e torneo interrotto appartengono al profilo v6, con migrazione v1/v2/v3/v4/v5.

Il controllo QA con ?qa=race è disponibile soltanto nel server di sviluppo. Avanza il vero ciclo fisico e usa RaceDriver e un pilota drift basato su sterzo/freno a mano, senza simulare arrivi, punteggi o teletrasportare sui checkpoint. Verificare che il relativo oggetto globale non sia presente nella build distribuibile.

Economia e profili appartengono a src/progression. Validare transazioni prima di applicarle; acquisti e premi finali producono autosave. Componenti posseduti ed equipaggiati sono separati per esemplare. Le IA restano di serie. Importazioni e slot sono applicabili soltanto fuori gara e con simulazione sospesa. Non assegnare crediti dalla classifica provvisoria. Documentare versioni e limiti del formato JSON.

Estetica: catalogo e prezzi in data/appearance.json, validazione e costo in tuning/appearance.ts. Usare lo stesso modello configurato in studio e in strada; liberare geometrie, materiali e texture sostituiti. Vinili limitati a forme e superfici ammesse, mai SVG o URL arbitrari importati. Le bozze vanno applicate prima del salvataggio. Mantenere le chiavi localStorage esistenti anche quando cambia lo schema. Foto PNG dalla scena 3D con filtro applicato al file, senza interfaccia o acquisizione del desktop.


Carriera: dati in data/career.json, regole in progression/career.ts. Reputazione separata dai crediti, bonus da estetica applicata, premi/sblocchi atomici con la classifica definitiva. Contratti dal momento della firma, servizi fotografici una volta per rivista, rivali in sequenza. Nessun premio da classifiche provvisorie o ritiri. Le gare veloci restano accessibili; avviare la carriera abilita i limiti di livello sui nuovi acquisti, preservando tutti i pezzi posseduti. Il catalogo contiene 51 modelli di 12 costruttori, con famiglie, dimensioni, attacchi ruota e parametri propri. I componenti estetici sono moduli adattati alle proporzioni del modello. I quartieri condividono coordinate fisiche, ponti e grafo GPS. Attivare geometrie e collider secondo distanza e accesso della carriera.

A garage pieno la sostituzione del modello deve restare disponibile ai livelli corretti: quotazione dal catalogo, trasferimento dei componenti compatibili, conferma della differenza nel gioco e copia recuperabile prima della scrittura. Se il salvataggio fallisce, non cambiare auto o saldo in memoria.

Preferenze locali versionate in core/preferences.ts, separate dai profili di progressione. Localizzazione IT/EN in data/en.json e ui/translation.ts, con conservazione dei nomi originali. Non tradurre identificativi, valori dei select o dati fisici. Le modifiche ai testi devono aggiornare il dizionario e mantenere il ritorno IT senza duplicazioni. Radio e suoni sintetizzati localmente, senza asset audio esterni. In qualità bassa evitare render target del postprocessing; in media/alta liberarli al ritorno alla qualità bassa. I collezionabili sono validati e premiati una sola volta nel profilo v6.
