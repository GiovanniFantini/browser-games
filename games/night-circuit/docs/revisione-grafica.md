# Revisione grafica completa

La richiesta corrente di Giovanni autorizza a proseguire senza pause di approvazione fino al dettaglio e alla grafica dei riferimenti in chat. Le precedenti attese fra texture, edifici, luce e auto sono superate. Le immagini orientano la qualità e non sono incorporate nel gioco.

## Contenuti

- Texture procedurali con seed e cache IndexedDB, senza risorse esterne.
- Kit `src/gen/buildings/kit.ts`: 31 moduli e grammatica base, piani e coronamento. Vetrine, ingressi, cornici, balconi, tende, scale antincendio, condizionatori, impianti, serbatoi, antenne, cartelloni e tetti. I moduli vengono raggruppati in mesh instanziate per forma e materiale. Old Docks usa settori da 240 metri; gli altri quartieri hanno palette, altezze e coperture proprie.
- Sottopasso dei Fonditori, sulla strada già guidabile di Old Docks: volta continua, archi strutturali, nicchie, travi, correnti, lampade, parapetti e segnaletica originale. I sostegni laterali hanno collisioni e lasciano libera la carreggiata.
- `npm run bake:lighting`: genera due lightmap PNG da 512 px con 1.682 sorgenti statiche. Il build le rigenera dal codice. La mappa della città e quella del sottopasso vengono campionate nello spazio del mondo. Le auto mantengono ombreggiatura fisica, riflessi, luce dinamica vicina e un lieve riempimento sulla vernice per restare leggibili fra i lampioni. Il gestore mantiene quattro luci locali, più i fari del giocatore.
- Auto generate dall'API ufficiale Blender 4.5, con 51 schede parametriche, curve e sezioni, subdivision, decimazione, UV, bake AO e GLB. Parti nominate, attacchi ruota, tuning, vinili e aperture conservati. Il catalogo si carica su richiesta, mentre l'auto iniziale e quella del profilo vengono preparate prima dell'avvio.
- Garage con pavimento consumato, marcatura della postazione, pareti, serrande, armadi, banco, pneumatici, travi e insegna originale. Le normali pesate delle parti rigide delle auto mantengono riflessi regolari sui paraurti. I fari sono incassati nel frontale. Il controllo dei volumi di visibilità comprende tutti i 51 modelli dopo la decodifica dei vertici quantizzati.
- Telecamera più bassa, strumenti circolari compatti e suggerimenti fuori dalla sagoma dell'auto. Indicatori di ritrovo ridotti. UI, insegne e segnaletica usano il font originale generato nel progetto.
- Motore, gomme, impatti, nitro, ambiente e radio restano sintetizzati con Web Audio, senza campioni esterni.

## Riproduzione

```powershell
npm run bake:lighting
npm run build
npm run dev
```

La partenza di Old Docks è dentro il nuovo sottopasso. Il resto della città rimane percorribile. La [guida Blender per principianti](../tools/blender/README.md) descrive i comandi verificati e l'ispezione dei modelli.

## Verifiche e limiti

- `npm run build`: superato, comprese rigenerazione lightmap e compilazione TypeScript. Resta l'avviso Vite sul chunk principale superiore a 500 kB.
- `npm run lint`: superato.
- `npm test`: 22 file, 90 test superati, con fisica, gare, progressione e salvataggi.
- `npx playwright test tests/visual-upgrade.spec.ts tests/textures.spec.ts tests/appearance.spec.ts tests/audio.spec.ts`: nove test superati con Chromium. Verificati 17 materiali e 68 mappe, seed, cache, fallback senza IndexedDB, tutti i GLB, geometria e volumi di visibilità, guida fisica dentro e fuori dal sottopasso, tuning, editor vinili ridimensionato, esportazione foto, persistenza e sintesi audio.
- Dopo le ultime correzioni, ripetuta la prova di guida nel sottopasso, uscita in città e garage con il modello effettivo. La build distribuibile è stata controllata anche in qualità media: nessun errore JavaScript o shader, nessuna richiesta a domini esterni e API QA assente. Profilo iniziale pulito con traffico zero: 2.838.115 byte trasferiti da Vite preview, incluso il solo GLB iniziale da 294.520 byte. Queste dimensioni descrivono la compressione HTTP di questo server e questo profilo, non tutti i salvataggi o gli host.
- Catalogo finale: 51 GLB, da 6.953 a 7.194 triangoli, 14.901.756 byte complessivi dopo quantizzazione. La distribuzione completa occupa 21.087.864 byte: supera 15 MB se si considera l'intero catalogo installato. Il caricamento iniziale misura separatamente i soli file richiesti dal profilo; gli altri modelli si caricano su richiesta.
- Sul catalogo finale quantizzato, ripetuti e superati i due controlli di `visual-upgrade.spec.ts` su tutti i GLB e sui volumi di visibilità. Ricostruita con successo la distribuzione completa dopo la sostituzione dei 51 file.
- Esempio Blender aggiornato e salvato: `artifacts/blender/silex-c1.blend`, con curve di controllo, parti e UV. Le normali pesate e il bake sono stati rigenerati sull'intero catalogo.

Acquisizioni locali:

- `artifacts/visual-underpass-medium-final.png`: guida, qualità media.
- `artifacts/visual-city-final.png`: uscita dal sottopasso a 94 km/h, qualità bassa.
- `artifacts/visual-garage-final.png`: anteprima del tuning nell'officina.
- `artifacts/visual-workshop-photo-final.png`: studio fotografico dalla build distribuibile.
- `artifacts/production-visual-report.json`: richieste e dimensioni misurate nel controllo della build.

Gli screenshot sono acquisizioni del gioco nel browser, con fisica Rapier e modelli effettivamente caricati. Le misure software non certificano 60 fps su GPU integrata. La revisione è stata successivamente caricata su GitHub e pubblicata su GitHub Pages con autorizzazione di Giovanni; lo stato corrente è descritto in [pubblicazione](pubblicazione.md). Non sono stati aggiunti workflow personalizzati.
