# Review delle ottimizzazioni del 17 novembre 2026

Review locale richiesta da Giovanni con Claude Code, modello Opus. Comprende il rendering modificato e una seconda lettura di gare, risultati, torneo, fantasma, economia, carriera, importazioni e migrazioni. La successiva richiesta di commit e pubblicazione è stata completata il 17 novembre 2026, come registrato in [pubblicazione](pubblicazione.md).

## Segnalazioni e decisioni

| ID Opus | Classificazione condivisa | Intervento o decisione |
| --- | --- | --- |
| R1-01 | Suggerimento, copertura | Test dei due rami senza riflesso: fuori frustum e camera sotto il piano. Verifica anche i tentativi del Reflector, una sola shadow map corrente e ripristino di autoUpdate. |
| R1-02 | Suggerimento, verifica | Smoke del pacchetto statico con guida, bassa/alta/media, preferenze persistenti, garage e assenza di errori e globali QA/test. |
| R1-03 | Nice-to-have | Commento sul contratto di beforeSceneRender e sul ripristino del flag delle ombre. |
| R1-04 | Nice-to-have | Asserzione browser: ogni luce con castShadow appartiene al layer 0. |
| R1-05 | Limite visivo preesistente, facoltativo | Rinvio confermato singolarmente da Opus nel giro 2. Fuori dal caso Hillcrest, il cielo riflesso conserva l'inversa della proiezione iniziale dopo FOV dinamico o resize. Non è un comportamento corretto né una regressione nuova. Correggerlo richiede un confronto visivo dedicato. |
| R1-06 | Nice-to-have | Rinvio confermato da Opus nel giro 2. Cambiare qualità durante prepare può richiedere una compilazione al primo frame. Nessuna promessa di avvio più veloce. |
| R1-07 | Difetto cosmetico preesistente | Dichiarata un'icona vuota nel documento, eliminando la richiesta favicon.ico e il relativo 404. Rimosso il route che lo nascondeva nel test visivo. |
| R1-08 | Nice-to-have, misura | Nuova campagna sui tempi di avvio rinviata con accordo Opus nel giro 2. Restano riportate le mediane osservate, 13,23 s prima e 14,42 s dopo. Nessun guadagno sull'avvio dimostrato. |
| R2-01 | Bug P2 preesistente | Prossima tappa era disponibile dalla seconda tappa anche nella classifica provvisoria. Ora compare solo dopo la liquidazione finale; anche l'azione verifica la fase della sessione. Test con guida fisica reale, provvisoria, click programmatico, finale e avvio della terza tappa. |
| R2-02 | Bug P2 preesistente, raro | Due campioni del fantasma potevano arrotondare allo stesso tempo e invalidare l'intera transazione del premio. Ora il campione finale sostituisce il precedente a parità di tempo; una registrazione invalida viene scartata e il fantasma in memoria cambia solo dopo il commit riuscito. |
| R3-01 | Suggerimento, affidabilità | Helper di ricaricamento con attesa iniziale di 180 s, coerente con il caricamento con routing e cache HTTP disabilitata. Le asserzioni funzionali restano identiche. |
| R3-02 | Nice-to-have | Ripristinati i metodi originali delle IA dopo la seconda tappa, prima della terza. La coppa finale continua a verificare gli avversari reali in movimento. |
| R3-03 | Nice-to-have | La verifica del collegamento writeProgress/confirmProgress al commit è svolta da entrambi i revisori sul codice; non viene aggiunto un test che ricostruisca l'intero RaceSystem per quattro righe. |
| C1-01 | Difetto del test garage | La vecchia manovra chiedeva il prompt vicino al garage a 88 km/h, mentre il prompt richiede velocità inferiore a 5 m/s. Ora la prova percorre realmente la strada, frena e verifica sia velocità sia distanza prima del prompt e dell'ingresso. |
| C1-02 | Affidabilità dei test all'avvio | Portate a 180 s le attese di avvio iniziale e reload ancora limitate al default di 20 s in garage, carriera, gare e review. Non cambiano le asserzioni o i tempi delle azioni di gameplay. |
| R4-01 | Verifica richiesta | Ripetere la coppa sul file definitivo, che comprende anche reloadReady e il ripristino delle IA. |
| R4-02 | Verifica richiesta | Dopo i falsi negativi del garage, eseguire di nuovo tutti i 35 test su sorgenti e test fermi. Snapshot SHA-256 prima e controllo dopo l'esecuzione. |
| R5-01 | Bug del test preesistente | Il vecchio controllo tetto assumeva geometrie del fallback e poteva mescolarle ai GLB. Ora precarica tutti i 51 GLB, ne controlla la provenienza e verifica superfici curve, trasformazioni, materiali e presa con raggi indipendenti. Conserva acquisto e guida reale. |
| R5-02 | Bug P2 preesistente | L'opzione Presa sul tetto applicava il materiale vetro senza creare una presa. Ora crea un piccolo volume con apertura frontale, aderente al pannello e adattato alla sua dimensione. |
| R5-03 | Bug P2 preesistente | Sulle quattro monoposto mancava il bersaglio delle personalizzazioni tetto. Fibra, presa e vinile ora usano la copertura posteriore e seguono l'apertura del portellone. La serie senza personalizzazioni mantiene nomi e batching precedenti. |
| R5-04 | Suggerimento accolto | Montaggio figlio del pannello, materiale trim esistente, base campionata sulla superficie e sommità sopra il massimo di angoli e centro. Risorse della presa e della sua apertura incluse nel normale smaltimento del veicolo. |
| R5-05 | Suggerimento accolto | Prova sui 51 GLB precaricati: almeno quattro contatti della base entro 1 mm, vinile coincidente col pannello, materiale fibra, UV complete, provenienza GLB e perno posteriore sulle monoposto. |
| R5-06 | Ipotesi visiva confermata come bug | La freccia centrata sul tetto diventava una fascia perché le UV usavano l'intera auto. Il confronto dedicato lo riproduce; ora le UV del solo tetto coprono il pannello completo. |
| R6-01 | Bug minore del test | Il controllo del materiale leggeva il pannello invece della presa. Ora controlla entrambi e verifica anche gli eventi di rilascio di tutte le geometrie e materiali delle mesh nei due veicoli di prova. |
| C2-01 | Anomalia dell'ambiente, esclusione confermata | Durante la corsa conclusiva l'orologio osservato è avanzato di circa 27 minuti nell'attesa di 45 secondi. Windows registra una correzione di 242.963 ms effettuata da VMware Tools. Due test sono scaduti nell'intervallo; entrambi sono poi passati due volte, invariati e in sequenza. Opus ha confermato l'esclusione nella review 7, senza richiedere nuove modifiche o un'altra corsa integrale. Il dettaglio evita di confondere la prova con una corsa unica interamente verde. |

La prova deterministica del secondo bug riproduce nel codice precedente i tempi `[0, 0.2, 0.2]` e l'errore «Fotogramma fantasma non valido». Il codice corretto produce `[0, 0.2]`, conserva la posa finale e supera la validazione. Un test verifica anche la transazione reale di premio e profilo.

L'uscita volontaria dalla classifica provvisoria tramite Altre gare o Torna alla guida conserva l'ultima tappa salvata e rinuncia al premio corrente, come prima. Non viene introdotta una nuova regola di cancellazione del torneo.

## Confronto della grafica

Prima delle fix sono state conservate nove pose di guida e una cattura del garage. Ripetizione sulla versione finale: zero pixel differenti in tutti e dieci i confronti, senza soglie di tolleranza. Le pose comprendono sottopasso, viale, vista inversa, Neon, pioggia/nitro, Hillcrest, ritorno, bassa e alta. I canvas di guida sono 1280 × 800; il garage è 471 × 350.

Il confronto è stato ripetuto anche dopo le fix del tetto. Altri nove confronti dedicati usano compatta, monoposto e SUV, ciascuna di serie, con presa e con fibra/vinile. Le tre immagini di serie sono identiche pixel per pixel. Le sei personalizzazioni cambiano intenzionalmente solo le parti corrette: ora compaiono presa, fibra e freccia prima assenti o ritagliate. Le differenze interessano dallo 0,32% al 2,65% dell'immagine; la valutazione comprende il confronto visivo, non solo la percentuale.

I confronti controllati fissano clock, pose e stato della camera come nel banco delle prestazioni. La verifica separata nel ciclo effettivo copre guida, ombre, resize e cambi di qualità, senza tale normalizzazione. Non costituiscono una misura di FPS sulla GPU NVIDIA del PC di Giovanni.

## Evidenze

- 94 test unitari in 23 file passati sulla versione finale (`unit-final.txt`).
- Build con TypeScript, lint e formattazione dei file modificati passati (`build-final.txt`, `lint-final.txt`, `format-final.txt`).
- Tutti i 35 casi browser verificati sulla stessa versione: la corsa completa conclusiva con due worker ha 33 passati e due timeout durante l'anomalia dell'ambiente (`browser-frozen-final.txt`); le due prove sono state ripetute due volte ciascuna in sequenza, con quattro esiti positivi (`browser-environment-retry.txt`, 4,6 minuti). Non si presenta questa esecuzione come un unico comando con 35 test verdi.
- Tutti i 143 file di sorgenti/test e configurazioni acquisiti prima della corsa sono invariati dopo corsa e ripetizioni (`frozen-integrity.json`). Nessuna modifica alle asserzioni per risolvere i due timeout.
- La prima corsa congelata aveva chiuso 34 casi e individuato il controllo tetto obsoleto che ha portato alle fix R5. Non viene usata come sostituto del test tetto finale.
- Smoke del pacchetto statico finale: guida reale con W, velocità campionata 50 km/h, qualità bassa/alta/media e preferenze persistenti, garage; zero errori JavaScript/console/WebGL o risposte HTTP fallite. Globali QA e diagnostici assenti anche con `?qa=race` (`static-smoke.json`).
- Dieci confronti standard e tre di auto di serie identici al pixel. Sei confronti sulle personalizzazioni corrette valutati direttamente da Opus nella review 6, con esito visivo `raggiunto`.

Cartella locale ignorata `artifacts/code-review-2026-11-17/`: prompt e risposte integrali di Opus, snapshot dei sorgenti, PNG before/roof-final, `image-diff.json`, confronti tetto `baseline-*-roof*.png` e `roof-after-*-roof*.png`, `roof-image-diff.json`, `ghost-reproduction.json`, log dei test e smoke statico. Le copie e gli strumenti diagnostici non fanno parte della distribuzione. Le prime catture tetto dall'alto, ostruite da una trave, sono state sostituite per la valutazione da una visuale libera e coerente prima/dopo.

La verifica globale della formattazione segnala nove file estranei alle modifiche: otto per CRLF nel checkout, uno per l'output preesistente del generatore delle lightmap. Il contenuto normalizzato coincide con HEAD (`format-audit.json`). I file modificati vengono controllati separatamente. Resta l'avviso Vite preesistente sul chunk maggiore di 500 kB.

`npm run format:check` globale fallisce per questi file preesistenti: `src/data/appearance.json`, `src/data/en.json`, `src/data/prototype.json`, `src/ui/appearance.css`, `src/ui/navigation.ts`, `src/ui/settings.ts`, `src/world/track.ts` e `package.json` per CRLF; `src/gen/lighting/bake.json` per la formattazione già prodotta dal generatore in HEAD. Il check mirato passa per `index.html`, `src/main.ts`, `src/race/ghost.ts`, `src/race/modes.test.ts`, `src/race/system.ts`, `src/ui/races.ts`, `src/world/effects.ts`, `src/world/wet-road.ts`, `src/world/car-reflections.ts`, `src/gen/buildings/kit.ts`, `src/vehicle/generated.ts`, `src/vehicle/roof-intake.ts`, `tests/career.spec.ts`, `tests/garage.spec.ts`, `tests/modes.spec.ts`, `tests/phase8.spec.ts`, `tests/races.spec.ts`, `tests/render-pipeline.spec.ts`, `tests/review.spec.ts` e `tests/visual-upgrade.spec.ts`.

## Esito conclusivo

Il giro 7 di Claude Code locale, modello `claude-opus-5-5`, ha verificato log, integrità dei file, codice finale e chiusura delle segnalazioni. Nessun nuovo bug o regressione concreta. Le esclusioni e i rinvii sono confermati singolarmente, compresa l'anomalia ambientale C2-01. Il testo integrale è in `artifacts/code-review-2026-11-17/round-7-final.txt`; i dati del processo confermano modello, assenza di errori, 30 turni e durata di circa 98 secondi.

Verdetto concorde di Codex e Opus: `READY TO GO IN PROD`. Conservazione e correzioni della grafica: `raggiunto`.

Sono corretti cinque bug funzionali preesistenti (coppa, fantasma, presa tetto, personalizzazioni delle monoposto e UV del vinile tetto), oltre al 404 cosmetico dell'icona. I problemi dei test sono separati dai difetti del prodotto nella tabella. Restano i limiti facoltativi e ambientali esplicitamente condivisi, senza garanzie di FPS sull'hardware fisico non disponibile.

Il verdetto è stato espresso sulla build locale verificata. Successivamente Giovanni ha autorizzato commit e pubblicazione: sorgenti `c10cd11585aea0f4aff9b893748f5c1409876751`, distribuzione `5eac5e4cdf807ba21fe24d0195e9444be07036a4`, verificata dal dominio pubblico il 17 novembre 2026. Nessuna modifica a pipeline o configurazioni CI/CD.
