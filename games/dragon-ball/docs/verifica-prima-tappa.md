# Verifica della prima tappa

Prima verifica: 8 novembre 2026. Revisione di colori e ambientazione: 9 novembre 2026.

## Ambiente

Ultima revisione dei personaggi: sostituzione delle factory procedurali con GLB locali creati in Blender. Verificati caricamento nel gioco, ritratti delle mesh, ripresa del salvataggio di prova, dialogo dell'incontro con Bulma e passaggio all'obiettivo della Sfera, movimento, salto e pose di trasporto/sollevamento. Il confronto dei modelli ha verificato camminata e viste statiche. Le prove hanno usato la porta 5174, senza leggere o modificare il salvataggio di Giovanni sulla porta 5173. La resa artistica non è ancora approvata. Dettagli e misure nel documento dei modelli.

Windows, Node.js 24.20.0, npm 11.19.0. Verifica interattiva nel browser integrato di Codex, con server Vite locale. Non è stata ancora eseguita una matrice separata di Chrome, Edge e Firefox, né una misurazione delle prestazioni su un computer di riferimento con GPU registrata.

## Controlli automatici

- Compilazione TypeScript e build di produzione.
- La build della revisione produce circa 606 kB di JavaScript minificato, circa 157 kB gzip. Vite segnala il superamento della soglia indicativa di 500 kB per un singolo chunk; la build termina correttamente. La libreria 3D costituisce la parte principale del bundle. Non sono stati misurati i tempi di download.
- Cinque test su ordine della progressione dal prologo del pesce e impossibilità di avanzamenti duplicati, compatibilità dei salvataggi precedenti, conservazione di stato e posizione dopo lettura, riconoscimento di dati corrotti o futuri senza modificarli, distinzione tra salvataggio assente e storage non disponibile.

## Verifica interattiva

- Nuova partita con conferma quando esistono già progressi.
- Movimento di Goku dalla casa a Bulma e ritorno, corsa e comando di salto.
- Rotazione della telecamera con mouse e tastiera; collisioni con alberi e casa. Gli alberi intercettati dalla visuale diventano semitrasparenti; gli ostacoli solidi accorciano la distanza della telecamera.
- Primo dialogo con Bulma, aggiornamento dell'obiettivo, percorso di Bulma verso la casa e dialogo sulla Sfera a quattro stelle.
- Ricaricamento della pagina, disponibilità di Continua la partita e ripresa dal punto e dall'obiettivo salvati.
- Ultimo incontro con Bulma, messaggio di completamento e possibilità di continuare a esplorare.
- Pausa e ripresa, passaggio alla qualità leggera.

## Revisione del 9 novembre

- Verifica visiva di palette satura, ombre toon e cielo azzurro, con rimozione della velatura beige del menu e della nebbia vicina.
- Recupero del pesce gigante sulla riva e trasporto verso il sentiero; arrivo dell'auto e dialogo del fraintendimento.
- Percorso di Bulma fino alla casa, attraversamento della porta da parte di Goku e scoperta della Sfera sul comò, all'interno della stanza.
- Accordo con Bulma dentro casa e completamento dei quattro obiettivi.
- Ricaricamento dell'ultima build e ripresa dal completamento, nella stessa stanza; controllo visivo della vista in trasparenza per pareti e tetto. Nessun errore o avviso rilevato nella console della build verificata.
- Le prove del nuovo percorso usano l'origine locale sulla porta 4173, distinta da quella sulla porta 5173. I salvataggi preesistenti del giocatore sulla porta 5173 non sono stati cancellati o sostituiti.

## Limiti

Questa verifica riguarda soltanto la prima tappa. Nessuna prova della saga completa è possibile finché le altre zone non sono realizzate. Non sono ancora misurati fps, tempi di caricamento o compatibilità su hardware diversi. Il comportamento con storage negato e dati corrotti è verificato nei test della persistenza, non attraverso impostazioni reali del browser.

I modelli e le animazioni sono realizzati proceduralmente e restano da rifinire. Il pesce si recupera con un'interazione semplice, senza un combattimento o un minigioco di pesca. Arrivo e sollevamento dell'auto sono brevi animazioni stilizzate: non rappresentano ancora tutta la scena del capitolo. La disposizione geografica e le proporzioni degli ambienti sono adattamenti per il gioco, non una ricostruzione esatta delle tavole. Questi limiti non certificano la fedeltà completa dell'intero capitolo del manga.

## Riferimenti verificati

- [Bulma nel primo arco, con tavole colorate del capitolo 1](https://en.dragon-ball-official.com/news/01_3933.html): abbigliamento, auto TURBO, fraintendimento iniziale e scoperta della Sfera in casa.
- [Casa del nonno Gohan](https://en.dragon-ball-official.com/news/01_680.html): riferimento alla singola stanza e alla tavola dell'interno con letto, tavolo, comò e porte.
- [Pesce gigante](https://en.dragon-ball-official.com/news/01_3043.html): presenza nell'inizio del manga. La meccanica attuale è un adattamento semplificato.

Le immagini consultate non sono incluse come texture o altri asset distribuiti nel gioco. Modelli, scritte e geometrie sono creati nel codice.
