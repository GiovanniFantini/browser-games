# Due giri di playtest simulati

Il primo giro usa la build epoche-020-locale-2dce5dcada57. Ogni agente parte con chat e contesto browser nuovi, conosce solo consegna, seme, ritmo, lingua e modalità di accesso. Gioca attraverso i controlli visibili. Gli agenti del secondo giro ricevono la build successiva senza i resoconti del primo. Le assenze di 30–60 minuti si provano spostando l'orologio del browser dopo il salvataggio. I risultati misurano il comportamento di giocatori simulati. Le soglie con persone dei due playtest della roadmap restano da misurare.

## Primo giro

| Sessione | Modalità | Comportamento osservato | Punto raggiunto |
|---|---|---|---|
| A1 | Rapido, IT, seme 1 | Ha cercato le risorgive e fatto decidere insieme i gruppi. Durante un dilemma ha consultato i pannelli e alzato Insediamento. L'ordine suggeriva di riavviare il tempo. Per applicarlo ha dovuto riaprire il dilemma e scegliere. La soglia effettiva del 64% era in una sezione chiusa. Per un tick la maturazione mostrava 0:36/0:36 con un secondo ancora da attendere. | Neolitico, 104 abitanti, legittimità 61%, dilemma «Granai oltre misura». |
| A2 | Storico, IT, seme 1 | Dopo la scelta delle risorgive aveva 21,7 Influenza. Al rientro da 35 minuti simulati ne aveva 7,4. Il riepilogo mostrava popolazione, legittimità e otto voci ma ometteva la risorsa che limitava la decisione. Ha scelto di trasferirsi alla sorgente spendendo 5. | Preistoria, 57 abitanti, partita ripresa. |
| A3 | Rapido, EN, seme 2 | Il requisito nascosto appariva come «Settled 50% ≥ 64%». Un ordine respinto per influenza insufficiente mostrava un messaggio in fondo alla lista senza il costo. Una crisi delle risorse ha proposto di tornare all'era precedente, quando la civiltà era ancora nell'era iniziale. | Dialogo dell'età buia in Preistoria. |
| A4 | Rapido, IT, seme 2 | Ha aperto le politiche richieste, trovato la soglia del 64% e portato Insediamento a 75. Ha speso 9 Influenza per dare voce a entrambi i gruppi. Ha riconosciuto la conseguenza nella cronaca. | Neolitico, 100 abitanti, Metallurgia come traguardo successivo. |
| A5 | Storico, EN, seme 2 | Dopo aver portato Settlement a 100 è uscito e rientrato dopo 30 minuti simulati. Ha riconosciuto la decisione pendente e il costo delle tre risposte. Il riepilogo ometteva il calo da 20,1 a 4,3 Influenza e il momento in cui l'avanzamento si era fermato. | Preistoria, 46 abitanti, dilemma del greto; ha indicato la risposta gratuita. |

Tutti e tre i tentativi Rapido hanno individuato il pannello chiuso come ostacolo. Due hanno raggiunto il Neolitico, uno un esito strutturale. Entrambi i rientri Storico hanno individuato il calo di Influenza consultando la schermata successiva.

## Modifiche prima del secondo giro

- Nell'Insediamento le vie di riforma partono aperte. Ogni voce indica politica, direzione, soglia richiesta e valori impostato ed effettivo. La maturazione mostra i secondi trascorsi arrotondati per difetto.
- Un ordine respinto mostra accanto al cursore quanto costava e quanta Influenza era disponibile quando il motore lo ha valutato. La coda durante un dilemma indica quale decisione occorre riaprire.
- Al rientro sono visibili durata dell'assenza, tempo recuperato alla velocità salvata e Influenza prima e dopo il recupero.
- Nell'età buia in Preistoria il testo descrive la ripartenza nella stessa era e dalla data corrente. Le ere successive mantengono la spiegazione della regressione.

La build del secondo giro è identificata dallo [ZIP locale](../../artifacts/playtest-agenti/campagna-giro2.zip) con SHA-256 f1d44327073d2349d221aac1d6cd46c663a3336d6d5c583acf3865e0241285e2. Le modifiche riguardano entrambe le lingue.

## Secondo giro, cinque agenti nuovi

| Sessione | Modalità | Cosa ha usato il giocatore | Ultimo stato verificato |
|---|---|---|---|
| B1 | Rapido, IT, seme 1 | Ha seguito maturazione, popolazione, sapere e politiche effettive. Nel Futuro ha scelto Automazione estesa e Beni comuni. L'anteprima di Risorse comuni ha intercettato il clic finale; ha usato Invio. | Trascendenza nel 2251, Maira, 849.548 abitanti, Eredità 51. |
| B2 | Storico, EN, seme 2 | Ha impostato Settlement a 76%. Dopo 45 minuti, il foglio indicava 7:43 di simulazione, 40→46 abitanti e 25→9,1 Influenza. Ha riconosciuto la pausa e speso 5 per razionare l'acqua. Ha chiesto quale decisione lo attendesse e come fosse stata spesa l'Influenza. Uscendo ha visto per un attimo lo slot libero. | Preistoria, 46/78 abitanti, politica effettiva 76%. |
| B3 | Rapido, EN, seme 2 | Ha portato Settlement al 75%, seguito una delle due vie del Neolitico e riconosciuto la conseguenza della scelta di riunire i focolari. Nell'era contemporanea l'anteprima di Defence ha coperto il pulsante di avanzamento. Ha usato Invio. | Trascendenza nel 2439, Nerira, 1.113.176 abitanti, Eredità 51. Durata riportata 6:24, comprese pause e ostacolo. |
| B4 | Storico, IT, seme 1 | Ha osservato la Stanzialità effettiva crescere dal 63,3% all'80,8% con impostazione 86%. Il quinto rientro segnava 76,3/78 abitanti; al sesto erano 112,1. Ha suggerito di nominare il dilemma e raggiungerlo direttamente. Ha visto un avviso temporaneo di salvataggio fallito, seguito dalla conferma di salvataggio. | Neolitico dopo sei rientri di circa 35 minuti simulati. |
| B5 | Rapido, IT, seme 3 | Ha seguito le alternative di Metallurgia e delle ere successive. Nel dilemma «Cure a distanza» ha aperto ambulatori negli habitat. Ha ritrovato la conseguenza nel riepilogo finale. In Neolitico l'anteprima di Divisione del raccolto ha intercettato il clic. Ha usato Invio. | Trascendenza nel 2160, Maava, 289.073 abitanti, Eredità 51. |

In Rapido tutti e tre hanno raggiunto la Trascendenza da Genesi. Tutti e tre hanno incontrato un'anteprima sopra il pulsante e hanno proseguito con la tastiera. In Storico entrambi hanno spiegato la pausa al rientro e hanno compiuto la scelta successiva. I due gruppi erano indipendenti e il primo era libero di fermarsi prima: i conteggi dei finali descrivono i tentativi osservati e non stimano un miglioramento del tasso di completamento umano.

## Correzioni e riprove dopo il secondo giro

- Le anteprime delle politiche si aprono sopra o sotto il cursore, nella sua colonna. A 1280×720 su Firefox, col controllo Risorse comuni a fuoco, il test ha trovato l'anteprima al centro del pulsante finale sulla build del giro. Dopo la correzione ha controllato i cursori del Futuro e raggiunto Trascendenza con il mouse. [Confronto del puntatore](../../artifacts/playtest-agenti/puntatore.json).
- Il riepilogo distingue l'Influenza complessiva dalla spesa effettiva della dottrina per i dilemmi minori. Se la civiltà attende un dilemma decisivo, lo nomina e offre «Vai alla decisione». Nella riprova da 35 minuti la dottrina ha speso 18 punti, il saldo è passato da 30 a 14,3 e il pulsante ha aperto «Il greto affiora». [Riprova del rientro](../../artifacts/playtest-agenti/rientro-e-slot.json).
- Prima di mostrare le azioni sugli slot, l'elenco attende i dati di IndexedDB. Se la lettura fallisce, permette di riprovarla. Prima della correzione l'osservazione del DOM registrava «Slot libero», poi «Nerira». Con la correzione il primo nome mostrato è «Nerira».
- Il salvataggio automatico attende il primo stato della campagna dal Worker, anche quando cambia la visibilità della scheda. Per l'avviso temporaneo visto da B4 la causa resta indeterminata; l'agente ha successivamente osservato «Progressi salvati».

## Campagna Storico completa e consegna locale

Una prova supplementare, con un agente nuovo sulla build di riprova, ha portato Maira da Genesi a Trascendenza in Storico, seme 1. Ha raggiunto il Futuro al ventesimo rientro e il finale nel 3238 d.C., con 1.543.639 abitanti ed Eredità 51. Il contatore Eredità è stato verificato anche nella schermata degli slot. Il driver ha eseguito 49 rientri in circa 11 minuti reali; diversi erano superflui perché cercava ancora il comando «Entra nella nuova era» quando era già disponibile «Compi la trascendenza». Il totale dei rientri non misura la durata necessaria per completare la campagna.

Nel Bronzo un recupero di 35 minuti a 4× ha lasciato visibile «Preparazione» per oltre 30 secondi sul PC di prova. Ora il Worker comunica la percentuale di tempo d'assenza simulato. Nella [riprova](../../artifacts/playtest-agenti/rientro-consegna.json) la percentuale avanzava fino al dilemma che ha fermato il recupero. Questo intervento rende visibile il lavoro in corso. Il tempo di calcolo dipende dalla quantità di simulazione da recuperare.

La versione italiana mostra «Società a capi» come livello di complessità. Quando la Trascendenza è disponibile al rientro, il riepilogo indica dove raggiungerla senza compiere la scelta al posto del giocatore. Verificato il passaggio dal riepilogo al finale in italiano e inglese, inclusa una ripresa in presenza di crisi. [Risultati](../../artifacts/playtest-agenti/finale-al-rientro.json).

Una riprova indipendente su uno slot del Futuro in Chrome a 1280×720 ha raggiunto la Trascendenza con un clic al centro del pulsante mentre l'anteprima di Risorse comuni era aperta. Questa è una prova mirata sul salvataggio, separata dalle tre campagne Rapido iniziate da Genesi.

La [campagna aggiornata](http://127.0.0.1:4573/epoche/) è disponibile sul PC. Il [manifest](../../artifacts/playtest-agenti/build.json) identifica le versioni dei due giri, della riprova Storico e della consegna. L'[archivio della campagna](../../artifacts/playtest-agenti/campagna-locale.zip) ha SHA-256 4f76dd66300e594667bc23de5f08fcbe915ddef32957e032b54f532870a1c823. Il pacchetto è stato confrontato con i file serviti su loopback.

Verifiche tecniche: lint, 54 test, sim:check e build. Nei due ritmi il replay dei dieci semi e tre profili ha prodotto gli stessi log della baseline. La matrice usa sette stati esportati dalla build del secondo giro e confronta stato, avanzamento, esilio, guerra, coda e modifica ritardata. [Chrome 1366×768](../../artifacts/playtest-agenti/consegna-chrome-1366/matrix.json), [Chrome 1920×1080](../../artifacts/playtest-agenti/consegna-chrome-1920/matrix.json), [Firefox 1366×768](../../artifacts/playtest-agenti/consegna-firefox-1366/matrix.json), [Firefox 1920×1080](../../artifacts/playtest-agenti/consegna-firefox-1920/matrix.json).

## Rilascio e verifica del salvataggio Storico, 23 novembre 2026

La [campagna pubblica](https://giovannifantini.github.io/browser-games/epoche-campagna/) corrisponde al commit Pages 37c23a1. In Chrome è stata verificata la creazione, il salvataggio e la ripresa di una civiltà.

In sette rientri sul primo slot, con seme 1 e assenze simulate di 35 minuti, la sola ripetizione dei rientri sulla build del secondo giro non ha prodotto l’avviso. Sulla build pubblicata, ritardando di 3,1 secondi una singola richiesta di acquisizione al sesto rientro, è comparso lo stesso messaggio. Il termine di 2,5 secondi scadeva prima della risposta del Worker e il gioco segnalava un errore di scrittura prima di chiamare IndexedDB. Il playtest B4 originale non aveva una traccia dei tempi che permetta di attribuirgli con certezza la stessa causa.

La correzione locale ripete una volta l’acquisizione automatica ancora attuale. Un errore di acquisizione persistente e un errore di scrittura hanno messaggi distinti. Con la correzione, sette rientri in Chrome e sette in Firefox hanno completato il salvataggio, incluso il sesto con il ritardo indotto. In Chrome sono stati verificati anche l’esaurimento della quota, il conflitto tra schede e l’uscita con Worker senza risposta.
