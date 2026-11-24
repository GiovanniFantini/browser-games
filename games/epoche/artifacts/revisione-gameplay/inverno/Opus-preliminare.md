## Revisione tecnica preliminare: NO GO provvisorio

Ho solo letto codice e artefatti, senza eseguire nulla. Nel ramo ordinario non ho trovato difetti bloccanti. Servono due correzioni e prove aggiornate.

### Da correggere prima del GO

**1. La prova guidata può bloccarsi in Preistoria senza esito**
- `bivio.ndjson`, ancora in scrittura, conteneva 42 righe `open` su 1.793. Esempi: righe 124-126 (seme 105) e 241-255 (seme 109, dove si bloccano quattro scelte su cinque).
- Tutte hanno crisi totale esattamente 100, popolazione 44-59 (il passaggio nel fixture mostrato chiede 78) e nessun rimedio usato. Tutte nascono dallo stile casuale prima dell'inverno.
- La causa probabile è che, esauriti i tre dilemmi, `events.ts:210` non apra più eventi. `updateCrises` ferma la crisi a 100 senza dissolvere, salvo legittimità sotto 49 (`events.ts:410-415`).
- Il testo dell'udienza dice invece «A 100 il villaggio si dissolve». Il diario si esporta solo a prova conclusa o con un esito, quindi chi si blocca lo perde.
- Il simulatore usa politiche fisse: un giocatore potrebbe uscirne, ma non è dimostrato.
- **Richiesta:** in `winterStudy` far dissolvere il villaggio a 100, oppure riprendere gli eventi ordinari a copione esaurito. In ogni caso serve un'uscita con diario, un test e il bivio rilanciato, perché cambiano gli esiti delle righe `open`.

**2. L'udienza del registro non chiude il tick**
- In `?rimedi`, `ledger` non è decisivo. Alla scadenza `campaign.ts:337` può aprire l'udienza, poi lo stesso tick continua con guerra, crisi, tratti ed eventi.
- Se uno di questi scrive in cronaca, `token !== sequence`. Possono anche comparire un esito o un dilemma insieme all'udienza.
- `validateSave` (`save.ts:240-242`) rifiuta allora il salvataggio automatico, e l'esportazione produce un file non importabile. Il caso è raro e rientra dopo la scelta, senza danneggiare lo slot già scritto.
- **Richiesta:** ritorno immediato dopo la risposta automatica se `next.reckoning` è aperto, con test di salvataggio su quel tick. Le matrici di campagna restano valide, perché il simulatore risponde prima della scadenza.

**3. Prove da riallineare**
- `Confronto.md` e `dominanze.json` non corrispondono ad `analisi.py`: manca la sezione sul ritmo e il bivio conta 3000 righe, come `rami-finali.ndjson`. Le vittorie 0/10/42/45 coincidono invece con `verifica-1.ndjson`.
- L'analisi non riporta gli `open`: vanno distinti dalle sconfitte.
- Il confronto misura tutto il pacchetto, non solo i rimedi. Vanno dichiarati il tetto all'Influenza ai primi due passaggi (`progression.ts:145`), il debito di salute 28 della scelta 2 e i 12 punti aggiuntivi del campo incolto.
- Riserve contro baratto, 455 a 43, non dimostra equilibrio. Il criterio assegna anche un retaggio in più alla Tavola (`winterBranches.ts:59`).
- Previdente passa da 50 a 45, con cinque perdite e nessun recupero: va scritto in `Stato.md`.
- Esiste `registro.cjs`, ma mancano `registro.json` e le immagini. Il registro e la fine della prova non hanno quindi riscontro browser in cartella.

### Difetti minori, non bloccanti
- **Promesse sul Bronzo:** in `?rimedi` `ledger` è sorteggiato e può non uscire, mentre le carte lo danno per certo. Conviene garantirlo o rendere condizionale il testo.
- **Rinnovo della Tavola:** il tetto all'Influenza in `reckoning.ts:184-186` agisce anche verso il Medioevo, senza essere annunciato.
- **Popolazione:** `reckoning.ts:183` non applica il minimo di 10 richiesto dal salvataggio. Il passaggio normale è protetto da `enterEra`; resta esposta la migrazione.
- **Eredità:** la dissoluzione decisa in `reckoning.ts:197` non assegna `legacyStructural`, a differenza delle altre.
- **Import manipolati:** è accettata un'udienza `advance` non pronta, che non si può risolvere. `marks` agisce anche in un salvataggio `current` (`events.ts:454`).
- **Conquista o regressione:** con `barter` ancora attivo, il disgelo può ripresentarsi.

### Cosa regge
- **Debiti:** il token impedisce la doppia applicazione, il pagamento è unico e `renew` scade una volta sola. Anteprima ed esito coincidono nei cinque casi testati.
- **Salvataggi:** le quattro modalità hanno database separati, l'import controlla la modalità e i vecchi file ricevono valori predefiniti.
- **Ordinario:** regole e rimedi sono vincolati alla modalità. Cambiano per tutti solo aspetto del diorama, avvisi, arrotondamento degli abitanti e selezione dei retaggi.
- **Interfaccia:** le schermate IT/EN viste a 1366×768 sono leggibili e coerenti.
- **Controlli:** 85 test superati; lint e build senza errori.

### Limiti della prova, non motivi di NO GO
Gli agenti sostituiscono solo il test su carta, come richiesto, e `Prova.md` li dichiara simulati. Usabilità, durata di 12-15 minuti, ere avanzate e semi 1001-1100 restano fuori da questo giudizio.

**Esito per modalità:**
- `?studio=inverno`: **NO GO** fino al punto 1.
- `?rimedi`: **NO GO** fino al punto 2, con una correzione piccola.
- Build: ordinario senza obiezioni; dopo le modifiche vanno ripetuti test, lint, build e browser.

Il giudizio finale seguirà con correzioni e matrici definitive.