# Distribuzione di Night Circuit

Stato al 11 novembre 2026: gioco pubblicato su Sites, versione 1. URL verificato dal servizio di pubblicazione: https://night-circuit-neon-streets.weproject-6682.chatgpt.site.

Il sito è privato, accessibile al proprietario con il proprio account ChatGPT anche da altri PC. Il repository https://github.com/GiovanniFantini/BrowserGames resta privato. I sorgenti sono in games/night-circuit/ sul ramo main. Dragon Ball rimane separato e non fa parte di questa consegna.

## Pubblicazione attiva

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
