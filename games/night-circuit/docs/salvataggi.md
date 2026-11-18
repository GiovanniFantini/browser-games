# Formato del profilo

Il gioco usa localStorage, senza account o servizi esterni. Chiavi indipendenti: `night-circuit:v2:auto`, `night-circuit:v2:slot-1`, `night-circuit:v2:slot-2`, `night-circuit:v2:slot-3` e `night-circuit:v2:backup`.

## Schema corrente v6

Il profilo contiene:

- `game`: identificativo `night-circuit`; `version`: 6.
- `career`: avvio, reputazione intera fino a un milione, quartiere corrente, rivali battuti in ordine, vittorie, contratto attivo con progresso, contratti conclusi, copertine e messaggi letti/non letti. Tutti gli identificativi sono validati sul catalogo; nessun testo o URL arbitrario viene importato. Un quartiere non sbloccato non può essere quello corrente. La reputazione non viene ricostruita retroattivamente dai record delle fasi precedenti.
- `exploration`: lista senza duplicati dei frammenti raccolti, al massimo dodici, con soli identificativi del catalogo. Ogni raccolta assegna 250 CR una volta e viene salvata.
- `credits`: intero da zero a un miliardo.
- `cars`: da uno a tre esemplari. Ogni esemplare ha `id` (`car-1`, `car-2`, `car-3`), `model` (uno dei 51 identificativi ammessi in `data/career.json`), `owned`, `equipped`, `appearance` e `visualOwned`.
- `owned`: massimo livello acquistato per ciascuna delle undici categorie del catalogo, da zero a tre. Possedere il livello superiore comprende quelli precedenti.
- `equipped`: livello installato, mai superiore a quello posseduto. Zero indica la serie.
- `appearance`: componenti estetici scelti, cerchio/diametro/spinner, colori, oscuramento e fino a dodici strati di vinili. Ogni strato ha identificativo univoco, forma ammessa, superficie, posizione normalizzata, scala sui due assi, rotazione, colore, opacità e specchiatura.
- `visualOwned`: identificativi dei componenti estetici già pagati. La configurazione deve usare soltanto parti possedute. Colori e regolazioni sono inclusi.
- `activeCar`: identificativo dell’esemplare usato.
- `bestTimes`: migliori tempi positivi per gli eventi conosciuti sul layout attuale, incluse le penalità.
- `bestScores`: migliori punteggi non negativi dei due eventi drift sul layout attuale.
- `recordsLayout`: 2 per la rete stradale revisionata. `previousRecords` conserva tempi e punteggi della mappa precedente, mostrati separatamente nel garage. Nei profili senza questo campo i record vengono archiviati senza perdere risultati, premi, inventari o carriera; i nuovi tentativi iniziano una classifica confrontabile.
- `ghost`: nullo o registrazione del miglior giro pulito di Eco dei Fonditori. Versione, evento, durata massima 360 secondi e fino a 1802 pose temporizzate a 5 Hz. Coordinate finite e limitate, tempi strettamente crescenti, quaternion normalizzati e fotogrammi iniziale/finale obbligatori. Ripristini manuali o automatici impediscono di sostituire il record. Le nuove registrazioni hanno `layout: 2`. Quelle precedenti restano leggibili con posa adattata al terreno, ma il primo giro pulito sulla nuova mappa le sostituisce anche se più lento, perché i due tracciati hanno lunghezze diverse.
- `cup`: nullo o coppa in corso con identificativo univoco, prossima tappa, difficoltà/recupero IA e cinque classificati con punti, tempi e arrivi. Salvata soltanto alla liquidazione definitiva della tappa; abbandonare la coppa la cancella. Il premio finale e la cancellazione del progresso sono una singola transazione.
- `results`: ultimi trenta risultati con identificativo gara, evento, posizione, tempo o ritiro e premio.
- `settled`: registro recente di 2.048 identificativi delle gare già liquidate, per evitare un secondo pagamento. I vecchi profili fino a 10.000 identificativi restano leggibili; alla successiva gara il registro viene compattato senza bloccare i premi futuri.

Il limite comune per file e parser è 2 MB. Anche l’esportazione formattata del registro massimo può essere reimportata, verificato con un test di andata e ritorno. Le proprietà sconosciute non vengono propagate. Auto, categorie ed eventi seguono una lista ammessa. Dati incoerenti, valori negativi/non finiti, versioni future, duplicati e componenti non posseduti vengono rifiutati. L’importazione ricostruisce un profilo nuovo, senza fondere proprietà arbitrarie nell’oggetto attivo.

## Migrazione dei profili v2-v5

Le chiavi localStorage conservano il nome `v2` per leggere automaticamente autosave, slot e copia precedente della fase 4. Il campo `version` nel documento identifica lo schema corrente. La migrazione v2→v3 mantiene tutti i dati di gioco, aggiungendo a ogni auto aspetto e inventario di serie. La migrazione v3→v4 aggiunge punteggi drift, fantasma e coppa senza cambiare i dati esistenti. La migrazione v4→v5 conserva anche fantasma, coppa e punteggi, aggiungendo una carriera non ancora avviata. La migrazione v5→v6 aggiunge `exploration: []` mantenendo tutti i dati di carriera, inventari, risultati, coppa e fantasma. La prima successiva scrittura conserva il documento in v6. Non è necessario cancellare il profilo.

Pose del garage, salto idraulico, posizione della telecamera e filtro fotografico sono temporanei. Le bozze non applicate non entrano nell’autosave o nell’esportazione.

## Formato minimo v1

È un formato di interscambio documentato per la migrazione, non un salvataggio pubblicato nelle fasi 1-3. Esempio:

```json
{
  "game": "night-circuit",
  "version": 1,
  "credits": 12000,
  "upgrades": {
    "engine": 0,
    "boost": 0,
    "exhaust": 0,
    "transmission": 0,
    "clutch": 0,
    "suspension": 0,
    "brakes": 0,
    "tires": 0,
    "weight": 0,
    "ecu": 0,
    "nitro": 0
  }
}
```

La migrazione crea un esemplare, installa i livelli indicati e li registra come acquistati insieme a quelli inferiori. Storico e record iniziano vuoti. Il profilo viene successivamente esportato e salvato in v6.

## Errori e copie

Una transazione viene applicata in memoria soltanto dopo validazione. Se la scrittura dell’autosave fallisce, il profilo resta giocabile in memoria ed esportabile; il messaggio del garage segnala che non è stato conservato sul disco. Lo slot manuale viene scritto separatamente.

Caricare uno slot, applicare un’importazione valida o confermare una sostituzione di modello salva prima il profilo attuale nella copia precedente. Il ripristino scambia nuovamente il profilo corrente con la copia, permettendo di tornare indietro. Un errore di scrittura durante un caricamento o una sostituzione di modello non applica il profilo in memoria. La sostituzione conserva identificativo del posto, componenti e aspetto compatibile dei modelli del catalogo, aggiornando modello, saldo e auto attiva nella stessa transazione. Un autosave bloccato va recuperato prima di sostituire un’auto.

Un autosave corrotto o di versione non supportata blocca le scritture automatiche, conservandone il contenuto. La sessione usa un profilo iniziale in memoria finché viene scelto esplicitamente un recupero valido. Esportare eventuali progressi in memoria prima di ricaricare.

Il file JSON è un salvataggio locale modificabile dall’utente. Non è un sistema competitivo con convalida lato server. I limiti proteggono compatibilità e integrità dell’applicazione.

## Preferenze locali

`night-circuit:preferences:v1` è separata dalla progressione e non entra nell’export del profilo. Conserva lingua IT/EN, unità km/h o mph, qualità, pioggia/bloom, assistenza, densità, volumi, radio e binding tastiera/gamepad. Parser con enum ammessi, intervalli numerici e fallback sui default. La rimappatura scambia le assegnazioni duplicate; frecce e F3 restano riservati. Se la scrittura fallisce, il menu lo segnala e mantiene le impostazioni per la sessione. Ripristinare queste preferenze non modifica crediti, auto, carriera o collezione.

Quando un’altra scheda modifica l’autosave, la scheda con il profilo precedente conserva i progressi in memoria ed evita di sovrascrivere il nuovo documento. Il messaggio richiede esportazione e ricarica. Importazioni e sostituzioni rilevano lo stesso conflitto prima di scrivere la copia o l’autosave.
