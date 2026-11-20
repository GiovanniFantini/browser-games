# NIGHT CIRCUIT: Neon Streets

Racing arcade 3D per browser desktop. Città, auto e contenuti creativi originali, sempre di notte. Versione locale 0.8.0: guida, Old Docks, nove eventi, tuning prestazioni ed estetico, garage e salvataggi. Drift, drag, sprint a tempo, sfide, torneo, fantasma e carriera sono disponibili. La fase 8 aggiunge i quattro quartieri continui, 51 auto di 12 costruttori, radio, effetti, impostazioni e IT/EN. Le otto fasi sono implementate e verificate; la review iterativa con Opus locale è conclusa con entrambi i verdetti READY TO PROD per la build statica. Le misure su GPU integrata fisica restano da eseguire.

Gioca alla [versione online su GitHub Pages](https://giovannifantini.github.io/browser-games/guida/), senza account ChatGPT. Il [repository della distribuzione](https://github.com/GiovanniFantini/browser-games) è pubblico; i sorgenti di sviluppo sono nel branch codex/release-night-circuit dello stesso repository. Per trasferire i progressi fra PC o dal precedente sito usare Esporta e Importa salvataggio nel gioco.

## Nuova rete stradale online

La revisione richiesta il 17 novembre aggiunge curve, collegamenti diagonali, incroci a T e isolati di dimensioni diverse. Il terreno segue la strada con quote reali, usate anche da collisioni, gare, traffico e GPS. Tutti i quartieri hanno linee centrali, separazione delle corsie, bordi e attraversamenti pedonali. Il viale del drag, il sottopasso e gli accessi ai ponti mantengono la loro geometria dedicata.

Questa revisione è pubblicata su GitHub Pages dal 18 novembre 2026, insieme alle ottimizzazioni del rendering e alle fix approvate da Opus. Verifiche e confronto visivo sono in [revisione delle strade](docs/revisione-strade.md).

## Avvio

Ambiente verificato: Node.js 24.20.0, npm 11.19.0. La generazione delle lightmap importa il modulo TypeScript del terreno e richiede una versione di Node con supporto nativo a TypeScript (22.18 o successiva).

Dalla cartella di questo gioco:

```powershell
npm install
npm run dev
```

Per installazioni riproducibili usare `npm ci` al posto di `npm install`. Aprire l'indirizzo locale indicato da Vite e premere Entra in pista. L'audio richiede questo gesto iniziale.

Dalla radice della raccolta:

```powershell
npm --prefix games/night-circuit ci
npm run dev:night-circuit
```

La destinazione iniziale è Old Docks. Aggiungere `?world=track` all'indirizzo per la pista chiusa della fase 1. Tutte le risorse runtime sono locali dopo l'installazione; non sono richiesti account o servizi esterni.

Per avviare direttamente la qualità bassa aggiungere `?quality=low`, oppure `?world=track&quality=low` per la pista. Questo riduce anche la risoluzione della cubemap generata all'avvio.

## Revisione grafica

Il 17 novembre 2026 è stata pubblicata su GitHub Pages l'ottimizzazione del rendering che mantiene modelli, texture, ombre e riflessi. I nove confronti controllati hanno zero pixel differenti. Le misure sulla GPU virtuale mostrano un miglioramento del tempo per fotogramma; risultati, metodologia, limiti e review Opus sono in [prestazioni del rendering](docs/prestazioni-rendering.md).

La successiva [review delle ottimizzazioni](docs/review-ottimizzazione.md) si è chiusa al settimo giro con Codex e Opus concordi su READY TO GO IN PROD. Le correzioni a coppa, fantasma e personalizzazioni del tetto sono incluse nella versione online. La [pubblicazione verificata](docs/pubblicazione.md) registra commit, hash e prove sul dominio pubblico; la review conserva confronti prima/dopo, controlli di regressione e limiti condivisi.

Dopo il rifiuto della precedente resa pubblicata, il nuovo ciclo con Claude Code locale, modello Opus, ha ottenuto `raggiunto` alla nona review. Il confronto usa entrambi i riferimenti di Giovanni e richiede qualità almeno equivalente nei tre assi auto, edifici e illuminazione, senza tolleranza di un punto. Le catture comprendono guida reale, drift, sottopasso, vista lontana e garage. Il giudizio del revisore non sostituisce l'accettazione di Giovanni. La review 10 ha confermato il risultato anche sul pacchetto statico. La nuova versione è pubblicata su GitHub Pages e verificata nel browser dal dominio pubblico.

La [review visiva](docs/review-visiva.md) descrive il ciclo e le verifiche; il [verdetto Opus](docs/verdetto-opus.md) conserva il testo del revisore. Sono stati rifatti aperture e rientranze delle finestre, vetrine e insegne, padiglioni e cinema, arredi del viale, skyline e nuvole, riflessi del bagnato, carrozzerie e gruppi ottici. I 51 GLB contengono da 7.512 a 7.554 triangoli. La compattazione genera anche le versioni dei modelli, così un file nuovo non riusa la cache HTTP di quello precedente.

Il nuovo vincolo esclude tutti gli asset esterni, anche CC0. La revisione comprende 17 materiali originali con albedo, roughness, normal ed emissive a 512 px (anche 256 px nella scheda di debug), generati con seed in un worker OffscreenCanvas. IndexedDB conserva le mappe fra gli avvii; se lo storage è indisponibile il gioco le genera in memoria. Asfalto, cemento, lastre, mattoni, lamiera e facciate sono applicati alla città con scala in metri. Un cielo nuvoloso procedurale alimenta lo sfondo e la texture dei riflessi. Sono stati aggiunti 31 moduli edilizi, vetrine con interni simulati, il sottopasso guidabile dei Fonditori, lightmap generate al build, 51 auto Blender con parti separate e il garage arredato. Questa revisione è disponibile su GitHub Pages; il precedente sito Sites conserva la vecchia versione. La [revisione grafica completa](docs/revisione-grafica.md) descrive contenuti e verifiche; la [guida Blender per principianti](tools/blender/README.md) spiega come generare e ispezionare le auto.

Con il server locale avviato aprire [il laboratorio texture](http://127.0.0.1:5175/?debug=textures), adattando la porta a quella stampata da Vite. La scheda è disponibile anche nella build statica con `?debug=textures`. Mostra le quattro mappe in griglia, filtri per mappa, ingrandimento nativo e anteprima PBR selezionabile dal nome del materiale. Seed e risoluzione distinguono le voci della cache. Svuota cache texture elimina solo queste mappe, senza toccare i salvataggi.

Il font Circuit Grid usa tratti vettoriali originali, con minuscole, accenti e tre pesi; gli stessi tratti disegnano le insegne. Il TTF generato è incluso nel progetto e non richiede Python per giocare. Per rigenerarlo, dalla cartella del gioco:

```powershell
python -m pip install fonttools
python tools/fonts/generate.py
```

Verifica dedicata: `npx playwright test tests/textures.spec.ts`. Evidenze e limiti sono in [verifiche texture](docs/verifiche-texture.md).

## Comandi di guida

| Azione | Tastiera | Gamepad standard |
| --- | --- | --- |
| Accelerare | W o freccia su | RT |
| Frenare, poi retro | S o freccia giù | LT |
| Sterzare | A/D o frecce sinistra/destra | Levetta sinistra |
| Freno a mano | Spazio | A |
| Nitro | Shift | B |
| Cambiare visuale | C | X |
| Marcia superiore/inferiore | X/Z | D-pad su/giù |
| Cambio automatico/manuale | V | D-pad sinistra |
| Sfidare il pilota vicino | F | D-pad destra |
| Ripristinare l'auto, in gara all'ultimo checkpoint con penalità | R | Y |
| Pausa/ripresa | Esc | Start |
| Audio on/off | M | View |
| Mappa e ritorno alla guida | G | Pulsante Mappa con mouse |
| Telemetria | F3 | Tastiera |
| Menu gare veloci | Q | RB |
| Gara al ritrovo o garage/officina nelle vicinanze | E | LB |
| Garage e officina | H | Pulsante Garage con mouse |
| Carriera e telefono | P | Pressione levetta sinistra |
| Impostazioni | O | Pulsante Impostazioni con mouse |

La tabella mostra i comandi predefiniti. In Impostazioni (O) si possono cambiare tasti, pulsanti del gamepad e asse dello sterzo. Le frecce restano controlli alternativi e F3 resta riservato. Assegnare un comando già usato scambia le due assegnazioni. Escape annulla la cattura di un nuovo tasto.

Gamepad con mappatura standard Gamepad API. I nomi A/B/X/Y indicano le posizioni della disposizione standard. Il menu e la selezione della mappa usano mouse/tastiera; la guida supporta il gamepad. Menu navigabili con Tab. Nessun controllo touch in queste tappe.

## Cosa è disponibile

- Auto Orvane Silex C1 originale con quattro sospensioni raycast Rapier, cambio automatico/manuale, sei marce e retro, grip arcade, freno a mano, nitro, stabilizzazione e controsterzo disattivabile.
- Quattro visuali: vicina, lontana, cofano e paraurti. Interpolazione del corpo fra passi fisici a 60 Hz.
- Audio sintetizzato per motore, gomme, urti, nitro, rilascio e ambiente/pioggia. Tre radio strumentali originali: Lumen Drive (112 BPM), Vector Pulse (138 BPM), Late Current (86 BPM). Volumi generale/motore/musica/effetti, radio spenta e sospensione audio in pausa.
- HUD velocità, giri, marcia, nitro, stato di aderenza e telemetria F3.
- Quattro quartieri in coordinate condivise: Old Docks industriale, Neon District verticale, Hillcrest collinare e Airport Belt con tunnel. Ogni rete ha 81 incroci e 144 segmenti; quattro ponti e quattro scorciatoie collegano il grafo GPS. I ponti si aprono con i rivali. Il viaggio rapido dal telefono resta disponibile.
- Asfalto con materiale bagnato e cubemap procedurale prefiltrata, fari, insegne, lampioni e nebbia. Qualità bassa con risoluzione limitata e ombre disattivate.
- Minimap orientata a nord o secondo l'auto, mappa completa, filtri dei punti di interesse, destinazioni selezionabili anche dalla lista, A* e ricalcolo del percorso evidenziato sulla strada.
- Traffico civile con percorsi arrotondati derivati dal grafo, collisioni e arresto ai semafori. Densità assente/leggera/media/intensa fino a 32 veicoli.
- Settori con attivazione grafica e fisica per distanza, dettagli vicini e instancing di edifici, luci e traffico. Generazione deterministica in memoria, senza streaming di rete.
- Dodici frammenti da raccogliere guidando attraverso il segnale, 250 CR ciascuno una sola volta, stato conservato nel profilo e indicato nella mappa.
- Catalogo di 51 auto, 12 costruttori originali e famiglie compatte, coupé, berline, SUV, storiche, prototipi, monoposto e supercar. Dimensioni, passo, carreggiata, massa e guida differenziati; anteprima prima dell’acquisto e sostituzione anche con tre posti occupati.
- Qualità bassa/media/alta, bloom e pioggia selezionabili, sfocatura radiale durante il nitro in media/alta, interfaccia IT/EN, km/h o mph. Preferenze locali salvate separatamente dalla progressione.
- Circuito Anello dei Fonditori a due giri e sprint Rotta del Levante, con griglia, conto alla rovescia, quattro avversari raycast e collisioni reali.
- Checkpoint da attraversare nell'ordine e nel verso corretti, posizione, giri, cronometro, miglior giro, avvisi contromano/fuori percorso e mappa con percorso gara e avversari.
- Difficoltà Apprendista/Strada/Esperto, piccoli errori IA, scia, sorpassi e recupero di velocità regolabile. Avversari e auto vengono riutilizzati fra le gare.
- Classifica finale, tempi con penalità, riprova, abbandono e ritorno alla guida libera. Premi in crediti e record persistenti.
- Undici categorie di prestazioni, tre livelli ciascuna, catalogo e prezzi JSON, confronto delle statistiche e banco prova teorico. Modifiche effettive alla fisica e al timbro motore.
- Garage 3D con rotazione/zoom, tre posti per auto del catalogo, acquisto auto e componenti, installazione e ritorno alla serie gratuiti.
- Autosave locale, tre slot manuali, esportazione/importazione JSON validata, migrazione e copia precedente.
- Cinque kit completi oltre alla serie, parti indipendenti, trenta cerchi procedurali, spinner, diametro/colore e pinze.
- Vernici lucida/metallizzata/perlata/opaca/cangiante, vetri, fari e fanali, neon fisso/pulsante/a inseguimento, colori degli indicatori.
- Editor vinili con dodici strati, sei forme originali, posizione, scala, rotazione, opacità, specchiatura e ordine degli strati.
- Studio con aperture, interni e impianto nel bagagliaio, salto idraulico, inquadrature, foto con quattro filtri ed esportazione PNG.

## Come gareggiare

Dal menu iniziale scegliere Gara veloce, oppure premere Q durante la guida libera. Scegliere evento, difficoltà e recupero IA. In alternativa raggiungere uno dei ritrovi segnati sulla mappa e premere E (LB sul gamepad). Il circuito è vicino al punto iniziale; lo sprint parte dal Ritrovo dei moli.

La gara usa il quartiere già caricato. Dopo il conto alla rovescia, seguire il tracciato azzurro e attraversare il cancello illuminato del prossimo checkpoint. La minimappa mostra percorso e avversari; il percorso gara sostituisce la destinazione GPS personale. Dopo la gara si può impostare una nuova destinazione. G apre la mappa e mette in pausa la simulazione. Esc mette in pausa anche durante una gara; non la abbandona.

R (Y sul gamepad) ripristina l'auto all'ultimo checkpoint già validato e aggiunge 3 secondi al tempo finale. Prima del via il ripristino è disabilitato. Non si completano giri saltando checkpoint, passando al contrario o raggiungendo soltanto il traguardo. Il traffico civile viene sospeso durante le gare, eccetto il drag con sei veicoli, e ripristinato con la densità scelta quando si torna alla guida libera.

Dopo l'arrivo le auto si spostano ai lati per liberare la linea. La classifica è provvisoria finché gli avversari terminano: la finestra di completamento è di 45 secondi oltre il tempo del giocatore, incluse le sue penalità; chi non arriva entro tale limite viene indicato come ritirato. Un cambio di scheda sospende la simulazione; al ritorno può proseguire il completamento delle IA nei risultati. È possibile riprovare o tornare alla guida senza attendere: uscire dalla classifica provvisoria rinuncia al premio. Soltanto la classifica finale assegna crediti e registra tempi e risultati. Il ritiro assegna zero crediti. Avviando la carriera, gli arrivi definitivi assegnano anche reputazione.

## Modalità della fase 6

Tutte le modalità sono avviabili dal menu gare veloci e dai rispettivi ritrovi E/LB sulla mappa.

| Evento | Obiettivo |
| --- | --- |
| Trame dei Fonditori | Un giro drift, almeno 350 punti entro 200 secondi |
| Pendio di Vetracava | Discesa drift, almeno 200 punti entro 160 secondi |
| Rettilineo del Canale | Drag manuale contro un avversario e sei veicoli civili |
| Battito delle Lanterne | Sprint con 35 secondi iniziali e 8 aggiunti per checkpoint valido |
| Distacco ai Moli | Mantenere 80 metri di vantaggio per 3 secondi, entro 100 secondi |
| Eco dei Fonditori | Giro pulito a tempo con il fantasma del proprio miglior giro |
| Coppa dei Tre Bacini | Tre gare con quattro avversari, classifica a punti e premio finale |

Il drift premia velocità, angolo di slittamento da 10° a 75° e avanzamento sul percorso. Il freno a mano aiuta a iniziare la derapata; correggere lo sterzo per controllarla. La catena aumenta il moltiplicatore fino a cinque e viene consolidata dopo una breve pausa o all’arrivo. Un urto contro pareti annulla la catena ancora aperta. Ruotare sul posto o allontanarsi dal percorso non produce punti. La discesa usa il passo fisico di Vetracava, collegato alla rete di Hillcrest da una salita e da un rientro. Con Hillcrest sbloccato è percorribile anche nella guida libera; la gara veloce resta avviabile dal menu.

Nel drag il cambio è obbligatoriamente manuale. Tenere i giri nella fascia di lancio indicata durante il conto alla rovescia, poi cambiare con X/Z quando l’indicatore è nella fascia ottimale. Cambiate premature o tardive riducono la spinta. Insistere al limitatore per quattro secondi cumulativi durante la corsa rompe il motore e termina la gara. R aggiunge la penalità e non ripara il motore. Fuori dal drag il cambio manuale non introduce questo guasto.

Nemi percorre realmente le strade nella guida libera. Avvicinarsi e premere F quando compare la proposta per sfidarla dalle posizioni attuali. Il conto alla rovescia ferma entrambe le auto prima della partenza. Il distacco considera l’avanzamento sul percorso validato: tagliare attraverso gli isolati non aiuta. Il menu permette anche una partenza dalla griglia.

Il fantasma è trasparente, senza collisioni, campionato cinque volte al secondo e conservato nel profilo. Soltanto un giro completato senza ripristini può sostituire un record più lento. R e il ripristino automatico invalidano la registrazione. Il limite è sei minuti; esportazione e slot comprendono anche il fantasma.

Il torneo assegna 10/7/5/3/1 punti agli arrivati; i ritirati non ricevono punti. A parità conta il tempo cumulativo, con 180 secondi per un ritiro. Dopo ogni classifica definitiva si salva la tappa successiva: ricaricare e scegliere la coppa per riprendere. Prossima tappa continua senza ricaricare. Il premio viene pagato una volta alla fine delle tre gare. Abbandona torneo cancella tutte le tappe della coppa in corso. Dal menu è anche possibile azzerare una coppa sospesa.

## Carriera e telefono

Scegliere Carriera dal menu oppure premere P durante la guida libera. Il telefono mette in pausa e contiene Percorso, Sponsor, Riviste, Messaggi e Quartieri. Inizia carriera abilita la progressione senza cancellare crediti, auto, componenti, coppa o fantasma. Tutti i pezzi già posseduti restano reinstallabili, anche sopra il livello attuale.

Un arrivo valido assegna 40 REP, una vittoria 60 REP. Si aggiunge la parte intera dell’indice estetico applicato moltiplicato per quattro. Un ritiro non assegna REP. I quattro rivali si affrontano in ordine con almeno 90/220/360/520 REP: Nemi a Old Docks, Ozra a Neon District, Iven a Hillcrest, Selki ad Airport Belt. Battere ciascuno assegna 80 REP più il bonus estetico e apre il quartiere successivo; dopo Selki la carriera principale è completa. I risultati e gli sblocchi vengono salvati insieme, alla classifica definitiva.

A 160 REP si raggiunge il livello 2, a 400 REP il livello 3. Si aprono i corrispondenti livelli dei componenti e del catalogo auto, inclusi Lyra R2 e Velan GT. In garage scegliere Modello da acquistare prima di usare un posto libero. Lyra R2 costa 15.000 CR, Velan GT 22.000 CR. Hanno proporzioni dell’abitacolo e prestazioni diverse sulla stessa piattaforma; kit, cerchi e attacchi ruota restano compatibili. Le elaborazioni si conservano per esemplare. Prima di avviare la carriera il tuning delle gare veloci rimane libero; i nuovi modelli richiedono comunque il relativo livello.

Se tutti i posti sono occupati, scegliere il modello nuovo e usare Prepara sostituzione sull’auto da cambiare. Il ritiro vale il 50% del prezzo di serie del modello precedente; la schermata mostra differenza o rimborso prima della conferma. Componenti, inventario estetico e aspetto compatibili restano nello stesso posto. Le altre auto non cambiano. Il profilo precedente si recupera con Ripristina copia precedente. La sostituzione si applica soltanto se la copia e il nuovo profilo possono essere salvati.

Si può accettare un solo sponsor alla volta. Torqen richiede due arrivi, Velyra due vittorie drift, Aervik una velocità reale di 100 km/h. I progressi iniziano dalla firma e rimangono dopo una ricarica. Aprire Sponsor e riscuotere quando l’obiettivo è completo; ogni contratto paga una volta.

Le riviste Riflesso Tardivo, Fotogramma Notturno e Firma di Strada richiedono rispettivamente 80/240/450 REP e indice estetico 1/3/5. Scatta copertina apre il garage, fotografa la configurazione applicata e scarica un PNG 1600 × 900 con titolo e impaginazione originali. Il premio viene registrato dopo la generazione riuscita. Le bozze non sostituiscono l’auto del servizio. Ogni rivista assegna il premio una volta.

I messaggi conservano inviti dei rivali, nuovi accessi, contratti e consigli. Il telefono segnala messaggi non letti; aprire la sezione li segna come letti. Non vengono inviate comunicazioni esterne.

Quartieri permette il viaggio rapido nelle aree sbloccate. Si può anche raggiungerle guidando sui ponti. Neon District ha torri e luci rosa, Hillcrest un terreno collinare, ville e il passo di Vetracava collegato da salita e rientro, Airport Belt strade ampie e tunnel. Ogni quartiere ha traffico, GPS, garage, negozi e gare. Geometrie e collider vengono attivati secondo distanza e accesso; la generazione avviene una volta in memoria. La posizione precisa resta temporanea: caricando un profilo si riparte dal punto del quartiere salvato.

I quattro quartieri occupano circa 4 km² di terreno urbano; ponti e passo orientale portano l’ingombro complessivo a circa 5,2 km². Il passo ha un ingresso e un rientro sulla rete di Hillcrest, è incluso nel GPS ed è aperto anche senza avviare una gara.

## Garage e prestazioni

Aprire Garage dal menu, dal pulsante in alto o con H. Vicino al Garage del bacino e all’Officina Torqen si può usare E/LB. La simulazione si ferma durante le modifiche. Durante una gara occorre prima tornare alla guida libera.

Il profilo parte con 12.000 CR e una Orvane Silex C1. Un ulteriore esemplare della Silex C1 costa 9.000 CR, fino a tre posti. Sono disponibili 51 modelli di 12 costruttori inventati, selezionabili dal catalogo. La selezione mostra sagoma, descrizione e statistiche prima dell’acquisto, mantenendo l’auto attiva. Ogni esemplare conserva i propri componenti. Le IA continuano a usare l’auto di serie.

Scegliere una delle undici categorie e confrontare i tre livelli. Si acquistano in ordine; ogni acquisto installa il pezzo. Tutti i livelli già acquistati restano disponibili senza un secondo addebito. Rimontare la serie è gratuito. Gli indici di spinta, tenuta e frenata usano la Silex C1 di serie come riferimento 100. Massa, durata/potenza del nitro e limite teorico di velocità sono espliciti. Il banco prova visualizza forza motrice e potenza alle ruote del modello arcade: non costituisce una misura della velocità effettivamente raggiunta. La taratura fine facoltativa non è inclusa.

I premi per posizione sono in `src/data/performance.json`: nelle gare veloci, circuito 3.500/2.400/1.500/900/600 CR, sprint 2.200/1.500/900/600/350 CR, moltiplicati per 0,8/1/1,2 secondo la difficoltà. Ogni gara paga una volta. Record per evento e ultimi trenta risultati sono conservati nel profilo.

## Personalizzazione estetica e foto

Aprire il garage con H e scegliere Estetica e foto. Cromia Notturna e Atelier Velyra, segnati sulla mappa, aprono direttamente l’estetica con E nelle vicinanze. Le sezioni Carrozzeria, Colori e luci e Vinili modificano l’anteprima. Applica acquista i pezzi ancora mancanti, installa la configurazione e la salva. Cambiare sezione conserva la bozza; tornare alle prestazioni o uscire scarta le modifiche non applicate. Ogni esemplare conserva il proprio aspetto e inventario estetico. I colori e le regolazioni sono inclusi, i pezzi già acquistati si reinstallano gratis.

Sono disponibili cinque kit originali oltre alla serie. Paraurti, minigonne, spoiler, cofano, tetto, specchietti, bocchettone e scarichi possono essere scelti indipendentemente. Trenta disegni di cerchi, diametri da 17 a 22 pollici, colori dei cerchi e delle pinze e spinner. Il diametro cambia il rapporto visivo cerchio/pneumatico, mantenendo il raggio esterno della ruota fisica. L’estetica non modifica prestazioni, massa o collisioni.

Le finiture perlata e cangiante miscelano due colori in base all’angolo di osservazione. Vetri, fari/fanali e neon sono regolabili; il neon può restare fisso, pulsare o animarsi a inseguimento. I colori di velocità/giri e nitro si applicano anche alla guida. L’indice estetico 0-10 descrive la configurazione applicata e aggiunge fino a 40 REP agli arrivi della carriera. Le bozze non assegnano bonus.

L’editor vinili usa fino a dodici strati con forme geometriche originali: striscia, freccia, fiamma, ramificazione, orbita e sigillo. Scegliere superficie e forma, aggiungere uno strato e trascinarlo nel riquadro o usare le regolazioni. Ogni strato ha scala sui due assi, rotazione, colore e opacità. È possibile duplicare, riordinare ed eliminare. Specchia copia il disegno sull’altro lato. Le superfici sono fianco sinistro/destro (fascia inferiore della carrozzeria), cofano e tetto.

Nello studio si possono aprire porte verticali, cofano e portellone per osservare gli interni e gli impianti nel bagagliaio. Il salto idraulico è un’animazione di anteprima nel garage. Le aperture si richiudono tornando alla guida.

Modalità foto apre l’inquadratura a 16:9 con rotazione e zoom. Scegliere un filtro e usare Esporta PNG: il file misura 1600 × 900 e contiene la sola scena, con il filtro applicato anche all’immagine scaricata. Le foto possono includere modifiche ancora in anteprima. Esc torna al garage. Non si acquisisce il desktop e non si inviano immagini a servizi esterni.

## Conservare il profilo

I dati vengono salvati nel localStorage di questo browser e dello stesso indirizzo, inclusa la porta. Cambiare browser, indirizzo o cancellare i dati del sito non trasferisce il profilo. Esportare JSON per conservarne una copia e importarlo nel nuovo browser.

Acquisti, configurazione, auto attiva e classifiche finali attivano l’autosave. I tre slot manuali sono indipendenti. Caricare uno slot o applicare un’importazione sostituisce il profilo completo e conserva quello precedente con il pulsante di ripristino. Il file importato viene validato prima e mostra saldo e numero di auto prima di applicarlo. Un file non valido non cambia i progressi.

Se lo spazio locale non è disponibile, gli acquisti restano in memoria e il garage lo segnala: esportare prima di chiudere la pagina. Un autosave illeggibile o di versione futura viene conservato intatto e non viene sovrascritto automaticamente. Recuperare una copia precedente o importare esplicitamente un file valido.

Lo schema corrente è v6, compatibile in lettura con i profili v1-v5. La migrazione v5 conserva tutta la carriera e aggiunge la lista dei frammenti raccolti. La migrazione conserva crediti, auto, componenti, aspetto e record e aggiunge una carriera non ancora avviata; anche punteggi drift, fantasma e torneo sono conservati quando presenti. I profili v2 ricevono anche l’aspetto di serie. Il formato minimo di interscambio v1 viene migrato in un esemplare con tutti i livelli acquistati fino a quello indicato. Le fasi 1-3 non avevano salvataggi; la fase 4 usava lo schema v2. Dettagli ed esempio in [formato salvataggi](docs/salvataggi.md).

## Controlli di sviluppo

```powershell
npm run build
npm test
npm run lint
npm run format:check
```

Per i test automatici nel browser:

```powershell
npx playwright install chromium
npm run test:browser
```

I test browser avviano il server locale sulla porta 5175. Gli screenshot vengono scritti in `artifacts/`, esclusa da Git. Per controllare la build distribuibile usare `npm run preview` dopo `npm run build`.

## Prove manuali

1. Accelerare, frenare fino alla retro e ripartire. Provare sterzo ai due lati, curve, freno a mano e nitro. Tenerlo premuto fino a esaurimento e rilasciarlo per ricaricare.
2. Urtare barriere, marciapiedi, edifici e traffico. Verificare che R consenta sempre di tornare al punto iniziale.
3. Provare le quattro visuali, pausa/ripresa, cambio scheda, mute e qualità bassa. Verificare accelerazione e rilasci del gamepad fisico.
4. Aprire G, selezionare una destinazione dalla lista o cliccando una strada, provare filtri/cancellazione, tornare alla guida e seguire il percorso. Deviare e verificare il ricalcolo; raggiungere la destinazione.
5. Cambiare densità e osservare traffico e semafori per più cicli. Esplorare i bordi del quartiere e i settori lontani senza attraversare edifici/barriere.
6. Provare entrambe le gare dal menu e dai ritrovi. Tenere premuto l'acceleratore prima del via, verificare la griglia ferma, poi completare i checkpoint e i due giri del circuito.
7. Saltare un checkpoint, passarci al contrario, usare R e verificare la penalità. Controllare pausa e mappa, abbandono, riprova, classifica e ripristino del traffico.
8. Provare le tre difficoltà e le opzioni di recupero IA. Cambiare scheda dopo il proprio arrivo e verificare che al ritorno la classifica possa diventare definitiva.

9. Aprire Estetica, confrontare i cinque kit, cambiare singole parti e cerchi. Provare diametro, spinner e colori delle pinze; applicare e ritornare in strada.
10. Provare le cinque finiture e ruotare la telecamera per perlata/cangiante. Cambiare vetri, fari, neon e colori degli indicatori; verificare il risultato durante la guida.
11. Creare strati su lati, cofano e tetto; trascinare, ruotare, scalare, specchiare, duplicare e riordinare. Provare il limite di dodici e il comportamento sui kit larghi.
12. Aprire porte, cofano e portellone, osservare motore/interni/impianto, provare il salto. Entrare in foto, cambiare filtro, esportare il PNG e aprirlo. Esc deve ripristinare correttamente il garage anche in una finestra più stretta.
13. Uscire con una bozza non applicata, riaprire e verificare lo scarto. Applicare una configurazione, ricaricare, cambiare esemplare e provare slot/import/export. Un vecchio profilo v2 deve mantenere crediti e prestazioni.

14. Aprire Impostazioni, cambiare lingua e unità, rimappare un comando e verificare il recupero dopo una ricarica. Provare radio, volumi, pioggia, bloom e i tre livelli grafici.
15. Con i quartieri aperti attraversare i ponti, seguire un GPS fra quartieri e percorrere salita/discesa/rientro di Vetracava. Raccogliere un frammento e verificare che non paghi una seconda volta.
16. Confrontare compatta, SUV, supercar e monoposto nel salone e alla guida. Sulla monoposto tetto e vinile superiore personalizzano la copertura dietro il sedile.

## Limiti attuali

La città usa quattro reti urbane collegate, con geometrie procedurali e fisica arcade. L’estensione e le ultime verifiche sono descritte nella review finale. Il catalogo completo è accessibile dal garage o dal concessionario; gli acquisti rispettano livelli e crediti.

Fisica arcade iniziale e traffico semplificato: i civili seguono percorsi stabiliti e non aggirano un ostacolo fermo. Non sono avversari da gara. Nitro con ricarica temporale e bonus per drift valido, passaggi ravvicinati e salti puliti. Danni estetici assenti. Riflessi ambientali economici, senza riflessi screen-space. Bloom disponibile in media/alta. Il mondo resta allocato in memoria: i settori vengono attivati/disattivati, senza streaming da rete o rigenerazione delle risorse.

L'IA delle gare ha uno stile arcade: se rimane bloccata senza progressi, riparte dall'ultimo checkpoint già validato. Non riceve checkpoint o giri gratuiti. Le gare veloci usano auto di serie con colori diversi; i rivali hanno modelli e abilità progressivi. L’IA adatta velocità e frenata a prestazioni, raggio delle curve e distanza di arresto. Il giocatore usa le proprie elaborazioni: per i rivali avanzati servono auto e tuning adeguati.

Profilo basso richiede comunque WebGL2. I 60 fps su GPU integrata sono un obiettivo non certificato su tale hardware. Il resoconto corrente dei controlli è in [review finale](docs/review-finale.md); [verifiche iniziali](docs/verifiche.md) conserva le prove delle fasi 1 e 2.

La verifica della fase 3 è documentata in [verifiche gare](docs/verifiche-fase3.md). I test browser delle gare avanzano il vero passo fisso attraverso un controllo disponibile soltanto in sviluppo con `?qa=race`; il pilota di test usa Rapier e piloti basati sui comandi reali, senza simulare l'arrivo o teletrasportarsi sui checkpoint. Il controllo non è incluso nella build distribuibile. Nel server di sviluppo F3 nella sezione Prestazioni del garage apre anche lo strumento Crediti infiniti: conserva il saldo al massimo durante gli acquisti e modifica i dati salvati/esportati del profilo di test. È assente dalla versione distribuibile.

## Documenti

- [Requisiti e roadmap](docs/requisiti.md)
- [Istruzioni del gioco](AGENTS.md)
- [Crediti e licenze](CREDITS.md)

La verifica della fase 4 è documentata in [verifiche tuning e salvataggi](docs/verifiche-fase4.md).

La verifica della fase 5 è documentata in [verifiche estetica e foto](docs/verifiche-fase5.md).

La verifica della fase 6 è documentata in [verifiche modalità e fantasma](docs/verifiche-fase6.md).

La verifica della fase 7 è documentata in [verifiche carriera e progressione](docs/verifiche-fase7.md).

La fase 8 è descritta in [verifiche città completa e rifinitura](docs/verifiche-fase8.md). I nomi propri originali di eventi, quartieri e prodotti restano invariati nelle due lingue. Lo schema v6 migra anche v5, aggiungendo la collezione dei frammenti senza alterare carriera, auto, inventari, ghost o coppa. Preferenze separate: `night-circuit:preferences:v1`. Non contengono crediti o sblocchi. In sviluppo, F3 mostra anche raycast e linea di gara; Alt+clic sulla mappa riposiziona sulla strada selezionata. Questi strumenti di modifica della posizione sono assenti dalla build distribuibile.

La review conclusiva con Opus locale e le relative correzioni sono registrate in [review finale](docs/review-finale.md).

Nel drift rapido di Vetracava, se Hillcrest non è ancora aperto, uscire dalla piattaforma di partenza può far cadere l’auto e riportarla al punto di Old Docks. R resta il recupero al checkpoint durante la gara. Aprire Hillcrest rende disponibili salita e rientro del passo.

La preparazione per GitHub e i salvataggi fra PC sono descritti in [distribuzione](docs/pubblicazione.md).

Nella home pubblica della raccolta scegli NIGHT CIRCUIT per aprire guida/. I parametri dei vecchi segnalibri, come ?quality=low, seguono la scelta del gioco.
