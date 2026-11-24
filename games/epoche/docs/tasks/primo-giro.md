# Primo giro della campagna 1.0

La build locale è epoche-020-giro1-dabdb079. Il [pacchetto](../../artifacts/primo-giro/epoche-020-giro1-dabdb079.zip) proviene dallo [snapshot E001](../../artifacts/primo-giro/E001.txt). L'archivio contiene la campagna con scelta del ritmo. I manifest Chrome e Firefox si riferiscono a questa build. Per questa tornata il piano prevede osservazione sul PC locale, su http://127.0.0.1:4173/. Se si passa a sessioni a distanza, E007 richiede un'origine HTTPS riservata.

## Dati locali e isolamento (E006)

IndexedDB usa il database epoche, versione logica 1, con slots (chiave slot 1, 2 o 3) e legacy (chiave id della campagna). Una transazione assegna un token casuale a ogni apertura dello slot. Ogni scrittura ricontrolla il token e scarta i salvataggi superati della stessa partita. Le preferenze su localStorage sono epoche-language, epoche-sound ed epoche-volume. Le schede della stessa origine condividono questi dati. Per il pilota usare un profilo dedicato per persona e tornare nello stesso profilo per lo Storico. Il server locale è associato al loopback e usa la porta fissa 4173.

## Copione per il moderatore (E017)

Prima di aprire il gioco annota il tipo di prova e concorda separatamente l'eventuale raccolta di catture ed export. Leggi «Inizia una partita e guida la tua civiltà fin dove vuoi. Raccontami cosa stai cercando di fare». Nella prova inglese usa “Start a game and guide your civilization as far as you like. Tell me what you are trying to do.” Per un tentativo mirato aggiungi soltanto l'obiettivo di raggiungere la Trascendenza. Lascia decidere quando interrompere. Se chiede aiuto, chiedi «Che cosa hai provato?». Registra il punto e il tempo prima di qualsiasi suggerimento e trascrivi l'aiuto. In caso di perdita dei progressi sospendi la sessione, conserva gli elementi consentiti e segui la procedura del piano.

Al termine chiedi «Come passeresti alla prossima era?», «Quale tua scelta ha cambiato qualcosa e da cosa te ne sei accorto?», «Quando avresti voluto fermarti e perché?». Al rientro chiedi «Cosa è successo mentre eri via? Cosa vuoi fare adesso?». Al finale chiedi quali decisioni riconosce nella storia della civiltà. Registra le parole della persona prima di interpretarle. Per un abbandono annota il motivo spontaneo e l'ultima azione.

## Scheda da copiare per sessione (E018)

| Campo | Da compilare |
|---|---|
| ID anonimo, esperienza con gestionali, tipo di prova | |
| Build, browser/versione, profilo, risoluzione, lingua | |
| Seme, quattro scelte di Genesi, ritmo, slot | |
| Minuti attivi, minuti di assenza, velocità, ultima era e tick | |
| Obiettivo espresso, scelte, conseguenze riconosciute | |
| Attese, interruzioni per dilemma, crisi e contromisura indicata | |
| Ogni aiuto con minuto, tentativi precedenti e suggerimento | |
| Esito, motivo di interruzione, intenzione di continuare | |
| Rientro, parole della persona e decisione successiva | |
| Problema, passaggi, ora simulata, riproducibilità | |
| Consenso separato a export e catture, riferimenti agli allegati consentiti | |

## Campione proposto (E019)

Un pilota separato verifica il copione. Per il primo giro prevedere cinque esordienti, includendo persone con e senza esperienza nei gestionali. Osservare una prima partita libera per ciascuno. Prevedere anche tre tentativi mirati in Rapido da Genesi (semi 1, 1, 2) e due avvii Storico (semi 1, 2), con rientro nello stesso slot dopo 30–60 minuti. Prevedere almeno una prova in inglese e distribuire i due browser. Registrare separatamente prove libere, mirate ed eventuali slot di copertura. Lasciare aperte le assegnazioni fino alla disponibilità delle persone. Il secondo giro richiede almeno cinque persone nuove.

## Registro degli asset (E039)

| Risorsa inclusa | Provenienza e condizioni da verificare |
|---|---|
| public/art/valley-distance.webp e valley-woods.webp | Generate con ImageGen per la versione locale secondo VISUAL_REFERENCE.md. Nessuna attestazione specifica per la distribuzione commerciale nel materiale esaminato. |
| Diorami, figure e interfaccia | Forme procedurali e stili del progetto, renderizzati con PixiJS e CSS. La licenza del gioco è aperta come decisione E081. |
| Caratteri | Famiglie di sistema dichiarate dal CSS. Il browser usa i caratteri installati sul dispositivo. Nessun file font nel pacchetto. |
| Musica e segnali | Sintesi Web Audio del progetto in src/ui/sound.ts. Nessun campione audio nel pacchetto. |
| collection/covers/epoche.jpg | Copertina richiamata dalla scheda BrowserGames. Provenienza e condizioni da confermare prima di E060. |

Le condizioni mancanti restano aperte in E060.

## Prove tecniche e allegati

- E001–E004. Il [manifest della build](../../artifacts/primo-giro/manifest.json) collega sorgente, ZIP e campioni. I [digest HTTP dei 18 file](../../artifacts/primo-giro/E004-files.json) sono stati verificati byte per byte contro il contenuto estratto. Il log della compilazione riporta un avviso Vite su un chunk oltre 500 kB minificati.
- E005–E010. In due profili puliti è stato creato lo slot 1 con semi e ritmi diversi. Il gioco ha salvato all'uscita. Dopo la chiusura completa e la riapertura del browser, ogni profilo ha ripreso la propria civiltà ed esportato lo stato. [Chrome stabile](../../artifacts/primo-giro/chrome-manifest.json) e [Firefox della distribuzione Playwright](../../artifacts/primo-giro/firefox-manifest.json) sono stati eseguiti in modalità headless a 1440×900. Queste prove coprono il percorso funzionale. La valutazione delle persone si svolge con browser visibile.
- E011–E016. I file E011.log ed E012.log riportano ogni combinazione seme/profilo. E013.log ed E014.log contengono anche gli ingressi nelle ere e i tick di apertura dei dilemmi. La modifica riguarda i due strumenti di simulazione. [Misure e fasce per le riprove](../../artifacts/primo-giro/E015-E016.md).
- E020. Il [campione Storico con nove ore di assenza](../../artifacts/primo-giro/E020-9h.json) deriva dalla prima esportazione Firefox. Usare l'orario di riferimento e l'[esito atteso](../../artifacts/primo-giro/E020.json). L'import aggiorna la data dello slot: nella prova browser importare al tempo di riferimento, poi avanzare di nove ore l'orologio prima di premere Continua.
- E028, verifica tecnica anticipata. Su Firefox la cronaca ha indicato 13,3 anni, due nuove voci e una decisione in attesa. Al tick 800 il dilemma «Il greto affiora» era ancora aperto. Il replay a otto e nove ore ha dato stati identici; in questo campione la decisione interrompe il recupero prima del tetto. Il risultato va riconfermato se E022 cambia il pacchetto o la procedura. [Resoconto browser](../../artifacts/primo-giro/E028-browser.json) e [cattura](../../artifacts/primo-giro/E028-assenza.png).

## Dipendenze per proseguire

Il pilota E021 richiede una persona disponibile per una sessione osservata. E022–E038 dipendono dal pilota e dai riscontri del primo giro. Gli interventi dal task E040 in avanti che dipendono da tali riscontri restano aperti. Dopo il primo giro Giovanni ha confermato la campagna locale. E081 resta aperto per la licenza di una futura distribuzione. La revisione di Opus è rinviata secondo l'indicazione di Giovanni.
