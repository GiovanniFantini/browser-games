# Crediti e licenze

## Contenuti del gioco

Auto Orvane Silex C1, veicoli civili, città Port Riders, Old Docks, pista Bacino 09, insegne e marchi immaginari creati per questo progetto. Geometrie, decorazioni, mappa, materiali e texture dei cartelli generati dal codice. Nessun modello o texture scaricato da cataloghi esterni. Nomi, marchi e sagome sono originali; le immagini fornite in chat orientano il livello di qualità visiva.

Motore ed effetti pneumatici sintetizzati con Web Audio API. Nessuna traccia musicale esterna. Le tre radio Lumen Drive, Vector Pulse e Late Current usano sequenze originali di oscillatori, percussioni e rumore generati localmente. Nessun campione musicale esterno.

Fase 3: percorsi, checkpoint, indicatori e interfaccia gare generati dal codice. I quattro piloti Nemi, Ozra, Iven e Selki sono personaggi inventati per le gare veloci; corrono su varianti di colore della stessa auto originale. Nessun nuovo asset esterno.

Fase 5: kit Velyra, trenta cerchi, forme dei vinili, motivi della fibra, interni e studio fotografico originali e generati dal codice. Nessun asset esterno aggiunto.

Fase 6: pendio di Vetracava, percorsi e nomi degli eventi, coppa e presentazione del fantasma creati per il progetto. Geometrie e materiali procedurali, senza nuovi asset o dipendenze esterne.

Fase 7: Orvane Lyra R2 e Velan GT, riviste Riflesso Tardivo, Fotogramma Notturno e Firma di Strada, contratti, testi della carriera e settori d’ingresso originali. Copertine generate dal rendering locale dell’auto e impaginate dal codice, senza nuovi asset esterni.

## Font

Circuit Grid: tratti vettoriali originali definiti in `src/gen/textures/typeface.json`, con alcuni simboli in `glyphs.json`. Il font TTF locale è generato da `tools/fonts/generate.py` con FontTools (strumento di sviluppo, nessuna risorsa grafica importata). Lo stesso dizionario disegna il testo delle nuove insegne su OffscreenCanvas. Il precedente font esterno è stato rimosso dal runtime e dalle dipendenze.

## Librerie runtime

- Three.js, autori Three.js, licenza MIT. Cielo, riflessi urbani e ambiente dei riflessi del garage sono generati dal codice originale del progetto. Licenza copiata in `public/licenses/three-MIT.txt`.
- Rapier, Dimforge e contributori, licenza Apache-2.0. Pacchetto @dimforge/rapier3d-compat. Licenza copiata in `public/licenses/rapier-Apache-2.0.txt`.

I nomi delle dipendenze sono identificativi tecnici obbligatori, non marchi rappresentati nel mondo di gioco. Gli strumenti di sviluppo conservano le licenze nei rispettivi pacchetti. Consultare package-lock.json per le versioni riproducibili.

Fase 8: 51 auto e 12 costruttori immaginari del catalogo career.json, quartieri continui, sottozone, emblemi geometrici, scorciatoie e frammenti originali. Sagome e parti procedurali modulari, senza modelli scaricati. Effetti di postprocessing dai moduli del pacchetto Three.js, con la stessa licenza MIT già distribuita. Testi inglesi inclusi in data/en.json. Tutte le risorse runtime e le licenze restano locali.

Revisione grafica: diciassette materiali con quattro mappe ciascuno generati localmente in OffscreenCanvas, con seed e cache IndexedDB. Trentuno moduli edilizi originali, volta dei Fonditori, officina, lightmap calcolate dagli script del progetto e 51 auto generate con Blender, UV e bake AO. Nessun asset esterno, nemmeno CC0. Le immagini di riferimento fornite in chat non vengono distribuite con il gioco.
