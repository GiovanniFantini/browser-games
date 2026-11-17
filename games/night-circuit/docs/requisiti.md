# Requisiti e percorso di realizzazione

## Ottimizzazione autorizzata il 17 novembre 2026

Giovanni richiede di provare le ottimizzazioni proposte dalla review Opus e misurarne il risultato conservando la grafica. La versione locale mantiene contenuti, parametri e risoluzione degli effetti; separa il riflesso planare dalla scena principale, riusa matrici e Reflector, precompila sul target corretto e ripristina la sonda dopo i cambi di qualità. I render aggiuntivi di preriscaldamento sono stati scartati perché alteravano due confronti visivi. Tutti i nove confronti della versione finale hanno zero pixel differenti. Il [resoconto prestazionale](prestazioni-rendering.md) distingue le misure nella GPU virtuale dalla verifica ancora non disponibile sul PC reale. Non è stata introdotta una nuova architettura di streaming.

## Obiettivo completo confermato

NIGHT CIRCUIT: Neon Streets è un racing arcade a mondo aperto nella città inventata Port Riders, sempre di notte. Il giocatore esplora, trova gare e negozi, guadagna crediti e reputazione, personalizza auto originali e affronta rivali. La personalizzazione costituisce il centro del progetto.

La richiesta iniziale è stata approvata attraverso il documento di progettazione in chat. L'utente ha autorizzato in sequenza le fasi 1, 2, 3, 4, 5, 6, 7 e 8 fino al completamento. La prima review del prototipo fu affidata a un secondo agente disponibile. La review conclusiva richiesta da Giovanni usa Claude Code locale con il modello Opus e confronta il codice con il testo iniziale integrale; vedere review-finale.md.

Stato locale: fasi 1-8 completate e verificate funzionalmente. La misura dei 60 fps su GPU integrata resta esterna alla verifica software disponibile; risultati e limiti correnti sono in review-finale.md. La review iterativa Codex/Opus è conclusa con READY TO PROD per la build statica.

## Vincoli comuni al gioco

La successiva richiesta di Giovanni stabilisce una soglia visiva minima equivalente al riferimento console fornito in chat. La verifica è affidata a Claude Code locale con Opus, confrontando immagini reali del gioco e riferimento. Continuare a correggere e richiedere review finché il verdetto non è `raggiunto`. Il precedente READY TO PROD riguarda la verifica funzionale e non chiude questa revisione grafica. Stato ed evidenze in review-visiva.md.

- Tutti i contenuti creativi originali: nessun marchio automobilistico/aftermarket reale, modello reale, sagoma riconoscibilmente copiata, città reale o riferimento ad altri giochi. Nitro è il nome del boost. Personaggi, testi, loghi e UI originali.
- Almeno 50 auto originali e almeno 12 costruttori inventati dettagliati nel gioco completo. Famiglie di compatte, coupé, berline/SUV sportivi, vetture storiche da corsa, monoposto e supercar con sagome proprie.
- Nessun asset esterno, nemmeno CC0. Texture, modelli, font, icone e suoni generati nel progetto da codice o script nel repository. Audio e musica interamente sintetizzati con Web Audio.
- TypeScript strict, Vite, Three.js/WebGL2 con qualità bassa, Rapier con quattro ruote raycast e guida arcade, Web Audio API, HUD HTML/CSS leggero, input tastiera/gamepad. Touch facoltativo.
- Simulazione fissa 60 Hz e interpolazione grafica. Instancing, riuso degli oggetti, dettagli a distanza e caricamento per settori; evitare allocazioni applicative superflue nei cicli frequenti. Le API di libreria/browser possono restituire oggetti propri.
- Dati delle auto, pezzi, prezzi, eventi e quartieri in JSON. Localizzazione IT/EN prevista. Nessun backend richiesto.
- Obiettivi da misurare: 60 fps su portatile medio con GPU integrata e build iniziale inferiore a 15 MB. Non sono garanzie implicite.

## Mondo completo

Circa 4-6 km² con seed fisso. Old Docks industriale, Neon District verticale e stretto, Hillcrest collinare, Airport Belt con superstrade/tunnel. Sottozone con identità culturali e architettoniche originali. Sblocco sequenziale tramite rivali.

Grafo stradale comune a mesh, marciapiedi, navigatore A*, traffico e IA. Notte, asfalto bagnato con riflessi economici, neon, lampioni, bloom nella rifinitura, nebbia e pioggia facoltativa. Minimap e mappa con filtri, gare, officine, carrozzerie, vernici, concessionario, garage, scorciatoie e collezionabili. Traffico a densità regolabile con semafori semplici.

## Guida e personalizzazione complete

Sospensioni a molla/smorzatore, grip e slittamento, freno a mano, assistenza in funzione della velocità e controsterzo disattivabile. Cambio automatico/manuale a sei marce e retro. Nitro con ricarica tramite stile di guida, FOV e fiammata; collisioni non bloccanti e danni estetici facoltativi. Quattro telecamere.

Prestazioni: motore, sovralimentazione, scarico, cambio, frizione, sospensioni, freni, pneumatici, alleggerimento, ECU e nitro. Tre livelli per categoria, effetti misurabili e sonori, taratura fine facoltativa e banco prova con curve.

Estetica: almeno cinque kit per auto, paraurti, minigonne, spoiler, cofani, tetti, specchi, bocchettone, scarichi, almeno trenta cerchi procedurali con spinner, vernici e pinze, editor vinili a strati con trasformazioni e specchiatura, vetri e fari, neon animati. Interni/audio bagagliaio, aperture e idraulica. HUD personalizzabile con tachimetro e contagiri analogici. Garage 360°, zoom, foto/filtri/esportazione PNG.

## Gare, carriera e salvataggi completi

Circuito, sprint, drift, drag manuale con limitatore e traffico, street sprint a checkpoint, sfide libere a distacco, tornei e prova a tempo con fantasma. IA su racing line con abilità, scia, errori e recupero regolabile. Avvio delle gare sul posto.

Crediti e reputazione separati, punteggio estetico 0-10, sponsor e riviste inventati, 3-4 rivali, messaggi su telefono, sblocchi a livelli e garage multiposto. Motore ed effetti procedurali, radio originale con loop strumentali. Menu, impostazioni, rimappatura, unità e lingue nella rifinitura.

Autosave dopo gare/acquisti, tre slot manuali, import/export JSON, schema versionato e migrazioni. Test mirati per statistiche, economia, drift, estetica, migrazioni e pathfinding quando tali sistemi vengono introdotti. Debug F3 progressivo: fps, draw call, veicolo; raycast/racing line/teletrasporto e strumenti economia insieme ai sistemi pertinenti.

## Roadmap e criteri di chiusura

Ogni voce descrive quanto disponibile alla chiusura della relativa tappa. Le riserve delle fasi precedenti sono state affrontate nelle successive; lo stato corrente è indicato sopra.

1. Prototipo guidabile: progetto, scena notturna, pista, auto procedurale, fisica, telecamera, HUD, motore sintetizzato. Devono funzionare guida, frenata/retro, sterzo, collisioni, pausa, ripristino e audio. Tastiera/gamepad, qualità bassa, freno a mano, nitro e quattro visuali inclusi nella tappa approvata.
2. Città: un quartiere derivato dal grafo, illuminazione e asfalto bagnato, minimappa, GPS selezionabile, percorso su strada e mappa, traffico con semafori e densità. Old Docks occupa una griglia di 960 × 960 metri, circa 0,92 km², primo quartiere della futura città. Le destinazioni di negozi/gare sono luoghi esplorabili; le loro attività arrivano nelle fasi successive. La pista della fase 1 resta accessibile con `?world=track`.
3. Circuito e sprint con quattro avversari fisici, checkpoint ordinati, risultati e gara veloce. Anello dei Fonditori a due giri e Rotta del Levante da punto a punto, entrambi sulle strade di Old Docks. Griglia e conto alla rovescia, posizione/giri/tempi, mappa di gara e recupero con penalità. Avvio da menu o ritrovi in strada, senza ricostruire il mondo. IA su linea arrotondata, livelli di difficoltà, piccoli errori, scia, sorpassi e recupero di velocità regolabile. I civili vengono sospesi durante la gara e ripristinati all'uscita. Dopo l'arrivo le auto liberano il traguardo. Risultati provvisori fino all'arrivo di tutti o alla finestra di completamento, che considera anche le penalità del giocatore. Nella fase 3 i risultati erano limitati alla sessione; la fase 4 aggiunge crediti e persistenza.
4. Tuning prestazioni, catalogo, negozio, garage e salvataggi. Undici categorie con tre livelli, prezzi e modificatori JSON, componenti posseduti/equipaggiati per auto, statistiche di confronto, curve teoriche di forza motrice e potenza. Garage con anteprima ruotabile e zoom, tre posti per esemplari indipendenti della Silex C1; gli altri modelli del catalogo completo restano da realizzare. Acquisto livelli in ordine, reinstallazione e serie gratuite, premi dopo la classifica definitiva. Autosave, tre slot manuali, import/export validato, schema v2 e migrazione del formato minimo di interscambio v1. La taratura fine resta facoltativa e non è implementata. Estetica/foto e reputazione restano nelle rispettive fasi successive.
5. Estetica: cinque kit oltre alla serie per il modello disponibile, componenti indipendenti, trenta cerchi procedurali con diametro/colore/spinner e pinze. Cinque finiture, inclusa cangiante a due colori, vetri e fari/fanali, neon animati, indicatori personalizzabili. Editor di dodici strati con sei forme originali, quattro superfici, trasformazioni, specchiatura e ordine. Anteprima e acquisti per esemplare, indice estetico 0-10, aperture e interni con impianto visivo, salto idraulico in studio. Foto con quattro filtri e PNG 1600 × 900. Schema v3 con migrazione v2 e bozze applicate esplicitamente. La personalizzazione si applica anche alla guida senza cambiare collisioni o prestazioni.
6. Drift su circuito e discesa fisica dedicata, punteggio da slittamento/velocità/avanzamento, catene e collisioni. Drag manuale con fascia lancio/cambiata, limitatore, guasto e sei civili. Sprint a tempo con bonus ai checkpoint, sfide a distacco dal menu o incontrando Nemi nella guida libera. Torneo di tre gare con punti, spareggio sui tempi, ripresa salvata e premio finale unico. Prova a tempo con fantasma trasparente del miglior giro pulito, senza corpo fisico. Cambio manuale anche libero, controlli tastiera/gamepad. Nove eventi visibili, dati e premi JSON. Schema v4 compatibile v1/v2/v3 per punteggi, fantasma e torneo. Il pendio è un percorso evento; non completa il quartiere Hillcrest.
7. Carriera avviabile dal telefono, reputazione distinta dai crediti e bonus dall’estetica applicata. Tre livelli per componenti e tre modelli originali sulla piattaforma Orvane, acquistabili anche a garage pieno tramite sostituzione con trasferimento dei componenti compatibili e copia recuperabile. Tre contratti sponsor persistenti, tre servizi fotografici per riviste inventate con copertine PNG, quattro rivali con profili e gare fisiche. Vittorie in sequenza per aprire Neon District, Hillcrest e Airport Belt. Settori d’ingresso guidabili con geometrie, collisioni, garage, traffico, GPS e gare; viaggio dal telefono. Messaggi, inviti, consigli e notifiche, obiettivo principale completato dopo il quarto rivale. Schema v5 e migrazione v4 senza perdita dei dati precedenti. I collegamenti continui, l’estensione e la rifinitura dei quartieri restano nella fase 8.
8. Quattro quartieri in coordinate condivise e ponti sbloccabili, Hillcrest con terreno a quota 0-55 m e passo con salita/tornanti/rientro anche liberi, tunnel Airport Belt, sottozone e negozi. Grafo comune con scorciatoie, GPS fra quartieri e dodici collezionabili persistenti. Catalogo di 51 auto e 12 costruttori con sagome parametriche di famiglie diverse e attacchi ruota fisici coerenti. Radio con tre stazioni originali, audio ambiente/effetti, pioggia, bloom, nebbia di quota e blur nitro. Impostazioni persistenti, qualità bassa/media/alta, unità, volumi, rimappatura e IT/EN. Schema v6 compatibile v1-v5. Debug geometrico/teletrasporto solo in sviluppo. Instancing, dettagli per distanza e render target assenti in qualità bassa; build inferiore a 15 MB. Controllo finale dei riferimenti creativi e verifica browser delle regressioni.

Le fasi 1-3 non avevano acquisti né salvataggi. Il nitro conserva la ricarica temporale e aggiunge bonus per drift valido, passaggi ravvicinati e salti puliti. Polizia, touch, danni estetici e taratura fine restano facoltativi e non implementati. Il mondo completo viene generato una volta; geometrie, dettagli e collider vengono attivati per distanza e sblocco, senza streaming di rete o rigenerazione. Il terreno urbano occupa circa 4 km², con ingombro complessivo di circa 5,2 km² includendo il passo orientale e lo svincolo di Nacelle. Il requisito prestazionale di 60 fps su GPU integrata richiede una misura su quell’hardware e non viene dedotto dal rendering software.

## Revisione visiva richiesta l’11 novembre 2026

Obiettivo: qualità visiva di un racing arcade console dei primi anni 2000, texture 256-512 px, auto da 3-8k triangoli e illuminazione ricca e satura. La chiusura delle precedenti otto fasi non equivale al completamento di questa nuova revisione. La richiesta più recente di Giovanni supera le pause iniziali: proseguire attraverso tutti i passi fino al dettaglio del riferimento e mostrare screenshot reali del risultato.

1. Texture in `src/gen/textures`: OffscreenCanvas con seed, albedo/roughness/normal/emissive per asfalto con granulosità, crepe, rattoppi, pozzanghere e segnaletica usurata, marciapiede, tre mattoni, cemento macchiato, lamiera, vetro, facciate con finestre calde diverse, tende e sagome, saracinesche, insegne con nomi da dizionario e cartelloni astratti. Cache IndexedDB e scheda debug in griglia. Implementazione e verifiche in `verifiche-texture.md`.
2. Edifici in `src/gen/buildings`: almeno 25 moduli, compresi vetrine, piani, cornicioni, tetti/impianti, falde, capannoni, scale antincendio, tende, condizionatori, insegne a bandiera, cartelloni, serbatoi e antenne. Grammatica base + N piani + coronamento e varianti per quartiere. Instancing e merge.
3. Illuminazione città con vertex color o lightmap generate al build, pozze di luce dei lampioni e delle insegne, poche luci dinamiche vicino all’auto. Il build genera due lightmap e il gestore seleziona quattro sorgenti locali.
4. Auto Blender 4.x in `tools/blender`, parametri JSON per ogni auto, profili laterale/dall’alto e 6-8 sezioni a curve, loft/skin, subdivision leggera e decimazione. Parti separate e nominate per tuning intercambiabile, UV automatiche, bake AO ed export GLB in `public/models`. Sagome originali e guida di esecuzione per principianti. Il catalogo comprende 51 GLB generati con otto sezioni, UV e AO; guida e verifiche sono collegate dalla revisione grafica completa.

Suoni motore, gomme, impatti, nitro, ambiente e musica devono restare interamente procedurali con Web Audio. L’implementazione corrente sintetizza queste categorie. La richiesta più recente autorizza a proseguire senza pause fra i passi.

I riferimenti visivi forniti da Giovanni dopo la prima verifica texture chiariscono il criterio di accettazione: aspetto urbano credibile da console dei primi anni 2000, senza font a pixel, griglie di finestre gigantesche, asfalto con macchie ripetute troppo evidenti o riflessi bianchi da studio. La prima versione texture non è approvata. La revisione include materiali con scala in metri, più dettaglio e usura, font vettoriale originale e panorama procedurale per cielo e riflessi. I riferimenti orientano la qualità complessiva e non autorizzano a incorporare asset, marchi o modelli tratti dalle immagini.

## Autorizzazione corrente della revisione completa

Giovanni ha chiesto di continuare fino a raggiungere almeno il dettaglio e la grafica dell’ultimo riferimento, che mostra una strada sotto una struttura ad archi con luce calda, materiali articolati e auto dettagliata. Questa richiesta sostituisce le pause di approvazione fra i passi. Procedere autonomamente con edifici, illuminazione, auto e rifinitura; verificare scene reali nel browser, mantenendo contenuti e asset originali generati nel repository. Il confronto visivo resta necessario, non basta il superamento dei test.

## Nuovo ciclo dopo il rifiuto della resa pubblicata

La review locale delle ottimizzazioni del 17 novembre 2026 preserva la grafica e verifica le regressioni anche nel gameplay. La coppa rende disponibile Prossima tappa soltanto a classifica definitiva. La quantizzazione dei campioni del fantasma non deve invalidare la transazione del premio; una registrazione inutilizzabile viene scartata. Classificazioni e verifiche sono in `review-ottimizzazione.md`.

Le personalizzazioni del tetto devono funzionare sui 51 GLB: Presa sul tetto crea una presa fisica aderente, Fibra cambia il materiale e i vinili coprono la superficie scelta senza ritagliare la texture sulle dimensioni dell'intera auto. Sulle quattro monoposto le tre funzioni riguardano la copertura dietro il sedile e ne seguono il perno. La configurazione di serie conserva l'aspetto precedente.

Limite conservato della coppa: uscire dalla classifica provvisoria o ricaricare la pagina conserva l'ultima tappa salvata e non assegna il premio della tappa in corso. La cancellazione delle tappe salvate avviene con Abbandona torneo. Un'eventuale regola diversa richiede una decisione di prodotto e uno stato persistente della tappa iniziata.

Il criterio corrente richiede qualità almeno equivalente a entrambi i riferimenti, senza la vecchia tolleranza. La review Opus 9 sulle catture round-21 ha restituito `raggiunto` nei tre assi. Il loft usa campionamento fitto e rilassamento, con scocca e normali protette: la semplificazione riguarda i dettagli. Le rifiniture ottiche sono generate in codice e condivise da studio e strada. Verifiche del pacchetto e pubblicazione sono registrate nella review visiva; il verdetto del revisore non sostituisce l’accettazione di Giovanni.
