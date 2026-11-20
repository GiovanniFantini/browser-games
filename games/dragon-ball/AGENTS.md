# Istruzioni di sviluppo: Dragon Ball

Applicare anche le [istruzioni generali](../../AGENTS.md). Leggere [README](README.md) e [requisiti](docs/requisiti.md) prima delle modifiche.

## Identità del gioco

- Realizzare un'avventura 3D esplorabile, single player per computer.
- Usare solo Goku bambino come personaggio giocabile. Gli altri personaggi operano come NPC, anche quando sono alleati o risolvono un evento narrativo.
- Completare l'intera Saga di Pilaf. Non sostituirla con una sola ambientazione o con una sequenza di arene.
- Rispettare eventi, ordine narrativo e ruoli del manga. Non importare episodi aggiuntivi dell'anime, personaggi futuri o tecniche anticipate.
- Inserire tutti gli NPC della saga, compresi personaggi secondari e neutrali. Verificare il censimento per capitolo durante la preparazione dei contenuti; il primo elenco nei requisiti non certifica da solo la completezza.
- Non trasformare ogni incontro in un combattimento. Dialoghi, inseguimenti, esplorazione e scene devono rispettare il senso dell'evento originale.
- Scrivere dialoghi originali e sintetici che conservino il significato degli eventi; non copiare lunghi dialoghi del manga.

## Gameplay e resa

- Aggiornamento più recente: Giovanni ha apprezzato entrambi i concept e ha richiesto di trasformarli in veri modelli 3D di Goku e Bulma, mantenendone lo stile e mostrandoli nel gioco. È autorizzato il lavoro su entrambi: i precedenti vincoli di pausa su Bulma documentano la fase precedente. I concept sono il riferimento della nuova modellazione; i modelli procedurali precedenti restano scartati. Non confondere il riscontro positivo sulle illustrazioni con l'approvazione di mesh non ancora realizzate.
- Mantenere pochi comandi facili da apprendere. Nessuna sequenza complessa di tasti richiesta per progredire.
- Dare priorità a movimento, leggibilità, risposta dei comandi e telecamera prima della quantità di contenuti.
- Il combattimento ispirato a Naruto riguarda libertà di movimento e accessibilità. Non comporta l'importazione delle sue mosse o delle sue meccaniche narrative.
- Sbloccare tecniche e strumenti solo quando la storia li permette. Non inserire volo libero o abilità delle saghe successive.
- Usare forme low poly riconoscibili, colori cartoon e illuminazione semplice. Il riferimento a Mario 64 non richiede filtri retrò.
- Il riferimento grafico confermato da Giovanni è Budokai Tenkaichi 3, stile PS2: proporzioni dei personaggi, silhouette riconoscibili, cel shading a poche fasce e contorni sottili. Mantenere il rendering leggero per il browser. La conferma del riferimento non equivale all'approvazione dei modelli attuali. La storia continua a seguire il manga.
- La prima proposta con resa Tenkaichi è stata scartata per l'effetto da pupazzo. La ricostruzione attuale riguarda soltanto Goku bambino: mostrare e valutare l'anteprima `goku.html` prima di intervenire su Bulma, come richiesto da Giovanni.
- Anche la prima ricostruzione separata di Goku è stata giudicata troppo simile a un pupazzo. Confrontare viso e proporzioni con immagini del modello 3D di Tenkaichi 3, oltre all'artwork promozionale. Evitare il sorriso fisso, gli occhi verticali generici e le superfici separate che fanno sembrare gomiti e ginocchia giunture di un giocattolo.
- La revisione successiva è stata giudicata troppo squadrata, simile a Roblox. Giovanni ha richiesto un cambio di metodo: usare superfici continue con curvature morbide per viso, corpo e ciocche. Non riproporre i pannelli rigidi e le ciocche costruite come schegge della versione scartata. La costruzione corrente usa superfici interpolate nel codice; non attribuirle una lavorazione in software esterni non avvenuta.
- Giovanni ha poi richiesto iterazioni con Opus. Dopo quattro candidati ha scartato anche il risultato finale, giudicato simile a South Park e privo dell'identità di Goku. L'intero modello procedurale è scartato come proposta artistica: resta temporaneamente nel prototipo per consentire il gioco. Non preservarne dettagli o proporzioni come scelte approvate e non proporre altri cicli di piccoli ritocchi allo stesso metodo. La nuova fase richiede un riferimento visivo coerente, una mesh con texture curate e verifica prima di passare a Bulma. Distinguere sempre concept illustrato, mesh reale e render nel browser.
- Il costume della proposta corrente è blu con polsini rossi. Il precedente abbinamento di pantaloni gialli e polsini rosa derivava da un riferimento GT improprio. Non confondere Goku bambino originale con Goku GT; i colori restano una scelta visiva della proposta, distinta dal riferimento narrativo al manga.
- La palette deve essere vivace e contrastata: verdi pieni, cielo azzurro, accenti arancioni e colori distinti per i personaggi. Evitare la foschia vicina e il trattamento beige o pastello della prima prova, rifiutati da Giovanni.
- La zona iniziale deve raccontare la vita isolata di Goku e l'incontro del primo capitolo: pesce gigante, strada sterrata, auto TURBO scambiata per un mostro e scoperta della Sfera dentro la casa del nonno. Non sostituire questi luoghi con un parco generico o un piedistallo esterno per la Sfera.
- Creare modelli 3D veri e coerenti per personaggi e ambienti. Segnaposto temporanei devono essere dichiarati e sostituiti prima della chiusura del relativo contenuto.
- Le immagini di riferimento non sostituiscono mesh, rig e animazioni richiesti nel gioco.
- Conservare le proporzioni distinte: Goku bambino basso e compatto, Bulma più alta e slanciata. Capelli, volti e vestiti devono mantenere le caratteristiche del primo capitolo, compresa la treccia di Bulma e la scritta 97 sul retro dell'abito.
- Per Goku il budget tecnico della proposta corrente è circa 8.000 triangoli principali, aumentato rispetto ai 5.000 iniziali per conservare le curvature richieste; Bulma mantiene il riferimento di circa 5.000. Usare piccole texture e unire le parti statiche. Conteggiare e dichiarare separatamente il passaggio aggiuntivo dei contorni. Verificare i cambiamenti anche in `goku-studio.html` e `goku.html`, in movimento e nelle pose usate nel gioco. I ritratti dei dialoghi devono restare coerenti con le mesh reali. La correttezza tecnica non equivale all'approvazione della somiglianza da parte di Giovanni.

## Implementazione

- Non richiedere account o servizi di generazione 3D: Giovanni li ha esclusi. Lavorare localmente. La prima nuova base usa mesh e rig generati da uno script Blender, con UV proiettate dai concept. Non descriverla come scultura manuale o conversione automatica fedele. I render delle mesh reali restano da valutare separatamente dalle illustrazioni apprezzate.
- Tenere separati rendering, input, simulazione, combattimento, missioni, dialoghi e persistenza, senza costruire un framework generico anticipatamente.
- Usare dati identificabili per zone, NPC, incontri e missioni. Non legare la progressione a coordinate o testi dei dialoghi.
- Separare lo stato narrativo persistente dallo stato temporaneo di una scena.
- Limitare i dati caricati alle zone necessarie e liberare geometrie, materiali, texture e listener non più utilizzati.
- Usare un passo temporale controllato per simulazione e collisioni, evitando che la velocità dipenda dal numero di fotogrammi.
- Usare uno spazio dei nomi di salvataggio proprio del gioco, con versione dello schema. Non sovrascrivere i dati degli altri giochi.
- Gestire salvataggio mancante, corrotto o incompatibile e impossibilità di scrivere nello storage, senza bloccare l'avvio.
- Non dichiarare una tecnica disponibile finché controlli, animazione, effetti e conseguenze di gameplay sono implementati.

## Verifica e completamento

Verificare nel browser movimento, salti, telecamera vicino a ostacoli, aggancio del bersaglio, combattimento, dialoghi, transizioni e ripresa della partita.

Verificare la progressione completa dall'inizio al finale, anche dopo sconfitte e ricaricamenti. Controllare che gli NPC cambino ruolo e posizione quando la storia lo richiede e che nessun evento necessario possa rendere impossibile proseguire.

Una prima tappa con Goku e Bulma dimostra la base del gioco. La versione completa richiede tutte le zone e gli eventi della Saga di Pilaf, il censimento NPC verificato e il rispetto dei criteri di accettazione.
