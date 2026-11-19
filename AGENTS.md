# Istruzioni generali di BrowserGames

## Ambito e priorità

Queste istruzioni si applicano alla raccolta e a tutti i giochi. Le istruzioni nelle cartelle dei giochi aggiungono regole specifiche senza indebolire le preferenze generali di Giovanni o i vincoli di autorizzazione qui riportati.

Leggere il README generale e, prima di intervenire su un gioco, il suo README, il suo AGENTS.md e i requisiti. La richiesta più recente di Giovanni guida le decisioni; aggiornare i documenti quando cambia una scelta confermata.

## Separazione delle decisioni

- Tenere nella radice soltanto decisioni comuni alla raccolta: organizzazione, modalità di lavoro e documentazione.
- Tenere in `games/<identificativo>/` decisioni su grafica, motore, dispositivi, gameplay, storia, salvataggi, dipendenze e prestazioni del gioco.
- Non trasformare una scelta di Dragon Ball in un vincolo per gli altri giochi.
- Mantenere indipendenti codice, risorse e dati dei giochi. Condividere componenti solo quando c'è una necessità dimostrata.
- Distinguere requisiti confermati, scelte tecniche iniziali modificabili e proposte ancora da decidere.

## Modalità di lavoro

- Lavorare per tappe giocabili e verificabili, conservando l'obiettivo completo concordato.
- Una demo o una tappa tecnica non equivale al completamento del gioco.
- Preferire soluzioni semplici e leggere, con dipendenze motivate da esigenze reali.
- Aggiornare README e requisiti insieme alle modifiche che cambiano avvio, comportamento o perimetro.
- Documentare soltanto comandi realmente disponibili e verificati.
- Non creare infrastruttura, backend, autenticazione o servizi esterni senza una necessità del gioco.
- Non introdurre strumenti di gestione per più pacchetti o un motore comune prima che servano.
- Nei progetti 3D dichiarare sempre il sistema di coordinate adottato (esempio Y-up, 1 unità uguale a 1 metro) e prevedere la pulizia esplicita delle risorse GPU (dispose di geometrie, materiali e texture) al cambio scena o riavvio.

## Flusso di lavoro con i modelli

Giovanni dispone di una licenza ChatGPT Pro 100 (con accesso esteso a GPT-6.2 Astra e GPT-6.2 Sol) e di una licenza Claude Pro (con Claude Opus 5.5 soggetto a limiti ogni 5 ore e Claude Fable 5.2 solo a consumo extra).

- GPT-6.2 Astra (sforzo High) prepara i piani per i nuovi giochi, le epiche complesse e l'architettura 3D. Il piano indica tappe giocabili, decisioni tecniche, dipendenze e criteri di accettazione, con il dettaglio necessario perché Sol possa partire in autonomia.
- GPT-6.2 Sol si occupa di analisi, sviluppo, UI, verifiche e correzioni dopo la review. A fine tappa prepara il diff, i criteri di accettazione e l'esito delle verifiche per Opus.
- Claude Opus 5.5 rivede i piani architetturali prima dello sviluppo e il codice a fine tappa per individuare bug silenziosi, problemi di prestazioni o difetti spaziali. Per le modifiche minori e isolate basta la verifica mirata di Sol.
- Claude Fable 5.2 viene usato solo su autorizzazione esplicita di Giovanni per scene 3D procedurali molto complesse o blocchi tecnici non risolti da Astra e Opus.

Se un modello non è accessibile nella sessione, indicarlo e preparare il materiale da passare a Claude o Codex.

## Verifica

Verificare le parti interessate dalla modifica. Per gameplay, grafica, telecamera e interfaccia serve una verifica nel browser: la sola compilazione non dimostra che il gioco funzioni. Per i giochi 3D controllare nel browser anche l'assenza di errori WebGL in console, la stabilità delle prestazioni e il corretto allineamento visivo di telecamera, luci e collisioni.

Usare test automatici per logiche dove sono utili, come progressione delle missioni e compatibilità dei salvataggi. Evitare test che ripetano semplicemente l'implementazione. Registrare ciò che è stato verificato e le limitazioni effettive, senza presentare obiettivi di prestazione come misure già ottenute.

## Autorizzazioni e comunicazioni

- Prima di modificare qualsiasi file di pipeline o configurazione CI/CD, chiedere a Giovanni e attendere la sua autorizzazione esplicita per quella modifica. Una richiesta di sviluppo, fix, commit o push non la autorizza. La regola include controlli preliminari e protezioni.
- Non creare pipeline come parte automatica dell'impostazione del progetto.
- Non dedurre da una richiesta di preparazione l'autorizzazione a inviare comunicazioni, pubblicare o fare push. Rispettare l'ambito autorizzato nella conversazione.
- Non inviare email e non creare o salvare bozze nei servizi di posta senza la richiesta esplicita di Giovanni per quella specifica azione.
- Se Giovanni chiede di preparare una mail, scrivere il testo soltanto in chat. Per le risposte, indicare A e Cc e usare tutti i destinatari originari nei rispettivi ruoli, eliminando duplicati e l'indirizzo di Giovanni. Verificare i destinatari sul messaggio originale prima di una bozza o di un invio autorizzati.
- Per email e HTML delle email restano valide tutte le preferenze generali di Giovanni, comprese saluto, firma, sintesi e paragrafi ed elenchi HTML espliciti.
- Comunicare in italiano, con linguaggio diretto, senza grassetto, corsivo, decorazioni o trattino lungo Unicode U+2014.
- Distinguere lavoro concluso, lavoro rimanente e dipendenze esterne. Non attribuire incarichi o scadenze non concordati.

## Stato attuale

Dragon Ball dispone della prima tappa giocabile locale: montagne, movimento, telecamera, incontro con Bulma e salvataggio automatico. Il resto della saga deve ancora essere realizzato. Non dichiarare disponibili funzionalità o pubblicazione finché non sono state implementate e verificate.

NIGHT CIRCUIT è il secondo gioco, indipendente. L'autorizzazione attuale comprende tutte le otto fasi. Consultare i suoi requisiti e il resoconto delle verifiche nella cartella dedicata; la fase 8 è completata e verificata localmente, con limiti di misura documentati.
