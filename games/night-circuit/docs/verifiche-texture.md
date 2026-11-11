# Revisione texture procedurali

Data: 11 novembre 2026. Primo passo della nuova revisione visiva, distinto dalle otto fasi precedenti. Nessuna pubblicazione o modifica CI/CD eseguita.

## Realizzato

- `src/gen/textures/generator.ts`: 16 ricette a 512 px, selezionabili anche a 256 px. Asfalto bagnato, asfalto con segnaletica consumata, marciapiede, tre mattoni, cemento macchiato, lamiera ondulata, vetro, due facciate, saracinesca, due insegne cartellone astratto e panorama notturno originale.
- Ogni ricetta produce quattro PNG: albedo, roughness, normal ed emissive. Le normal derivano da un campo di altezza condiviso con giunti e crepe. Le superfici senza emissione producono una mappa emissive nera.
- Finestre con diverse tonalità calde, aperture delle tende e sagome coerenti fra albedo ed emissione. Testi delle insegne composti da sillabe inventate e disegnati dai glifi originali del repository.
- Worker OffscreenCanvas per la generazione, seed deterministico e cache IndexedDB separata dai salvataggi, indicizzata per versione generatore, seed, risoluzione e materiale. Fallback in memoria se la cache è disabilitata o non scrivibile. I tempi mostrati dalla scheda sono quelli della singola esecuzione, non un requisito prestazionale certificato.
- Laboratorio `?debug=textures`, disponibile anche nella build statica: 64 mappe in griglia, filtro per canale, ingrandimento nativo, seed/risoluzione, svuotamento cache texture e anteprima PBR con rotazione. Il nome di ciascun materiale seleziona l’anteprima.
- Materiali collegati all’asfalto della città/pista e a cemento, facciate, mattoni e lamiera di Old Docks. Geometrie attuali conservate in attesa del passo edifici.
- Font esterno rimosso da dipendenze, import CSS, testi dei crediti e file distribuiti. Circuit Grid generato da `tools/fonts/generate.py` usando i glifi originali JSON, compresi accenti e simboli dell’interfaccia. Nessun asset esterno aggiunto.

## Verifiche

- `npm run build`: superato. Resta l’avviso Vite sulla dimensione del chunk principale; nessun nuovo errore di compilazione.
- `npm run lint`: superato.
- `npm test`: 22 file, 90 test superati, incluse fisica Rapier, gare, progressione, salvataggi e geometrie.
- `npx playwright test tests/textures.spec.ts`: tre verifiche browser con Chromium e rendering software. Controllati 16 materiali, 64 immagini da 512 px, confronto dei pixel decodificati per seed uguali/diversi a 256 px, 16 hit e zero rigenerazioni dopo reload, variazione seed/risoluzione, ingrandimento, cambio anteprima, generazione con IndexedDB disabilitato e assenza di richieste HTTP esterne dal laboratorio.
- Città avviata, ingresso in guida e accelerazione oltre 15 km/h con materiali procedurali, senza eccezioni JavaScript o errori di compilazione degli shader. Screenshot della scena reale e del laboratorio controllati visivamente.
- Font rigenerato con `python tools/fonts/generate.py`.

Screenshot locali in `artifacts/textures-lab.png`, `artifacts/textures-albedo.png`, `artifacts/textures-facade-pbr.png` e `artifacts/textures-city.png`.

## Limiti e prossimi passi

Il controllo software non misura le prestazioni su GPU integrata. Le texture ora seguono una scala in metri, con proiezione su superfici orizzontali e verticali, anche su mesh instanziate. La nuova grammatica di facciata, i moduli edilizi e la loro densità appartengono al secondo passo. Le luci del laboratorio servono alla verifica PBR e non costituiscono il bake della città richiesto nel terzo passo. Le auto mostrate sono quelle procedurali precedenti, non i modelli Blender da 3-8k triangoli del quarto passo. Non sono stati importati texture, modelli, font o suoni esterni.

Questa attesa appartiene al primo resoconto. La successiva richiesta di Giovanni di continuare fino al dettaglio del riferimento la supera: edifici, illuminazione e auto sono descritti nella [revisione grafica completa](revisione-grafica.md).

## Correzione dopo i riferimenti visivi di Giovanni

La prima versione del passo texture è stata respinta. Le immagini fornite in chat fissano il risultato complessivo atteso: un ambiente urbano notturno credibile, edifici di tipologie diverse, superfici consumate, riflessi coerenti e controllati, cielo nuvoloso, auto dalle forme curate e interfaccia leggibile. Non indicano una direzione pixel art o una città di blocchi uniformi. Non copiare marchi, veicoli o contenuti delle immagini. Nessuna immagine di riferimento viene incorporata come asset.

Revisioni del primo passo:

- Mattoni calcolati per singolo elemento con variazioni di impasto, bordi, fughe e microdifetti. Cemento, lastre e metallo con dettaglio su più scale. Riparazioni dell’asfalto traslucide con aggregato conservato, microcrepe meno marcate, macchie d’acqua localizzate e normal più leggere.
- Facciate con finestre più piccole, cornici sottili, recessi, davanzali, tracce di dilavamento, interni accennati, tende rigate e sagome rare. Emissione ridotta e distribuita su una minoranza di aperture.
- Proiezione delle mappe nello spazio del mondo: finestre e grana non si deformano secondo le dimensioni dei blocchi o la lunghezza dei segmenti stradali. Campionamento coerente fra albedo, roughness, emissive e normal, inclusa la base tangente delle normal.
- Texture originale di cielo nuvoloso e riflessi urbani, con skyline lontano generato. Nella guida sostituisce lo sfondo uniforme e l’ambiente bianco da studio. Il numero e la posizione delle luci della città restano quelli precedenti; nessun bake anticipato.
- Font riprogettato con tratti vettoriali originali, minuscole, accenti e tre pesi veri; insegne disegnate dagli stessi tratti. Il vecchio disegno a pixel resta soltanto per alcuni simboli.

Queste correzioni riguardavano soltanto i materiali. Il successivo lavoro su architettura, luce precalcolata e modelli auto, autorizzato dalla richiesta di continuare senza pause, è documentato nella revisione grafica completa. La verifica corrente delle texture comprende 17 materiali e 68 mappe.

La prova della nuova proiezione ha superato il timeout iniziale di 30 secondi durante il primo rendering software. La proiezione è stata spostata sui vertici, riducendo il lavoro per pixel; il test consente fino a 120 secondi per il primo ingresso. Questa tolleranza della verifica software non costituisce una misura delle prestazioni su hardware grafico reale.
