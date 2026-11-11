# Revisione visiva con Opus locale

Richiesta successiva alla pubblicazione della prima revisione grafica: raggiungere il dettaglio e la resa del riferimento fornito in chat, con review ripetute di Claude Code locale, modello Opus. Il riferimento resta materiale di confronto nelle evidenze locali ignorate e non è un asset del gioco.

Stato: soglia visiva approvata e versione pubblicata. Dopo otto review con `non raggiunto`, la nona restituisce `raggiunto`, senza difetti bloccanti. La decima conferma `raggiunto` sulla candidata finale e l'undicesima sulla guida in tempo reale della build di produzione, senza regressioni bloccanti. Il [testo conclusivo del revisore](verdetto-opus.md) è conservato nel repository. Il modello effettivo indicato da Claude Code è `claude-opus-5-5`. Il catalogo completo è rigenerato e verificato; la distribuzione pubblica è disponibile su [GitHub Pages](https://giovannifantini.github.io/night-circuit/).

## Interventi locali

- Cielo nuvoloso con shader e rumore generato dal codice; panorama HDR originale per i riflessi della carrozzeria.
- Vernice con clearcoat, vetri, gruppi ottici, cerchi a razze, pinze, battistrada e scritte originali; geometrie Blender con normali continue, paraurti sagomati, fari integrati, pannelli e interni separati.
- Pozze di luce statiche, alternanza di luce e ombra nel sottopasso, aloni e riflessi economici sull'asfalto.
- Facciate variate, finestre accese e spente, dettagli stradali e auto parcheggiate con collider.
- Fumo dai contatti delle ruote, legato a velocità laterale, aderenza e freno a mano. Telecamera e interfaccia riviste per lasciare visibile l'auto durante la derapata.
- Velocità del tachimetro calcolata dal movimento planare e regime motore coerente con lo slittamento.

## Metodo e limiti

Le catture sono prodotte nel browser dalla simulazione Rapier reale con input di guida, a qualità media. Le immagini non vengono ritoccate. Ogni ciclo include città, sottopasso, derapata e garage, oltre al riferimento. Prompt, immagini, telemetria e risposte integrali sono in `artifacts/visual-review`, esclusa dal repository e dalla distribuzione.

Il browser usa ANGLE Direct3D 11 su VMware SVGA 3D. Questa verifica dimostra rendering e comportamento nell'ambiente disponibile, senza certificare prestazioni su una GPU integrata fisica. Nessun asset creativo esterno è introdotto. Le nuove auto sono rigenerate da parametri e script Blender del repository, con bake AO, UV e limite di 3000-8000 triangoli verificato dal generatore.

## Esiti intermedi

1. Prima review: qualità complessiva 3/10. Richiesti miglioramenti a modello, luci, vernice, atmosfera, strada e movimento.
2. Seconda review: qualità complessiva 5/10. Richiesti neri più profondi, fumo naturale, riflessi stradali e carrozzeria meno squadrata.
3. Terza review: qualità complessiva 6/10. Migliorati cielo, ambiente e illuminazione; ancora insufficienti vernice, fari, strada e fumo.
4. Quarta review: qualità complessiva 7/10. Chiusi i difetti del sottopasso, la leggibilità dell'auto rispetto all'HUD e le cuciture posteriori. Restano bloccanti vernice, riflessi stradali, fumo e integrazione dei fari.
5. Quinta review: chiusi fari e asfalto, confermato il volume del fumo ma richiesta una tonalità meno luminosa. Restano vernice, luce, fumo e raccordi della carrozzeria. Le review successive valutano riflessi viola leggibili, fumo grigio irregolare, aloni più ampi, pozze sui marciapiedi e geometrie posteriori curve.
6. Sesta review: luce e movimento rientrano nella soglia. Restano finitura della vernice e sagoma.
7. Settima review: chiusi il lunotto spento e la fascia posteriore troppo chiara. La vernice rientra nella soglia. Rimane bloccante soltanto la sagoma, con richiesta di passaruota e raccordi più visibili.
8. Ottava review: confermati parafanghi e fanali posteriori, richiesti ancora interventi al frontale e alla continuità della coda.
9. Nona review, scatti del round 13: `raggiunto`. Frontale curvo, griglia integrata, passaruota leggibili, continuità tra lunotto e baule e fanali avvolgenti chiudono l'ultima categoria. Nessun difetto bloccante.
10. Decima review, scatti del round 14 dopo la correzione delle normali delle superfici curve: `raggiunto`, senza regressioni bloccanti.
11. Undicesima review, catture della build di produzione con input continui e tempo reale, senza QA: `raggiunto`. Confermata la dimensione dell'auto nell'inquadratura dopo la correzione del ritardo traslazionale della telecamera.

I punteggi intermedi descrivono il giudizio del revisore e non sostituiscono il verdetto conclusivo richiesto.

## Verifiche della candidata

- Catalogo rigenerato dallo script Blender aggiornato: 51 auto, da 6.093 a 6.190 triangoli. La Silex C1 approvata ha 6.150 triangoli; il suo GLB mantiene lo stesso hash dopo la rigenerazione e compattazione del resto del catalogo.
- Build TypeScript/Vite e lint superati. Resta l'avviso sulla dimensione del chunk principale, circa 5,43 MB non compressi e 1,98 MB gzip. I modelli vengono caricati su richiesta.
- 22 file e 91 test unitari superati per fisica, gare, tuning, progressione, salvataggi e distanza della telecamera durante una traslazione veloce.
- Tre prove texture: seed ripetibili, mappe, cache persistente, fallback senza IndexedDB e città guidabile.
- Due prove estetica: vinili, kit, aperture, acquisti, persistenza e foto PNG 1600 × 900, compresi filtri.
- Tre prove sui modelli: tutti i 51 GLB, nomi delle parti, UV, AO, triangoli, contenimento dei vertici nei volumi di visibilità, guida reale e tuning nel garage.

Le prove browser finali usano ANGLE Direct3D 11 nell'ambiente descritto sopra. Una prima esecuzione è stata invalidata da un ricaricamento Vite durante le modifiche e da un timeout di acquisizione con rendering software. Le due prove interessate sono state ripetute con esito positivo sulla versione ferma. La configurazione CI/CD non è stata modificata.

## Pubblicazione verificata

Distribuzione pubblica: commit `422e0cb3a87f5604f2d2f761c748b95869e17de2` del repository `GiovanniFantini/night-circuit`. Sorgenti della build: commit `e8e27bb22d954e95491eb7f1ba1f26734ce209d0` del repository privato BrowserGames. Il percorso base verificato è `/night-circuit/`.

La prova del pacchetto statico locale e quella sul dominio pubblico sono entrambe superate: avvio, guida con input reali, garage e studio fotografico. Nessun errore JavaScript/WebGL e nessuna richiesta di asset esterni. L'interfaccia QA di sviluppo è assente nella build pubblica. `release.json` corrisponde alla versione attesa e il GLB della Silex servito online ha SHA-256 `08bb1dc8974f56b3ed6a5c6e0702cdd3979e08bb90e6b854789932460e5cf674`, identico al file approvato.

La prima prova online ha evidenziato un ritardo della telecamera durante lo spostamento continuo, non visibile nelle catture con avanzamento manuale. La telecamera ora compensa la traslazione del corpo mantenendo la distanza, con interpolazione dell'orientamento. Un test dedicato protegge questa proprietà. Opus ha rivalutato città, derapata e garage della build di produzione con guida in tempo reale, confermando `raggiunto`.

La verifica finale sul dominio pubblico è conclusa l'11 novembre 2026 alle 18:33, ora italiana. Screenshot e rapporto tecnico sono nelle evidenze locali `artifacts/release/public-live-*`. Il campo speed del rapporto è un campione successivo alla prima cattura, non una telemetria sincronizzata a ciascuna immagine. Il precedente sito Sites conserva la versione precedente. Il repository pubblico contiene solo distribuzione compilata, asset originali generati e licenze delle librerie; non contiene le immagini di riferimento della chat.
