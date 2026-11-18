# Revisione della rete stradale

Richiesta del 17 novembre 2026: ridurre la regolarità della mappa, introdurre strade più naturali e dislivelli, rendere visibili le strisce. Revisione locale successiva alla pubblicazione delle ottimizzazioni. Non pubblicata.

## Modifiche

- Quattro layout deterministici in street-layout.json: curve con ampiezze e fasi diverse, bordi arrotondati e asimmetrici, 8 collegamenti diagonali, 24 tratti omessi per creare incroci a T e isolati più grandi. Il grafo mantiene gli identificativi degli incroci per preservare semafori e ponti.
- Strade campionate ogni 8 metri, superficie con quote condivise e terreno triangolato ogni 12 metri. Lo stesso terreno serve al renderer, ai collider Rapier e alle interrogazioni di quota.
- Segnaletica bianca e gialla unita in poche geometrie: mezzeria doppia, corsie tratteggiate, bordi e attraversamenti. La vernice resta sopra la superficie del riflesso, con usura generata localmente.
- GPS lungo le curve con costi delle polilinee; traffico sui collegamenti esistenti e orientamento sui dislivelli; gare convertite dalle coordinate di progetto alle coordinate fisiche dopo la costruzione del tracciato.
- Edifici riposizionati e controllati rispetto alla carreggiata, fondazioni, alberi e segnali alla quota del terreno. Riflesso planare adattato alla superficie locale e maschera ricavata dalla rete, illuminazione precalcolata riallineata.
- Fantasmi precedenti conservati nel salvataggio e adattati durante la riproduzione. Le nuove registrazioni identificano il nuovo layout.

Il viale centrale di Old Docks resta piano e diritto per il drag e per gli elementi dedicati. Banchine, sottopasso, tunnel aeroportuale, ponti e passi esterni mantengono gli accessi previsti. Il dislivello principale di Hillcrest è conservato, con un terreno più continuo rispetto ai precedenti segmenti da 120 metri.

## Verifiche concluse

Build e lint superati. La verifica completa finale supera 24 file e 101 test unitari. I nuovi controlli comprendono traffico nei quattro quartieri, invertibilità e determinante jacobiano superiore a 0,4, posizione dei semafori, quota dei triangoli Rapier e migrazione dei record. La pendenza massima di Hillcrest resta sotto il 19%. La formattazione dei file modificati è conforme. Il controllo globale Prettier segnala sette file preesistenti invariati (appearance.json, prototype.json, bake.json, appearance.css, settings.ts, track.ts e package.json); non sono stati riformattati file estranei alla revisione.

Nel browser: guida dal sottopasso con input reali, 94 km/h, nessuna collisione o errore JavaScript/WebGL. Salita fisica a Hillcrest: in quattro secondi la quota dell'auto passa da 47,11 a 50,54 metri, quattro ruote a contatto, nessun urto. Le catture dei quattro quartieri non hanno errori di console. Su 1.680 punti di carreggiata nei quattro quartieri, i raycast reali trovano la superficie con scarto massimo dalla quota interrogata di 0,005 metri. Non sono misure di prestazioni sul PC NVIDIA dell'utente.

Le prime prove hanno individuato due difetti corretti: percorso GPS inutilmente lungo all'ingresso delle scorciatoie e curva incompatibile con il drag. Una prova drift è stata invalidata da un ricaricamento Vite durante le modifiche. La verifica completa è stata ripetuta sulla versione ferma. Il secondo ciclo supera tutte le 19 prove browser in 13,7 minuti: guida, traffico/GPS, sprint, circuito, quattro IA, drag, drift, fantasma, sfida, coppa, ponti/gate/reset, gara regionale in pendenza, salvataggi/localizzazione, gamepad, personalizzazioni e rendering a diverse qualità. Il reset regionale confronta ora la posizione fisica con streetSpawn, anziché con la coordinata logica precedente. Il controllo del rendering conferma riflesso separato, ombre correnti, risorse e camera corretti nei cambi di qualità e quartiere.

La review tecnica Opus del secondo giro conferma tutti i dodici bug corretti e il via libera tecnico; condivide la classificazione dei suggerimenti rimasti non bloccanti. La review visiva del secondo giro conclude con la riga esatta `raggiunto`: strisce e diagonali senza interferenze, etichette leggibili, rete meno uniforme, dislivelli visibili dalla cresta, qualità equivalente alla precedente versione approvata. Le catture aeree sono camere QA sulla vera scena, senza modificare geometrie o luci. I suggerimenti non bloccanti condivisi riguardano raccordi e illuminazione degli incroci, precisione delle sorgenti precalcolate, un piccolo solco fra asfalto e cordolo e ulteriori differenze fra le vie secondarie. Non sono condizioni di chiusura aggiuntive. Nessun asset, risoluzione degli effetti o modello è stato ridotto per questa revisione. Evidenze ignorate in artifacts/street-revision: screenshot prima/dopo, catture dei quartieri, telemetria della salita, log build/test, prompt e risposte Opus. L'approvazione della precedente versione pubblicata non approva automaticamente questa revisione.

## Esito

Revisione locale pronta, con Codex e Opus concordi sul via libera tecnico e visivo. Sono conservati i precedenti effetti e le ottimizzazioni approvate del rendering. Nessun file di pipeline o CI/CD è stato modificato. Il 18 novembre Giovanni ha autorizzato commit e pubblicazione di questa revisione. La distribuzione viene verificata separatamente; stato e identificativi sono registrati in pubblicazione.md.

I vecchi record restano disponibili nel garage sotto Record mappa precedente. I nuovi tempi e punteggi sono separati perché lunghezze e pendenze cambiano. Carriera, inventari, premi, risultati e coppa vengono conservati. Le versioni di Node precedenti al supporto nativo TypeScript richiedono un aggiornamento per rigenerare le lightmap; l'ambiente verificato è Node 24.20.0.
