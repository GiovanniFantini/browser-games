# Backlog di implementazione della revisione di gameplay di EPOCHE

Piano operativo redatto da Claude Code (Opus 5.5) a partire da [Piano.md](Piano.md). Percorso di lavoro: `C:\repos\browser-games\games\epoche`. I percorsi citati partono da lì. Gli ID sono distinti dalle schede T01-T10 della Fase 1 in `docs/tasks/`.

## Regole di lettura

- Requisiti: proposte, soglie e ordine del piano. Ipotesi: H1-H4, H6, i numeri nuovi dei rami e ogni valore qui detto proposta. Il piano non numera H5: le 12 sconfitte al Neolitico si raggruppano per seme.
- Metriche della fetta: sopravvivenza da Genesi al primo dilemma del Bronzo. Tassi dei finali: Trascendenza a fine campagna. Non si confrontano tra loro. 1/50, 9/50, 34/50 e 50/50 sono finali. Il 10/117 appartiene a una versione precedente.
- Le dipendenze ordinano il lavoro. I cancelli decisionali sono T10, T34 e T36. T37-T40 partono solo con T36 superato.
- Un agente da solo prepara codice, simulazioni, kit, moduli e analisi. Le sessioni di T10, T33 e T35 richiedono partecipanti reali disponibili. Gli agenti trovano difetti ma non contano come utenti.
- Senza persone, T01-T09, T11-T13, T28 e T29 restano eseguibili. Le attività che dipendono da T10 attendono il riscontro del prototipo.
- Il primo giro con cinque persone precede il congelamento, perché può cambiare le regole. Le dodici sessioni vengono dopo i semi sigillati.
- Anteprime, dilemmi irraggiungibili e trattati dei round 1-3 restano chiusi. Catalogo, arte e ritmo Storico non cambiano nella fetta.
- Prove in `artifacts/revisione-gameplay/prove/Txx/`, cartella nuova. Esiti in `PLANS.md`. Testi in italiano e inglese. Nessun nuovo servizio.

## Fase 1. Base misurabile

### T01. Preregistrare metriche e soglie
Dipendenze: nessuna
Intervento: creare `artifacts/revisione-gameplay/registro.md` con formule, soglie del piano, gruppi per seme e separazione fetta/finali. Proposta per la preferibilità: prima la sopravvivenza, poi il maggior numero di misure migliori tra popolazione, crisi e retaggi; i pareggi non assegnano preferenza.
Verifica: ogni soglia delle sezioni Misura e Rischi compare una volta con formula, fonte e task. Evidenza: tabella di corrispondenza.

### T02. Conservare la build attuale
Dipendenze: T01
Intervento: `games/epoche` risulta non tracciato, quindi copiare sorgenti e configurazione in `artifacts/revisione-gameplay/originale/`, senza `node_modules` e senza test (Vitest li raccoglierebbe), più la cartella `dist` ottenuta con `npm run build`.
Verifica: manifest SHA-256 ricalcolato con zero differenze; dalla copia un seme produce lo stesso esito della sorgente. Evidenza: manifest e confronto.

### T03. Parametrizzare il confronto
Dipendenze: T02
Intervento: in `tools/sim/compareResponses.ts` accettare intervallo di semi, vie, strategie e file NDJSON, mantenendo i valori predefiniti. Aggiungere riassunto per seme e conteggi di risposte visibili e pagabili.
Verifica: sui semi 1-25 e due vie riprodurre 1/50, 9/50, 34/50, 50/50 senza costi rinviati, 12 sconfitte al Neolitico, 4 nel Futuro e 4.869 dilemmi. Differenze spiegate prima di proseguire. Evidenza: NDJSON e comando.

### T04. Aggiungere le cinque strategie
Dipendenze: T03
Intervento: estendere `NarrativeProfile` in `tools/sim/campaign.ts` con previdente (conta debiti e scadenze), attendista, spendacciona prima del passaggio, favorevole e contraria ai retaggi. La prudente attuale resta la miope.
Verifica: cinque test nuovi in `tests/strategies.test.ts`, ciascuno con uno stato in cui la strategia sceglie diversamente dalla miope; stesso seme, stesso esito. Evidenza: output dei test.

### T05. Misurare la base e le ipotesi
Dipendenze: T04
Intervento: eseguire tutte le strategie sui semi 1-25 per continuità e 101-200. Misurare H1 (vicoli ciechi a 101 e ricomparsa dopo 1.800 tick), H2 (spesa prima del passaggio), H3 (attesa, comprese le quattro sconfitte con crisi preesistente) e H4.
Verifica: rapporto per seme e via con esito e intervallo per ogni ipotesi, anche se smentita; finali e sopravvivenza al Bronzo in tabelle separate. Evidenza: NDJSON e rapporto.

### T06. Duplicare gli stati incontrati
Dipendenze: T04
Intervento: creare `tools/sim/branches.ts`, che salva stati con decisione pendente, applica ogni risposta pagabile con `applyCampaignAction` e prosegue con almeno tre strategie.
Verifica: almeno 200 stati dei semi 101-200; registrare sopravvivenza, popolazione, crisi e retaggi; segnalare risposte mai migliori e risposte migliori oltre il 65%. Riesecuzione identica. Evidenza: elenco stati e rapporto.

### T07. Sigillare i semi di verdetto
Dipendenze: T03
Intervento: creare `tools/sim/holdout.ts` e far rifiutare 1001-1100 agli altri strumenti. Il comando richiede un manifest delle regole e registra l'apertura in un file che impedisce la seconda.
Verifica: test su intervallo fittizio: rifiuto senza manifest, rifiuto con hash diverso, una apertura, rifiuto della seconda. Nessun seme reale eseguito. Evidenza: output dei test.

## Fase 2. Carta e reclutamento

### T08. Preparare il prototipo su carta
Dipendenze: T05
Intervento: creare `artifacts/revisione-gameplay/carta/` con inverno, Resa dei conti, rami A e B, registro del Bronzo, tre segni e tabella dei numeri dell'esempio.
Verifica: percorrere a tavolino tutte le uscite; con crisi 12 e debito 101 A produce 53, 43 o dissoluzione, B parte da debito 28. Nessun esito anticipato fuori dalle carte. Evidenza: foglio di calcolo delle uscite.

### T09. Preparare protocolli e reclutamento
Dipendenze: T01, T08
Intervento: creare `artifacts/revisione-gameplay/sessioni/` con protocolli per 3, 5 e 12, modulo di consenso, griglia di codifica, testo di invito e piano di alternanza. Domande del piano prima e dopo il clic. Il reclutamento di persone che non conoscono il gioco è una dipendenza esterna.
Verifica: sei ordini vecchia-nuova e sei nuova-vecchia con semi diversi; criterio per correttezza e testo saltato fissato in anticipo. Evidenza: moduli e schema.

### T10. Provare su carta con tre persone
Dipendenze: T08, T09
Intervento: condurre tre sessioni con persone reali e registrare risposte, dubbi e motivazioni. L'agente prepara e analizza, senza simulare partecipanti. Proposta di cancello: almeno due su tre indicano chi perde, quando e un rimedio per entrambi i rami.
Verifica: tre moduli completi e decisione motivata dai riscontri: procedere, correggere la carta e ripetere, fermarsi. Senza partecipanti lo stato resta in attesa. Evidenza: moduli anonimi e decisione.

## Fase 3. Regole della fetta

### T11. Introdurre l'opzione di prova e proteggere i salvataggi
Dipendenze: T02
Intervento: aggiungere `rules` a `Campaign` e `StartCampaign` in `src/engine/campaign/model.ts`, a `createCampaign` e allo schema di `src/persistence/save.ts`, con `current` predefinito e versione file 1.
Verifica: salvataggi senza il campo tornano `current`; regole `current` lasciano invariati `tests/determinism.snapshot.json` e gli esiti di T03; andata e ritorno con la prova attiva. Dichiarare che una build vecchia non sostiene i nuovi salvataggi. Evidenza: matrice dei salvataggi.

### T12. Fissare la sequenza comparabile
Dipendenze: T11
Intervento: in un nuovo `src/content/campaign/trial.ts` definire siccità, raccolto secco, inverno e registro, usando `chain` e `maybeOpenEvent`. Oggi `dryHarvest` segue solo una risposta e nel Bronzo `silt` può precedere `ledger`. Chiudere la fetta al primo dilemma del Bronzo.
Verifica: 100 semi tra 101 e 200 incontrano la sequenza finché sopravvivono e si fermano sullo stesso punto. Campagne ordinarie invariate. Evidenza: NDJSON.

### T13. Aggiungere il diario locale e congelare il controllo
Dipendenze: T12
Intervento: creare `src/ui/trialLog.ts` per apertura, clic, scorrimento e pausa, esportabile con `src/ui/download.ts`. Salvare quindi una copia di controllo con soli sequenza e diario, accanto all'originale.
Verifica: differenze dall'originale limitate a T11-T13; diario privo di dati personali e nessuna richiesta di rete esterna; build servite su porte diverse, quindi archivi del browser separati. Evidenza: elenco differenze e manifest.

### T14. Modellare scadenze e segni
Dipendenze: T10, T13
Intervento: permettere in `definitions.ts` e `applyResponse` scadenze a una o due ere e aggiungere `marks` al modello e allo schema. Gli effetti durevoli entrano in `preparation`, poiché `enterEra` non conserva i modificatori.
Verifica: un debito a due ere scade una sola volta; un segno produce -2 Sostentamento per tutto il Neolitico, sopravvive al salvataggio e cessa nel Bronzo. Evidenza: test in `tests/reckoning.test.ts`, nuovo.

### T15. Conservare Influenza e perdite al passaggio
Dipendenze: T14
Intervento: in `enterEra` di `world.ts` aggiungere opzioni usate solo dal passaggio in prova: Influenza residua con base minima inferiore, da calibrare, e perdita demografica dopo il minimo di popolazione, che oggi annullerebbe il -20%. Rivali e regressione invariati.
Verifica: con 25 residui sopra base entra 25; sotto base entra la base; partita A da 100 entra con 80. Test sui rivali invariati. Evidenza: prima e dopo.

### T16. Aprire la Resa dei conti
Dipendenze: T14
Intervento: aggiungere stato `reckoning` e azione `RECKON` in `model.ts` e `applyCampaignAction`. `ADVANCE`, dopo `settleEraChain`, apre la Resa se esistono debiti o perdite da regolare. Bloccare tempo, dottrina e avanzamento offline in `campaignActionBlock`, `catchUp` e `runtime.ts`.
Verifica: ripresa dallo stesso punto, nessuna scelta automatica, nessun doppio passaggio, rifiuto di un `RECKON` superato. Evidenza: test di motore e Worker.

### T17. Offrire rimedi e prevederne l'esito
Dipendenze: T15, T16
Intervento: creare `src/engine/campaign/reckoning.ts` con rimedi da dati, retaggi impegnabili e una previsione pura usata da motore, vista e simulatore. Coprire le famiglie rinviate in Preistoria e Neolitico, con due o tre modi e una perdita sempre presente.
Verifica: previsione identica all'applicazione sui casi generati; ogni combinazione fatale della fetta offre almeno un rimedio parziale; separare offerto da sufficiente. Evidenza: tabella per famiglia e soglia.

### T18. Implementare il ramo A
Dipendenze: T17
Intervento: variante di prova di `winter.0` con Tavola comune. Resa: sementi, debito -60, Sostentamento -2 nel Neolitico e campo est incolto fino al Bronzo; clan, debito -70, popolazione -20%, Tensioni +15; nessun pagamento.
Verifica: da debito 58, Influenza 25 e crisi zero: Risorse +17, debito 101; dopo il calo a 12, ingresso a 53, 43 o dissoluzione dichiarata. Evidenza: test numerico e cronache.

### T19. Implementare il ramo B
Dipendenze: T17
Intervento: variante di prova di `winter.3`: Influenza -6, Salute +24, debito 28, nessuna Tavola. Resa: isolare, Salute -20, Tensioni +22 e capanna vuota; curare insieme, Salute -20, Risorse +18 e lotto non seminato.
Verifica: dallo stesso stato Influenza 19 prima della rigenerazione, Risorse circa 28 al passaggio e 46 con la cura comune; nessuna uscita priva di perdita. Evidenza: test numerico e cronache.

### T20. Gestire la Tavola comune
Dipendenze: T18
Intervento: aggiungere `commonTable` a retaggi e tradizioni in `definitions.ts`, rinnovo con sacrificio e consumo esplicito. La fondazione esiste solo in prova, perché `save.ts` ricostruisce i retaggi dalla cronaca e la attribuirebbe ai salvataggi vecchi.
Verifica: attiva per Preistoria, Neolitico e Bronzo, scompare nel Classico senza rinnovo; consumata non si rinnova; un vecchio salvataggio con `winter.0` non la riceve. Evidenza: test di vita e migrazione.

### T21. Chiudere la fetta con il registro
Dipendenze: T19, T20
Intervento: varianti di prova di `ledger`: A condona consumando la Tavola con meno cibo e può riaccogliere il clan cedendo un lotto; B riceve la richiesta di una quota dai parenti dei malati e terreno disponibile secondo la cura.
Verifica: sei percorsi noti mostrano opzioni e perdite diverse, con alternativa gratuita. Nessuna Tavola in B. Evidenza: tabella dei percorsi e test.

### T22. Verificare sconfitte e casi laterali
Dipendenze: T21
Intervento: registrare in cronaca i rimedi offerti e l'eventuale rifiuto. Trattare anche la migrazione dopo conquista, che oggi chiama `settleDeferred` senza passare da `ADVANCE`; definire debiti multipli, crisi alte e regressioni.
Verifica: sui semi 101-200 zero sconfitte da debito senza un rimedio offerto prima; elencare i rimedi insufficienti senza contarli come successo. Evidenza: NDJSON e casi.

## Fase 4. Interfaccia, villaggio e ritmo

### T23. Costruire la finestra della Resa
Dipendenze: T17, T18, T19
Intervento: estendere `buildCampaignView` e `CampaignDialogs` in `CampaignPanels.tsx`: debiti, retaggi impegnabili, prezzi ed esito. Il pulsante diventa «Affronta il passaggio» e accanto dichiara l'esito; il Consiglio non annuncia via libera davanti a un debito fatale.
Verifica: nei casi 53, 43, dissoluzione, 28 e 46 valori uguali al motore; uso completo da tastiera. Evidenza: catture nelle due lingue a 1366×768.

### T24. Ridisegnare le carte
Dipendenze: T23
Intervento: in `CampaignPanels.tsx`, `campaign.css` e dizionari mostrare chi perde oggi, che cosa torna e quando, che cosa si salva. «Nessun costo» diventa «Influenza 0»; fatalità solo quando vera, sollievo visibile, dettagli a richiesta. Le carte nuove valgono nella prova.
Verifica: a 1366×768 quattro risposte compatte senza scorrimento; inverno a cinque e officina a sei raggiungibili e confrontabili; frase sulla dissoluzione non ripetuta. Evidenza: misure e catture.

### T25. Disegnare i tre segni
Dipendenze: T14, T21
Intervento: in `src/map/diorama.ts` rendere campo o lotto incolto, capanna vuota del clan o dei malati e Tavola comune presente o mancata; mostrare i debiti sullo stesso lotto.
Verifica: ogni segno resta nella medesima posizione dopo passaggio e ricaricamento e scompare alla scadenza; confronto dei sei percorsi. Evidenza: coppie di catture e stato salvato.

### T26. Rendere leggibile il villaggio
Dipendenze: T25
Intervento: in `Diorama.tsx` spostare `.village-notice` fuori dagli edifici e aggiungere retaggi cliccabili in scena, con `heritageCamera` aggiornata. Controllare nella build attuale se castello e osservatorio spariscono dall'era successiva; correggere i lotti solo se il difetto esiste.
Verifica: intersezione nulla del fumetto con i riquadri degli edifici in quattro luoghi; ogni retaggio raggiungibile da mouse e tastiera. Evidenza: misure, catture ed esito sui lotti.

### T27. Spiegare e rigiocare la sconfitta
Dipendenze: T22, T23
Intervento: aggiungere a `CampaignDialogs` «Rivedi la scelta decisiva», con causa, rimedi e ramo, e nuova partita con stesso seme, scelte, ritmo ed Eredità iniziale. Conservare quest'ultima, oggi assente nello stato, perché `launch` usa il totale aggiornato.
Verifica: ogni sconfitta della fetta indica la sequenza corretta; la nuova partita ha lo stesso stato iniziale, escluso l'ID. Evidenza: confronto e catture.

### T28. Chiarire slot e Genesi
Dipendenze: T13
Intervento: in `CampaignApp.tsx` e dizionari aggiungere una frase di promessa agli slot, spiegare Eredità, spostare il seme nelle opzioni avanzate, distinguere l'estremo «Equilibrio» dal centro e mostrare l'effetto delle quattro scelte ricavato da `createIdentity` e `makeWorld`.
Verifica: ogni testo coincide con una variazione osservabile ai valori 0, 50 e 100; seme assegnabile e riproducibile. Evidenza: tabella e catture.

### T29. Correggere gli errori locali
Dipendenze: T13
Intervento: in `App.tsx`, `theme.css` e `CampaignPanels.tsx` evitare che il selettore copra l'era, mostrare popolazione intera accanto alla soglia, tenere visibile il danno sanitario e aprire inizialmente «Politiche richieste», rendendo coerente quanto riporta il playtest.
Verifica: 1366×768 e 1920×1080, italiano e inglese, nomi lunghi, nessuna sovrapposizione né soglia arrotondata in modo ingannevole. Evidenza: catture e misure.

### T30. Provare un ritmo più lento
Dipendenze: T12, T24
Intervento: aggiungere tempi di prova separati da `rapidTiming`, perché Storico ne deriva: meno dilemmi, pausa alla prima lettura e due o tre scelte concatenate. Confrontarli con l'intervallo attuale di 10,5 secondi a 1×.
Verifica: Storico invariato; l'orologio non avanza alla prima lettura; tabella di dilemmi e durata per era nelle due cadenze, con obiettivo 12-15 minuti da confermare nelle sessioni. Evidenza: diario e tabella.

### T31. Verificare la fetta completa
Dipendenze: T22, T26, T27, T28, T29, T30
Intervento: eseguire `npm run lint`, `npm test`, `npm run build`, la matrice dei salvataggi vecchi, correnti e interrotti in Resa, poi giocare in Chrome entrambi i rami. Aggiornare README e documenti di design toccati.
Verifica: controlli superati, sei percorsi completati e zero errori JavaScript; fetta disattivata uguale al comportamento originale salvo T28-T29. Evidenza: registro, catture e limiti.

## Fase 5. Verdetto

### T32. Calibrare sui semi 101-200
Dipendenze: T06, T22, T30, T31
Intervento: misurare controllo e fetta con condizioni iniziali identiche e calibrare base di Influenza e prezzi. Se tutte le strategie superano il 90%, aumentare prima il prezzo umano, poi i punti.
Verifica: sulla fetta previdente sopra la miope e sotto il 95%; spesa e attesa senza vantaggio sistematico; A e B preferibili ciascuno in almeno il 30% di almeno 200 stati; risposte dominate corrette e casi oltre 65% rivisti. Finali riportati a parte, senza soglia. Evidenza: serie di prove, inclusi i fallimenti.

### T33. Osservare cinque persone
Dipendenze: T09, T32
Intervento: cinque persone reali che non conoscono il gioco provano la fetta. L'agente prepara build, moduli e analisi, poi corregge i blocchi e riesegue T31 e T32 se cambiano le regole. Senza partecipanti fermarsi qui.
Verifica: cinque registrazioni di compiti e blocchi, con correzione o motivazione dei blocchi ancora aperti. Nessuna soglia del giro a dodici viene dedotta. Evidenza: moduli anonimi e registro.

### T34. Congelare e aprire i semi sigillati
Dipendenze: T07, T33
Intervento: congelare regole, strategie e formule; eseguire una sola volta 1001-1100 su controllo e fetta. Cancello: criteri di T32 senza ritocchi. Se falliscono, niente sessioni di verdetto: documentare il motivo e, in caso di revisione, usare un nuovo intervallo per il ciclo successivo.
Verifica: 100 semi per versione, risultati raggruppati per seme, hash uguali al manifest e una sola apertura. Evidenza: manifest, NDJSON e verdetto.

### T35. Confrontare con dodici persone
Dipendenze: T34
Intervento: dodici nuove persone reali provano vecchia e nuova versione in ordine alternato con semi diversi, usando la copia T13 e la build congelata. Nessuna modifica alle regole durante il giro. L'agente prepara e calcola, altri reclutano.
Verifica: 12 moduli completi; almeno 9 risposte corrette, A e B scelti da almeno 3, almeno 8 vogliono rigiocare, nessuno giudica invisibile la causa. Registrare durata, lettura, scorrimenti e pause. Evidenza: dati anonimi e codifica.

### T36. Decidere arresto, alternativa o estensione
Dipendenze: T35
Intervento: sottoporre il rapporto a Giovanni. Se più della metà salta i testi, ridurre i dilemmi. Se la comprensione peggiora rispetto al controllo, tenere le carte e togliere le scadenze a due ere. Se A e B sembrano la stessa scelta, fermarsi e ripensare il debito. Dati mancanti non equivalgono a superamento.
Verifica: ogni criterio ha valore, soglia ed esito; una modifica alle regole richiede nuovo ciclo e semi nuovi; decisione scritta. Evidenza: rapporto e `PLANS.md`.

## Fase 6. Estensione condizionale

### T37. Estendere a Età moderna e caso delle corsie
Dipendenze: T36
Intervento: applicare Resa e rimedi a `shortage`, la cui risposta 4 riduce `state` quando quel debito nasce dallo stesso dilemma. Rendere il rimedio utile al primo incontro o spostarlo alla Resa. Verificare il caso analogo `wards` nel Contemporaneo.
Verifica: censire le 16 risposte che creano debiti e le 5 che li riducono; nessun sollievo mostrato a debito zero; ogni debito fatale ha un rimedio con perdita. Evidenza: censimento e test.

### T38. Estendere al Futuro
Dipendenze: T37
Intervento: aprire la Resa tra Informazione e Futuro, dove scadono debiti di `heat` e `servers`. In `habitatWorkshop` correggere il confronto tra maestri (costo 2, Risorse 14) e carrelli (costo 3, Risorse 21), facendo cambiare chi paga. Alla Trascendenza non si aggiunge una Resa: in era 9 i debiti non vengono creati.
Verifica: nessuna delle sei risposte domina; duplicazione su almeno 200 stati; sollievo visibile. Evidenza: rapporto e catture.

### T39. Differenziare retaggi permanenti e deperibili
Dipendenze: T38
Intervento: dare ai permanenti usati in `borderTax`, `lobby`, `orbitCare` e `orbitalCrossing` vie con obblighi ricorrenti. Per Fiera e Scuola sostituire il rinnovo gratuito all'uso con sacrificio o consumo. Estendere soltanto risposte già catalogate.
Verifica: T06 su stati con e senza retaggio: mai costo e danno entrambi inferiori senza un'altra perdita; strategie favorevole e contraria senza dominanza oltre il 65%; vecchi salvataggi validi. Evidenza: rapporto e matrice.

### T40. Verificare la campagna estesa
Dipendenze: T39
Intervento: calibrare di nuovo su 101-200, congelare e usare una sola volta un intervallo nuovo, proposta 2001-2100. Completare in Chrome i passaggi di Moderna, Contemporaneo e Futuro, poi una Trascendenza e una sconfitta.
Verifica: sui finali previdente sopra la miope e sotto il 95%, nessun vantaggio sistematico di attesa o spesa, zero sconfitte da debito senza rimedio offerto, Storico invariato. Evidenza: NDJSON, manifest, catture e documenti aggiornati. Il comfort delle persone nelle nuove ere resta da misurare.
