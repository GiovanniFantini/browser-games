## Verdetto

| Decisione | Esito |
|---|---|
| Il guado in produzione, opzionale dalla lobby | **NO GO per questa build.** Quattro correzioni circoscritte. |
| Passaggio alla tappa 3 | **NO GO.** Mancano Giovanni e i cinque esordienti. |
| Gioco completo o nuova campagna principale | **NO GO.** Servono la campagna completa e il confronto con dodici persone. |

Ho letto codice, test, dati e screenshot, e ricalcolato a mano le sequenze citate. Non ho giocato la build né rieseguito i test. I log confermano lint, build e 95 test.

## Blocchi precedenti

| Blocco | Stato |
|---|---|
| Vittoria senza scegliere | **Aperto** |
| Menu di carte | **Chiuso per un prototipo:** due squadre assegnabili anche da mappa e tastiera |
| Mappa contro racconto | **Quasi chiuso:** legna, fuoco, piena e solchi seguono lo stato. Restano i punti 2 e 3 |
| Finale senza memoria | **Chiuso:** ricorda ospite, patto, legna e tetto |
| Prove browser | **Chiuso in gran parte:** semi fissi, entrambe le piene, patto infranto, tastiera |

Il gioco ora ha un buon cuore. Con piena alta puoi avere due cose su tre: raccolto, promessa mantenuta e ospite. Le regole intorno permettono però ancora di ignorare la piena.

## Cosa correggere

**1. Una sequenza fissa vince ancora.** Entrambe raccolgono con le due piene, senza fame:
- *Riparo/raccogli, entroterra/raccogli, case/raccogli, focolare/raccogli, semina* chiude con 7 razioni. `rami.json` mostra già il problema: `identicalWinter.private` dà `sow` su entrambi i semi.
- *Riparo/sorveglia, entroterra/recupera, comune/ripara, rami gelati/ospite, semina* ottiene anche ospite e tetto. Nessun piano con raccolto la supera, in nessuna piena.

Ci sono anche ordini dominati. «Cerca cibo» non apre alcun finale che le case non aprano, e con piena alta perde. Con le case, «rami gelati/sorveglia» equivale a «focolare/raccogli». L'enumeratore conta le storie, ma non cerca queste dominanze.

Correzione in `src/valley/game.ts`, quasi tutta per sottrazione:
- «Ripara una casa» solo con `flood === "high"`. Al disgelo si toglie. La riga del tetto nel finale appare solo con piena alta: oggi `03-ospite` lamenta un tetto mai danneggiato.
- Togliere `glean`, la regola `soaked` e `guard` nella quarta stagione.

Così, con piena alta, si raccoglie solo affidandosi alle case oppure con comune e tetto. Con acqua ordinaria il tetto non si ripara, quindi l'unica sequenza comune passa dalle case e perde l'ospite. Chi si adatta può avere raccolto, promessa e ospite: *riparo/sorveglia, promessa/recupera, comune/Nara, focolare/ospite, semina*.

**Prova:**
- Per ogni coppia di semi alta/bassa, enumerare le sequenze fisse e confrontare i finali con raccolto per ospite e promessa, più il tetto con piena alta. Nessuna deve essere insuperata in entrambe.
- Con piena alta devono restare: raccolto e promessa; raccolto, ospite e tetto; partenza, promessa e ospite.
- Aggiungere la politica «sequenza fissa» alla matrice.
- Portare i test sui turni con `job`: oggi tre usano un percorso senza incarico che l'interfaccia non produce.
- Il caso «dispersione» diventa *riparo/raccogli, entroterra/raccogli, case/raccogli, rami gelati/raccogli, partenza* sul seme 1.

**2. Il granaio rialzato sta nel posto sbagliato.** È disegnato sull'ansa allagabile, mentre l'etichetta «Scorte di casa» è al focolare (`ValleyArt.tsx:71`, `valley.css:195`, visibile in `03-barca`). Portare `private` sulla terrazza, con etichetta e oggetto insieme.
**Prova:** screenshot con deposito comune e privato dopo la piena alta.

**3. L'animazione smentisce gli incarichi.** Alla conferma entrambe le pedine vanno dalla prima squadra (`Valley.tsx:343`). Le prove girano a 25× o con movimento ridotto, quindi non l'hanno mostrato. Togliere le pedine, dato che le figure si muovono già, oppure dare un percorso a ciascuna.
**Prova:** 1×, *case/Nara*, fotogramma durante il movimento con le squadre in due luoghi.

**4. Schermo ed etichetta.**
- In `02-patto`, a 1366×768, il pulsante di conferma è sotto il bordo. La mappa scorre in verticale di circa 80 px tra una schermata e l'altra, spostando i bersagli. Ancorarla in alto e tenere la conferma visibile.
- Né la lobby né la modalità dicono che è un prototipo, come richiesto. Scrivere «Gioca Il guado · prototipo» / «Play The Ford · prototype» e ripeterlo nella testata.

**Prova:** nella terza stagione, con patto e incarichi scelti, a 1366×768 e 1093×614 la conferma è visibile senza scorrere e i segnalini hanno le stesse coordinate prima e dopo la scelta. A 390×844 basta che sia raggiungibile. Salvare gli screenshot.

## Da sistemare prima delle prove con persone
- **L'apertura si risolve da sola.** «Riparo/sorveglia» raggiunge ogni finale delle altre due, a parte il ricordo del luogo, quindi la probabilità di piena non pesa. Ogni apertura deve dare un finale o un costo ricordato che le altre non danno.
- **L'avviso dei tetti bagnati suggerisce la soluzione** prima che arrivi l'ospite. Dichiarare il rischio e lasciare i rimedi agli ordini.
- **La sconfitta finale non dice la causa:** sementi marcite, malati o nessun passaggio.
- Canoa e cataste sono ancora in parte coperte. `dcommon` in inglese è sgrammaticato.

## Come diventa GO
Se le quattro prove passano sulla build servita sotto `/epoche-campagna/`, con lint, build, test e hash aggiornati, **il GO alla distribuzione opzionale è già dato, senza una terza review**. Se un criterio del punto 1 fallisce, torna da me. Dopo: Giovanni da solo, poi i cinque esordienti.

**Perimetro autorizzato:** correggere e riprovare Il guado in locale; distribuirlo come prototipo opzionale solo a quattro prove superate, con la campagna attuale predefinita; nessun avvio della tappa 3 né sostituzione del gioco.
