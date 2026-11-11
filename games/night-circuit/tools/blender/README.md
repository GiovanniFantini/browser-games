# Generare e modificare le auto con Blender

Tutte le auto sono originali e generate dai file del progetto. Non occorre Blender per giocare: i GLB pronti sono in `public/models`. Ogni auto ha una scheda in `tools/blender/cars`, con lo stesso identificativo usato dal gioco.

## Su questo PC: esecuzione già verificata

1. Apri un terminale PowerShell nella cartella `games/night-circuit`.
2. Incolla queste due righe per generare soltanto la Silex C1:

```powershell
$pythonBlender = "$env:LOCALAPPDATA/CodexTools/Blender-4.5.16/blender-4.5.16-windows-x64/4.5/python/bin/python.exe"
& $pythonBlender tools/blender/generate_cars.py -- --car silex-c1
```

Questo interprete dispone dell'API ufficiale `bpy` di Blender 4.5.16. La generazione è stata eseguita e verificata con questa modalità. Non compare una finestra: il lavoro avviene in background. Aspetta la riga `ALL MODELS COMPLETE`. Durante il bake possono comparire molte righe di avanzamento.

3. Per tutte le 51 auto, sostituisci l'ultima riga con:

```powershell
& $pythonBlender tools/blender/generate_cars.py -- --all
```

4. Dopo la generazione compatta i GLB, poi avvia il gioco:

```powershell
node tools/pack-models.mjs
npm run dev
```

La compattazione usa `KHR_mesh_quantization`, senza cambiare il numero dei triangoli, i nomi o gli attacchi dei componenti. Il gioco carica e decodifica il modello quando serve.

## Usare Blender 4.x installato normalmente

Blender si scarica dal [sito ufficiale](https://www.blender.org/download/). La [documentazione ufficiale di installazione](https://docs.blender.org/manual/en/latest/getting_started/installing/windows.html) descrive anche la versione ZIP. Il generatore usa le API della serie 4.x; la verifica del progetto è stata eseguita con 4.5.16.

Dalla cartella del gioco, se Blender è nel PATH:

```powershell
blender --background --python tools/blender/generate_cars.py -- --car silex-c1 --save-blend
```

Altrimenti indica il percorso del tuo eseguibile, per esempio:

```powershell
& "C:/Program Files/Blender Foundation/Blender 4.5/blender.exe" --background --python tools/blender/generate_cars.py -- --car silex-c1 --save-blend
```

Il percorso deve corrispondere alla tua installazione. Nell'ambiente di verifica il pacchetto desktop portatile ha dato un errore Windows relativo all'assembly `blender.crt`; per questo l'esecuzione verificata usa `bpy` come descritto sopra. I file e il procedimento di modellazione sono gli stessi.

## Vedere il modello nell'interfaccia

1. Genera un'auto aggiungendo `--save-blend`. Il file di lavoro viene scritto in `artifacts/blender/<identificativo>.blend`.
2. In Blender scegli File, Open e apri quel file. Questo file di lavoro non viene distribuito con il gioco.
3. Nell'Outliner, in alto a destra, trovi scocca, cofano, portellone, paraurti, minigonne, specchi, cristalli, fari, fanali e i quattro gruppi ruota. Ogni ruota contiene gomma e cerchio.
4. Seleziona un oggetto nell'Outliner. Premi il punto del tastierino numerico per inquadrarlo; ruota la vista con il pulsante centrale del mouse, ingrandisci con la rotella.
5. Le curve di partenza sono nella raccolta `source_profiles`. Sono nascoste per evitare che coprano il risultato: puoi mostrarle dall'Outliner. Contiene profilo laterale, profilo dall'alto e otto sezioni Bezier.
6. Per aprire direttamente un GLB usa File, Import, glTF 2.0 e scegli il file in `public/models`.

Puoi anche eseguire lo script dalla scheda Scripting, aprendo `tools/blender/generate_cars.py` nel Text Editor e premendo Run Script. Senza argomenti genera la Silex C1. Usa un file Blender vuoto: lo script ricrea la scena di lavoro.

## Cambiare le proporzioni senza modellare a mano

Apri, per esempio, `tools/blender/cars/silex-c1.json` in un editor di testo e salva una copia prima di modificarlo.

- `length`, `width`, `wheelbase`, `track`: dimensioni generali e attacchi ruota, in metri. Devono restare coerenti con la scheda del gioco in `src/data/career.json` se cambi le dimensioni fisiche.
- `side_profile` e `top_profile`: punti normalizzati dei due profili, conservati come curve di controllo.
- `sections`: otto sezioni trasversali, con posizione `z`, larghezza, altezza superiore e linea di cintura. Questi valori controllano il loft finale. Modifica poco alla volta.
- `cross_section_segments` e `longitudinal_segments`: densità di campionamento delle superfici.
- `target_triangles`: obiettivo della decimazione. L'esportazione si interrompe se il risultato esce dall'intervallo 3.000-8.000 triangoli.
- `ao_size` e `ao_samples`: risoluzione e campioni del bake AO. Il progetto usa 256 px e otto campioni, con una pulizia procedurale del rumore.

Rigenera l'auto con lo stesso comando, ricompatta i GLB e ricarica il gioco. Cambiare soltanto il file JSON non modifica un GLB già esportato.

Se vuoi continuare a usare il server durante una generazione lunga, aggiungi `--output-dir artifacts/blender/regenerated-models`. I nuovi GLB e il loro manifest saranno preparati in quella cartella senza ricaricare il gioco a ogni file. Al termine copia GLB e manifest in `public/models`, poi esegui la compattazione. La cartella predefinita resta `public/models`.

## Cosa fa lo script

1. Costruisce le curve di controllo e le otto sezioni originali.
2. Campiona il loft con passaruota e profili raccordati.
3. Applica una suddivisione leggera e una decimazione che conserva le giunzioni fra i pannelli.
4. Separa e nomina le parti, aggiunge parafanghi sagomati, paraurti curvi, fari incassati, fanali avvolgenti, ruote e interni. I passaruota delle monoposto rimangono aperti. Le parti curve mantengono normali morbide, mentre quelle rigide usano normali pesate. Il budget finale include anche la scocca.
5. Crea e impagina automaticamente le UV.
6. Esegue il bake AO con Cycles e incorpora la texture nel GLB. Una copia ispezionabile resta in `artifacts/blender/ao`.
7. Esporta il GLB e aggiorna `public/models/manifest.json`, che riporta triangoli e parti di ciascun modello.

Il tuning nel browser riutilizza queste parti, genera varianti dei componenti e dei cerchi e conserva i pivot per portiere, cofano e portellone. Il modello impiegato nel garage è lo stesso della guida.
