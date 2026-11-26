const phrases: Record<string, [string, string]> = {
  wetSeed: [
    "Le sementi sono marcite. Dopo la piena alta mancavano sia i granai rialzati delle case sia un tetto riparato.",
    "The seed rotted. After high water there were neither raised household stores nor a repaired roof.",
  ],
  proto: ["Prototipo", "Prototype"],
  sickExit: [
    "I raccoglitori erano malati e mancava una squadra per seminare.",
    "The gatherers were sick and there were too few hands to sow.",
  ],
  seedExit: [
    "Al disgelo il villaggio era senza sementi.",
    "The village reached thaw with no seed left.",
  ],
  noFerry: [
    "Nessuna barca poteva portare tutti insieme.",
    "No boat could carry the families together.",
  ],
  wetWarning: [
    "Le case lungo l’ansa hanno il tetto bagnato. Le sementi rimaste all’umido marciranno durante il gelo.",
    "The flood soaked the roofs on the bend. Seed left in the damp will rot at frost.",
  ],
  wetNow: [
    "Queste sementi sono umide. Senza un tetto riparato o un granaio privato, marciranno stanotte.",
    "This seed is damp. Without a repaired roof or a raised private store it will rot tonight.",
  ],
  ordersOne: ["Prima squadra", "First crew"],
  ordersTwo: ["Seconda squadra", "Second crew"],
  chooseJob: [
    "Assegna anche la seconda squadra per confermare.",
    "Assign the second crew to confirm.",
  ],
  jtogether: ["Lavora con la prima squadra", "Work with the first crew"],
  jgather: ["Raccogli provviste", "Gather provisions"],
  jguard: ["Sorveglia i ripari", "Guard the shelters"],
  jmend: ["Ripara una casa", "Repair a home"],
  jsalvage: ["Recupera una catasta", "Salvage a timber stack"],
  jtrade: ["Porta 2 cataste a Nara", "Take 2 stacks to Nara"],
  jshelterGuest: ["Accogli l’ospite", "Welcome the guest"],
  hjgather: [
    "La seconda squadra guadagna 1 razione.",
    "The second crew brings back 1 ration.",
  ],
  hjguard: [
    "Bruci 1 catasta nelle case per curare i malati. Al disgelo avrai due squadre.",
    "Burn 1 timber in the households to care for the sick. You will have both crews at thaw.",
  ],
  hjmend: [
    "Usi 1 catasta. Una famiglia ritroverà la sua casa asciutta.",
    "Use 1 stack. A household will have a dry home again.",
  ],
  hjsalvage: [
    "La squadra recupera 1 catasta a monte.",
    "The crew recovers 1 timber stack upstream.",
  ],
  hjtrade: [
    "Nara scambia 2 razioni con 2 cataste e vi aspetterà al disgelo.",
    "Nara gives 2 rations for 2 timber stacks and will wait at thaw.",
  ],
  hjshelterGuest: [
    "L’ospite mangia 1 razione prima del villaggio. Se mangia, resta per seminare.",
    "The guest eats 1 ration before the village. If fed, they stay to sow.",
  ],
  hjtogether: [
    "Il lavoro impegna entrambe le squadre disponibili.",
    "This job needs both available crews.",
  ],
  houseFixed: [
    "La casa sul guado ha un tetto asciutto.",
    "The home by the ford has a dry roof.",
  ],
  salvage: [
    "La seconda squadra recupera una catasta.",
    "The second crew recovers one timber stack.",
  ],
  extraRation: [
    "La seconda squadra consegna una razione.",
    "The second crew brings one ration.",
  ],
  crewRested: [
    "Le case curano i raccoglitori. Le due squadre sono pronte per la semina.",
    "The households care for the gatherers. Both crews are ready to sow.",
  ],
  soaked: [
    "Senza deposito, l’umidità della piena alta rovina fino a due razioni.",
    "With no store, damp from the high flood spoils up to two rations.",
  ],
  homes: ["Una casa riparata", "A home repaired"],
  openHome: [
    "La casa sul guado attende ancora un tetto.",
    "The ford house still needs a roof.",
  ],
  guestJourney: [
    "La famiglia accolta al focolare ha condiviso con voi l’inverno.",
    "The family welcomed at the hearth shared your winter.",
  ],
  fieldGuest: [
    "La famiglia accolta al focolare lavora nei primi solchi.",
    "The family you sheltered tends the first furrows.",
  ],
  fieldOwn: [
    "I primi solchi sono il lavoro delle famiglie del villaggio.",
    "The village households tend the first furrows.",
  ],
  pastKept: [
    "All’approdo Nara ricorda il legname consegnato.",
    "At the landing Nara remembers the timber you delivered.",
  ],
  pastBroken: [
    "Il palo all’approdo è vuoto: Nara ricorda la promessa infranta.",
    "The mooring is empty: Nara remembers the broken promise.",
  ],
  pastNeutral: [
    "Nara ha trovato il legname a monte. La sua barca vive su un’altra riva.",
    "Nara found timber upstream. Her boat belongs to another shore.",
  ],
  familyLeft: [
    "La famiglia ospite ha cercato rifugio sull’altra riva.",
    "The guest family sought shelter across the river.",
  ],
  timberPath: ["Il primo viaggio della legna", "The timber’s first journey"],
  pendingCrew: [
    "Scegli la destinazione della seconda squadra sulla mappa.",
    "Choose the second crew’s destination on the map.",
  ],
  gatherFirst: [
    "La seconda squadra raccoglie 2 razioni. In caso di piena alta, la legna resta incustodita.",
    "The second crew gathers 2 rations. In a high flood the stacks are unguarded.",
  ],
  crewTwo: [
    "Dove mandi la seconda squadra?",
    "Where will the second crew work?",
  ],
  pickFruit: ["Raccogli due razioni", "Gather two rations"],
  guardBank: ["Presidia il riparo", "Guard the shelter"],
  guardHint: [
    "La guardia salva una catasta in più con la piena alta e raccoglie 1 razione.",
    "The guards save one extra stack in a high flood and gather 1 ration.",
  ],
  watchHigh: [
    "I sorveglianti recuperano una catasta dalla corrente. Ne restano due, insieme a una razione raccolta sulla riva.",
    "The guards recover a stack from the current. Two survive, along with one ration gathered on the bank.",
  ],
  watchLow: [
    "La riva tiene. La squadra di guardia trova il tempo di raccogliere una razione.",
    "The bank holds. The guards have time to gather one ration.",
  ],
  foragers: ["Raccoglitori", "Gatherers"],
  guards: ["Guardia", "Guards"],
  second: ["Seconda squadra", "Second crew"],
  bed: ["Letti di semina", "Seed beds"],
  reserved: ["Due razioni promesse", "Two rations reserved"],
  gone: ["Approdo vuoto", "Empty landing"],
  guestHere: ["Famiglia ospite", "Guest family"],
  homeStore: ["Scorte di casa", "Household stores"],
  publicStore: ["Scorte comuni", "Common stores"],
  title: ["Il guado", "The ford"],
  valley: ["Valle di Arenua", "Arenua valley"],
  back: ["Partite", "Games"],
  season: ["Stagione", "Season"],
  wood: ["Legna", "Timber"],
  food: ["Razioni", "Rations"],
  grain: ["Sementi", "Seed sacks"],
  people: ["Squadre", "Crews"],
  plan: ["Ordini della stagione", "Season orders"],
  pick: [
    "Scegli un luogo segnato sulla mappa oppure un incarico qui sotto.",
    "Select a marked place on the map or a job below.",
  ],
  go: ["Fai passare la stagione", "Advance the season"],
  undo: ["Annulla ordine", "Clear order"],
  journal: ["Diario del guado", "Ford journal"],
  empty: [
    "Il diario comincia con il primo ordine.",
    "Your first order starts the journal.",
  ],
  restart: ["Riprova questo mondo", "Replay this world"],
  new: ["Esplora un altro mondo", "Explore another world"],
  resume: ["Riprendi", "Resume"],
  archive: ["Partite della valle", "Valley games"],
  stored: ["Salvato su questo dispositivo", "Saved on this device"],
  saveError: [
    "Salvataggio locale non disponibile. Esporta il diario per conservare la partita.",
    "Local save unavailable. Export the journal to keep your game.",
  ],
  error: [
    "Questo diario non si può aprire. Puoi sceglierne un altro.",
    "This journal cannot be opened. Choose another.",
  ],
  export: ["Esporta partita", "Export game"],
  import: ["Importa partita", "Import game"],
  review: ["Ultima stagione", "Last season"],
  next: ["Prepara la prossima stagione", "Plan the next season"],
  close: ["Chiudi", "Close"],
  speed: ["Velocità della scena", "Scene speed"],
  weather: ["Segnale a monte", "Upstream signal"],
  clear: [
    "Acqua limpida · 1 possibilità su 4 di piena alta.",
    "Clear water · 1 in 4 chance of high flood.",
  ],
  cloudy: [
    "Acqua torbida · 3 possibilità su 4 di piena alta.",
    "Cloudy water · 3 in 4 chance of high flood.",
  ],
  high: ["Piena alta", "High flood"],
  low: ["Piena ordinaria", "Ordinary flood"],
  terrace: ["Terrazza", "Terrace"],
  camp: ["Focolare", "Hearth"],
  bank: ["Riparo basso", "Low shelter"],
  boat: ["Approdo", "Landing"],
  deliver: [
    "Onora il patto: consegna 2 cataste e ricevi 2 razioni.",
    "Keep the pact: give 2 timber and receive 2 rations.",
  ],
  cannot: [
    "Questo progetto lascia poca legna per il patto. Confermandolo perderai il passaggio sulla barca.",
    "This plan leaves too little timber for the pact. Confirming it costs your ferry passage.",
  ],
  refuse: [
    "Trattieni la legna: il vicino ritirerà il passaggio.",
    "Keep the timber: your neighbour will withdraw passage.",
  ],
  upkeep: [
    "Il villaggio mangia 1 razione a fine stagione. Dopo due stagioni consecutive a digiuno, le famiglie si separano.",
    "The village eats 1 ration at season end. After two consecutive hungry seasons, the families disperse.",
  ],
  hungry: ["Una stagione senza mangiare", "One hungry season"],
  crew: ["Due squadre disponibili", "Two crews available"],
  illCrew: ["Una squadra assiste i malati", "One crew tends the sick"],
  helpCrew: [
    "La famiglia ospitata aiuta nella semina",
    "The guest family can help sow",
  ],
  terms: [
    "La barca accetta la tua gente al disgelo",
    "The boat will take your people at thaw",
  ],
  preview: ["Prima di confermare", "Before you commit"],
  locked: [
    "Scegli l’incarico prima di confermare.",
    "Choose a job before confirming.",
  ],
  diaryLink: ["Apri diario", "Open journal"],
  first: ["Prima stagione", "First season"],
  language: ["Lingua", "Language"],
  highWaterCosts: [
    "Con piena alta. Il cibo è prima della cena.",
    "In high water. Food shown before supper.",
  ],
  floodChance: ["Piena alta", "High flood"],
  guardCost: [
    "1 razione · con piena alta salvi 2 cataste su 3",
    "1 ration · keep 2 of 3 stacks in high water",
  ],
  gatherCost: [
    "2 razioni · con piena alta salvi 1 catasta su 3",
    "2 rations · keep 1 of 3 stacks in high water",
  ],
  meal: [
    "Il villaggio consuma 1 razione a stagione.",
    "The village eats 1 ration each season.",
  ],
  valleyGoal: [
    "Porta le famiglie alla primavera.",
    "Keep everyone together until spring.",
  ],
  floodChoice: ["Dove porti la legna?", "Where will you take the timber?"],
  safeWood: ["Legna salva · niente raccolta", "Safe timber · no foraging"],
  nearWood: [
    "Legna a rischio · una squadra libera",
    "Timber at risk · one crew free",
  ],
  startFlood: ["Affronta la piena", "Face the flood"],
  changeStock: ["Scorte prima e dopo", "Stores before and after"],
  s0: ["L’acqua sale", "The water rises"],
  s1: ["La barca di Nara", "Nara’s boat"],
  s2: ["Di chi è il deposito?", "Whose storehouse?"],
  s3: ["La prima gelata", "First frost"],
  s4: ["Il disgelo", "The thaw"],
  q0: [
    "Il fiume sta salendo. Hai tre cataste sulla riva e ti serviranno per scaldarti o per fare uno scambio.",
    "The river is rising. Three timber stacks lie on the bank. You will need them for warmth or trade.",
  ],
  q1: [
    "Nara aspetta all’approdo con due razioni. Cerca due cataste per riparare la sua barca.",
    "Nara waits at the landing with two rations. She needs two stacks to repair her boat.",
  ],
  q2: [
    "Una famiglia senza riparo chiede posto per l’inverno. Chi potrà prendere cibo dal deposito?",
    "A family without shelter asks to stay for winter. Who may take food from the store?",
  ],
  q3: [
    "Il gelo arriva stanotte. Una squadra può proteggere il fuoco oppure uscire per cercare cibo.",
    "Frost arrives tonight. A crew can tend the fire or go out for food.",
  ],
  q4: [
    "Le rive si riaprono. Decidi dove vivranno le famiglie dopo questo inverno.",
    "The banks are open again. Decide where the families will live after winter.",
  ],
  haul: ["Sulla terrazza", "High terrace"],
  shelter: ["Nel riparo vicino", "Nearby shelter"],
  pledge: ["Prometti legname a Nara", "Promise timber to Nara"],
  forage: ["Raccogli nell’entroterra", "Forage inland"],
  common: ["Costruisci il deposito comune", "Build a common store"],
  private: ["Affida le scorte alle case", "Give each household its share"],
  glean: ["Cerca cibo prima del gelo", "Gather before the frost"],
  warm: ["Alimenta il focolare", "Keep the fire lit"],
  fell: ["Raccogli fra i rami gelati", "Forage in the frozen brush"],
  eat: ["Cuoci le sementi", "Cook the seed grain"],
  sow: ["Semina sulla terrazza", "Sow on the terrace"],
  cross: ["Parti con Nara", "Leave with Nara"],
  stay: ["Accompagna le famiglie in partenza", "See the families off"],
  dhaul: [
    "Entrambe le squadre portano tutte e tre le cataste all’asciutto. Nessuno raccoglie cibo.",
    "Both crews move all three stacks to dry ground. Nobody gathers food.",
  ],
  dshelter: [
    "Una squadra porta la legna sull’ansa. Restano esposte 2 cataste se arriva la piena alta.",
    "One crew moves the timber to the bend. Two stacks remain exposed in a high flood.",
  ],
  dpledge: [
    "Prenoti le sue 2 razioni. La prossima stagione potrai consegnare 2 cataste e ottenere un passaggio al disgelo.",
    "Reserve her 2 rations. Next season deliver 2 stacks to earn a passage at thaw.",
  ],
  dforage: [
    "La prima squadra riporta 1 razione. Nara cerca legname a monte e riparte.",
    "The first crew brings home 1 ration. Nara looks upstream for timber and leaves.",
  ],
  dcommon: [
    "Usi 1 catasta. Al gelo potrai ospitare una famiglia. Se la sfami aiuterà a seminare. Con piena alta i semi qui richiedono un tetto riparato.",
    "Spend 1 timber. At frost you can welcome a family. If fed, they will help sow. After a high flood the seed here needs a repaired roof.",
  ],
  dprivate: [
    "Le case conservano le sementi in granai rialzati sulla terrazza. L’ospite partirà. Per seminare ti serviranno entrambe le squadre.",
    "The households keep the seed dry in raised stores on the terrace. The guest leaves. Sowing will require both crews.",
  ],
  dglean: [
    "Guadagni 1 razione. Senza deposito, dopo una piena alta il gelo rovina fino a 2 razioni. L’ospite cercherà una casa sull’altra riva.",
    "Gain 1 ration. With no store after high water, frost spoils up to 2 rations. The guest will seek a home across the river.",
  ],
  dwarm: [
    "Bruci 1 catasta. Entrambe le squadre resteranno in salute per la semina.",
    "Burn 1 stack. Both crews will be healthy for sowing.",
  ],
  dfell: [
    "Porti a casa 1 razione e conservi la legna. Il freddo ferisce i raccoglitori: per seminare servirà l’ospite.",
    "Bring home 1 ration and keep the timber. The cold hurts the gatherers: you will need the guest to sow.",
  ],
  deat: [
    "Il sacco diventa 2 razioni. Consumi una catasta se ne hai. Senza semi, la barca di Nara è la via per restare insieme.",
    "The sack yields 2 rations. Use a stack if you have one. Without seed, Nara’s boat is the way to stay together.",
  ],
  dsow: [
    "Usi le ultime sementi. Le famiglie resteranno in valle e raccoglieranno insieme.",
    "Use the last seed. The families stay in the valley for their first harvest.",
  ],
  dcross: [
    "Nara mantiene la promessa. Lasciate i ripari ma attraversate il fiume insieme.",
    "Nara keeps her promise. You leave the shelters but cross the river together.",
  ],
  dstay: [
    "Mancano le condizioni per seminare e un passaggio per tutti. Ogni famiglia cercherà un riparo diverso.",
    "You lack what you need to sow and a passage for everyone. Each household must seek shelter separately.",
  ],
  dry: [
    "Le tre cataste sono asciutte sulla terrazza.",
    "All three stacks are dry on the terrace.",
  ],
  washed: [
    "L’acqua ha strappato due cataste dal riparo basso. I raccoglitori hanno portato due razioni.",
    "The flood swept two stacks from the low shelter. The gatherers brought back two rations.",
  ],
  saved: [
    "Il riparo basso ha tenuto. Tornano anche i raccoglitori con due razioni.",
    "The low shelter held. The gatherers also return with two rations.",
  ],
  promise: [
    "Nara lega la barca al palo e mette da parte due razioni per voi.",
    "Nara moors her boat and sets aside two rations for you.",
  ],
  upriver: [
    "La prima squadra torna con le provviste. Nara risale il fiume.",
    "The first crew returns with provisions. Nara heads upstream.",
  ],
  delivered: [
    "Nara riceve il legname e lascia due razioni. Vi riserva la barca al disgelo.",
    "Nara takes the timber and leaves two rations. She saves you a place on her boat.",
  ],
  broken: [
    "La legna promessa resta qui. Nara ritira le razioni e il passaggio.",
    "The promised timber stays here. Nara withdraws the food and the passage.",
  ],
  ecommon: [
    "La porta del deposito è aperta anche alla famiglia ospite.",
    "The storehouse door is open to the guest family.",
  ],
  eprivate: [
    "Ogni casa chiude le proprie scorte.",
    "Each household keeps its own stores.",
  ],
  eglean: [
    "I raccoglitori trovano una razione. Nessun deposito accoglierà l’ospite.",
    "The gatherers find one ration. There is no store for the guest.",
  ],
  warmed: [
    "Il focolare resta acceso. Le squadre tornano al completo.",
    "The fire stays lit. The crews return in full.",
  ],
  ill: [
    "La ricerca rende una razione. Una squadra accudisce i malati al ritorno.",
    "The search yields one ration. A crew tends the sick on their return.",
  ],
  cooked: [
    "Le sementi sfamano il paese. I campi resteranno vuoti.",
    "The seed feeds the village. The fields will stay empty.",
  ],
  guest: [
    "L’ospite mangia dal deposito e resta ad aiutare al disgelo.",
    "The guest eats from the common store and stays to help at thaw.",
  ],
  left: [
    "L’ospite parte verso l’altra riva.",
    "The guest leaves for the opposite bank.",
  ],
  hunger: [
    "Questa stagione il focolare resta senza cibo.",
    "This season the hearth runs out of food.",
  ],
  sown: [
    "Sulla terrazza compaiono i primi solchi. Il villaggio resta qui.",
    "The first furrows appear on the terrace. The village stays.",
  ],
  ferry: [
    "Nara vi riconosce. La barca trasporta le famiglie sull’altra riva.",
    "Nara recognises you. Her boat takes the families across.",
  ],
  scatter: [
    "I focolari si spengono. Le famiglie cercano riparo separatamente.",
    "The hearths go dark. The families seek shelter apart.",
  ],
  harvest: ["Il primo raccolto", "The first harvest"],
  migration: ["Una nuova riva", "A new shore"],
  dispersal: ["I fuochi si dividono", "The hearths divide"],
  world: ["Mondo", "World"],
  result: ["Esito della stagione", "Season outcome"],
  inspect: [
    "Qui non ci sono incarichi disponibili in questa stagione.",
    "There are no jobs here this season.",
  ],
  log: ["Legna al riparo", "Sheltered timber"],
  rest: ["Ripari abitati", "Occupied shelters"],
  outcome: ["Destino del villaggio", "Village outcome"],
  other: ["Altro mondo", "Another world"],
};
export type Lang = "it" | "en";
export const label = (lang: Lang, key: string) =>
  phrases[key]?.[lang === "it" ? 0 : 1] ?? key;
