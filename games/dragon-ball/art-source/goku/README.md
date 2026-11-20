# Goku bambino: nuova base visiva

## Stato

Prima mesh locale: goku-v1.blend, esportata in ../../public/models/goku.glb dallo script ../build_characters.py. Lo script costruisce superfici volumetriche, UV proiettate dalla tavola e uno scheletro con pesi. Non è una scultura manuale. Il gioco usa la texture incorporata nel GLB; il bastone è aggiunto dalla factory del gioco. Il riscontro positivo sul concept non approva automaticamente questa mesh.

concept-v1.png è una tavola illustrata generata con lo strumento immagini integrato il 9 novembre 2026. Presenta fronte, tre quarti, profilo e dettaglio del volto. Non è un render di una mesh e non contiene un rig; la nuova mesh ne riutilizza la texture tramite UV. Giovanni ha espresso un riscontro positivo ("bello") e ha chiesto di vedere Bulma con lo stesso metodo. Questo conferma la direzione del concept, non l'approvazione della nuova mesh.

Il modello procedurale precedente è stato rifiutato per la scarsa riconoscibilità. Questa tavola serve a fissare una base diversa prima di produrre la nuova mesh. Le viste generate possono avere incoerenze: in particolare vanno riconciliate ciocche e coda fra fronte e profilo. Non trattarle come proiezioni geometricamente esatte.

## Indicazioni per la mesh

- Conservare l'identità di Goku bambino: frangia appuntita, grandi ciocche asimmetriche, sopracciglia nere, occhi larghi e mento piccolo definito.
- Costruire spalle e braccia con raccordi anatomici continui. Evitare sfere separate e articolazioni da pupazzo.
- Usare gi e pantaloni blu, polsini rossi, cintura chiara e coda marrone. Non mescolare il costume di Goku GT.
- Creare vere superfici tridimensionali anche per il profilo del viso. La tavola non va applicata come cartello piano davanti al personaggio.
- Produrre una mesh modificabile con UV e texture, poi rig e pesi per le pose del gioco. GLB è il formato di integrazione previsto, non ancora implementato.
- Verificare somiglianza e spalle con un render della mesh reale prima di considerare completato Goku. La richiesta successiva di Giovanni autorizza intanto il concept di Bulma.
- Misurare triangoli, dimensioni delle texture e costo dei contorni dopo la creazione. Il riferimento di circa 8.000 triangoli è una scelta iniziale modificabile, non una misura del concept.

## Strumenti

fal era stato valutato come possibile strumento esterno. Giovanni ha escluso account e servizi esterni: la realizzazione procede localmente con Blender. Nessuna generazione 3D esterna o operazione a pagamento è stata avviata.

Il prompt integrale usato per la tavola è conservato in prompt-v1.txt. Non sono state fornite immagini in input.
