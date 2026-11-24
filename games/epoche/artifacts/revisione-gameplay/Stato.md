# Implementazione e verifiche

La tappa pubblicabile comprende le attività autonome T01-T09, T11-T13, T28 e T29. Il controllo studio usa il parametro URL `?studio` e un archivio degli slot separato. La campagna normale usa le regole correnti. Un salvataggio senza `rules` si apre come campagna normale. Le build precedenti non supportano la modalità studio dei nuovi salvataggi.

- T01, T07. [Registro e soglie](registro.md). Il test usa un intervallo fittizio. I semi 1001-1100 sono riservati.
- T02. L’archivio originale contiene sorgenti, configurazione e build. Il manifest SHA-256 e il controllo del seme 1 sono nella cartella originale.
- T03-T06. [Misure sulle campagne ordinarie](prove/Strategie.md). Il file per-seme conserva i risultati accoppiati e le righe NDJSON contengono anche quanti pulsanti sono visibili e quanti sono pagabili. Le diramazioni confrontano ogni risposta con tre strategie successive.
- T08-T09. [Carte](carta/Carte.md), [esiti per chi conduce](carta/Esiti.md), [schede per le sessioni](sessioni/Protocollo.md).
- T11-T13. `trialSequence.ts` confronta la sequenza siccità, raccolto secco, inverno nei 100 semi di calibrazione. La prova termina al registro del Bronzo o alla dissoluzione. Il diario della prova resta nel browser e si esporta dal finale. Il controllo è conservato accanto al pacchetto originale.
- T28-T29. Slot e Genesi illustrano l’Eredità, il modificatore che ogni scelta applica ai tratti e la probabilità di acqua nelle celle interne idonee. Il seme resta modificabile nelle opzioni avanzate. Regione mostra le pressioni attive e apre le riforme. La popolazione usata per la soglia è espressa in abitanti interi.
- T10. In attesa delle tre osservazioni reali previste dal prototipo. T14-T27 e T30-T40 dipendono direttamente o indirettamente da quel riscontro. Le sessioni con cinque e dodici persone saranno possibili dopo la prima implementazione dei rimedi.

## Ripetere le verifiche

Dalla cartella del gioco eseguire `npm ci`, `npm run lint`, `npm test` e `npm run build`. Servire `dist` alla porta 5277. Per il controllo congelato estrarre `controllo-studio.zip` e servire la sua cartella `dist` alla porta 5278. L’archivio contiene anche i sorgenti del controllo. In entrambe le build aprire `/?studio`. Il diario registra l’arrivo del dilemma, l’apertura e chiusura effettiva della carta, lo scorrimento e i passaggi di velocità. L’ID della risposta è quello del motore.

Per le misure usare `npx tsx tools/sim/compareResponses.ts --seeds=1-25 --routes=0,1 --strategies=first,random,cautious,foresight,wait,spend,heritage,ordinary --output=continuita-nuova.ndjson`. Ripetere su 101-200 per la calibrazione. Per i rami usare `npx tsx tools/sim/branches.ts rami-nuovi.ndjson stati-nuovi`. La seconda posizione è la cartella degli stati compressi. I risultati attesi sono in `prove`.

Le 1.743 continuazioni di 200 stati hanno dato risultati identici byte per byte alla ripetizione. [Verifica](review/riproducibilita.json). I 77 test sono passati. Chrome ha verificato le due lingue a 1366×768 e 1920×1080 e il diario su entrambe le build.
