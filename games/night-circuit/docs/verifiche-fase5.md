# Verifica della fase 5

Data: 10 novembre 2026. Versione locale 0.5.0. Windows, Node.js 24.20.0, npm 11.19.0.

## Perimetro

Tuning estetico della Orvane Silex C1, unico modello della tappa attuale. Cinque kit oltre alla serie, parti indipendenti, trenta cerchi, finiture, vetri, luci, neon, vinili e studio fotografico. Ogni esemplare mantiene aspetto e inventario propri. Nessun modello automobilistico aggiuntivo, modalità di gara o sistema di carriera viene presentato come completato.

## Implementazione

- Catalogo, prezzi, disegni dei cerchi, forme originali dei vinili, filtri e configurazione estetica iniziale in JSON.
- Anteprima prima dell’acquisto, costo dei soli pezzi mancanti, reinstallazione gratuita, regolazioni e colori inclusi. Le bozze si applicano esplicitamente; uscire le scarta. Gli strumenti di sviluppo non interrompono una bozza estetica.
- Cinque kit distinti e selezione indipendente di paraurti, minigonne, spoiler, cofano, tetto, specchietti, bocchettone e scarichi. Materiale a fibra generato dal codice.
- Trenta cerchi procedurali con numero/disposizione dei raggi distinti, diametro da 17 a 22 pollici, colore, pinze e spinner. Il diametro esterno del pneumatico e il veicolo fisico restano invariati. Le pinze seguono sterzo e sospensione senza orbitare con i pneumatici.
- Lucida, metallizzata, perlata, opaca e cangiante. Perlata e cangiante usano la relazione fra normale e direzione di vista per miscelare il secondo colore. Vetri e colori di fari/fanali sono configurabili. Neon fisso, pulsante o a inseguimento; colori degli indicatori applicati durante la guida.
- Editor di dodici strati con sei forme, quattro superfici, posizione, scala separata sui due assi, rotazione, colore, opacità, specchiatura, duplicazione, ordine e cancellazione. Lo spazio del puntatore viene convertito nel sistema del SVG anche in presenza di margini dovuti alle proporzioni del riquadro. I vinili laterali seguono il profilo esterno dei kit, delle porte chiuse e delle minigonne.
- Interni, impianto visibile nel bagagliaio, porte verticali, cofano e portellone apribili nello studio. Salto idraulico come animazione transitoria nel garage.
- Anteprima e guida usano lo stesso generatore e la medesima configurazione. Sostituire un modello libera geometrie, materiali, texture e buffer degli oggetti in instancing. Il renderer del garage viene riutilizzato e fermato alla chiusura. La scena stradale non viene ridisegnata sotto il garage opaco; il passo di controllo continua a gestire i comandi e riprende normalmente la guida alla chiusura.
- Foto 16:9, orbita/zoom e quattro filtri. Export di un PNG 1600 × 900 dalla sola scena 3D. Il filtro viene applicato ai pixel del file. Dimensioni e rapporto della preview vengono ripristinati anche in caso di errore.
- Schema v3, migrazione dei profili v2 senza perdita di crediti, auto, componenti, risultati e record. Sono mantenuti autosave, slot, copia precedente e import/export. Le chiavi locali esistenti conservano il nome precedente per compatibilità.

## Review e metodo

Review indipendente in sola lettura dal secondo agente già coinvolto. Il modello Opus non è disponibile in questa sessione. Corretti ancoraggio delle pinze, validazione rigorosa del lato del vinile, trascinamento SVG con cambio di proporzioni e posizione delle decal sulle carrozzerie allargate. I test con Raycaster confrontano la superficie del vinile con le vere mesh del kit, delle porte e delle barre inferiori.

Il controllo visivo ha incluso le immagini PNG esportate. Il primo test completo ha verificato configurazione, acquisto, vinili, aperture, esportazione con filtro monocromatico, ricarica, scarto della bozza e colori durante la guida. Il test a 800 pixel ha individuato un canvas troppo largo al rientro dalla foto; corretto il dimensionamento minimo della griglia e del canvas e ripetuta la verifica.

I test unitari verificano economia e inventari indipendenti, migrazione v2, colori e limiti validi, rifiuto di lati non testuali, punteggio estetico limitato senza premio per duplicati identici, specchiatura, dismissione delle risorse e ancoraggio delle pinze con sterzo e rotazione reali. Restano attivi i confronti fisici Rapier e le regressioni delle fasi precedenti.

La prova del file fotografico controlla dimensioni PNG e pixel: l’immagine contiene la scena e la monocromia è presente nei dati scaricati. Il controllo non si limita all’anteprima CSS o all’estensione del file.

## Esiti finali

- `npm run build`: superato, TypeScript strict e build statica di 12 file, 5.159.450 byte. Sotto il limite iniziale di 15 MB. Resta l’avviso Vite per il singolo bundle grande, contenente anche il motore fisico WebAssembly.
- `npm test`: 44 test superati in 12 file. Comprendono i precedenti test fisici Rapier, migrazioni, economia e i nuovi controlli estetici e geometrici.
- `npm run lint` e `npm run format:check`: superati sulla versione 0.5.0.
- `npm run test:browser`: dieci scenari superati nella suite completa, circa 23,5 minuti con rendering software. Due scenari nuovi per estetica e foto, otto regressioni per guida, GPS, garage, salvataggi e gare. Nei due eventi tutti e cinque i partecipanti terminano con il vero passo fisico.
- Il test ridimensionato verifica il trascinamento a coordinate normalizzate 0,75/0,25, l’applicazione sul kit largo e il ritorno dalla foto senza scorrimento orizzontale.
- Il test completo verifica acquisto, tre strati di vinili con specchiatura, aperture, foto, file PNG monocromatico, persistenza dopo ricarica, scarto delle bozze e colori del HUD durante la guida. Nessun errore JavaScript o di compilazione shader rilevato.
- Prova aggiuntiva sulla build statica con `npm run preview`, dopo l’esclusione del rendering stradale sotto il garage: caricamento automatico di un profilo v2, conservazione di motore elaborato e record, acquisto estetico con prezzo da catalogo, cangiante, vinile specchiato, PNG reale, ridimensionamento a 800 pixel durante la foto, ritorno alle prestazioni, ricarica e ripresa effettiva della guida. Superata, senza errori JavaScript o shader.
- Verificata l’assenza dell’oggetto QA, delle etichette e dei binding degli strumenti di sviluppo dell’economia nella build distribuibile, sia nel codice prodotto sia durante la prova browser.
- Controllo mirato nei sorgenti, test, documenti e metadati del gioco: nessuna occorrenza dei marchi reali cercati, segnaposto incompleti o trattino lungo.

Immagini aperte e controllate: `artifacts/phase5-editor.png`, `artifacts/phase5-photo.png`, `artifacts/phase5-wide-kit.png`, `artifacts/phase5-street.png` e `artifacts/phase5-production.png`. Il PNG della verifica finale è un’immagine esportata dallo studio, non uno screenshot dell’interfaccia. Gli artefatti locali sono esclusi da Git.

## Limiti effettivi

Tutti i contenuti restano procedurali e low-poly. I vinili dei fianchi occupano la fascia inferiore della carrozzeria; cofano e tetto hanno superfici dedicate. La personalizzazione non modifica il veicolo fisico. Lo studio fotografa l’auto nel garage; non è una cattura del desktop o una modalità foto dell’intera città. Aperture e idraulica sono transitorie e disponibili nello studio. L’impianto nel bagagliaio è visivo: musica e radio appartengono alla rifinitura.

Le prove browser usano rendering software e non certificano 60 fps su GPU integrata. Il gamepad fisico resta da verificare sull’hardware dell’utente. Nessun nuovo servizio, dipendenza, pipeline o pubblicazione introdotto.
