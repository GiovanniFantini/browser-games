# Distribuzione di Night Circuit

## Pubblicazione attuale: GitHub Pages

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
