# Schede dei compiti

I compiti della Fase 1 hanno schede individuali e stato in [PLANS.md](../../PLANS.md). Per aggiungere una scheda usa [`_TEMPLATE.md`](_TEMPLATE.md). I comandi si eseguono da `games/epoche`.

## Fase 1: motore minimo
| ID | Scheda |
|---|---|
| T01 | [Setup del progetto](T01-project-setup.md) |
| T02 | [Nucleo dell'engine](T02-engine-core.md) |
| T03 | [Schemi del contenuto e dati della Preistoria](T03-content-schema.md) |
| T04 | [Stato di gioco e attributi](T04-attributes-system.md) |
| T05 | [Politiche, Influenza e Legittimità](T05-policies-influence.md) |
| T06 | [Popolazione e Complessità](T06-population-complexity.md) |
| T07 | [Simulatore headless e determinismo](T07-headless-sim.md) |
| T08 | [Ponte Web Worker e store](T08-worker-bridge.md) |
| T09 | [Interfaccia grezza](T09-raw-ui.md) |
| T10 | [Verifica locale della Fase 1](T10-local-verification.md) |

## Regole per chi scrive le schede
- Dimensiona ogni compito in modo che possa essere verificato e rivisto autonomamente.
- I criteri di accettazione devono essere **verificabili** (un test, un comando, un comportamento osservabile).
- Indica sempre cosa è **fuori ambito**, per evitare che l'agente faccia troppo.

## Epoche 1.0 browser

I 100 task E001–E100 attuano il [piano operativo](../ROADMAP.md#piano-operativo-per-la-10-browser). Le righe senza stato sono da fare. I [due giri simulati con agenti indipendenti](playtest-agenti.md) hanno prodotto correzioni per progressione, gestione dell’Influenza e rientro. I criteri che richiedono persone rimangono aperti. Il [resoconto del primo giro](primo-giro.md) raccoglie build, verifiche, protocollo e dipendenze aperte. Ogni riga indica il risultato da ottenere, i prerequisiti diretti e la prova da allegare. Aggiornare lo stato accanto all'ID dopo la verifica. Per un task condizionato dai riscontri, chiudere con la correzione verificata o con la motivazione documentata per cui il lavoro non serve. Per un prerequisito esterno assente, mantenere il task bloccato e proseguire sulle attività indipendenti. Le [verifiche successive in locale](verifiche-locali.md) distinguono i risultati tecnici dalle prove con persone e dalla decisione sulla candidata ufficiale.

Ambito comune: campagna da Genesi alla Trascendenza su BrowserGames, Chrome e Firefox desktop, italiano e inglese, Rapido e Storico. Steam, installer, nuove ere e modifiche CI/CD sono fuori da questo piano. Il test remoto richiede un'origine HTTPS riservata autorizzata. Inviti esterni, pubblicazione e ripristino pubblico seguono le autorizzazioni concordate. Nei task di gioco valgono i contratti di [AGENTS.md](../../AGENTS.md) e il [piano tecnico](../../PLANS.md).

Se una candidata fallisce una verifica, correggere il difetto e rifare E062 o E083 secondo la fase. Ripetere le prove a valle interessate sulla nuova build e aggiornare manifest e SHA-256 prima di riaprire la consegna o il rilascio. Una modifica a progressione, salvataggi o segnali informativi riapre anche le prove con persone interessate. Conservare i risultati associati alla build che li ha prodotti.

### E001–E010 · Build e ambiente del primo giro

| ID | Task | Dipende da | Criterio di chiusura |
|---|---|---|---|
| E001 (verificato) | Identificare il sorgente di partenza | Nessuno | Commit o snapshot esatto, versione Node e lockfile registrati. |
| E002 (verificato) | Compilare la campagna completa | E001 | `npm run build` produce `dist/`; il log identifica la modalità campagna. |
| E003 (verificato) | Archiviare il pacchetto del primo giro | E002 | ZIP e SHA-256 associati al sorgente e a un ID di build univoco. |
| E004 (verificato) | Servire la build locale a indirizzo fisso | E003 | Vite preview risponde su `http://127.0.0.1:4173/` con il bundle archiviato. |
| E005 (verificato) | Preparare profili browser persistenti | E004 | Due profili di prova hanno slot separati; chiudendo e riaprendo lo stesso profilo lo slot resta disponibile. |
| E006 (verificato) | Controllare l'isolamento dei dati di Epoche | E004 | IndexedDB, chiavi di preferenza e meccanismi di coordinamento tra schede sono inventariati; ogni conflitto riscontrato è risolto o impedito dall'isolamento verificato. |
| E007 (prove locali) | Preparare l'accesso remoto se necessario | E003, E006 | Pacchetto servito su origine HTTPS separata, con accesso limitato verificato; se tutte le prove sono osservate in locale, annotarlo. |
| E008 (verificato) | Verificare l'avvio e la persistenza in Chrome | E005, E006 | Da profilo pulito si impostano seme e ritmo, si crea uno slot, si chiude il browser e si riprende ed esporta la partita. |
| E009 (verificato) | Verificare l'avvio e la persistenza in Firefox | E005, E006 | Lo stesso percorso di E008 riesce su Firefox; versione e risultato sono annotati. |
| E010 (verificato) | Conservare gli export di riferimento del primo giro | E008, E009 | Manifest con ID di build, browser, ritmo e stato di gioco per ogni campione JSON iniziale. |

### E011–E020 · Base simulata e protocollo di osservazione

| ID | Task | Dipende da | Criterio di chiusura |
|---|---|---|---|
| E011 (verificato) | Misurare i tre profili in Rapido | E003 | `npm run sim:campaign -- 10 --compare` registra traguardi e stalli per 10 semi e tre profili. |
| E012 (verificato) | Misurare i tre profili in Storico | E003 | `npm run sim:campaign -- 10 --standard --compare` registra lo stesso campione in Storico. |
| E013 (verificato) | Censire i dilemmi in Rapido | E003 | `npm exec -- tsx tools/sim/narrative.ts 1 10` produce tracce per due percorsi su ciascun seme. |
| E014 (verificato) | Censire i dilemmi in Storico | E003 | Il comando di E013 con `--standard` produce le tracce del ritmo Storico. |
| E015 (verificato) | Ricavare cadenza e durata per era | E011, E012, E013, E014 | Resoconto con tick di ingresso, intervalli tra dilemmi, durate e stalli per ritmo. Se mancano i tick, integrarli nel resoconto del simulatore; distinguere tempo simulato e tempo attivo. |
| E016 (verificato) | Fissare la base di confronto | E015 | Fasce di durata e cadenza, minimi narrativi e configurazioni da riprovare sono registrati prima delle correzioni. |
| E017 (verificato) | Preparare le istruzioni per chi osserva | Nessuno | Copione con consegna neutra, regola sugli aiuti, gestione abbandoni e domande su progressione, conseguenze, assenza e finale. |
| E018 (verificato) | Preparare la scheda per ogni sessione | E017 | Modello con ID anonimo, build, browser, lingua, risoluzione, seme, scelte di Genesi, ritmo, minuti, esito, aiuti, attese, dilemmi e rientro; raccolta di export e catture subordinata al consenso. |
| E019 (verificato) | Disegnare il campione e le prove | E016, E017 | Piano per 5–10 esordienti di esperienza diversa, almeno due semi di cui uno comune, una prova in inglese, tre tentativi Rapido e due rientri Storico. |
| E020 (verificato) | Preparare il caso di assenza oltre il tetto | E010 | Export controllato con oltre otto ore di assenza e risultato atteso documentato per recupero, cronaca e arresto agli eventi decisivi. |

### E021–E030 · Pilota e sessioni del primo giro

| ID | Task | Dipende da | Criterio di chiusura |
|---|---|---|---|
| E021 (attende il pilota) | Eseguire il pilota con una persona | E008, E009, E016, E018, E019 | Dopo l'eventuale autorizzazione all'invito esterno, una sessione osservata in locale mostra che accesso, istruzioni e raccolta sono utilizzabili. |
| E022 | Sistemare il protocollo dopo il pilota | E021 | Risolti i problemi di preparazione; se cambia il pacchetto, nuovo ID, campioni e smoke aggiornati prima del giro. |
| E023 | Confermare disponibilità e assegnare le prove | E019, E022 | Dopo l'autorizzazione agli eventuali inviti esterni, matrice anonima con partecipanti, profili browser persistenti, esperienza, modalità, lingue e rientri. Per le sessioni a distanza chiudere prima E007. |
| E024 | Osservare le partite libere | E023 | Almeno cinque prime sessioni documentate, compresi gli avvii in Storico, gli abbandoni e gli interventi del moderatore. |
| E025 | Osservare i tentativi mirati in Rapido | E023 | Almeno tre tentativi da Genesi, con percorso, punto di arresto o Trascendenza e interventi registrati. |
| E026 | Osservare i rientri in Storico | E023 | Due rientri nello stesso slot dopo 30–60 minuti, con spiegazione del giocatore e decisione successiva. |
| E027 | Raccogliere l'evidenza della prova in inglese | E024 | Scheda di almeno una prova in inglese con testi o istruzioni fraintesi e relativi contesti. |
| E028 (verificato in locale) | Eseguire la prova controllata oltre otto ore | E020, E022 | Resoconto confronta recupero effettivo, limite applicato e pausa sui punti decisivi con il risultato atteso. |
| E029 (slot e catture pronti) | Coprire le ere rimaste senza riscontri | E024, E025, E026 | Slot mirati e rapporti per le lacune, con precedenza a Bronzo, Medioevo, Contemporanea e Futuro; evidenze distinte dalle partite complete. |
| E030 | Consolidare blocchi ed export del giro | E024, E025, E026, E027, E028, E029 | Ogni blocco ha build, passaggi e ora simulata; allegati consentiti associati alla sessione e ogni cambio di build tracciato. |

Se si perdono progressi in E024–E026, sospendere subito il giro. Riprodurre e correggere il difetto prima di riprendere, archiviare la build corretta con nuovo ID, ripetere E008–E010 e registrare quali sessioni ricominciano. E041 raccoglie le eventuali correzioni residue.

### E031–E040 · Decisione dopo il primo giro e priorità

| ID | Task | Dipende da | Criterio di chiusura |
|---|---|---|---|
| E031 | Riepilogare tentativi e abbandoni | E030 | Conteggi per era, ritmo, tipo di prova, completamento e motivo di interruzione. |
| E032 | Valutare la comprensione dell'avanzamento | E030 | Ogni prima prova indica se il giocatore sa spiegare, senza suggerimenti, come raggiungere l'era seguente. |
| E033 | Valutare la leggibilità delle conseguenze | E030 | Le spiegazioni del giocatore sono confrontate con gli effetti osservati e con le informazioni offerte dal gioco. |
| E034 | Valutare ritmo e interesse | E030, E016 | Gli abbandoni per noia o confusione sono contati; attese e interruzioni sono confrontate per era e ritmo. |
| E035 | Valutare comprensione del rientro e del finale | E030 | Sono documentati il significato attribuito alla cronaca dell'assenza e le decisioni che i giocatori si aspettano di ritrovare alla Trascendenza. |
| E036 | Riprodurre i blocchi prioritari | E030 | Ogni perdita dati, blocco di progressione o ripresa e crisi illeggibile ha un caso riproducibile o il limite dell'evidenza annotato. |
| E037 | Verificare l'esito del primo giro | E031, E032, E033, E034, E035 | Registrare esito e denominatori per almeno cinque prime prove, maggioranza che spiega come avanzare e riconosce una conseguenza, meno della metà di abbandoni per noia o confusione. |
| E038 | Ordinare le correzioni di gameplay e persistenza | E036, E037 | Lista ordinata per impatto; per ogni voce evidenza, risultato atteso e prova da ripetere. |
| E039 (verificato) | Inventariare diritti di grafica, font e audio | E001 | Registro con provenienza e condizioni d'uso per gli asset della build, inclusa la copertina; voci mancanti identificate. |
| E040 | Risolvere l'esito del primo giro e fissare il perimetro | E038, E039 | Se E037 è sotto soglia, correggere il ciclo, aggiornare E003 ed E008–E010 e ripetere E021–E037 con nuovi esordienti. Dopo il superamento, fissare le correzioni residue e i due diorami campione. |

### E041–E050 · Correzioni di simulazione e interfaccia

| ID | Task | Dipende da | Criterio di chiusura |
|---|---|---|---|
| E041 | Correggere perdite o sovrascritture di progressi emerse | E040 | I casi riprodotti mantengono lo slot o permettono il recupero; esito registrato. |
| E042 | Correggere gli impedimenti alla ripresa emersi | E040 | Lo slot problematico riapre nel ritmo e nello stato attesi, con gli ordini ancora applicabili. |
| E043 | Correggere gli stalli di avanzamento emersi | E040 | Ogni caso riprodotto ha un percorso di riforme praticabile e verificato fino all'era successiva. |
| E044 | Rendere leggibile il requisito di riforma | E040 | Nei casi fraintesi, la vista indica requisito, valore impostato, valore effettivo e passo ancora necessario. |
| E045 | Rendere leggibili le crisi gravi | E040 | In ogni caso segnalato, schermata e cronaca rendono individuabili causa e contromisura possibile. |
| E046 | Ritoccare la cadenza dei dilemmi dove serve | E040 | Le ere problematiche rientrano nella fascia concordata o hanno una modifica motivata e misurata. |
| E047 | Migliorare la varietà delle scelte dove serve | E040 | Le aperture o le ere segnalate presentano alternative con conseguenze distinte, dimostrate su semi di riferimento. |
| E048 | Migliorare le attese e la cronaca nello Storico | E040 | I casi osservati mostrano cosa si aspetta e cosa è successo al rientro; pausa e ordini in coda restano coerenti. |
| E049 | Rifinire il finale dove serve | E035, E040 | I casi segnalati alla Trascendenza espongono l'esito e le scelte rilevanti nella cronaca. |
| E050 (replay locale) | Verificare il bilanciamento dopo le correzioni | E041, E042, E043, E044, E045, E046, E047, E048, E049 | Replay dei semi problematici e del campione nei due ritmi. Il profilo reattivo chiude tutti i semi; scostamenti di durata e copertura sono motivati. |

### E051–E060 · Diorama, suono e testi

| ID | Task | Dipende da | Criterio di chiusura |
|---|---|---|---|
| E051 (materiale pronto) | Preparare quattro stati del Neolitico | E040, E045 | Catture o slot per stabilità, crescita, degrado e crisi, nelle stesse condizioni di inquadratura. |
| E052 (materiale pronto) | Preparare quattro stati dell'Industriale | E040, E045 | Materiale equivalente per l'Industriale, utilizzabile nello stesso confronto. |
| E053 (prova cieca pronta, attende osservatori) | Provare i due diorami senza etichette | E051, E052 | Prima della prova indicare osservatori e soglia proposta di maggioranza per ciascuno stato e coppia. Annotare riconoscimento, segnale usato e fraintendimenti per i quattro stati e per coppie di ere adiacenti, con priorità a quelle confuse nel primo giro. |
| E054 | Definire gli interventi visivi della 1.0 | E053 | Lista limitata a transizioni d'era e stati poco leggibili, ordinata per impatto e chiusa prima del secondo giro. |
| E055 | Rifinire il riconoscimento delle ere | E054 | Ripetendo la prova di E053 senza etichette, le coppie interessate raggiungono la soglia; allegare catture comparabili. |
| E056 | Rifinire i segnali di cambiamento e crisi | E054 | I quattro stati raggiungono la soglia di E053 nella riprova e i segnali nei casi di crisi corrispondono al gioco. |
| E057 (audio verificato, attende ascoltatori) | Rifinire i segnali sonori informativi | E054 | Durante la riprova gli osservatori riconoscono dilemma, crisi e cambio d'era secondo la soglia di E053; volume e silenzioso persistono. |
| E058 (confronto bilingue pronto, attende lettore) | Rileggere i testi inglesi | E027, E050 | Persona fluente controlla tutti i dilemmi, i testi di Genesi, rientro e finale e i testi modificati in E044–E049; verificare in gioco le correzioni che possono cambiare il layout. |
| E059 (verificato sulla build locale) | Verificare grafica e indicazioni di compatibilità | E055, E056, E057, E058 | Nei due formati desktop, scene e pannelli sono leggibili in entrambe le lingue. All'ingresso diretto su mobile e Safari, prima della partita la build indica rispettivamente l'uso da computer e i browser verificati. |
| E060 (copertina locale sostituita, condizioni commerciali aperte) | Risolvere le voci aperte sui diritti | E039, E059 | Gli asset inclusi e la copertina hanno condizioni d'uso documentate o sono sostituiti con risorse verificate. |

### E061–E070 · Candidata e matrice dei salvataggi

| ID | Task | Dipende da | Criterio di chiusura |
|---|---|---|---|
| E061 (manifest locale pronto) | Registrare versioni supportate e casi di prova | E010, E030, E040 | Manifest di tutte le build ufficiali del primo giro, comprese le ripetizioni. Per i casi di E063–E066 senza export consentito, produrre file controllati dal pacchetto archiviato della versione corrispondente. |
| E062 (build tecnica archiviata) | Compilare e identificare la candidata del secondo giro | E050, E059, E060 | Lint, test, `sim:check` e build passano; ZIP e SHA-256 legati a sorgente e versione. |
| E063 (verificato sulla build locale) | Importare inizio e fine nei due ritmi | E061, E062 | Per ogni build supportata, quattro casi distribuiti fra inizio e fine di Rapido e Storico importano e raggiungono il prossimo traguardo previsto. |
| E064 (verificato sulla build locale) | Importare ordini in coda e dilemmi pendenti | E061, E062 | Per ogni build supportata, i campioni mantengono ordini, effetto ritardato e dilemma, senza doppia applicazione. |
| E065 (verificato sulla build locale) | Importare stati di guerra o esilio | E061, E062 | Per ogni build supportata, scenario e opzioni disponibili coincidono con i salvataggi di riferimento prima e dopo l'import. |
| E066 (verificato sulla build locale) | Verificare l'assenza al cambio versione | E061, E062 | Per ogni build supportata, cronaca coerente, avanzamento recuperato una volta sola e nessun esito irreversibile eseguito in assenza. |
| E067 (verificato sulla build locale) | Verificare import di file non accettabili | E062 | File corrotto e versione non supportata generano un errore leggibile; lo slot preesistente resta invariato. |
| E068 (verificato sulla build locale) | Verificare scritture concorrenti e guasti | E062 | La scheda precedente non sovrascrive la nuova; un errore di scrittura lascia recuperabile la sessione o l'export. |
| E069 (schema invariato verificato) | Verificare migrazione interrotta se cambia lo schema | E061, E062 | Caso di interruzione con recupero della copia precedente; se lo schema è invariato, confronto delle versioni annotato. |
| E070 (pacchetto tecnico pronto) | Abilitare l'uso della candidata nel secondo giro | E063, E064, E065, E066, E067, E068, E069 | Matrice superata, pacchetto avviato negli ambienti di prova del primo giro e pronto per la consegna con ID e campione di export. |

### E071–E080 · Secondo giro e decisione

| ID | Task | Dipende da | Criterio di chiusura |
|---|---|---|---|
| E071 | Confermare cinque o più partecipanti nuovi | E070 | Dopo l'autorizzazione agli eventuali inviti esterni, matrice con tentativi in entrambi i ritmi e persone che non hanno giocato al pilota o al primo giro. |
| E072 | Osservare i tentativi da Genesi al finale in Rapido | E071 | Tentativi e aiuti registrati, con esito rispetto ai tre completamenti da Genesi alla Trascendenza senza interventi. |
| E073 | Osservare i tentativi da Genesi al finale in Storico | E071 | Passaggi di sessione documentati ed esito rispetto ad almeno una campagna da Genesi alla Trascendenza. |
| E074 | Osservare i rientri in Storico | E071 | Registrare esito rispetto ad almeno due rientri in cui il giocatore spiega cosa è successo e quale azione può intraprendere. |
| E075 | Verificare comprensione di una crisi grave | E071 | In partita o su slot mirato, registrare se il giocatore indica causa e contromisura dal gioco, senza suggerimenti. |
| E076 | Verificare comprensione di un esito strutturale | E071 | In partita o su slot mirato, registrare se il giocatore individua come proseguire con lo Spirito. |
| E077 | Verificare interesse e significato delle scelte | E072, E073, E074 | Esito rispetto alla maggioranza che indica una scelta significativa e vuole continuare o rigiocare, con denominatore. |
| E078 | Correggere e ripetere le prove che mancano | E072, E073, E074, E075, E076, E077 | Qualsiasi soglia mancata o blocco grave ha correzione verificata con persone nuove; rifare la candidata e la matrice se la build cambia. |
| E079 | Consolidare gli export ufficiali del secondo giro | E078 | Manifest di tutte le build ufficiali, comprese le ripetizioni, e copertura dei casi di E063–E066. Produrre i file controllati mancanti dai rispettivi pacchetti archiviati. |
| E080 | Chiudere il secondo giro | E079 | Soglie del piano soddisfatte, zero blocchi gravi nuovi o ricorrenti, conteggi per criterio con prove mirate riconoscibili e ultima build identificata. |

### E081–E090 · Candidata finale e rilascio verificabile

| ID | Task | Dipende da | Criterio di chiusura |
|---|---|---|---|
| E081 (campagna locale confermata, licenza futura aperta) | Concordare accesso e licenza della campagna | Nessuno | Decisione di Giovanni registrata e guida di distribuzione aggiornata; i due playtest riservati procedono indipendentemente. |
| E082 (anteprima locale pronta) | Preparare scheda e indicazioni di compatibilità | E081 | Anteprima locale della scheda «Gioca a Epoche», link secondo la decisione e indicazioni visibili per mobile e Safari. |
| E083 (archivio tecnico pronto, attende candidata finale) | Archiviare la candidata finale | E080, E060 | Lint, test, `sim:check` e build passano; SHA-256, sorgente, versioni e archivio del pacchetto concordano. Eventuali asset aggiunti dopo E060 sono coperti dal registro dei diritti. |
| E084 (Chrome verificato in locale) | Verificare la candidata in Chrome | E083 | Build in sottocartella a 1366×768 e 1920×1080; verifiche di Genesi, Worker, due ritmi, tre slot, tastiera, lingue, audio, ripresa e Trascendenza documentate. |
| E085 (Firefox verificato in locale) | Verificare la candidata in Firefox | E083 | Stessi controlli di E084 su Firefox, con versione e eventuali difetti registrati. |
| E086 (matrice locale verificata, attende export del secondo giro) | Rieseguire la matrice dei salvataggi sul pacchetto finale | E079, E083 | E063–E069 rieseguiti con export dei due giri e della candidata. Tutti i casi supportati passano. |
| E087 (archivio e cambio locale verificati) | Verificare aggiornamento e cache | E082, E083 | In sottocartella, vecchia scheda e nuovo accesso caricano gli asset corretti; vincoli di cache documentati. |
| E088 (ripristino locale verificato) | Provare il ripristino immediato | E086, E087 | Salvare la partita e verificare il ripristino sulla stessa origine di prova. Lo slot torna accessibile, intatto e riapribile. |
| E089 (recupero locale verificato) | Provare il recupero per partite già in uso | E086, E088 | È disponibile una build compatibile o un pacchetto di recupero collaudato che legge ed esporta slot 1.0; documentata la compatibilità di schema. |
| E090 (materiale pronto, revisione rinviata) | Far rivedere a Opus progressione e salvataggi | E083, E084, E085, E086, E089 | Diff ed evidenze sottoposti a Claude Opus 5.5; rilievi bloccanti chiusi con nuova prova e verifica delle modifiche. |

### E091–E100 · Pubblicazione e riscontro pubblico

| ID | Task | Dipende da | Criterio di chiusura |
|---|---|---|---|
| E091 (scheda locale pronta, decisione aperta) | Raccogliere il pacchetto per la decisione di lancio | E081, E082, E084, E085, E086, E087, E089, E090 | Scheda di decisione con due giri, diritti, compatibilità, ripristino, revisione e zero difetti bloccanti. |
| E092 | Registrare l'autorizzazione alla pubblicazione | E091 | Autorizzazione esplicita per la candidata e la destinazione concordata, con regola di ripristino prevista da E088 ed E089. |
| E093 (pacchetti locali verificati) | Conservare il sito precedente e predisporre il cambio | E091 | File della campagna pronti e hash confrontato con E083. |
| E094 | Pubblicare campagna e scheda su BrowserGames | E092, E093 | Modifica applicata alle destinazioni autorizzate, con riferimenti al pacchetto pubblicato e alla modifica della scheda. |
| E095 | Verificare file e Worker sull'URL pubblico | E094 | Rapporti HTTPS e confronto degli asset con la candidata, con esito dell'avvio del Worker creando una partita. |
| E096 | Verificare home, ritmi, lingue e vecchia scheda | E094 | Accesso alla campagna dalla raccolta e selezione di ritmi e lingue verificati. |
| E097 | Verificare un salvataggio pubblico | E095, E096 | Esito del riavvio del browser sullo stesso slot, export/import e ripresa in un profilo di prova. Se l'avvio è già fallito, registrare l'impedimento e passare a E098. |
| E098 | Decidere conferma o recupero dopo la verifica immediata | E097 | Conferma con tutte le prove verdi. In caso di errore, E088 vale prima dell'uso pubblico. Se ci sono partite in uso o non è possibile escluderlo, seguire E089. Dopo il recupero, riaprire E083–E098 e ottenere autorizzazione per la nuova candidata; E099 ed E100 attendono l'esito positivo. |
| E099 | Aggiornare stato e riscontri della 1.0 | E098 | README, roadmap e distribuzione riportano gli URL e i risultati osservati, con ID e hash effettivamente serviti. |
| E100 | Chiudere la versione 1.0 browser | E099 | Resoconto finale con versione, prove, decisioni e problemi residui non bloccanti. La campagna è accessibile e la persistenza confermata su HTTPS. |

### Revisione dei 100 task

Claude Opus 5.5 ha approvato il piano al secondo giro, dopo la chiusura di 11 rilievi prioritari. La revisione ha verificato in particolare la ripetizione dei playtest dopo un problema, la compatibilità per ogni build dei tester, le prove visive e il ripristino. L'esito riguarda la pianificazione. Le prove e le autorizzazioni sono registrate durante l'esecuzione dei task.
