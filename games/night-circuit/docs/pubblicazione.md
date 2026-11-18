# Distribuzione di Night Circuit

## Pubblicazione attuale: GitHub Pages

### Nuova mappa pubblicata il 18 novembre 2026

Strade curve e diagonali, incroci a T, dislivelli reali e segnaletica dei quattro quartieri sono pubblicati su https://giovannifantini.github.io/night-circuit/, con le fix approvate da Opus nei due giri tecnici e visivi. Commit sorgenti: `ac1297d2d99cec61da855fa7b31e3671d1e7bf7f`. Commit distribuzione: `6bc38e316167943a1a4cfe1a3ab7823c68c15eef`. Pages ha raggiunto stato `built` alle 07:21:39 UTC (08:21:39 italiane).

Pacchetto locale e sito pubblico hanno superato la stessa verifica: guida reale oltre 20 km/h, nuova mappa, qualità bassa/alta/media con preferenze persistenti, garage e acquisto/applicazione della presa sul tetto. Un profilo precedente senza recordsLayout è stato caricato dalla vera build, mostrato sotto Record mappa precedente e salvato con una normale azione nel garage: tempi e punteggi precedenti conservati separatamente e nuovi record vuoti. Carriera e inventari sono conservati dal parser verificato.

Il controllo online termina a `2026-11-18T07:33:05.860Z`. Nessun errore JavaScript/WebGL/console, risposta HTTP fallita o richiesta verso origini esterne. API QA e diagnostiche di sviluppo assenti anche con `?qa=race`. `release.json` indica il commit corretto e il bundle `/night-circuit/assets/index-CD2M04mQ.js` ha SHA-256 `3759b283f6ecfaf0be64c84ea25872ff41ae0b55f44d6e3da16eb2e74cb67d3c`, identico alla candidata. Il GLB iniziale mantiene SHA-256 `9dfbe09c12b2dd7a374a3409ff203c0613e9bea8c8d6b95c46c720a0e0feac69`.

La prima prova della candidata ha anticipato il comando pausa durante il rientro dalla mappa. Lo script è stato corretto mettendo la cattura della mappa alla fine della sequenza; nessuna modifica al gioco. Nel primo controllo dei record online il collaudo ha inoltre anticipato il clic sul garage prima che il gioco fosse pronto; è stata aggiunta l’attesa del pulsante di avvio abilitato. La sequenza completa è poi passata sia in locale sia online, senza modificare il prodotto. Tutti i 66 file runtime copiati corrispondono alla candidata; i vecchi bundle restano disponibili per le pagine già nella cache.

Evidenze ignorate: artifacts/release/street-map-2026-11-18, con report, build Pages e screenshot candidate/online. La review funzionale precedente comprende 101 test unitari e 19 prove browser; i 191 file dell'implementazione sono invariati rispetto alla revisione approvata. Nessuna pipeline o configurazione CI/CD modificata. Sorgenti privati in BrowserGames, sola distribuzione e asset nel repository pubblico night-circuit.

### Aggiornamento del 17 novembre 2026

Ottimizzazioni del rendering e cinque fix funzionali approvate nella review 7 con Opus sono pubblicate su https://giovannifantini.github.io/night-circuit/. Commit dei sorgenti: `c10cd11585aea0f4aff9b893748f5c1409876751`. Commit della distribuzione pubblica: `5eac5e4cdf807ba21fe24d0195e9444be07036a4`. Pages ha raggiunto stato `built` per questo commit alle 20:07:32 UTC.

La verifica sul dominio pubblico si è conclusa alle 20:10:35 UTC (21:10:35 italiane): avvio a qualità media, accelerazione reale oltre 20 km/h, passaggi bassa/alta/media con preferenze persistenti, garage, acquisto e applicazione della presa sul tetto. Nessun errore JavaScript, WebGL o console, nessuna risposta HTTP fallita e nessuna richiesta verso origini esterne. Interfacce QA e diagnostiche di sviluppo assenti anche con `?qa=race`.

`release.json` online indica il commit sorgente atteso. Il bundle `/night-circuit/assets/index-D0iRjSOX.js` ha SHA-256 `30be26d9a3a586ba92c221155c669819e8e22d77a9a879e47f2796aa7ecb435f`, identico alla candidata locale. Anche il modello iniziale corrisponde: SHA-256 `9dfbe09c12b2dd7a374a3409ff203c0613e9bea8c8d6b95c46c720a0e0feac69`. Le risorse del gioco vengono caricate sotto `/night-circuit/`.

Build con base Pages e smoke locale superati prima del push. Il primo tentativo del nuovo script di smoke usava il timeout standalone di 5 s durante il cambio qualità; il controllo è stato riallineato alle attese della verifica browser, senza cambiare il prodotto. Candidata e sito pubblico hanno poi superato la stessa sequenza. I vecchi bundle con hash restano disponibili per compatibilità con le pagine già nella cache dei browser.

Evidenze locali ignorate in `artifacts/release/optimized-approved-2026-11-17/`: `candidate-report.json`, `online-report.json`, `pages-build.json` e screenshot `online-*`. Nessuna pipeline o configurazione CI/CD è stata modificata. Il verdetto completo e i limiti di misura restano nella [review delle ottimizzazioni](review-ottimizzazione.md).

Giovanni ha autorizzato l'accesso pubblico. Il gioco aggiornato è disponibile senza accesso ChatGPT su https://giovannifantini.github.io/night-circuit/.

Il repository pubblico https://github.com/GiovanniFantini/night-circuit contiene soltanto il gioco compilato e gli asset. Il repository dei sorgenti https://github.com/GiovanniFantini/BrowserGames resta privato, come verificato tramite GitHub. Gli script dei generatori e i file Blender di sviluppo restano separati dalla distribuzione pubblica.

Pages pubblica la radice del ramo `main` del repository `night-circuit`, con prefisso `/night-circuit/`. Commit della distribuzione iniziale: `d62a3efd591b9a7a67b5c901da8ccab40304f953`; sorgenti della revisione grafica: `c1589d91e84311663388deda5b3b9bfba9963e01`. Il build Pages ha raggiunto stato `built`, la pagina risponde HTTP 200 e il manifest online contiene 51 auto. Nessun workflow personalizzato è stato aggiunto.

Verifica eseguita sul sito pubblico con Chromium: avvio e guida reale oltre 5 km/h, caricamento di font, GLB e lightmap sotto `/night-circuit/`, nessuna risposta 404, nessun errore JavaScript o shader e API QA assente. Screenshot e richieste osservate sono in `artifacts/release/pages-live-verified.png` e `artifacts/release/pages-live-report.json`. Il rendering software verifica funzionalità e caricamento, senza certificare prestazioni su GPU integrata.

Checkout locale della distribuzione pubblica: `artifacts/release/public-pages-repository`. La variante compilata è in `artifacts/release/public-pages-candidate`. Per preparare un aggiornamento usare `npm run build -- --base=/night-circuit/ --outDir artifacts/release/public-pages-candidate`, verificare la build e aggiornare il checkout della distribuzione. Il push dei soli sorgenti su `BrowserGames` non aggiorna questo sito.

Il precedente sito Sites conserva la versione precedente. I salvataggi dipendono dall'indirizzo del sito: esportarli dal vecchio indirizzo e importarli nel nuovo.

## Preparazione e precedente blocco del repository privato

L'11 novembre 2026 la revisione grafica con texture originali, edifici modulari, lightmap e 51 auto Blender è stata caricata su `main`, commit `c1589d91e84311663388deda5b3b9bfba9963e01`. La build per `/BrowserGames/` è stata aggiornata su `gh-pages`, commit `11179e3`. Nel browser locale sono stati verificati guida reale, font, GLB, lightmap, assenza di richieste fallite e API QA assente. Lint e 90 test sono passati. I percorsi dei nuovi asset seguono la base di Vite.

Il nuovo tentativo di attivazione di Pages ha ricevuto HTTP 422: `Your current plan does not support GitHub Pages for this repository.` Il repository resta privato e Pages non è attivo. Il push non equivale quindi alla disponibilità del gioco su un indirizzo GitHub. Il sito Sites conserva la versione precedente descritta sotto.

È stata preparata e verificata una variante statica per il repository pubblico separato `night-circuit`, con base `/night-circuit/`, in `artifacts/release/public-pages-candidate`. La successiva autorizzazione di Giovanni ha consentito la creazione del repository e l'attivazione di Pages descritte sopra.

Stato al 11 novembre 2026: gioco pubblicato su Sites, versione 1. URL verificato dal servizio di pubblicazione: https://night-circuit-neon-streets.weproject-6682.chatgpt.site.

Il sito è privato, accessibile al proprietario con il proprio account ChatGPT anche da altri PC. Il repository https://github.com/GiovanniFantini/BrowserGames resta privato. I sorgenti sono in games/night-circuit/ sul ramo main. Dragon Ball rimane separato e non fa parte di questa consegna.

## Pubblicazione Sites precedente

È distribuita la build statica approvata da Codex e Opus, ricompilata senza il prefisso di GitHub Pages. Nessun cambiamento al codice di gioco. La build locale è passata; le verifiche funzionali della candidata e della variante con prefisso Pages sono descritte nella review finale. La pubblicazione Sites ha stato succeeded. Non è stata eseguita una nuova sessione di gameplay sul sito protetto da accesso; il collaudo funzionale è sulla build locale.

Identità del sito: appgprj_6af4152e22c881918e3512a4ee1fa0da. Versione salvata: appgprj_6af4152e22c881918e3512a4ee1fa0da~appgver_cc390874d60c819181298b94977e6114. Deployment: appgdep_6af4156cb2ac8191a07ff0387515d39d. Commit del repository Sites contenente lo snapshot compilato: d378a9012f8ec71d052de6f38bbcdd0a400f037b.

Il checkout Sites locale è games/night-circuit/artifacts/release/site-night-circuit/. Il suo .openai/hosting.json conserva l’identità del sito e static.directory=dist. Per aggiornare questo sito riutilizzare tale identità e le credenziali temporanee restituite da Sites, senza creare un altro sito e senza salvare token nei file. Lo snapshot compilato è mantenuto dal repository Sites; i sorgenti TypeScript restano nel repository GitHub. Nessun workflow o pipeline personalizzata è stato aggiunto.

## Build

Dalla cartella games/night-circuit/:

```powershell
npm ci
npm run build
```

L’output è in dist/ e comprende tutte le risorse runtime e le licenze. La pubblicazione non richiede un backend del gioco.

## Tentativo GitHub Pages

I sorgenti sono stati caricati su main e una variante della build con base /BrowserGames/ è conservata su gh-pages. Giovanni ha autorizzato l’attivazione di Pages, ma GitHub l’ha rifiutata con HTTP 422: il piano attuale non supporta Pages per questo repository privato. L’indirizzo GitHub Pages non è attivo. La visibilità del repository non è stata cambiata e nessun acquisto è stato effettuato.

## Salvataggi fra PC

I progressi sono salvati nel browser e restano separati per PC, browser e indirizzo del sito. Per trasferirli usare Esporta salvataggio nel gioco sul PC di origine e Importa sul PC di destinazione. Non è presente sincronizzazione cloud. I salvataggi dell’indirizzo locale non vengono trasferiti automaticamente al sito.
