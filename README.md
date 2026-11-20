# BrowserGames

Raccolta di browser game. Ogni gioco ha requisiti, stile visivo, dispositivi supportati e scelte tecniche propri.

Sviluppo locale: C:\repos\browser-games

Repository di riferimento: https://github.com/GiovanniFantini/browser-games

## Stato

È disponibile in locale la prima tappa giocabile di Dragon Ball: montagne, movimento di Goku, telecamera, incontro con Bulma e salvataggio automatico. La Saga di Pilaf completa deve ancora essere realizzata.

Il primo gioco è Dragon Ball: Saga di Pilaf, un'avventura 3D single player per computer.

NIGHT CIRCUIT: Neon Streets è il secondo gioco della raccolta: guida arcade 3D notturna con auto e città originali. Le otto tappe comprendono guida, Old Docks con mappa/GPS/traffico, gare, tuning prestazioni ed estetico, garage, crediti, salvataggi e foto. Sono disponibili anche drift su circuito e discesa, drag manuale, sprint a tempo, sfide a distacco, torneo e fantasma. La carriera comprende reputazione, quattro rivali, sponsor, copertine, sblocchi e telefono; i quattro quartieri sono collegati fisicamente, con salite, tunnel, scorciatoie e collezionabili. La fase 8 aggiunge 51 auto di 12 costruttori, radio procedurali, pioggia/bloom, impostazioni, rimappatura e IT/EN. La fase 8 è completata e verificata localmente; le misure su GPU integrata restano da eseguire. La review iterativa Codex/Opus è conclusa con READY TO PROD per la build statica. Il [resoconto corrente e i limiti](games/night-circuit/docs/review-finale.md) sono nella documentazione del gioco.

## Documentazione

- [Istruzioni generali](AGENTS.md)
- [Dragon Ball: presentazione e scelte tecniche](games/dragon-ball/README.md)
- [Dragon Ball: istruzioni di sviluppo](games/dragon-ball/AGENTS.md)
- [Dragon Ball: requisiti e percorso di realizzazione](games/dragon-ball/docs/requisiti.md)
- [NIGHT CIRCUIT: avvio e controlli](games/night-circuit/README.md)
- [NIGHT CIRCUIT: requisiti e roadmap](games/night-circuit/docs/requisiti.md)

## Organizzazione

Ogni gioco vive in `games/<identificativo>/`, con codice, risorse e documentazione dedicati. La [home della raccolta](https://giovannifantini.github.io/browser-games/) è pubblica. Da due schede si aprono NIGHT CIRCUIT o Time Defense. La pagina e le copertine sono in collection/.

Le istruzioni comuni appartengono al file `AGENTS.md` nella radice. Le scelte del singolo gioco appartengono alla sua cartella: motore o libreria grafica, linguaggio, stile, comandi, dispositivi, salvataggi, storia e requisiti di prestazione.

Codice condiviso e strumenti comuni verranno introdotti quando esiste un utilizzo concreto in più giochi. Non è richiesto che tutti i giochi usino lo stesso motore.

## Avvio locale

Richiesto Node.js 22.12 o successivo. La verifica iniziale è stata eseguita con Node.js 24.20.0 e npm 11.19.0.

Dalla radice del repository:

```powershell
npm --prefix games/dragon-ball ci
npm run dev
```

Per NIGHT CIRCUIT:

```powershell
npm --prefix games/night-circuit ci
npm run dev:night-circuit
```

Aprire l'indirizzo locale stampato da Vite, normalmente http://127.0.0.1:5173/.

```powershell
npm test
npm run build
```

I comandi senza suffisso nella radice avviano e verificano il primo gioco. I comandi con suffisso `:night-circuit` operano sul secondo. Ogni gioco conserva le proprie dipendenze nella sua cartella.

## Pubblicazione

La build di Dragon Ball produce file statici in `games/dragon-ball/dist/`, senza backend. Il servizio di hosting resta da scegliere.

NIGHT CIRCUIT è disponibile sulla [GitHub Pages pubblica](https://giovannifantini.github.io/browser-games/). Il selettore apre [NIGHT CIRCUIT](https://giovannifantini.github.io/browser-games/guida/) o [Time Defense](https://giovannifantini.github.io/browser-games/time-defense/). È disponibile anche su [Sites](https://night-circuit-neon-streets.weproject-6682.chatgpt.site), con accesso privato tramite account ChatGPT. I sorgenti sono nel branch codex/release-night-circuit del repository GitHub browser-games; dettagli e salvataggi fra PC sono nella [documentazione del gioco](games/night-circuit/docs/pubblicazione.md).

Nessuna pipeline CI/CD è stata creata o modificata.
