# Piano per EPOCHE

Revisione di Claude Opus 5.5 tramite Claude Code. Il piano si basa sulle catture del gioco, sulle regole, sul codice e sulle simulazioni precedenti. Le prove con persone sono proposte.

## Dati

- Campione attuale, semi 1-25 per due vie: prima risposta 1/50, casuale 9/50, prudente 34/50, prudente senza debiti 50/50. La prudente perde 12 volte all'ingresso del Neolitico e 4 nel Futuro.
- Il caso 10/117 sui retaggi appartiene alla versione precedente ai costi rinviati.
- Il 76% dei 4.869 dilemmi offre due o tre risposte. Il caso a sei risposte è stato osservato nella prova mirata del Futuro e zero volte nelle 150 campagne.
- La prudente ignora i costi rinviati (`tools/sim/campaign.ts:169-174`) e avanza appena può. Il 34/50 misura anche questa cecità.
- All'ingresso in un'era l'Influenza sale almeno al valore iniziale (`world.ts:179-182`).
- Le crisi possono attenuarsi col tempo. I debiti richiedono una scelta che li riduca. Ogni debito scade all'era successiva.
- Nel catalogo conto 16 risposte che creano debiti e 5 che li riducono. Penuria di pane (`shortage`) e corsie (`wards`) riducono solo un tipo di debito che, nella loro era, nasce dallo stesso dilemma: al primo incontro non c'è nulla da ridurre.
- A 1× nel Rapido l'intervallo ordinario tra dilemmi è di 10,5 secondi.

I round 1-3 sono chiusi su anteprime, dilemmi irraggiungibili e trattati: non li riaprirei. Restano aperti la cadenza e i playtest con persone.

## Che cosa si vede

1. [Slot](schermate/01-slot.png): tre riquadri uguali, nessuna promessa di gioco, «Eredità 0» senza spiegazione.
2. [Genesi](schermate/02-genesi.png): «Equilibrio» è sia l'estremo sinistro sia il valore 50. Il seme tecnico pesa quanto la scelta, il cui effetto non è indicato.
3. [Inverno](schermate/03-inverno.png): «Nessun costo» accompagna la risposta con +43 di debito. «Totale rinviato 101» non dice che è fatale. La quarta risposta è tagliata, la quinta nascosta, la frase sulla dissoluzione si ripete.
4. [Prima del passaggio](schermate/04-prima-del-passaggio.png): il Consiglio annuncia le condizioni per la nuova era, il pulsante è attivo e gli attributi visibili sono sani. L'avviso fatale è testo piccolo, e il fumetto copre il villaggio.
5. [Dissoluzione](schermate/05-dissoluzione.png): le cause sono chiare, ma l'unica uscita è «Torna alle civiltà».
6. [Neolitico](schermate/06-neolitico.png): popolazione 100, Influenza 35 e Legittimità 50 come nel ramo perduto. I 6 punti spesi non lasciano differenza. Compare Risorse 28%, mentre il danno sanitario non si vede.
7. [Officina](schermate/07-officina.png) e [scorrimento](schermate/08-officina-scorrimento.png): le sei risposte non si confrontano insieme e il sollievo non appare sulle carte. I maestri costano 2 e portano Risorse a 14, smontare i carrelli costa 3 e le porta a 21.
8. [Futuro](schermate/09-futuro.png): il selettore lingua copre «Nazione indu…», la popolazione ha decimali accanto alla soglia, i retaggi sono chiusi in un menu. «Politiche richieste» è chiuso, contro quanto riporta il playtest.
9. [Atlante](schermate/10-atlante-storico.jpg): valle e fiume danno continuità, ma castello e osservatorio spariscono nell'era dopo. La verifica è precedente: controllare i lotti persistenti nella build attuale.

## Ipotesi da provare

- H1. Il debito 101 è un vicolo cieco: in Preistoria l'unico rimedio alimentare è nello stesso inverno, con ricomparsa possibile dopo 1.800 tick.
- H2. Conviene svuotare l'Influenza prima del passaggio, perché viene ricaricata.
- H3. Attendere può azzerare il rischio nelle quattro sconfitte con crisi preesistente, rendendo la pazienza una mossa dominante.
- H4. Chi legge i totali torna vicino a 50/50: oggi si premia l'aritmetica più della scelta.
- Le 12 sconfitte al passaggio nel Neolitico provengono da sei mondi, ciascuno sui due percorsi. Nel confronto si raggruppano le partite per seme.
- H6. Con un dilemma ogni 10,5 secondi si smette di leggere.

## Proposte, in ordine

1. Rendere il passaggio una scelta. Prima di entrare si apre la Resa dei conti: debiti, retaggi impegnabili e due o tre modi di pagare. Per ogni debito che può uccidere esiste almeno un rimedio parziale, sempre con una perdita. Il pulsante diventa «Affronta il passaggio» e dichiara l'esito.
2. Far durare le conseguenze. Un debito può scadere dopo una o due ere e lasciare un segno: campo incolto, famiglia partita, tradizione mancata. L'Influenza residua attraversa il passaggio, con una base minima più bassa da calibrare.
3. Ridisegnare le carte: chi perde oggi, che cosa torna e quando, che cosa si salva. «Nessun costo» diventa «Influenza 0», la fatalità appare solo quando è vera, il sollievo è visibile. A 1366×768 quattro risposte compatte devono stare insieme, con dettagli a richiesta.
4. Cercare dominanze prima di aggiungere testi. Un retaggio deve cambiare chi paga, senza costare meno e ferire meno. Quelli duraturi aprono vie con obblighi ricorrenti, quelli deperibili sono forti ma si consumano o vanno rinnovati con un sacrificio.
5. Rallentare: meno dilemmi per era, pausa alla prima lettura, due o tre scelte concatenate. Da confrontare con la cadenza attuale.
6. Far parlare il villaggio: fumetto fuori dagli edifici, retaggi cliccabili in scena, debiti visibili nello stesso lotto. Dopo una sconfitta, «Rivedi la scelta decisiva» e nuova partita con lo stesso seme.
7. Sistemare ingresso ed errori locali: una frase di promessa negli slot, seme nelle opzioni avanzate, effetto di ogni scelta di Genesi, etichette e selettore corretti.

## Esempio giocabile

I numeri nuovi sono ipotesi di calibrazione. Si parte da debito alimentare 58, Influenza 25 e crisi a zero.

Ramo A, aprire le riserve. Oggi Risorse +17 e debito 101. In cambio nasce la Tavola comune, tradizione di tre ere. Alla Resa dei conti, dopo il calo a 12 della crisi, si sceglie tra:

- mangiare le sementi: debito -60, Sostentamento -2 per tutto il Neolitico, campo est incolto fino al Bronzo. Entrata con Risorse 53.
- mandare un clan dai vicini: debito -70, popolazione -20%, Tensioni +15. Entrata con Risorse 43. Il clan può tornare nel Bronzo, se lo si accoglie cedendo un lotto.
- entrare senza pagare: dissoluzione dichiarata.

Ramo B, barattare le pelli. Influenza -6, Salute +24, debito 28, nessuna Tavola comune. Al passaggio restano Risorse circa 28 e malati senza coperte:

- isolarli: Salute -20, Tensioni +22, una capanna resta vuota.
- curarli insieme: Salute -20, Risorse +18, un lotto non viene seminato.

Nel Bronzo, davanti al registro dei debiti, la Tavola comune permette ad A di condonare consumando la tradizione, con meno cibo. In B i parenti dei malati chiedono una quota e il terreno disponibile dipende dalle cure scelte. Nel Classico la Tavola scompare se non è stata rinnovata. A compra coesione con un debito pesante, B compra sicurezza con salute e fiducia: se uno vince in quasi tutti gli stati, l'esempio è fallito.

## Prima fetta

Da Genesi al primo dilemma del Bronzo, 12-15 minuti, dietro un'opzione di prova. Comprende siccità, raccolto secco, inverno, Resa dei conti, i due rami, Tavola comune e registro, con carte nuove e tre segni nel villaggio. Resto del catalogo, arte e ritmo Storico non cambiano. Si confronta con una copia della build attuale.

È la prova minima: se qui il rimedio non rende la scelta più interessante, estenderlo a dieci ere costerebbe molto e renderebbe poco.

## Misura

Simulazioni

- Prima di cambiare, misurare la baseline con altre strategie: prudente previdente (conta i debiti), attendista, spendacciona prima del passaggio, favorevole ai retaggi, contraria ai retaggi. Verifica H2, H3 e H4.
- Semi 1-25 solo per continuità. Calibrazione sui semi 101-200, verdetto unico sui semi 1001-1100, aperti a regole congelate. Stesse condizioni iniziali per vecchia e nuova versione, risultati raggruppati per seme.
- Per almeno 200 stati incontrati, duplicare la partita su ogni risposta pagabile e proseguire con più strategie. Registrare sopravvivenza, popolazione, crisi e retaggi. Una risposta mai migliore su alcuna misura è dominata. Una migliore in oltre il 65% degli stati va rivista.
- Obiettivi: previdente sopra la miope ma sotto il 95%, spesa pre-passaggio e attesa senza vantaggio sistematico, A e B ciascuno preferibile in almeno il 30% degli stati, nessuna sconfitta senza un rimedio offerto prima.

Persone

- Primo giro con cinque persone che non conoscono il gioco, per trovare blocchi. Poi dodici, vecchia e nuova versione in ordine alternato e semi diversi. Gli agenti restano utili per i difetti, senza contare come utenti.
- Prima del clic: «Chi perde, quando, e come potresti rimediare?». Dopo: «Sceglieresti l'altro ramo? Perché?».
- Passa se almeno 9 su 12 rispondono correttamente, entrambi i rami vengono scelti da almeno 3, almeno 8 vogliono rigiocare e nessuno giudica invisibile la causa della sconfitta. Registrare anche tempo di lettura, scorrimenti e pause.

## Rischi e arresto

- Il rimedio può rendere innocui i debiti: se i semi nuovi portano tutte le strategie oltre il 90%, aumentare il prezzo umano prima dei punti.
- Un'altra finestra può rallentare: se più della metà salta i testi, ridurre i dilemmi invece di accorciare ancora le frasi.
- Più conseguenze possono confondere: se la comprensione peggiora rispetto alla build attuale, tenere le carte nuove e togliere le scadenze a due ere.
- Se a dodici persone A e B sembrano la stessa scelta, il piano è smentito: fermarsi e ripensare il debito.

Ordine di lavoro: baseline con le nuove strategie, prototipo su carta con tre persone, fetta giocabile, semi sigillati e sessioni. Solo dopo, l'estensione a Età moderna e Futuro.
