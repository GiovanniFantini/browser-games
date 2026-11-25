## Verdetto

| Decisione | Esito | Azione bloccante |
|---|---|---|
| 1. Distribuzione opzionale per giocare | **NO GO per questa build** | Correggere le regole: le scelte non devono più essere dominate (sotto) |
| 2. Costruire i successivi archi storici | **NO GO** | Superare la prova umana della tappa 2: prima Giovanni, poi cinque esordienti |
| 3. Sostituire il gioco principale | **NO GO** | Superare il verdetto della tappa 7: confronto con dodici persone, dopo una campagna completa |

**GO a produrre la revisione del Guado.** La 1 può diventare GO senza playtest se la correzione regge all'enumerazione e alla prova nel browser. La 2 e la 3 no: posso approvare il design, ma non sostituire le sessioni umane.

Ho letto sorgenti, test e screenshot, ed enumerato le regole a mano. Non ho giocato la build né rieseguito i test.

## Cosa funziona
- La domanda iniziale si capisce: acqua che sale, probabilità dichiarata, costo leggibile prima di confermare.
- Illustrazione e tono danno alla valle un'identità, e Nara è un buon motivo per guardare l'altra riva.
- Sono basi solide il replay deterministico, gli slot separati, l'annullamento e l'accesso separato con `?valle`.

## Cosa non funziona

**1. La partita si vince senza mai scegliere davvero.** La sequenza *riparo, entroterra, cibo prima del gelo, focolare, semina* porta al raccolto **con entrambe le piene**, con 6 razioni e senza fame.
- **Piena:** con acqua bassa il riparo conserva le tre cataste e dà due razioni in più della terrazza. Con acqua alta il raccolto resta raggiungibile: la terrazza serve solo a tenere aperto il patto.
- **Patto:** la legna oltre la catasta del focolare serve quasi a nulla. Partendo dalla terrazza, patto onorato, cibo e focolare chiudono con 4 razioni, come la via senza patto, e aprono anche la partenza. Rompere la promessa non dà quasi mai un vantaggio.
- **Deposito privato:** è dominato da «Cerca cibo». Stesso esito, una razione in meno (`src/valley/game.ts:63`).
- **Deposito comune:** l'ospite conta solo se una squadra si ammala, e «Alimenta il focolare» lo evita (`src/valley/game.ts:35`). Manca così la prova politica chiesta dal documento.

**2. È un menu di carte.** Ogni luogo offre al massimo un ordine per stagione, quindi la mappa duplica i pulsanti. Le due squadre non si vedono e non si assegnano. È il rischio che il documento stesso segnala.

**3. La mappa smentisce il racconto.** Legna, canoa e fuoco sono dipinti nel fondale.
- In `02-patto` il segnalino dice 3 sulla terrazza, ma le cataste sono ancora sull'ansa.
- In `03-dispersione` il testo spegne i focolari, ma il fumo sale ancora.
- L'acqua alta resta disegnata fino al disgelo (`src/valley/Valley.tsx:105`).
- Le etichette coprono fuoco e canoa. Il deposito è un'etichetta con un imperativo, «Costruisci il deposito comune».
- In `03-raccolto` i solchi annunciati non ci sono.

**4. Il finale non ricorda.** In quella partita è l'ospite a rendere possibile la semina, ma non viene nominato. Il documento chiede tre luoghi, una promessa e una famiglia.

## Cosa provano i test
- L'enumerazione verifica che i rami finiscano, non che le scelte contino.
- Le tre partite browser iniziano tutte con `haul`: riparo basso, legna perduta e patto infranto non sono mai stati percorsi lì.
- Gli ordini passano dai pulsanti. Un solo luogo viene cliccato e subito annullato, la tastiera non è provata.
- I semi sono casuali, quindi le prove non sono riproducibili.

## La correzione con maggiore ritorno
**Sostituire «un ordine per stagione» con due squadre da collocare sulla mappa.** È il gioco già descritto nel documento, rende visibile il costo e crea conflitto. Valori da enumerare prima di adottarli:

- **Piena:** terrazza 2 squadre, riparo 1, raccolta 1.
- **Barca:** promettere è gratuito, l'entroterra dà 1 razione per squadra (oggi 2 in tutto).
- **Deposito:** costruire 1 squadra e 1 catasta, consegnare a Nara 1, raccogliere 1. Tre richieste per due squadre.
- **Inverno:** l'ospite mangia 1 razione dal deposito comune. Quello privato la conserva.
- **Disgelo:** semina 2 squadre, 1 con l'ospite. La squadra libera ripara il riparo e cambia il finale.

**Criteri di accettazione**
- Nessun ordine dominato a parità di stato. Nessuna sequenza fissa ottiene il miglior esito con entrambe le piene.
- Terrazza e riparo sono ciascuno preferibile in almeno una piena.
- A parità di tutto il resto, cambiare proprietario del deposito cambia il finale.
- Tenere o rompere la promessa offre un vantaggio diverso, e non solo una penalità.

## Perimetro adesso
1. Regole a due squadre ed enumeratore, prima della grafica.
2. Fondale senza legna, canoa e fuoco. Questi diventano oggetti di stato, insieme a squadre, deposito, solchi e acqua che si ritira.
3. Finale composto dai fatti: ospite, promessa, luogo.
4. Prova browser a seme fisso su riparo con entrambe le piene, patto infranto, ordini da mappa e tastiera, e build nel percorso pubblico.
5. Se tutto passa, **GO alla distribuzione opzionale**, etichettata come prototipo e con la campagna attuale predefinita.
6. Poi Giovanni da solo, senza spiegazioni, e i cinque esordienti. Soglie del documento: tre continuano o riprovano, quattro spiegano chi ha pagato il deposito.

**Fuori perimetro:** Reti di città, altre ere, secondo vicino, guerra, tavola delle tre epoche e migrazione dei salvataggi. Se l'interesse si ferma dopo aver spostato due squadre, si cambia il gesto qui.
