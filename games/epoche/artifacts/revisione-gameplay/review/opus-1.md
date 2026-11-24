# Verdetto: NO GO alla pubblicazione

Ho letto codice, dati e catture, senza eseguire build, lint o test. I sorgenti sono cambiati durante la revisione: `candidata.diff` e `dist/` non corrispondono più a `src/`. Inoltre quasi tutti i file del diff risultano riscritti per i soli fine riga. Per motore, salvataggi e vista ho quindi confrontato i file reali con `originale/estratto`.

## Bloccanti

**B1. La `dist/` da pubblicare contiene una Genesi sbagliata.**
- `index-BDjtkFX5.js` calcola i tratti con `createRng(seed)`, mentre la partita usa seme e scelte combinati.
- Riproduzione: seme 23, Cosmo a 0. La cattura `prove/genesi-it-1366.png` mostra Ambizione 2/20; la campagna reale dà 5 (`prove/genesi.json`).
- Il sorgente ora usa `genesisRng` (`src/ui/CampaignApp.tsx:48`, `src/engine/campaign/world.ts:64`), ma la `dist` non è stata ricompilata. Le catture e `browser.json` risultano precedenti alla correzione.
- Intervento: ricompilare, ripetere lint, test e prova browser sulla stessa build, poi registrarne l'hash.

**B2. La correzione della Genesi resta fuorviante.**
- Le quattro scelte entrano tutte nel generatore casuale. Il valore assoluto mostrato in un atto può quindi cambiare negli atti successivi, senza che il giocatore lo riveda.
- L'effetto non è monotono. In `genesi.json` la Memoria vale 10/10/10 a 0/50/100, e la Resilienza 6/13/12. T28 chiede una variazione osservabile, e qui il cursore sembra causare un'estrazione casuale.
- La prova fissa gli atti precedenti a 100 e controlla solo l'atto corrente: non può rilevarlo.
- Intervento: mostrare lo spostamento causato dalla scelta, `(scelta-50)/14` con il segno corretto per tratto, oppure i tratti definitivi in un riepilogo finale. Non cambiare il generatore: altererebbe i semi.

**B3. A 1366×768 il danno sanitario è invisibile (T29, gioco ordinario).**
- Riproduzione: `futuro-it-1366.png` e `futuro-en-1366.png`, con salute 24%. La riga non si legge; a 1920 sì.
- Causa probabile: `.crisis-list` è ora fuori dai riquadri (`src/ui/components/CampaignPanels.tsx:569`). Il diorama ha `min-height: 300px`, ma 280px di scena più i comandi lo fanno sbordare e coprire la riga (`src/ui/campaign.css:320`, `:819`).
- È una regressione: prima l'elenco stava nel pannello, raggiungibile scorrendo.
- `browser.cjs:37` usa `waitFor()`, che non rileva la copertura.
- Intervento: riportare l'elenco in un riquadro sempre visibile, o dare al diorama un'altezza minima reale. Verificare con `elementFromPoint` nelle due lingue.

**B4. T06 è dichiarato in `Stato.md`, ma la prova non è conclusa.**
- All'ultima lettura `rami.ndjson` era al seme 166 su 200 e la ripetizione era parziale. Manca `dominanze.json`.
- `analisi.py:46` richiede 200 stati e 600 gruppi. La ripetizione identica non è ancora dimostrata.
- Intervento: completare le serie, confrontarle byte per byte e generare il rapporto. In alternativa, togliere T06 dalla tappa.

**B5. Il diario del controllo congelato non è confrontabile (T13).**
- `controllo-dist` registra la posizione del pulsante (`indexOf`); la candidata registra l'indice del motore (`data-choice`). Divergono quando un retaggio filtra le risposte.
- In entrambe, «Pausa per decidere» e la barra spaziatrice non registrano la pausa. La ripresa non è mai registrata.
- `open` segna l'arrivo del dilemma, non l'apertura della carta: il tempo di lettura è falsato (`src/ui/trialLog.ts:16`, `:22`).
- Intervento: correggere il diario e rigenerare il controllo con hash. Se la tappa viene ridotta alla sola campagna, B5 blocca la consegna di T13 e non il gioco.

## Da correggere, non bloccanti da soli

- **Parola spezzata:** a 1366 in italiano appare «industrial/e» e l'intestazione cresce. Causa: `overflow-wrap: anywhere` in `src/ui/theme.css:925`.
- **Popolazione incoerente:** 168.681 nell'intestazione e 168.680 nella soglia.
- **Isolamento studio:** un salvataggio `trial` importato in uno slot ordinario è accettato, si ferma al registro e può aggiungere Eredità ordinaria. Rifiutare in `importSlot` regole diverse dalla modalità.
- **Eredità nello studio:** si trasmette tra partecipanti sullo stesso browser (`CampaignApp.tsx`, `inherited`). Azzerarla per `trial`.
- **Finestra del registro:** se il salvataggio fallisce, non offre esportazione né abbandono (`CampaignPanels.tsx:880`).
- **Semi riservati:** `npm run sim:campaign -- 1100` esegue 1001-1100 senza sigillo. `claimHoldout` copre solo `compareResponses.ts`.
- **T05:** mancano intervalli, ricchezza al passaggio e misura della ricomparsa. Il testo di H1 è scritto a mano in `analisi.py`, ma gli otto casi a 101 tornano. `heritage` dà gli stessi totali di `cautious`: non discrimina.
- **Test `trial`:** due casi; non coprono sequenza, interfaccia e importazione.

## Verifiche positive

- **Gioco ordinario:** nei punti critici letti di eventi e campagna, i rami nuovi agiscono solo con `rules === "trial"`. `genesisRng` conserva la formula originale.
- **Vecchi salvataggi:** senza `rules` diventano `current`; il caso è testato.
- **Studio:** database separato. Il registro blocca tempo, risposta e recupero offline.
- **Dati:** 1/50, 9/50, 34/50 e 50/50 risultano dalle tabelle. La sequenza ha 100 righe e nessuna dissoluzione.
- **Pubblicazione:** la `dist` ha percorsi relativi e nessun file di prova. Non ho trovato file CI in `.github`. Nel checkout Pages locale la cartella `epoche-campagna` non c'è, quindi ho potuto esaminare solo `dist/`.

## Limiti dichiarati, non difetti

T10 attende tre persone. T14-T27 e T30-T40 non sono consegnati. Le build vecchie non sostengono la modalità studio.

**Condizione per il GO:** chiudere B1-B3, chiudere B4-B5 o ritirarli esplicitamente dalla tappa, e consegnare un'unica candidata ferma con diff pulito, hash, lint, test e prova browser della stessa build.