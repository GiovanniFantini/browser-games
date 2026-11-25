# Il guado, candidata della partita breve

La modalità si apre dalla lista delle campagne o con `?valle`. Cinque stagioni, due squadre, quattro luoghi e un vicino. Il tempo avanza alla conferma. Gli incarichi delle due squadre sono annullabili finché restano sulla mappa. Chi riapre una partita riprende dall’ultima stagione confermata. La modalità usa slot propri. Esportare e reimportare conserva seme, impegni e scelte delle squadre.

Dopo la prima review di Opus abbiamo trasformato legna, fuoco, barca e abitanti in oggetti disegnati in base allo stato. La piena si ritira, il raccolto lascia solchi e il finale ricorda l’ospite, il guado e il patto. I due gruppi si assegnano sulla mappa o con i controlli accessibili a tastiera. La prima squadra imposta l’opera, la seconda sceglie un incarico compatibile. Quando entrambe servono alla stessa opera il gioco lo indica. La legna sul terrazzo, i coltivatori e la barca possono quindi trovarsi in luoghi diversi.

## Risultati riproducibili

- Sui semi 1 e 2 l’enumerazione delle azioni legalmente disponibili arriva a 193 e 174 storie complete. I test ricostruiscono le storie dal seme e dagli ordini anche su altri quattro mondi.
- A parità di piena alta, legna e promessa, consegnare il carico a Nara lascia un passaggio al disgelo, ma le sementi marciscono. Trattenere la squadra per riparare il tetto salva le sementi e l’ospite permette di seminare. Nara ritira il passaggio. Entrambi i risultati sono raggiungibili.
- Con piena alta e identici lavori successivi, i granai privati rialzati conservano il seme. Il deposito comune senza un tetto riparato lo perde. Con acqua ordinaria, il deposito comune può invece trattenere la famiglia che sostituirà i raccoglitori malati.
- Le 200 partite di confronto usano 25 coppie di semi fluviali e quattro criteri. Prima risposta: 27 raccolti e 23 trasferimenti. Casuale: 15 raccolti, 7 trasferimenti e 28 dispersioni. Prudente: 50 raccolti. Previdente: 35 raccolti e 15 trasferimenti. Una quinta politica ripete sempre gli stessi incarichi. Ottiene 50 raccolti, rinunciando sia all’ospite sia al patto. Il trasferimento tiene unita la comunità. Il primo ordine disponibile evita la dispersione in tutto questo campione. Queste politiche hanno regole fisse, consultabili in [valley.ts](../../tools/sim/valley.ts). Il prologo e la campagna storica hanno regole e finali diversi.
- In Chrome sono stati giocati quattro percorsi a seme fissato, tra cui piena alta e bassa, promessa mantenuta e infranta, riapertura a metà partita, entrambi i controlli delle squadre da mappa e tastiera, ripetizione del seme in un altro slot, IT ed EN. I controlli della build servita sotto `/epoche-campagna/` verificano anche importazione, resa a 1093×614 e 390×844, risorse grafiche e assenza di scorrimento orizzontale.
- La matrice è in [matrice.json](matrice.json). I casi accoppiati e i conteggi dell’enumeratore sono in [rami.json](rami.json). Le partite browser sono in [browser.json](browser.json) e [ripresa.json](ripresa.json).

## Criteri della seconda review

1. L’enumeratore incrocia tutte le sequenze legali dei 23 mondi di piena alta con quelle dei 27 di acqua ordinaria. Per ciascun raccolto confronta ospite e promessa mantenuta e, dopo una piena alta, tetto riparato. Una sequenza è superata se un’altra conserva ogni bene e ne ottiene almeno uno in più. In nessuna delle 621 coppie la stessa sequenza resta insuperata con entrambe le piene. Con piena alta rimangono accessibili raccolto con promessa, raccolto con ospite e tetto, trasferimento con promessa e ospite. Il controllo è eseguibile tramite `tsx tools/sim/valleyBranches.ts`.
2. Il deposito privato è disegnato sulla terrazza. Quello comune sorge al focolare. I casi con piena alta sono documentati in 07-granaio-1366.jpg e 03-rottura.jpg.
3. Le squadre si muovono separatamente. 06-movimento.jpg mostra il turno a 1× con un gruppo alle case rialzate e l’altro all’approdo per la consegna.
4. Lobby e testata presentano Il guado come prototipo. I risultati della verifica di conferma e posizione dei segnalini sono in [impaginazione.json](impaginazione.json).

## Prova con persone

Il compito 12 richiede la partita di Giovanni e cinque esordienti. Per ciascuno registrare tempo al primo ordine intenzionale, risposta a «Chi ha pagato la scelta del deposito?» e scelta spontanea tra uscire, continuare e riprovare. Tre esordienti che proseguono o riprovano e quattro che spiegano il costo consentono di aprire la tappa 3. Queste osservazioni sono ancora da raccogliere. La comparativa con dodici persone è successiva alla campagna completa.

## Illustrazione

La mappa deriva da due generazioni con imagegen integrato. Il primo prompt chiedeva una valle preistorica illustrata a guazzo e inchiostro, con terrazza asciutta in alto a sinistra, ripari e fuoco a sinistra, cataste sull’ansa e barca sulla riva opposta. Il secondo chiedeva la stessa inquadratura ripulita da cataste, canoa, fuoco e fumo. Il terreno usa [valle-terreno.jpg](../../public/art/valle-terreno.jpg). Gli oggetti mobili usano porzioni di [valle-guado.jpg](../../public/art/valle-guado.jpg).

