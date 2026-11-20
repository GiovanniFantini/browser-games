# Requisiti: Dragon Ball, Saga di Pilaf

## Stato delle decisioni

Le scelte indicate come confermate provengono dalle risposte di Giovanni. Le specifiche operative proposte sono una base modificabile durante lo sviluppo. Questo documento descrive il gioco da realizzare, non funzionalità già disponibili.

## Avanzamento

Ultimo riscontro sui personaggi: Giovanni ha apprezzato entrambi i concept e ha richiesto la trasformazione in modelli 3D di Goku e Bulma mantenendo questa resa, con integrazione visibile nel gioco. Ha escluso account e servizi esterni. Sono state prodotte due prime mesh locali con rig in Blender e integrate tramite GLB. La resa delle mesh resta distinta dall'approvazione dei concept; i dettagli della verifica sono nel documento dei modelli.

La prima tappa giocabile è implementata: montagne, movimento, corsa, salto, telecamera, recupero del pesce gigante, incontro con Bulma, scoperta della Sfera in casa e salvataggio automatico. Comprende la base tecnica delle tappe 1 e 2 del percorso di realizzazione, con le semplificazioni registrate nella [verifica della prima tappa](verifica-prima-tappa.md). Il combattimento di prova non è incluso e le tappe successive restano da realizzare.

Feedback confermato del 9 novembre: colori vivaci e più contrastati, ambientazione riconoscibile nel primo capitolo del manga. Evitare la palette pallida iniziale e la disposizione generica da parco. La revisione usa quattro obiettivi, auto TURBO, pesce gigante e una stanza esplorabile con la Sfera sul comò. I colori seguono la tavola colorata ufficiale scelta come riferimento, senza imporre le scelte cromatiche dell'anime.

Revisione dei personaggi: Giovanni ha confermato Budokai Tenkaichi 3, stile PS2, come riferimento grafico e ha scartato le proposte precedenti per la scarsa somiglianza, l'effetto da pupazzo e le forme squadrate simili a Roblox. Anche il quarto candidato del ciclo con Opus è stato rifiutato: ricorda South Park e non comunica Goku. È richiesto un cambio di metodo con lavoro su mesh e texture, partendo da un riferimento visivo coerente. Bulma resta sospesa. Il budget tecnico del segnaposto di Goku è circa 8.000 triangoli principali; il passaggio dei contorni è conteggiato separatamente in [modelli dei personaggi](modelli-personaggi.md).

La revisione corrente mantiene superfici curve, ma modifica proporzioni e lettura del personaggio: testa più grande, occhi aperti, capelli asimmetrici, orecchie a C, ombreggiatura uniforme sul viso, attacco deformabile delle spalle, mani e scarpe più grandi. Il costume blu con polsini rossi sostituisce il precedente abbinamento GT improprio. La storia continua a seguire il manga.

La descrizione precedente riguarda il segnaposto scartato ancora presente nel prototipo. Il nuovo modello non è disponibile. Concept illustrato, mesh, rig e render nel browser devono essere verificati come risultati distinti, senza presentare una tavola illustrata come modello giocabile. Bulma è rimasta invariata.

## Obiettivo e perimetro confermati

Realizzare nel browser l'intera Saga di Pilaf del manga di Dragon Ball, con Goku bambino come unico personaggio giocabile, tutti gli NPC della saga e grandi zone 3D collegate.

L'esperienza alterna esplorazione, incontri, dialoghi, combattimenti e avvenimenti narrativi. Deve essere facile da controllare e accessibile nella difficoltà. La grafica usa geometrie semplici e una resa cartoon moderna e leggera.

La prima versione completa termina con la conclusione della Saga di Pilaf. Le saghe del 21° Torneo Tenkaichi, Red Ribbon, 22° Torneo, Grande Mago Piccolo e 23° Torneo sono sviluppi successivi desiderati. Non fanno parte dei criteri di completamento della prima versione e non richiedono ora personaggi, mappe o sistemi dedicati.

## Fedeltà narrativa

- Il manga è la fonte principale. Le aggiunte esclusive dell'anime non entrano automaticamente nel gioco.
- Conservare successione degli incontri, motivazioni, ruoli e conseguenze degli eventi principali.
- Adattare percorsi, distanze e durata delle scene alle esigenze di gioco senza alterare la storia.
- Usare dialoghi originali e sintetici; gli incontri non devono ridursi a soli cartelli o descrizioni nel menu.
- Non introdurre vittorie, boss finali, tecniche o personaggi che contraddicano l'arco narrativo.
- Non anticipare il normale addestramento con Muten delle saghe successive.
- Gli eventi risolti da un NPC restano risolti da quell'NPC. Goku è l'unico personaggio controllabile, non l'autore di tutte le azioni.

## Zone e percorso narrativo

La seguente suddivisione è una proposta di produzione. Mantiene tutti i passaggi elencati, ma numero e confini delle mappe potranno cambiare.

| Tappa | Ambienti | Contenuto necessario |
| --- | --- | --- |
| 1 | Casa di Goku e montagne | Vita iniziale di Goku, incontro con Bulma, Sfera a quattro stelle e inizio della ricerca |
| 2 | Sentieri e costa, accesso alla Kame House | Incontro con la tartaruga, ostacolo del brigante, incontro con Muten e Nuvola Speedy |
| 3 | Villaggio di Oolong e dintorni | Abitanti minacciati, trasformazioni di Oolong, risoluzione dell'incontro e nuovo compagno di viaggio |
| 4 | Deserto e rifugio di Yamcha | Incontri con Yamcha e Puar e cambiamento dei loro rapporti con il gruppo |
| 5 | Monte Padella e percorsi verso Muten | Gyumao, Chichi, intervento di Muten e ricerca delle Sfere |
| 6 | Centro abitato della Banda del Coniglio | Abitanti, scagnozzi, Toninjinka e risoluzione coerente con il manga |
| 7 | Accessi e castello di Pilaf | Furto delle Sfere, ingresso nel castello, trappole, prigionia, evocazione di Shenron, desiderio di Oolong, trasformazione di Goku in Oozaru, fuga ed epilogo |

Il castello non deve concludersi con una vittoria inventata in un duello contro Pilaf. La trasformazione in Oozaru è un evento narrativo speciale; non implica una trasformazione liberamente attivabile o un secondo personaggio giocabile.

Le zone devono consentire esplorazione oltre il solo percorso obbligato. Collegamenti e ritorni sono consentiti quando compatibili con la situazione narrativa; non è richiesto rendere ogni luogo accessibile in ogni momento. Viaggi particolari, come quelli legati alla Nuvola Speedy, possono essere transizioni o sequenze guidate prima di richiedere un sistema di volo dedicato.

## Personaggi e censimento NPC

Requisito confermato: includere tutti gli NPC della Saga di Pilaf, amici, nemici e neutrali. Il seguente è il censimento iniziale, da verificare contro il manga durante la preparazione di ogni tappa.

| Personaggio o gruppo | Ruolo da rappresentare |
| --- | --- |
| Bulma | Incontro iniziale, ricerca delle Sfere, dialoghi e presenza nel gruppo |
| Tartaruga di Muten | Incontro e ritorno al mare |
| Muten | Incontri, doni e intervento al Monte Padella |
| Oolong e sue trasformazioni | Minaccia iniziale, incontro e partecipazione al viaggio e al finale |
| Abitanti del villaggio di Oolong | Adulti, anziana legata alla Sfera, ragazze e altri abitanti coinvolti negli eventi |
| Yamcha e Puar | Avversari iniziali, inseguimento del gruppo e successiva alleanza |
| Gyumao e Chichi | Incontri e vicende del Monte Padella |
| Toninjinka e i due scagnozzi della Banda del Coniglio | Minaccia del centro abitato e risoluzione dell'episodio |
| Abitanti, commercianti e passanti | Presenza e interazioni nei luoghi attraversati, secondo il manga |
| Pilaf, Mai e Shu | Furto, trappole e avvenimenti nel castello |
| Shenron | Evocazione e desiderio nel finale |
| Creature e avversari minori | In particolare gli incontri iniziali e il brigante che minaccia la tartaruga, oltre agli altri presenti nel riferimento |

Il nonno Son Gohan appartiene al passato di Goku: rappresentarne il ricordo e il legame con la Sfera senza inventare un suo incontro nel presente.

Per ogni personaggio o gruppo annotare in fase di produzione: riferimento nel manga, zona, ruolo, dialoghi o azioni, stati narrativi, modello, animazioni e verifica in gioco. Contare separatamente i personaggi distinti anche quando condividono un modello di base. I gruppi nella tabella non autorizzano a omettere i singoli personaggi presenti negli eventi.

Nomi e alias devono essere coerenti nell'interfaccia. Questo documento usa nomi italiani riconoscibili; registrare le equivalenze quando si prepara il catalogo dei contenuti.

## Esplorazione e missioni

- Movimento tridimensionale, corsa e salto con risposta immediata.
- Telecamera in terza persona controllabile con il mouse, con gestione degli ostacoli.
- Interazione con NPC, oggetti e passaggi attraverso un comando semplice e un'indicazione contestuale.
- Obiettivo corrente sempre consultabile, senza richiedere di ricordare ogni dialogo.
- Dragon Radar e raccolta delle Sfere introdotti nel contesto della storia; oggetti e Sfere non devono poter essere duplicati con caricamenti o transizioni.
- Personaggi del gruppo presenti nelle scene pertinenti; non è obbligatorio simulare tutti i compagni al seguito in ogni metro di viaggio.
- Progressione guidata dagli eventi narrativi, con libertà di esplorazione nelle zone disponibili.
- Nessun obbligo iniziale di crafting, raccolta ripetitiva, missioni generate o alberi di abilità.

## Combattimento

Impostazione confermata: movimento libero in 3D, aggancio del bersaglio, attacco con combo automatiche, schivata, parata e poche tecniche speciali. Ispirazione: accessibilità e mobilità dei combattimenti di Naruto, adattate a Goku in questa fase della storia.

- Un comando di attacco produce una sequenza semplice di colpi. Non servono combinazioni complesse per terminare il gioco.
- Gli avversari rendono leggibili preparazione e direzione degli attacchi.
- Parata e schivata devono avere regole comprensibili e riscontro visivo.
- Aggancio e cambio bersaglio devono funzionare anche con più avversari.
- Strumenti e tecniche, inclusi bastone e Kamehameha quando consentiti dagli eventi, rispettano lo sviluppo narrativo. La disponibilità esatta va registrata nella missione pertinente.
- Niente volo libero, trasformazioni a comando o tecniche delle saghe successive.
- Gli incontri non basati sul combattimento mantengono la propria soluzione narrativa.
- La sconfitta riporta a un checkpoint sicuro, con salute ripristinata e senza perdita permanente della progressione già confermata.

## Comandi iniziali proposti

Da verificare nel primo prototipo e correggere se scomodi. I suggerimenti a schermo devono corrispondere ai comandi effettivi.

| Azione | Comando proposto |
| --- | --- |
| Movimento | WASD |
| Telecamera | Mouse |
| Salto | Spazio |
| Corsa | Maiusc |
| Interazione e avanzamento dialogo | E |
| Attacco / combo | Tasto sinistro del mouse |
| Parata | Tasto destro del mouse |
| Schivata | Q |
| Aggancio / rilascio bersaglio | Tab |
| Cambio bersaglio | Rotella, mentre agganciato |
| Tecnica disponibile | R |
| Obiettivi e Radar | M |
| Pausa | Esc |

Gestire il comportamento del browser durante il gioco, il rilascio del puntatore e il ritorno ai menu. Non richiedere pressione simultanea di molti tasti. La rimappatura completa è un possibile miglioramento successivo.

## Grafica, modelli e interfaccia

- Riferimento visivo confermato: Budokai Tenkaichi 3, stile PS2, adattato al budget del browser. La storia segue il manga originale.
- Modelli 3D creati per il progetto, con silhouette e colori riconoscibili. Goku bambino deve avere proporzioni e aspetto coerenti con questo arco.
- Ambienti cartoon leggibili, forme semplici, illuminazione leggera e pochi effetti costosi.
- Animazioni per locomozione, salto, attacco, difesa, impatto e interazioni richieste. Gli NPC hanno le animazioni necessarie alle loro scene.
- Segnaposto ammessi durante lo sviluppo, senza considerarli modelli definitivi.
- Interfaccia e dialoghi inizialmente in italiano, come scelta operativa proposta.
- Menu iniziale con nuova partita e continua quando esiste un salvataggio valido; pausa, impostazioni essenziali e conferma prima di cancellare i progressi.
- HUD con salute, obiettivo corrente e indicazioni contestuali. Evitare indicatori permanenti non utili alla situazione.
- Base proposta: testi e suoni essenziali, senza doppiaggio. L'audio non deve essere necessario per capire attacchi, dialoghi o obiettivi.

## Salvataggio automatico

Requisito confermato: salvataggio locale nel browser senza account. Base tecnica iniziale: localStorage.

- Uno spazio dei nomi esclusivo, per esempio `browsergames.dragon-ball.save`, con versione dello schema nel contenuto.
- Salvare checkpoint, zona, stato della storia, missioni, inventario, Sfere e impostazioni persistenti.
- Salvare dopo eventi completati e in corrispondenza di punti sicuri, evitando stati intermedi irrecuperabili.
- Ricaricare la pagina deve consentire di riprendere dall'ultimo checkpoint confermato.
- Un salvataggio mancante, malformato o incompatibile non deve bloccare l'applicazione. Informare il giocatore e offrire un recupero o una nuova partita senza cancellazione silenziosa.
- Se lo storage non è disponibile, informare che i progressi non possono essere salvati e consentire comunque di giocare.
- Non promettere sincronizzazione tra browser o computer: i dati appartengono al browser e al sito usati e possono essere rimossi cancellandone i dati.

## Prestazioni e compatibilità

Target: computer con browser desktop aggiornato. Proposta iniziale di verifica: Chrome, Edge e Firefox.

Obiettivo tecnico iniziale, da misurare: circa 60 fps a 1080p su un computer di riferimento da registrare con GPU, browser e impostazioni. Non è una garanzia già verificata né un requisito hardware definitivo.

Prevedere qualità riducibile, risoluzione di rendering controllata, caricamento per zone e riutilizzo delle risorse. Evitare ombre ed effetti pesanti per impostazione predefinita. Se la grafica richiesta non è disponibile, mostrare un messaggio comprensibile invece di una schermata vuota.

## Tappe di realizzazione

1. Base tecnica: avvio nel browser, scena, input, movimento e telecamera, collisioni e pausa.
2. Prima tappa giocabile: montagne, Goku, Bulma, primo incontro, obiettivo iniziale e salvataggio. Includere un banco di prova del combattimento separato dalla storia, se necessario.
3. Esplorazione e scontri: collegamenti tra zone, dialoghi, missioni, combattimento accessibile e ripartenza da checkpoint.
4. Contenuti della saga: realizzare tutte le tappe narrative, con modelli e NPC; ogni tappa deve poter essere attraversata e ripresa da salvataggio.
5. Finale e verifica completa: castello, Shenron, Oozaru, epilogo e prova dall'inizio alla fine.

Le tappe organizzano lo sviluppo e non riducono il perimetro della prima versione completa. Non sono assegnate date o durate.

## Criteri di accettazione della prima versione completa

- Il gioco parte nel browser desktop e consente una nuova partita e la ripresa di una partita salvata.
- Goku è l'unico personaggio giocabile; movimento e combattimento sono utilizzabili senza combinazioni complesse.
- Tutte le tappe della Saga di Pilaf sono giocabili o rappresentate con scene pertinenti, nell'ordine coerente con il manga, fino all'epilogo.
- Il censimento per capitolo conferma la presenza degli NPC amici, nemici e neutrali. Nessun gruppo generico della tabella sostituisce questa verifica.
- Le grandi zone sono collegate e consentono esplorazione; una sequenza di sole arene o scene non soddisfa il requisito.
- Modelli e animazioni necessari sono presenti, senza segnaposto per personaggi ed eventi richiesti.
- Sconfitte, transizioni e ricaricamenti non duplicano oggetti, non cancellano silenziosamente progressi e non impediscono di completare la storia.
- La telecamera e le collisioni funzionano nei passaggi principali, durante i salti e in combattimento.
- Sono registrate verifiche reali di compatibilità e prestazioni sul computer di riferimento, con eventuali limiti descritti.
- La documentazione distingue chiaramente funzionalità disponibili e sviluppi successivi.

## Fonti e verifica dei contenuti

Fonte narrativa richiesta: manga originale di Dragon Ball, Saga di Pilaf. Durante la produzione annotare i riferimenti di capitolo per eventi e personaggi; la documentazione iniziale non rappresenta ancora una verifica pagina per pagina.

Riscontri ufficiali iniziali:

- [Pilaf: castello, prigionia, desiderio e trasformazione](https://en.dragon-ball-official.com/news/01_777.html)
- [Oolong: incontro e villaggio](https://fr.dragon-ball-official.com/news/01_2497.html)
- [Personaggi secondari, inclusa l'anziana del villaggio di Oolong](https://fr.dragon-ball-official.com/news/01_1010.html)

Queste schede sono riferimenti di supporto; non sostituiscono il censimento completo sul manga.
