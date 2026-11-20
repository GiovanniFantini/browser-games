# Modelli di Goku e Bulma

## Stato e riferimento grafico

Giovanni ha apprezzato entrambi i concept e ha richiesto veri modelli 3D nel gioco, escludendo account e servizi esterni. Sono stati creati ed esportati localmente in Blender 4.5.15 due prototipi con scheletro, caricati dalla factory del gioco e dalle anteprime. Le tavole approvate sono il riferimento, non una certificazione di somiglianza delle mesh.

## Mesh locali attuali

| Asset GLB | Triangoli | Mesh sorgenti | Ossa | Texture incorporata |
| --- | --- | --- | --- | --- |
| Goku | 5.552 | 25 | 13 | 1.774 x 887 |
| Bulma | 4.560 | 22 | 13 | 1.774 x 887 |

I file `public/models/goku.glb` e `bulma.glb` occupano rispettivamente circa 2,05 e 2,31 MB. Goku aggiunge nel gioco un bastone da 40 triangoli. Non è applicato il vecchio passaggio dei contorni; i tratti del concept sono nelle texture. Questi numeri non sono un benchmark degli fps.

Lo script `art-source/build_characters.py` costruisce superfici a sezioni, volumi dei capelli e uno scheletro con pesi sfumati. Salva `art-source/goku/goku-v1.blend` e `art-source/bulma/bulma-v1.blend`, poi esporta GLB. Non è una scultura manuale o una conversione neurale delle immagini. Le UV proiettano le viste dei concept sui volumi: restano limiti nei profili e nei raccordi delle texture. Il retro del vestito di Bulma usa la vista posteriore con 97. La frangia fine di Bulma è nella texture della testa curva, senza ciocche sovrapposte che duplicavano i tratti.

`src/asset-characters.ts` carica i due file locali prima della creazione della scena, clona gli scheletri per ogni istanza e anima ossa di braccia e gambe. Mantiene le pose di trasporto e sollevamento. I materiali con texture conservano le ombre disegnate; le superfici laterali uniformi usano materiali toon. Un filtro del materiale sostituisce il grigio del foglio nei bordi proiettati. Le normalizzazioni dei nomi delle ossa gestiscono la rimozione dei punti effettuata da Three.js.

Per rigenerare, eseguire con un'installazione locale di Blender verificata:

```powershell
blender --background --factory-startup --threads 2 --python games/dragon-ball/art-source/build_characters.py
```

Il comando è stato eseguito con il percorso completo della versione portabile ufficiale scaricata in `artifacts/tools/`; non richiede account. Lo script genera anche `art-source/mesh-report.json`.

La compilazione e la build sono passate, insieme ai cinque test di progressione e salvataggi. Il controllo dei GLB ha verificato vertici e attributi finiti, presenza delle skin e pesi normalizzati (errore massimo circa 0,00000003). Le viste nel browser hanno individuato e corretto bordi grigi, proiezioni laterali del viso e tratti duplicati nella frangia. La riuscita artistica resta da valutare sui render reali.

Nel browser sono stati provati camminata nell'anteprima, profilo, retro con 97 leggibile e scena di gioco con ripresa della partita, incontro con Bulma, ritratti, cambio obiettivo, trasporto, movimento e salto. La prova di gioco ha usato la porta 5174; il salvataggio sulla porta 5173 non è stato modificato. Restano visibili semplificazioni nei capelli e nel raccordo delle proiezioni laterali. La build JavaScript verificata è circa 691 kB minificata, 179 kB gzip, oltre ai due GLB. Resta l'avviso di Vite sul chunk maggiore di 500 kB; nessun benchmark degli fps è stato eseguito.

## Archivio del precedente tentativo procedurale

I paragrafi seguenti descrivono i modelli precedenti, scartati. Le vecchie misure e limitazioni non descrivono i GLB attuali. I precedenti riferimenti a fal e alla pausa su Bulma sono superati dalla richiesta di lavorare localmente su entrambi.

La [tavola di Bulma](../art-source/bulma/concept-v1.png) presenta fronte, tre quarti, retro e volto. Usa il concept di Goku come riferimento di resa e il primo capitolo per treccia, fiocco e abito corallo/arancione. Sono conservati [prompt e note](../art-source/bulma/README.md). È un'illustrazione generata, da valutare, non un nuovo modello 3D.

Aggiornamento dopo il ciclo con Opus: Giovanni ha rifiutato il candidato 4 per l'effetto South Park e la mancanza di riconoscibilità. Il risultato non ha raggiunto l'obiettivo. Tutte le misure e le descrizioni tecniche sotto riguardano quel segnaposto scartato, ancora presente nel prototipo. Le valutazioni di Opus sono documentazione del tentativo, non criteri da preservare nel nuovo modello.

La nuova fase separa riferimento visivo, creazione della mesh e integrazione: un'illustrazione non costituisce un asset 3D giocabile. Non è stata ancora prodotta né importata una mesh sostitutiva. La ricerca degli strumenti ha individuato fal come possibile generatore 3D, ma il servizio non risulta collegato. Nessun account, acquisto o generazione a pagamento è stato avviato. Bulma resta invariata.

È disponibile una [tavola concept](../art-source/goku/concept-v1.png), generata con lo strumento immagini integrato e salvata con [prompt e indicazioni](../art-source/goku/README.md). Non è un render del modello nel browser e non sostituisce la mesh richiesta. Non è ancora stata approvata da Giovanni.

Giovanni ha confermato Budokai Tenkaichi 3, stile PS2, come riferimento grafico e ha richiesto iterazioni con Opus dopo avere rifiutato più proposte per l'effetto pupazzo, Roblox e le spalle poco convincenti. Quattro candidati sono stati confrontati con render reali; il quarto è stato scelto da Opus come migliore del ciclo. Questa è una valutazione comparativa, non un'approvazione di Giovanni o una somiglianza garantita. Il lavoro resta limitato a Goku bambino. Bulma è invariata e la trama resta quella del primo manga.

La costruzione conserva superfici curve da profili cubici e ciocche volumetriche, ma recupera una silhouette asimmetrica dopo due proposte peggiori. La testa è più grande del 10% rispetto alla base del ciclo; gli occhi sono più aperti, la bocca è neutra e la frangia ha quattro punte e due basette. Mandibola, guance e naso appartengono alla stessa superficie. La pelle della sola testa usa una rampa toon più uniforme, senza modificare luci globali o Bulma. Le orecchie hanno un padiglione concavo e un'elice a C orientata verso l'esterno, leggibile in profilo.

Il gi resta un volume arrotondato con piccoli dettagli dipinti. Il costume corrente usa gi e pantaloni blu, polsini rossi e cintura chiara. Le braccia hanno tre ossa ciascuna, inclusa un'ancora al torso, così la spalla resta collegata al busto mentre il braccio ruota; le gambe mantengono due ossa ciascuna. Mani e scarpe sono un po' più grandi e i piccoli segni delle dita seguono la superficie deformata della mano.

Il modello è generato nel codice tramite questi nuovi costruttori di superfici. Non è stato scolpito in Blender o in un altro programma esterno. Il cambio di metodo riguarda la costruzione e il campionamento delle forme, non un semplice cambio di illuminazione o la sola attivazione di normali morbide.

## Ciclo di revisione con Opus

Sono state usate chiamate reali a Opus (modello restituito: claude-opus-5-5), con lettura delle immagini e, nel primo intervento mirato, modifiche dirette ai soli file di testa e capelli. I render del coordinatore sono stati rimandati al modello per il confronto successivo.

1. Candidato 1: capelli più verticali e compatti, pupille riviste, mento e orecchie modificati. La revisione visiva ha rilevato una regressione della silhouette verso una fiamma simmetrica; quella scelta è stata scartata.
2. Candidato 2: capelli allargati e abbassati secondo il primo riscontro, abito corretto e arti migliorati. Il confronto ha rilevato un'eccessiva criniera orizzontale; la testa iniziale restava preferibile. È stato conservato il miglioramento del corpo.
3. Candidato 3: silhouette asimmetrica della base, frangia più leggibile, testa più grande, occhi aperti e corpo del candidato 2. Opus lo ha scelto come migliore, indicando due ultimi problemi mirati: ombra irregolare su guancia/mento e orecchio piatto nel profilo.
4. Candidato 4: rampa della pelle più uniforme e padiglione dell'orecchio a C. Opus lo ha preferito al 3 senza rilevare regressioni bloccanti. Ha indicato come residui soprattutto i limiti artistici di modellazione e texture, non altri ritocchi automatici alle proporzioni.

La scelta finale del ciclo è stata mostrata e scartata da Giovanni. Il modello conserva un viso semplificato e poco volume nel profilo; capelli, abito e anatomia non raggiungono la somiglianza richiesta. Serve un diverso lavoro su mesh e texture, non un altro ciclo di proporzioni dello stesso costruttore.

Per occhi, espressione e proporzioni sono state consultate le [immagini di una conversione del modello di Tenkaichi 3](https://steamcommunity.com/sharedfiles/filedetails/?id=3772539621), presentata dal suo autore come conversione dell'originale. È un riferimento visivo indiretto, non una verifica degli asset PS2 originali. Il precedente artwork scelto dalla galleria del gioco mescolava il look GT, riscontrabile nel [riferimento Bandai](https://store.bandainamcoent.com/merchandise/dragon-ball/dragon-ball-gt-son-goku-gt-shfiguarts), ed è stato escluso come riferimento dell'abito. Le [tavole del primo capitolo](https://en.dragon-ball-official.com/news/01_3933.html) restano il riferimento narrativo. Nessuna mesh o texture del gioco commerciale è stata importata.

La riuscita visiva non viene dedotta dalla compilazione o dai conteggi di poligoni. La precedente proposta resta registrata come non approvata.

## Complessità attuale

Misure della factory character(), prima di aggiungere oggetti di scena come il pesce.

| Modello | Triangoli principali | Triangoli del passaggio contorni | Mesh principali | Mesh contorni |
| --- | --- | --- | --- | --- |
| Goku | 7.788 | 7.196 | 22 | 10 |
| Bulma | 4.778 | 4.550 | 43 | 12 |

Il budget tecnico corrente di Goku è circa 8.000 triangoli principali; quello di Bulma resta circa 5.000. È una scelta tecnica della proposta, non una misura di prestazione. I contorni aggiungono lavoro di rendering e sono conteggiati separatamente. Sono raggruppati per articolazione e usano materiali condivisi, con spessore di circa un pixel nel buffer di rendering. Non richiedono texture a schermo intero.

La base del ciclo usava 7.332 triangoli principali e 6.884 per i contorni. Le parti statiche della proposta corrente sono unite per materiale; gli arti raggruppano i triangoli per materiale, evitando un gruppo di disegno per ogni sezione. Bulma conserva geometrie, materiali e animazioni precedenti al ciclo.

Goku usa un atlante RGBA procedurale da 512 x 1.024 pixel con occhi aperti e chiusi e una texture del gi da 256 x 256. Bulma mantiene un atlante da 256 x 512 pixel e aggiunge 256 x 96 pixel per BULMA e 128 x 128 per 97. Le immagini di base occupano teoricamente circa 2,91 MiB RGBA, circa 3,88 MiB con i mipmap. Questo non misura la memoria totale del browser o della GPU.

Non sono aggiunte dipendenze. La build conserva l'avviso di Vite sul JavaScript minificato superiore a 500 kB.

## Organizzazione

- src/geometry.ts: materiali e helper condivisi con lo scenario.
- src/characters.ts: scelta della factory e modello preesistente di Bulma.
- src/goku.ts: nuova geometria di Goku, atlante del viso, unione delle parti statiche e animazioni.
- src/goku-surfaces.ts: campionamento dei profili cubici, superfici arrotondate e ciocche curve con orientamento continuo.
- src/goku-hair.ts: profili volumetrici delle ciocche di Goku.
- src/goku-clothes.ts: superfici curve del gi e della cintura, texture di collo e pieghe.
- src/goku-limbs.ts: profili curvi, superfici continue, scheletri e pesi degli arti di Goku.
- src/character-cel.ts: rampa di illuminazione dedicata ai personaggi e passaggio dei contorni.
- src/models.ts: esportazioni per il gioco e modelli del pesce e della Sfera.
- src/portraits.ts: ritratti ottenuti dalle mesh, catturati una volta all'avvio; clonazione degli scheletri per mantenere corretti i ritratti dei modelli deformabili.
- personaggi.html e src/character-preview.ts: ispezione locale con rotazione e animazioni. La pagina non legge o scrive salvataggi ed è disponibile tramite npm run dev.
- goku.html e src/goku-preview.ts: anteprima del solo Goku ricostruito, con viste dedicate, zoom, posa in guardia e camminata. Anche questa pagina usa npm run dev e non accede ai salvataggi.
- goku-studio.html e src/goku-studio.ts: confronto statico di fronte, tre quarti e profilo alla stessa scala, con miniature a 128 pixel, silhouette e posa in guardia. Disponibile tramite npm run dev; non incluso nei punti d'ingresso della build e senza accesso ai salvataggi.

## Verifiche e limiti

Sono verificate compilazione TypeScript, build, conteggi separati di mesh e contorni, normalizzazione dei pesi e assenza di geometrie, vertici deformati o matrici non finite durante camminata, salto, guardia, trasporto e sollevamento. Nel browser sono state controllate viste del modello, camminata e posa in guardia. Una prova locale separata sulla porta 5174 ha verificato caricamento della partita, ritratto aggiornato, movimento e salto nella scena, senza accedere al salvataggio dell'anteprima sulla porta 5173. La verifica finale non ha registrato errori o avvisi in console.

La build finale verificata produce circa 647 kB di JavaScript minificato, 170 kB gzip. Le misure indicano dimensioni e complessità; non dimostrano da sole la somiglianza o la velocità su altri computer.

Non è disponibile un benchmark degli fps né un confronto su hardware diversi. Il riferimento Tenkaichi descrive la direzione richiesta; il risultato è una proposta originale da valutare, non una riproduzione dei modelli del gioco commerciale.
