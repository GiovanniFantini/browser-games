# Verdetto: GO ALLA PUBBLICAZIONE

Il GO vale per la sola tappa autonoma e per la `dist` con `index-DASp7K74.js`. **Resta un difetto concreto, non bloccante (D1).** T10 resta in attesa e i rimedi avanzati non sono consegnati.

Ho lavorato in sola lettura. Non ho ricalcolato gli SHA-256 (incluso `be728aa0…`) né rieseguito build, test o Chrome. Non ho potuto vedere il checkout Pages: l'identità fra `dist` e `epoche-campagna` è dichiarata in `Correzioni.md`, non verificata da me.

## Bloccanti del giro 1

| | Esito | Riscontro |
| --- | --- | --- |
| B1 | Chiuso | `index.html` carica il bundle del manifest. Per data di modifica, `dist` segue i sorgenti dell'interfaccia e della campagna; catture, lint e test seguono `dist`. |
| B2 | Chiuso | Genesi e motore condividono `genesisModifiers`, con la stessa formula nel bundle e nel worker. Il testo mostra lo spostamento e la sequenza del generatore è invariata. |
| B3 | Chiuso | «Salute pubblica 24%» si legge nelle tre catture del Futuro che ho aperto (1366 it/en, 1920 it). `browser.cjs:38` usa `elementFromPoint`. |
| B4 | Chiuso | `rami.ndjson` e `ripetizione.ndjson` hanno 1.743 righe ciascuno e code uguali. `dominanze.json` è presente. L'identità byte per byte è in `riproducibilita.json`. |
| B5 | Chiuso | `trialLog.ts` ha lo stesso hash nei manifest di candidata e controllo. `diario.cjs` confronta arrivo, apertura, pausa, ripresa e ID della risposta sulle due build. |

## Difetto rimasto

**D1. Popolazione incoerente nella stessa schermata (T29).**
- **Riproduzione:** in `futuro-it-1366.png`, `futuro-en-1366.png` e `futuro-it-1920.png` l'intestazione e il criterio segnano 168.680, mentre «Capacità dell'ambiente» segna 168.681.
- **Causa:** `CampaignPanels.tsx:589` arrotonda ancora. Il troncamento è in `App.tsx:189`, cioè in `Settlement`, che la campagna non usa.
- **Effetto:** scarto di un abitante. La soglia per avanzare è corretta, per questo non blocca.
- **Intervento:** `Math.floor` a `:589` e anche a `:812` (riepilogo finale). Richiede una nuova build, un nuovo manifest e la ripetizione della prova browser.

## Verifiche positive

- **Gioco ordinario:** i rami nuovi di eventi e campagna agiscono solo con `rules === "trial"`.
- **Vecchi salvataggi:** senza `rules` diventano `current`, con test.
- **Studio:** database separato, Eredità iniziale zero, importazioni incrociate rifiutate prima di toccare lo slot.
- **Registro:** risposta, tempo e recupero offline sono bloccati. Se il salvataggio fallisce restano esportazione e uscita.
- **Dati:** nella calibrazione le 952 vittorie della tabella coincidono con le righe NDJSON. Le differenze medie tornano e la sequenza arriva al registro in 100 casi su 100.
- **Test:** 77 superati in 13 file, numero coerente con i sorgenti; lint senza errori.
- **Pubblicazione:** i percorsi controllati sono relativi e nella `dist` non ho visto file di prova. Non esistono file in `.github`; altre CI non sono state controllate.

## Limiti da tenere presenti

**Dichiarati:** T10 attende tre persone. T14-T27 e T30-T40 sono fuori tappa. Le build vecchie non sostengono lo studio.

**Non dichiarati, da sistemare prima delle sessioni giocate:**
- **Ritmo dello studio:** la Genesi propone Storico, 20 volte più lento, mentre la sequenza è misurata in Rapido. Il protocollo non fissa il ritmo.
- **Diario:** sta in `sessionStorage`, quindi chiudere la scheda prima dell'esportazione lo perde. Scorrimento e chiusura della carta senza scelta non sono coperti da `diario.cjs`.
- **`dominanze.json`:** il confronto non ha tolleranza. In `animals` la risposta 0 è «oltre 65%» per differenze di popolazione anche dello 0,001%. Diversi gruppi hanno solo 3 osservazioni. Non usarlo da solo per calibrare T32.
- **`heritage`:** nelle campagne dà gli stessi totali di `cautious`, quindi lì non discrimina.
- **Pianeta:** il testo spiega l'acqua, ma la scelta determina anche il tipo di popolo mostrato nel villaggio.