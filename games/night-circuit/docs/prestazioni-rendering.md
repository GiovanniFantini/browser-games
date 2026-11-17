# Ottimizzazione del rendering del 17 novembre 2026

Modifiche implementate e verificate localmente, poi pubblicate il 17 novembre 2026 su autorizzazione di Giovanni. Commit e prove sul dominio pubblico sono nella [pubblicazione verificata](pubblicazione.md).

## Risultato misurato

Cinque coppie alternate baseline/ottimizzata, nello stesso browser, con contesti isolati: Chrome headless, ANGLE Direct3D 11 su VMware SVGA 3D, 1280 × 800, devicePixelRatio 1, qualità media. Ogni campione comprende quattro secondi di stabilizzazione e sei secondi di misura con simulazione, traffico e sonda dei riflessi attivi. Il confronto riguarda la scena iniziale con auto ferma, non un giro completo della città.

| Misura | Baseline | Ottimizzata |
| --- | ---: | ---: |
| Durata media del callback del frame | 70,62 ms | 57,88 ms |
| Intervallo medio fra frame | 77,29 ms | 63,66 ms |
| FPS ricavati dagli intervalli | 12,94 | 15,71 |
| Media dei P95 degli intervalli dei cinque campioni | 89,96 ms | 77,84 ms |
| Callback nei soli frame che renderizzano una faccia della sonda | 70,89 ms | 61,07 ms |
| Frame misurati | 387 | 471 |

Il callback impiega mediamente il 18,0% in meno; l'intervallo fra frame si riduce del 17,6%, equivalente al 21,4% di FPS in più. Tutte le cinque coppie migliorano: la riduzione dell'intervallo varia dal 12,7% al 24,7%. Sono statistiche descrittive di questa sessione, non una garanzia su altre scene o macchine.

La sonda mantiene la cadenza di 0,06 secondi di simulazione. Con frame più brevi viene eseguita in una quota inferiore di essi: per questo il banco registra separatamente i frame con sonda. Anche questo confronto mostra un miglioramento, circa il 13,9%. Non sono stati ridotti risoluzione, numero di facce o frequenza della sonda.

Nessun errore JavaScript/WebGL rilevato e nessun frame di misura in pausa. Il numero di programmi rimane stabile durante ogni campione. Il tempo del callback comprende JavaScript e chiamate sincrone al driver; la differenza rispetto all'intervallo non costituisce una misura isolata della GPU.

L'avvio non ha un miglioramento dimostrato: i tempi risentono delle cache del driver e della preparazione iniziale. Le mediane osservate sono 13,23 secondi per il baseline e 14,42 per la versione ottimizzata. Il risultato riguarda soprattutto la fluidità a regime. Queste prove non misurano la GPU fisica del PC di Giovanni e non certificano 60 FPS su GPU integrata.

## Modifiche mantenute

- Il riflesso planare viene renderizzato prima della scena principale, evitando un render del mondo annidato. Le ombre vengono aggiornate nello stesso frame usando la camera principale, con la stessa copertura dei layer, e riutilizzate dalla scena. I flag e il wrapper introdotti dall'ottimizzazione vengono ripristinati anche in caso di errore; il recupero da un'eccezione interna del Reflector resta quello della libreria.
- In qualità media e alta le matrici del mondo vengono aggiornate una volta per frame, dopo movimento, telecamera, luci e posizionamento dello specchio. Gli altri passaggi riusano tali matrici. In qualità bassa resta l'ordine originale del singolo passaggio. I batch statici degli edifici conservano la matrice locale identità.
- A Hillcrest il Reflector viene conservato e nascosto. Al ritorno la camera riflessa ricattura l'inversa della proiezione corrente, come accadeva ricreando il Reflector. È verificato anche un ritorno dopo ridimensionamento. La qualità bassa continua a liberare i render target degli effetti.
- La precompilazione degli shader usa il render target HDR del composer in qualità media/alta e il canvas in bassa. Le texture dei mesh visibili vengono inizializzate prima del via.
- La sonda dell'auto riparte dalla prima faccia e da una scadenza azzerata dopo il rilascio in qualità bassa.

Le misure riguardano l'insieme delle modifiche e non isolano il contributo di ciascuna. Settori della città, fisica, modelli, materiali creativi, shader degli effetti e relativi parametri conservano i contenuti precedenti. Non è stato introdotto un nuovo sistema di streaming o di dettaglio ridotto.

## Verifica grafica

Nove confronti del canvas reale WebGL, con stessi asset, pose, clock, meteo, nitro, qualità e risoluzione: sottopasso, viale, vista inversa, visuale verso Neon, pioggia con nitro, Hillcrest, ritorno da Hillcrest, qualità bassa e alta. Tutti e nove hanno zero pixel differenti rispetto al baseline.

Le catture controllate normalizzano in entrambe le versioni l'inversa della camera riflessa, per eliminare la dipendenza dalla durata della prima requestAnimationFrame. Il test browser separato verifica il ritorno dopo resize senza questa normalizzazione. La guida reale e i cambi di qualità sono verificati con il ciclo effettivo del gioco, oltre alle pose controllate.

Il banco serve i cinque moduli originali salvati prima delle modifiche e i moduli correnti. Canonicalizza i timestamp degli import Vite in entrambe le versioni, così il caricatore GLB e il costruttore dei modelli condividono la stessa cache. I messaggi HMR sono disattivati soltanto nel banco, per impedire ricaricamenti durante le misure. Le pose controllate impediscono anche l'attivazione involontaria del throttling di pausa.

## Esperimenti scartati e review

È stato provato il preriscaldamento completo tramite render aggiuntivi, riempimento anticipato della cubemap e PMREM prima del via. La bisezione ha mostrato differenze sul riflesso dei vetri in qualità bassa e nel caso pioggia/nitro. Questa parte è stata rimossa. Resta soltanto la precompilazione e l'inizializzazione delle texture: nessun frame o sonda anticipata modifica l'aspetto iniziale dell'auto.

Il primo utilizzo di bloom, radial blur e PMREM può quindi ancora richiedere lavoro durante il gioco. Non si dichiara eliminato ogni possibile scatto iniziale.

Claude Code locale, modello `claude-opus-5-5`, ha esaminato codice, immagini e metodologia. Due review hanno richiesto correzioni; il controllo conclusivo ha chiuso i blocchi con la riga `raggiunto`. Il verdetto riguarda conservazione della qualità e correttezza delle modifiche, non una certificazione prestazionale del PC reale.

## Controlli ed evidenze

- 92 test unitari in 23 file superati.
- Quattro test browser superati: nuovo controllo del rendering, 51 GLB e volumi di visibilità, guida e garage. Il nuovo controllo verifica render non annidati, aggiornamento unico di matrici/ombre, camera delle ombre, cadenza dei binding della sonda, accelerazione reale, riuso del Reflector, resize, rilascio in bassa e ricollegamento dei materiali in alta.
- TypeScript, lint, formattazione e build superati. Resta l'avviso Vite già esistente sulla dimensione del chunk principale.
- Gli oggetti del banco e dei test e l'interfaccia QA sono assenti dagli asset della build.
- Pacchetto statico locale verificato nel browser: avvio, accelerazione con input reali e garage 3D, senza errori JavaScript/WebGL. Verificata anche a runtime l'assenza degli oggetti QA e del banco. Catture e risultato sono in `static-driving.png`, `static-garage.png` e `static-smoke.json` nella cartella delle evidenze.

Le evidenze locali ignorate sono in `artifacts/perf-optimization/`: `results-performance.json` contiene i dieci campioni definitivi e i singoli frame; `summary.json` le statistiche; `image-diff.json`, i PNG e i JSON di debug i nove confronti; `opus-acceptance.txt` il verdetto finale. `results-prewarmup-experiment.json` conserva le misure della variante sperimentale scartata e non va confuso con il risultato definitivo. Il banco, le copie del baseline e gli script di confronto non fanno parte della distribuzione.

Il ciclo di misure non comprendeva la pubblicazione. La successiva richiesta di Giovanni ha autorizzato commit e aggiornamento online, completati e verificati il 17 novembre 2026. Nessuna pipeline o configurazione CI/CD è stata modificata.

La successiva [review completa](review-ottimizzazione.md) distingue segnalazioni, correzioni del gameplay preesistente, verifiche aggiuntive e limiti confermati con Opus.
