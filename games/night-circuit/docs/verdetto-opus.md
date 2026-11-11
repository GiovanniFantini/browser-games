# Verdetto finale Opus

Review tramite Claude Code locale, modello dichiarato dal comando: claude-opus-5-5. Data: 11 novembre 2026. Immagini reali del gioco e riferimento fornito da Giovanni. Testo del revisore riportato sotto.

## Conferma della candidata finale

raggiunto

Ho letto `round-09.md`, il riferimento e `round-14-capture.json`. Ho guardato i cinque scatti del round 14 accanto a quelli del round 13.

La telemetria è la stessa del round 13 e corrisponde agli scatti. In città 94 km/h in terza senza slittamento, nel sottopasso auto ferma, derapata controllata a 88 km/h con 11,6 m/s di lato, derapata a 77 km/h in prima quasi tutta di traverso. Il modello ha sempre 6150 triangoli, non ci sono errori e la GPU è sempre quella virtuale VMware.

Sulle immagini:
- Città, sottopasso e garage sono di fatto uguali al round 13. Il frontale arrotondato, i passaruota, la continuità tra lunotto e baule e i fanali che girano sugli angoli sono ancora lì. Su queste superfici non vedo faccette nuove, bordi spezzati o macchie di luce.
- Nella derapata a 77 km/h la coda e il parafango posteriore hanno la stessa lettura del round 13. Il cerchio posteriore sembra appena più chiaro, ma non è un difetto.
- Nella derapata controllata l'inquadratura è un po' diversa, con l'auto vista più dal fianco sinistro e il fumo distribuito in modo diverso. È una variazione dello scatto, non del modello. Sulla fiancata sinistra si vede una striscia chiara: è la luce del lampione sul parafango visto di taglio. Non è uno strappo delle normali e non rompe la sagoma.

Tutte le categorie restano al livello approvato nella review 9, cioè a 1 punto dal benchmark. Le note non bloccanti sono le stesse.

Regressioni bloccanti: nessuna.

## Conferma sulla guida in tempo reale

raggiunto

Ho letto round-10.md, il riferimento, il rapporto JSON e le tre catture reali della build di produzione.

- Città a 91 km/h in terza: l'auto occupa circa il 28% della larghezza e un terzo dell'altezza, ben ancorata nel terzo inferiore. Il riferimento sta intorno al 34%, quindi l'inquadratura è di nuovo vicina come nelle catture approvate. Il ritardo della telecamera non si vede più. Fanali posteriori, targa, riflessi viola sulla carrozzeria e lampioni sull'asfalto bagnato tengono il confronto col riferimento come prima.
- Derapata a 51 km/h in seconda: l'auto è grande e leggibile di tre quarti posteriore, con fumo, segni rossi sull'asfalto e ruota posteriore definita. La striscia chiara sulla fiancata è la stessa luce radente già descritta nel round 10, non è un difetto nuovo.
- Garage: modello, cerchi, pinze e fari sono uguali a quelli approvati. Non vedo faccette, strappi o artefatti nuovi.

Il rapporto dice qaAbsent true, nessun errore e nessuna richiesta esterna, quindi le catture sono coerenti con una guida reale. C'è una piccola incongruenza: il campo speed vale 79, mentre gli HUD mostrano 91 e 51. Probabilmente è un campione preso in un altro momento. Non è bloccante per la resa, però il rapporto non contiene la telemetria di ogni singolo scatto.

Regressioni bloccanti: nessuna. Il livello resta quello approvato, a 1 punto dal benchmark.
