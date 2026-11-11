# Verdetto indipendente di Opus

11 novembre 2026. Claude Code locale 2.1.302, modello claude-opus-5-5. Sessione ca78670c-6133-42a9-ac71-6b32f26e3d9b. Testo del reviewer conservato integralmente. I numeri di riga si riferiscono alla candidata esaminata.

READY TO PROD

Confermo il verdetto di Codex per la distribuzione statica della candidata e50cb706deb6b5e692502767c42ee0b523e4721cde5c7a10caf7506751c92ded. Nella seconda iterazione nessun P1 o P2 era aperto nel codice, e il verdetto dipendeva solo dalle quattro prove finali. Ora quelle prove ci sono, sono complete e non segnalano errori. Le correzioni N1-N7 sono nel codice e non introducono regressioni bloccanti. Non ho trovato blocchi nuovi.

## Prove richieste nella seconda review

| Prova attesa | Esito | Evidenza |
|---|---|---|
| Suite Playwright completa e seriale | 28/28 in 7,1 minuti, 1 worker, fantasma con ricarica incluso (caso 12) | artifacts/review/browser-final.txt |
| Build distribuibile su preview | PASS: migrazione v4->v6, sponsor, guida, garage pieno con ripristino, preferenze persistenti, nessuno strumento QA o crediti, recupero dalla perdita del contesto WebGL, nessun errore di pagina o shader | production-final.txt, verify-production.mjs |
| Telemetria dopo l'unione delle geometrie | 1280×800, circa 15 secondi per campione, 0 errori: 214/316/334 draw call nei profili basso, medio e alto, 352 in gara con cinque partecipanti | performance-after-batching.json |
| Confronto del batching isolato | Draw call dell'auto da 83 a 35 senza ombre e da 141 a 52 con ombre; triangoli primari invariati (2.112) | car-batch-comparison.json |
| TypeScript, lint, format, Vitest | Dichiarati passati: 90 test in 22 file | review-finale.md |

L'importo nel controllo di produzione è allineato al catalogo. verify-production.mjs:54 legge il prezzo di drevalyn-rhelix da careerCatalog. Il valore di permuta 4.500 corrisponde al prezzo della silex-c1 (9.000) per il tasso del 50% (career.json:270 e 2104, profile.ts:324).

I triangoli con ombre salgono da 2.832 a 2.976. L'aumento è coerente con il codice: box() imposta castShadow e cylinder() no, quindi un gruppo unito che contiene almeno un caster proietta ombra per intero. È un costo marginale e dichiarato.

## Verifica di N1-N8 nel codice

- N1, griglia: chiuso. model.ts:737-760 usa 3 barre larghe 0,38 m ruotate di 45°. Sporgono di circa 0,19 m dal centro e restano tra x ±0,63 e y da -0,11 a 0,27, sul frontale. Nell'immagine catalog-three-quarter.png gli 8 modelli Caldorva e Arqessa mostrano tre rombi scuri sul paraurti e la fascia che attraversava il cofano non c'è più.
- N2, monoposto: chiuso. Altoparlanti e coni usano entrambi il passo 0,19 (model.ts:494 e 503) e l'accento è a ±0,5 (model.ts:817).
- N3, vetri: chiuso e verificato in modo solido. Ho controllato i segni degli angoli in model.ts:201-243 sui dati (screenAngle sempre negativo, rearAngle sempre positivo). Il bordo superiore delle lastre è esattamente alla quota media del tetto, sotto la sua faccia superiore, e il raccordo è di 1,5 cm sotto il bordo. Il calcolo nel portellone tiene conto della sua scala in profondità. Il test review.test.ts:58-76 controlla tutti i modelli non monoposto con tolleranza di 1 mm. Nell'immagine catalog-side.png nessuna lastra supera la cabina.
- N4, lotti: chiuso. metro.ts:121-126 ricava i lotti riservati da info.architecture. Le coordinate -180 e 60 cadono esattamente sulle celle 2 e 4 della griglia. Le architetture vengono costruite dallo stesso elenco (metro.ts:207) e l'elenco di Old Docks è vuoto (career.json:36).
- N5, barra dei giri: chiuso. hud.ts:219-226 ricalcola le etichette quando cambia la chiave limite/lingua, con il separatore corretto.
- N6, colore dei rivali: chiuso. system.ts:224 assegna driver.color all'indicatore di ogni pilota selezionato, anche nelle gare contro un rivale.
- N7, allocazione nel passo fisico: chiuso. main.ts:60 definisce DRIFT_MODES come Set di modulo, usato a main.ts:920.
- N8, documenti: chiuso. verifiche-fase8.md:3 si dichiara resoconto precedente e rimanda a review-finale.md. hud-medium.png è stato rigenerato: bloom leggibile, entrambi i quadranti visibili, scala 0,0 / 1,9 / 3,8 / 5,7 / 7,6 con la virgola italiana.

## Osservazioni residue P3, non bloccanti

1. Altoparlanti della monoposto. Sono dischi orizzontali di raggio 0,14 con passo 0,19, quindi si sovrappongono di circa 9 cm. Con l'impianto di livello 2 il bordo esterno arriva a ±0,425 m, contro i ±0,40 del vano. È un difetto estetico di pochi centimetri, visibile solo a portellone aperto. Rimedio facoltativo: raggio 0,09 per la famiglia single.
2. Rombi delle griglie Caldorva e Arqessa. Arrivano fino a y -0,11 e nella vista di tre quarti sembrano denti sotto il paraurti. Lo considero una scelta di stile accettabile, non un'intersezione con il cofano.
3. Collegamenti nella documentazione. README.md:218 chiama "resoconto effettivo dei controlli" docs/verifiche.md, che è il resoconto delle fasi 1 e 2. AGENTS.md:9 rimanda ancora a verifiche-fase8.md per i limiti. Il rimando corretto a review-finale.md c'è comunque (README.md:238 e verifiche-fase8.md:3), quindi la catena si legge senza errori. Conviene puntare direttamente a review-finale.md.
4. Nel campione hud-race.png compare "FUORI PERCORSO", perché la prova prestazionale usa un input rettilineo. Non tocca il gameplay: il circuito completo con quattro IA è coperto dal caso 24 della suite.

## Limiti documentati, che non sono misure ottenute

- 60 fps su un portatile fisico con GPU integrata: non certificato. I campioni sono su una GPU virtuale VMware SVGA 3D via Direct3D11, con 55-59 fps medi e 95° percentile a 16,7-16,8 ms. Sono vicini al limite del refresh ma non dimostrano il requisito. L'andamento non monotono tra basso e medio indica rumore dell'ambiente, non differenze dei profili.
- Gamepad fisico non provato. Guida e rimappatura sono testate con la Gamepad API simulata; i menu si usano con mouse e tastiera, come scritto nel README (riga 55).
- Il costo del traduttore sui testi dinamici e quello delle ombre della città non risultano colli di bottiglia nelle misure disponibili, ma non sono stati misurati su hardware fisico.
- Nella gara veloce di Vetracava, con Hillcrest ancora chiuso, uscire dalla piattaforma fa cadere l'auto; R recupera al checkpoint. È documentato in README.md:240.
- Identità dei quartieri: l'implementazione usa architetture e temi originali. Gli esempi culturali della richiesta iniziale sono stati presi come esempi. Resta un'interpretazione che Giovanni può confermare o correggere, non un'approvazione già data.
- Vite segnala un bundle singolo grande. Non è un errore, e la build da circa 5,40 MB resta sotto il limite di 15 MB.

Con questo la review iterativa è chiusa: il mio verdetto indipendente coincide con quello di Codex. Non ho modificato file e non ho eseguito comandi.
