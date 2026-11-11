# Distribuzione di Night Circuit

Repository: https://github.com/GiovanniFantini/BrowserGames. Il repository resta privato. I sorgenti di questo gioco sono in games/night-circuit/ sul ramo main; Dragon Ball rimane separato e non fa parte di questa consegna.

La candidata è stata approvata da Codex e Opus. La build per GitHub Pages usa il prefisso /BrowserGames/ ed è verificata nel browser su quel percorso. Il ramo gh-pages contiene soltanto i file statici compilati e le licenze. Non contiene salvataggi, sorgenti TypeScript o strumenti QA.

Stato al 11 novembre 2026: sorgenti caricati su main e build caricata su gh-pages. Giovanni ha autorizzato l’attivazione di GitHub Pages. La richiesta di attivazione è stata rifiutata da GitHub con HTTP 422: il piano attuale non supporta Pages per questo repository privato. Il sito non è attivo. Per proseguire occorre scegliere un hosting alternativo, un piano GitHub compatibile oppure autorizzare esplicitamente la visibilità pubblica del repository. La visibilità non è stata cambiata e nessun acquisto è stato effettuato.

Indirizzo previsto dopo l’attivazione: https://GiovanniFantini.github.io/BrowserGames/. La pubblicazione usa il ramo gh-pages, cartella radice. Non è prevista una pipeline personalizzata e nessun workflow è stato aggiunto.

## Build

Dalla cartella games/night-circuit/:

```powershell
npm ci
npm run build -- --base=/BrowserGames/
```

L’output è in dist/. Le prove funzionali di questa build comprendono avvio, guida, salvataggi e migrazioni, garage, preferenze, recupero WebGL e assenza dei controlli QA in produzione.

## Salvataggi fra PC

I progressi sono salvati nel browser e restano separati per PC, browser e indirizzo del sito. Per trasferirli usare Esporta salvataggio nel gioco sul PC di origine e Importa sul PC di destinazione. Non è presente sincronizzazione cloud. I salvataggi dell’indirizzo locale non vengono trasferiti automaticamente al sito.
