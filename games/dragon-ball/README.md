# Dragon Ball: Saga di Pilaf

Avventura 3D single player per computer, con Goku come unico personaggio giocabile. Il gioco segue la Saga di Pilaf del manga attraverso grandi zone collegate, esplorazione e combattimento accessibile.

## Stato

È disponibile la prima tappa giocabile locale: Goku sulle montagne, incontro con Bulma e avvio della ricerca delle Sfere. I personaggi usano GLB locali con scheletro; auto, casa, vegetazione e montagne usano modelli low poly generati nel codice. Le animazioni restano semplici.

La tappa comprende camminata, corsa, salto, collisioni, telecamera con gestione degli ostacoli, quattro obiettivi narrativi, dialoghi in italiano, menu di pausa, qualità grafica riducibile e salvataggio automatico. Si comincia sulla riva con il pesce gigante; seguono il trasporto del pesce, l'arrivo dell'auto TURBO, il fraintendimento di Goku e il ritorno a casa. Bulma entra nella stanza con Goku: la Sfera è sul comò e l'accordo per partire si svolge in casa.

La revisione del 9 novembre usa una palette satura, materiali toon e nebbia soltanto lontana, al posto della resa pallida iniziale. La casa ha una stanza esplorabile con letto, tavolo, comò e doppie porte. Tetto e pareti diventano trasparenti durante la permanenza nella stanza per rendere leggibile l'interno. L'auto e i colori dei personaggi prendono come riferimento le tavole colorate del primo capitolo pubblicate dal sito ufficiale.

Non sono ancora presenti combattimento, altre zone, audio o il resto della Saga di Pilaf. I modelli costituiscono la prima versione visiva da rifinire, non asset ricavati dal manga o da altri giochi.

## Goku e Bulma

Aggiornamento più recente: Giovanni ha apprezzato entrambi i concept e ha richiesto modelli 3D coerenti con queste tavole, escludendo account e servizi esterni. Sono state create localmente due prime mesh con scheletro tramite Blender 4.5.15 e lo script `art-source/build_characters.py`. Il gioco carica `public/models/goku.glb` e `public/models/bulma.glb`, comprese le texture proiettate dai concept. Sono prototipi volumetrici da valutare, non riproduzioni già approvate delle tavole. Sorgenti modificabili `.blend` nelle cartelle `art-source/goku/` e `art-source/bulma/`.

Giovanni ha scartato il quarto candidato del precedente ciclo con Opus: il risultato ricorda South Park e non comunica Goku. I paragrafi seguenti documentano quel tentativo, ora sostituito nel caricamento del gioco dai GLB locali. Bulma non è più sospesa.

Su richiesta di Giovanni sono stati confrontati quattro candidati con Opus, usando render frontali, a tre quarti, di profilo e miniature a 128 pixel. Le prime due revisioni dei capelli sono state scartate dopo il confronto. La quarta è stata giudicata la migliore del ciclo da Opus, senza considerarla approvata da Giovanni. Bulma è rimasta invariata.

Goku ha una testa più grande del 10% rispetto alla revisione precedente, occhi più aperti, bocca neutra, capelli asimmetrici con frangia appuntita e orecchie concave con elice a C. La pelle della testa ha un'ombreggiatura più uniforme. Le spalle rimangono ancorate al busto durante il movimento; mani e scarpe sono un po' più grandi. La proposta corrente usa gi e pantaloni blu, polsini rossi e cintura chiara, correggendo il precedente accostamento di colori GT. La storia resta quella del manga originale.

Il modello scartato resta generato nel codice; non è stato scolpito con un programma esterno. La revisione tecnica di Opus non ha dimostrato la somiglianza richiesta da Giovanni. I dettagli seguenti descrivono il segnaposto ancora caricato, non la direzione approvata per la sua sostituzione.

I modelli hanno proporzioni e volti distinti: Goku bambino è più basso e compatto, con ciocche asimmetriche, coda curva, gi incrociato, cintura e bastone; Bulma è più alta, con treccia laterale, fiocco, foulard, stivali, borsello e scritte BULMA davanti e 97 dietro.

Gli occhi e i lineamenti sono disegnati su piccole texture che seguono la superficie del volto. Sono presenti battito delle palpebre, movimento della treccia e della coda, articolazioni di gomiti e ginocchia. I ritratti di HUD e dialoghi sono catturati dalle stesse mesh una sola volta all'avvio.

Con il server di sviluppo attivo si può aprire [l'anteprima locale dei personaggi](http://127.0.0.1:5173/personaggi.html): viste davanti, profilo, retro e volti, rotazione con il mouse e prove di camminata e salto. Questa pagina di ispezione è disponibile tramite `npm run dev`; la build del gioco continua ad avere `index.html` come unico punto d'ingresso.

La [nuova anteprima del solo Goku](http://127.0.0.1:5173/goku.html) consente di esaminare tre quarti, fronte, profilo, retro e viso, ruotare il modello e alternare posa in guardia e camminata. Usa la stessa mesh del gioco, senza leggere o scrivere salvataggi. Anche questa pagina richiede il server di sviluppo.

Lo [studio a tre viste](http://127.0.0.1:5173/goku-studio.html) presenta fronte, tre quarti e profilo alla stessa scala, con miniature a 128 pixel e opzioni silhouette e guardia. È uno strumento di revisione locale, disponibile con `npm run dev`, escluso dai punti d'ingresso della build del gioco. Non accede ai salvataggi.

Misure, riferimenti e verifiche sono riportati in [modelli dei personaggi](docs/modelli-personaggi.md).

## Avvio e verifica

Node.js 22.12 o successivo. Dalla cartella di questo gioco:

```powershell
npm ci
npm run dev -- --host 127.0.0.1
```

Aprire l'indirizzo stampato dal server. Il primo avvio mostra il menu iniziale; dopo un salvataggio, usare Continua la partita.

```powershell
npm test
npm run build
npm run preview
```

La build verificata si trova in `dist/`. Il comando preview serve la build locale, normalmente su http://127.0.0.1:4173/. I comandi equivalenti di sviluppo, test e build sono disponibili anche dalla radice del repository.

Il rendering e il gameplay non richiedono servizi esterni. I font dell'interfaccia vengono richiesti a Google Fonts; in assenza di rete vengono usati i font di sistema.

## Comandi della prima tappa

| Azione | Comando |
| --- | --- |
| Muoversi | WASD |
| Correre | Maiusc + movimento |
| Saltare | Spazio |
| Ruotare la telecamera | Trascinare con il tasto sinistro del mouse |
| Ruotare la telecamera da tastiera | Frecce direzionali |
| Telecamera con mouse libero da trascinamento | Doppio clic nella scena, Esc per liberare il puntatore |
| Interagire / avanzare il dialogo | E oppure pulsante a schermo |
| Pausa / ripresa | Esc |

Attacco, parata, schivata, aggancio, tecniche e Radar non sono ancora comandi attivi. Le assegnazioni nei requisiti restano proposte per le tappe successive.

## Salvataggio della prima tappa

Progressione narrativa e impostazioni vengono salvate al completamento dei dialoghi e alle modifiche. Durante l'esplorazione la posizione a terra viene salvata ogni cinque secondi, oltre che alla pausa, alla perdita del focus e all'uscita dalla pagina. Un salto riprende dall'ultimo punto a terra sicuro.

I dialoghi incompleti non avanzano la missione: ricaricando si può ricominciare l'incontro. Una nuova partita chiede conferma prima di sostituire il salvataggio. Dati corrotti o di una versione non supportata sono segnalati e non vengono sovrascritti prima della conferma.

I salvataggi precedenti alla revisione restano validi e conservano l'obiettivo raggiunto. Il nuovo prologo del pesce si vede avviando volontariamente una nuova partita; non viene imposto a chi ha già iniziato.

Il salvataggio appartiene all'origine del sito: cambiare browser, hostname o porta produce uno spazio dati distinto. Non esiste sincronizzazione o account. Se il browser nega l'accesso allo storage, si può giocare con un avviso sui progressi non conservati.

## Decisioni confermate

- Prima versione completa: tutta la Saga di Pilaf, dall'incontro con Bulma alla conclusione dell'avventura al castello.
- Riferimento narrativo: manga, senza aggiunte esclusive dell'anime.
- Mondo: grandi zone collegate, esplorabili con accessi regolati dalla storia.
- Personaggio giocabile: soltanto Goku bambino.
- Personaggi: presenza degli NPC della saga, inclusi amici, nemici e neutrali.
- Grafica: Budokai Tenkaichi 3, stile PS2, come riferimento visivo confermato. Mantenere geometrie semplici e rendering leggero per il browser; Mario 64 resta il riferimento iniziale per la semplicità dei poligoni.
- Modelli: creati per il progetto.
- Combattimento: movimento libero, aggancio del bersaglio, combo semplici, schivata, parata e poche tecniche coerenti con la storia.
- Difficoltà accessibile e ripartenza da checkpoint.
- Salvataggio automatico nel browser, senza account.

## Base tecnica scelta per iniziare

Queste scelte riguardano questo gioco e potranno essere riviste in presenza di un limite concreto.

| Componente | Scelta | Motivo |
| --- | --- | --- |
| Linguaggio | TypeScript | Rendere espliciti stati, dati di missione e salvataggi |
| Grafica 3D | Three.js | Gestire scene, modelli, animazioni, luci ed effetti nel browser |
| Sviluppo e build | Vite | Ambiente locale e produzione di file statici |
| Interfaccia | HTML e CSS | Menu, dialoghi e HUD leggeri |
| Modelli iniziali | Mesh low poly create nel progetto | Costruire uno stile coerente senza dipendere da modelli forniti dall'utente |
| Asset esterni al codice | glTF/GLB quando utili | Separare mesh e animazioni dal codice di gioco |
| Persistenza iniziale | localStorage con schema versionato | Salvare progressi di piccole dimensioni senza server |
| Distribuzione prevista | File statici | Giocare senza backend o account |

Three.js è una libreria grafica, non un motore completo: movimento, collisioni, combattimento, dialoghi e missioni richiedono sistemi dedicati. Partire con collisioni semplici adatte a personaggi e scenario; valutare una libreria di fisica solo se necessaria. Non è prevista una simulazione fisica realistica.

Versioni iniziali registrate in package.json e package-lock.json: Three.js 0.187.0, Vite 8.3.6 e TypeScript 7.0.2. Non imporre queste tecnologie agli altri giochi.

## Dispositivi e comandi

Target confermato: computer. Base proposta: tastiera e mouse, browser desktop aggiornato con supporto alla grafica richiesta da Three.js. Smartphone, tablet e controller non fanno parte della prima versione.

La disposizione dei tasti, le impostazioni video e gli obiettivi prestazionali sono descritti nei requisiti come scelte iniziali da verificare giocando.

## Documenti

- [Requisiti e tappe](docs/requisiti.md)
- [Istruzioni specifiche](AGENTS.md)
- [Verifica della prima tappa](docs/verifica-prima-tappa.md)
- [Raccolta BrowserGames](../../README.md)

## Riferimenti tecnici

- [Three.js: realizzare un gioco](https://threejs.org/manual/pages/game.html)
- [Vite: guida iniziale](https://vite.dev/guide/)
- [Vite: supporto TypeScript](https://vite.dev/guide/features#typescript)

Il servizio di hosting verrà scelto successivamente. Non sono configurati pubblicazione o CI/CD.
