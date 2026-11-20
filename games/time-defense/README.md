# Time Defense

Tower defense cartoon per computer. La prima saga comprende cinque mappe originali, quattro famiglie di torri con specializzazioni, sei tipi di creature e il Custode finale. Le fratture temporali collegano fantasia e brevi scoperte di paleontologia, con fonti consultabili negli Appunti.

Ambito e criteri: [requisiti della prima saga](docs/requisiti.md).

## Giocare

Scegli Inizia la saga. Seleziona famiglia e piazzola, poi conferma Costruisci. Avvia ogni ondata quando sei pronto. Pausa o Esc fermano il tempo; Riprendi continua. Puoi costruire e migliorare anche in pausa. La vittoria apre il livello successivo; le stelle non sono richieste.

Ogni tentativo parte da 225 Scintille e 20 Stabilità. Se il Custode raggiunge il portale perdi anche con Stabilità residua. Puoi rigiocare i cinque livelli dopo il finale.

Il campo richiede 1024×720 CSS pixel. Menu e impostazioni si adattano a finestre più piccole. Audio dopo Attiva audio, con volumi Musica/Effetti separati. Movimento ridotto rispetta anche le preferenze del sistema.

Progressi e impostazioni sono locali a questo browser e indirizzo. Impostazioni permette di esportare/importare una copia. La partita in corso non si salva a metà ondata. Cambiare dominio o browser richiede importare la copia per trasferire i progressi.

## Avvio e build

Node.js almeno 22.12; verificato con 24.20.0 e npm 11.19.0. Dalla cartella del gioco:

```powershell
npm ci
npm run dev
```

Apri http://127.0.0.1:5182/. Per i file statici:

```powershell
npm run build
npm run verify:build
npm run prepare:site
npm run preview:site
```

La build è in `dist/`. Il sito completo con indice è in `artifacts/site/`; il server di anteprima mostra l’indirizzo locale. La preparazione richiede una directory nuova; per un’altra copia usa `npm run prepare:site -- artifacts/site-2` e passa la stessa directory a preview:site. Non servono servizi lato server per il gioco.

## Struttura

- `src/`: logica, interfaccia e renderer Canvas2D.
- `docs/`: dati canonici di torri, creature, effetti e cinque livelli.
- `art-source/`: soltanto le risorse e i metadati necessari a ricompilare il gioco.
- `release/`: indice della raccolta e inventario delle risorse.
- `tools/`: verifica dell’artefatto e preparazione/anteprima del sito.

I valori di combattimento e progressione derivano dai JSON. Il laboratorio opzionale si apre con `?laboratorio=1`; non assegna progressi della campagna.

## Verifica della prima saga

I task 1-47 sono stati revisionati da Claude Opus 5.5. Sono state completate 147 ondate native su Edge e Firefox, con profilo iniziale vuoto, e verificati salvataggi, impostazioni, tastiera e recupero dagli errori. Gli ultimi due avvisi del Richiamo hanno una verifica mirata successiva sull’Altopiano.

Il finale con otto torri e audio attivo è stato misurato per venti secondi reali: Edge 1024×720 DPR2 e 1280×720 DPR1, intervallo mediano 16,7 ms; Playwright Firefox 159.0 a 1024×720 DPR2, 24,3 ms. Sono misure su una macchina Windows virtualizzata, non garanzie per tutti i computer. Chrome è stato verificato nei flussi iniziali. Non si certificano lettori di schermo o il focus del sistema operativo.

Illustrazioni originali generate per questo progetto e suddivise in parti rigide; musica ed effetti procedurali originali. L’inventario in `release/assets.json` lega i 62 PNG e i 3 MP3 ai rispettivi hash. Le nozioni scientifiche sono distinte dalla fantasia e i collegamenti alle fonti sono negli Appunti.
