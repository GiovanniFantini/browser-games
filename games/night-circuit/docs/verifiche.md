# Verifiche delle fasi 1 e 2

Data: 10 novembre 2026. Ambiente Windows, Node.js 24.20.0, npm 11.19.0.

## Ambito

Revisione rispetto alla richiesta iniziale e alla roadmap approvata: prototipo guidabile, Old Docks, grafo, minimappa/GPS e traffico. Le funzionalità delle fasi 3-8 restano escluse da questa consegna.

Review indipendente svolta da un secondo agente disponibile. Opus non è disponibile fra i modelli di questa sessione; questa limitazione è stata comunicata prima della review.

## Correzioni verificate nella review

- Stabilizzazione del veicolo: corretti i segni dei momenti di raddrizzamento.
- Camere cofano/paraurti: separato il vettore avanti dal punto da guardare. Test di regressione con auto lontana dall'origine e ruotata.
- Gamepad: mantenuto lo stato dei pulsanti tra pausa e ripresa per evitare comandi Start duplicati. Test di regressione dedicato.
- Nitro: eliminata la ricarica mentre resta premuto il comando, evitando spinta intermittente a barra esaurita.
- Navigazione tastiera: Tab disponibile nei menu; G/Esc funzionano anche con i filtri della mappa focalizzati.
- Rimosse copie di array e closure applicative superflue nel campionamento frequente degli input.
- Traffico: inizializzato nella posizione reale della strada e corretto il culling delle istanze mobili, evitando auto invisibili con collisioni attive.
- Container: eliminate duplicazioni e aggiunti collisori.
- Minimap: timer separati per disegno e ricalcolo; nessun ridisegno involontario a ogni frame.
- Elementi statici comuni della città raggruppati per materiale in instancing.
- Gestione dell'avvio audio asincrono e perdita del contesto grafico: la ripresa non deve riattivare la guida dopo un cambio di visibilità e l'errore grafico richiede ricarica.

## Controlli automatici

I test coprono trasmissione/frenata/retro, consumo e ricarica nitro, limiti di spinta, veicolo Rapier su quattro ruote, direzione delle camere, fronte dei pulsanti gamepad, A*, percorsi sulla stessa strada, proiezione stradale, semafori senza verdi incompatibili e traffico reale con arresto/ripartenza e disattivazione dei collisori.

Esiti confermati: build TypeScript strict/Vite riuscita, lint riuscito, controllo Prettier riuscito e suite completa con 12 test superati in 7 file. La build statica comprende 12 file per circa 5,04 MB, incluse le licenze: sotto il limite iniziale di 15 MB. Vite segnala un bundle JavaScript grande, dovuto anche al motore fisico compatibile con WebAssembly incorporato; non impedisce la build. I test browser sono registrati nella sezione seguente.

## Browser

Verificati visivamente scena notturna, modello, asfalto procedurale, menu e layout del quartiere nel browser integrato. Corretta la sovrapposizione della minimappa al menu.

Superati entrambi gli scenari browser principali: fase 1 (avvio, accelerazione, nitro, quattro visuali, mute, pausa/ripresa, qualità bassa, ripristino e F3) e fase 2 (guida, mappa, selezione GPS, filtri, ritorno alla guida, rotazione minimappa e densità). Controllata anche la separazione fra minimappa e tachimetro mediante i loro rettangoli sullo schermo.

Screenshot finali in artifacts/phase1-driving.png, artifacts/phase2-driving.png e artifacts/phase2-map.png. Controllati visivamente guida a Old Docks e mappa. Corretti la sovrapposizione del tachimetro e i nomi dei punti di interesse sul bordo destro della mappa. Superato anche il terzo scenario mirato: clic diretto sulla strada, impostazione GPS, cancellazione del percorso e chiusura con G mentre un filtro ha il focus. Totale: tre scenari browser superati, due nella suite principale e uno nella verifica mirata successiva.

Il profilo basso viene applicato prima del primo culling, centrato sul punto di partenza. Nel menu e in pausa il rendering è limitato a 4 Hz, mantenendo attivo il polling dei controlli; in guida torna al normale ciclo di rendering. Anche questa separazione è stata ricontrollata nella review.

Il backend locale dei test è lento: i due scenari principali hanno impiegato circa 5,6 minuti complessivi. I tentativi iniziali hanno incontrato timeout del browser integrato, avvio del server e rendering software forzato. Il profilo basso riduce ora anche il costo iniziale, i test consentono al browser di scegliere il backend grafico disponibile e l'accelerazione viene verificata attendendo lo stato effettivo invece di assumere equivalenza fra tempo reale e simulato a basso frame rate. Nessun errore JavaScript della pagina negli scenari principali superati. Questi controlli non certificano 60 fps su GPU integrata.

## Risorse e limiti di verifica

Licenze runtime e OFL incluse in public/licenses e nella build. Dipendenze bloccate nel package-lock. Audit installazione: zero vulnerabilità dopo aggiornamento della dipendenza transitiva minimatch.

Controllo dei sorgenti, testi e metadati del nuovo gioco per nomi reali di automobili, giochi e città, segnaposto incompleti e riferimenti estranei. Nessun riferimento creativo protetto individuato nel controllo mirato. Gli identificativi e le licenze delle librerie rimangono per attribuzione tecnica.

Non misurati 60 fps su un portatile con GPU integrata e non provato un gamepad fisico. Non eseguire inferenze di prestazioni hardware dai test software. Le collisioni delle ruote e il traffico sono verificati anche con il vero motore fisico nei test.

I settori della città sono residenti: culling e dettagli per distanza riducono il rendering, senza scaricare le risorse dalla memoria. Questa soluzione iniziale non certifica lo streaming della futura città completa.
