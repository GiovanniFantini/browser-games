# Verifiche della fase 8

Resoconto del primo completamento della fase 8. Le correzioni successive, le misure con GPU virtuale Direct3D11 e il verdetto corrente sono in [review finale](review-finale.md).

Stato della prima consegna al 10 novembre 2026: fase 8 completata e verificata funzionalmente. Versione locale 0.8.0, senza pubblicazione, push, pipeline o servizi esterni.

## Città e veicoli

Le quattro origini sono (0,0), (1080,0), (1080,1080), (0,1080) metri. Reti urbane deterministiche con 324 incroci, 576 segmenti, quattro ponti, otto nodi delle quattro scorciatoie e nodi aggiuntivi per salita, discesa e rientro del passo. Il GPS A* usa la rete dei soli quartieri aperti. Lo sblocco dipende dai rivali anche per i collider delle barriere. Il passaggio guidato cambia quartiere, traffico, reset e telefono mantenendo la posizione fisica; il viaggio rapido resta un’opzione esplicita.

Hillcrest usa un terreno a triangoli, quota 0-55 m, pendenza massima inferiore al 19%; mesh, collider e quote del navigatore derivano dalle stesse coordinate. La discesa drift dedicata è sul versante orientale e non interseca più Neon District. Salita, discesa e rientro sono percorribili anche senza evento e fanno parte del GPS di Hillcrest. Airport Belt ha un tunnel aperto alle estremità. Civili riutilizzati e riposizionati sulla rete del quartiere corrente, senza simulare traffico interurbano.

Catalogo JSON di 51 auto e 12 costruttori. Dimensioni, carreggiata, passo, tetti, cabina, massa, potenza, freni, grip e resistenze differenziati. Famiglie con particolari procedurali; cinque kit oltre alla serie e trenta cerchi condividono moduli adattati alle proporzioni del modello. Il salone consente di vedere il modello selezionato senza cambiare auto attiva. La gerarchia della carrozzeria conserva le proporzioni anche per superfici ruotate e vinili. Sulle monoposto tetto e vinile superiore personalizzano la copertura posteriore; sui prototipi il vinile segue il tetto stretto. Acquisti e sostituzioni restano validati dalla progressione.

Dodici frammenti, premio unico di 250 CR e stato della collezione nel profilo v6. Migrazioni v1-v5 e chiavi autosave/slot precedenti conservate. Preferenze in chiave separata e validata.

## Rifinitura

Tre stazioni con BPM 112/138/86, voci e percussioni Web Audio senza campioni esterni. Volumi indipendenti, mute e pausa del contesto. Urti, gomme, nitro, rilascio, ambiente e pioggia sintetizzati.

Pioggia con buffer riutilizzato, bloom e sfocatura radiale in media/alta, qualità bassa senza render target del postprocessing. Ambiente riflesso e normal map procedurali. Quattro luci locali riutilizzate, selezionate fra i punti vicini senza cambiare il numero di uniformi fra quartieri. Compilazione iniziale degli shader prima di abilitare il pulsante di guida. La telemetria F3 conta anche i passaggi del postprocessing. Controlli rimappabili con scambio dei duplicati, asse/inversione del gamepad, km/h/mph, IT/EN e crediti nel menu. Dizionario con conservazione dei nomi propri e dei testi italiani per tornare alla lingua iniziale.

In sviluppo: raycast delle quattro ruote, linea della gara, Alt+clic sulla mappa per posizionare l’auto sulla strada, strumento crediti già disponibile. Nessuna assegnazione di checkpoint o arrivi dal controllo QA.

## Verifiche automatiche e browser

- 82 test Vitest passati in 20 file: statistiche, economia, estetica, drift, progressione, migrazioni, navigazione, preferenze, stile di guida, input e fisica Rapier.
- Test fisici su tutti i 51 modelli: accelerazione e contatto con il suolo. Una supercar di serie supera 300 km/h senza nitro sul piano; in manuale supera 250 km/h in sesta. Le misure riguardano il modello arcade, non vetture reali.
- Il pilota di test percorre salita, discesa e rientro del passo con comandi e Rapier, senza ripristini o teletrasporti, raggiungendo una quota superiore a 35 metri.
- Suite browser completa da 25 scenari passata durante l'integrazione. Copre anche le fasi precedenti: guida, gare reali, economia, salvataggi, foto, modalità speciali e carriera da zero fino ai rivali.
- Verifica mirata finale di otto scenari: audio procedurale e silenzio, ponte continuo e GPS conservato, ponte bloccato, pendenze e gara regionale, impostazioni/rimappatura/pioggia/bloom, IT/EN e raccolta persistente, cattura del gamepad e assistenza durante una gara, configurazione estetica e guida della monoposto. Il controllo geometrico del vinile superiore comprende tutti i 51 modelli. Tutti e otto passati nella verifica finale (4,1 minuti).
- L'audio viene anche renderizzato in OfflineAudioContext: tre radio producono segnale, volumi azzerati producono silenzio e un impatto resta udibile a velocità corrente zero. Il dispositivo gamepad simulato verifica anche l'assegnazione del pulsante pausa alla nitro senza chiusura del menu.
- TypeScript strict, build Vite, ESLint e Prettier verificati. Controllo finale sulla build distribuibile superato, dopo la correzione del layout Impostazioni a 800 pixel.

## Build distribuibile

Verificata con Chromium sul server preview dopo la compilazione finale:

- Migrazione di un profilo v4 a v6 conservando elaborazioni, kit, record, punteggi drift, fantasma e coppa sospesa. Avvio carriera senza reputazione retroattiva e sponsor conservato dopo ricarica.
- Guida reale, telefono e impostazioni a 800 pixel; menu Impostazioni con colonne adattive e selettori senza sovrapposizioni.
- Garage pieno: sostituzione con Drevalyn Rhelix, saldo corretto, parti trasferite e ripristino della copia precedente.
- Lingua inglese, mph e stazione radio conservati dopo ricarica.
- Nessun oggetto QA o strumento crediti e nessun cambio posizione con Alt+clic sulla mappa.
- Perdita intenzionale del contesto WebGL mentre Impostazioni è aperto: menu chiuso, pulsante di riprova focalizzato e ricarica riuscita.
- Nessun errore JavaScript o di compilazione degli shader negli scenari verificati.

Screenshot locali in artifacts/: quartieri, mappa, salone, famiglie auto, monoposto con vinile, impostazioni, telefono inglese, pioggia e bloom. I file di diagnostica non fanno parte delle risorse distribuite.

## Contenuti e dimensioni

Controllati nomi e testi in codice, dati, risorse e crediti rispetto ai riferimenti reali comuni di auto, costruttori, giochi e città. La terminologia generica potenzialmente ambigua è stata poi riformulata nella review finale. Costruttori, modelli, emblemi, personaggi, città, stazioni e sequenze musicali del gioco sono creati per questo progetto. Nessun asset creativo esterno aggiunto. Le licenze MIT, Apache-2.0 e OFL sono incluse nella build; i nomi tecnici delle dipendenze restano nei crediti.

La build statica comprende 12 file per 5.366.888 byte (circa 5,37 MB) non compressi, sotto il limite di 15 MB. Vite segnala un singolo bundle JavaScript grande, che include il motore fisico compatibile e i suoi dati incorporati. Nessun backend, caricamento di risorse remote o servizio esterno.

## Limiti di misura

Campione storico precedente alla review conclusiva: Chromium, SwiftShader, qualità bassa, 800 × 850 pixel, 3.16 fps medi su 2.53 secondi; telemetria 173 draw call e 43.520 triangoli. Dato grezzo in artifacts/phase8-performance.json. È rendering eseguito dalla CPU e non una misura di una GPU integrata. Il campione è breve e non dimostra le prestazioni dell'intera città.

I controlli browser usano Chromium e rendering software. Non certificano 60 fps su una GPU integrata. Il gamepad fisico non è stato collegato: input standard e rimappatura vengono verificati anche con un dispositivo simulato. Polizia, danni estetici, touch e taratura fine restano opzionali e non implementati. Il mondo è generato in memoria una volta, con attivazione per distanza e dettagli, senza scaricamento o rigenerazione dei settori.
