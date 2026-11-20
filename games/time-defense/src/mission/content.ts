import { bossThresholds, bossTailWarning } from "../enemies/notes";
import forest from "../../docs/livelli/dino-01.json";
import river from "../../docs/livelli/dino-02.json";
import swamp from "../../docs/livelli/dino-03.json";
import plateau from "../../docs/livelli/dino-04.json";
import rift from "../../docs/livelli/dino-05.json";
import towers from "../../docs/dati-torri.json";
import enemies from "../../docs/dati-nemici.json";
import type { WaveSession } from "../waves/session";

export type MissionId =
  "dino-01" | "dino-02" | "dino-03" | "dino-04" | "dino-05";
export const missionIds: readonly MissionId[] = [
  "dino-01",
  "dino-02",
  "dino-03",
  "dino-04",
  "dino-05",
];
export const introduction = [
  "L’Atlante di Lia si è spezzato, aprendo fratture nel tempo. Lia e Tic sono finiti tra i dinosauri. Per tornare a casa devono stabilizzare i frammenti.",
  "Le fratture attirano creature disorientate. Le difese le liberano dall’energia fuori fase. Proteggi il portale mentre Tic ripara il frammento alla sua base.",
] as const;
export const epilogue =
  "L’Atlante conserva le scoperte della valle. Il viaggio continua verso altre epoche, ma questa avventura è conclusa: tutti i cinque livelli restano rigiocabili.";
export interface MissionStory {
  readonly title: string;
  readonly victory: string;
  readonly defeat: string;
  readonly arrivalSpeaker: "Lia" | "Tic";
  readonly arrival: string;
  readonly endingSpeaker: "Lia" | "Tic";
  readonly ending: string;
  readonly unlock: string;
  readonly next: MissionId | null;
  readonly card: {
    readonly id: string;
    readonly title: string;
    readonly question: string;
    readonly real: string;
    readonly game: string;
    readonly periods?: readonly string[];
    readonly present?: string;
    readonly sources?: readonly {
      readonly title: string;
      readonly url: string;
    }[];
  };
}
export const stories: Readonly<Record<MissionId, MissionStory>> = {
  "dino-01": {
    title: "Foresta delle Felci",
    victory: "Foresta completata",
    defeat:
      "Prova Resina e Spore: rallentare i Corridori lascia più tempo ai marchi.",
    arrivalSpeaker: "Lia",
    arrival:
      "Prima guardiamo il sentiero. Se capiamo dove passeranno, possiamo scegliere dove costruire.",
    endingSpeaker: "Tic",
    ending: "Il primo ancoraggio è stabile. La prossima traccia segue l'acqua.",
    unlock:
      "Sbloccati la Pianura fluviale, Nido e Vedetta. Puoi usare le nuove difese anche rigiocando la Foresta.",
    next: "dino-02",
    card: {
      id: "E1",
      title: "Un ambiente è un insieme",
      question: "Che cosa vedi oltre alle creature?",
      real: "Un ecosistema comprende gli esseri viventi e gli elementi non viventi con cui interagiscono, come acqua, aria e suolo.",
      game: "Guarda piante, rocce e sentiero prima di costruire. Le piazzole e le torri viventi sono scelte della nostra avventura.",
    },
  },
  "dino-02": {
    title: "Pianura fluviale",
    victory: "Fiume completato",
    defeat:
      "Controlla il tratto finale comune in G. Il Guado usa il ramo corto; Spore aiuta contro i Corazzati.",
    arrivalSpeaker: "Tic",
    arrival:
      "Ci sono più passaggi. Controlla quali tratti portano allo stesso portale.",
    endingSpeaker: "Lia",
    ending:
      "Abbiamo difeso le sponde. Ora dobbiamo capire che cosa nasconde la palude.",
    unlock:
      "Sbloccate la Palude e le specializzazioni di Resina e Spore, disponibili anche nei replay.",
    next: "dino-03",
    card: {
      id: "E2",
      title: "Ecosistemi collegati",
      question: "Dove finisce la sponda e dove comincia l'ambiente vicino?",
      real: "Foreste, fiumi e zone umide sono esempi di ecosistemi. I loro confini non sono sempre netti. Gli organismi interagiscono anche con acqua, aria e suolo.",
      game: "I ponti e gli attraversamenti creano percorsi diversi. La scorciatoia del Guado è una regola del gioco, non una scoperta sul comportamento di una specie reale. Il ponte è fantasia delle fratture, non un'opera umana contemporanea ai dinosauri.",
    },
  },
  "dino-03": {
    title: "Palude delle Felci",
    victory: "Palude completata",
    defeat:
      "Distribuisci la difesa fra Nord e Sud. Controlla il ricongiungimento in E e pianifica i rami senza consumare tutto su una corsia.",
    arrivalSpeaker: "Lia",
    arrival:
      "Fermiamoci a osservare. Il percorso più corto lascia meno tempo alle nostre difese.",
    endingSpeaker: "Tic",
    ending:
      "La traccia sale tra le rocce. Due sentieri raggiungono la stessa frattura: dovremo difenderli entrambi.",
    unlock:
      "Sbloccati Altopiano, Roccia e rami del Nido, disponibili anche nei replay.",
    next: "dino-04",
    card: {
      id: "E3",
      title: "Non un unico momento",
      question: "I dinosauri sono vissuti tutti nello stesso periodo?",
      real: "Il Mesozoico comprende Triassico, Giurassico e Cretaceo. Non tutti i dinosauri vissero nello stesso momento. I dinosauri non aviani, cioè quelli diversi dagli uccelli, precedono di milioni di anni gli esseri umani moderni.",
      game: "Le fratture possono mescolare tempi diversi. Lia viene dal presente: la sua presenza qui non racconta una convivenza storica tra persone e dinosauri.",
      periods: ["Triassico", "Giurassico", "Cretaceo"],
      present: "Oggi: gli uccelli sono dinosauri.",
      sources: [
        {
          title: "Natural History Museum, When did dinosaurs live?",
          url: "https://www.nhm.ac.uk/discover/when-did-dinosaurs-live.html",
        },
        {
          title: "Australian Museum, What is a dinosaur?",
          url: "https://australian.museum/learn/dinosaurs/fact-sheets/what-is-a-dinosaur/",
        },
      ],
    },
  },
  "dino-04": {
    title: "Altopiano roccioso",
    victory: "Altopiano completato",
    defeat:
      "I due fronti si uniscono al portale. Confronta E/F con le piazzole di ogni ingresso; Spore aiuta sui Corazzati. Controlla il canto e i fondi prima del prossimo acquisto.",
    arrivalSpeaker: "Tic",
    arrival:
      "Due ingressi, un'uscita. Una difesa può aiutare l'altra, se scegliamo bene le posizioni.",
    endingSpeaker: "Lia",
    ending: "Non sta cercando lo scontro. È la frattura che la trattiene.",
    unlock:
      "Sbloccata la Valle della Frattura, ultima tappa della saga. Tutte le difese restano disponibili nei replay.",
    next: "dino-05",
    card: {
      id: "E4",
      title: "Leggere una corazza",
      question: "La corazza era un'armatura costruita?",
      real: "Gli anchilosauri avevano elementi ossei nella corazza; alcuni possedevano anche una mazza sulla coda. Le funzioni precise di queste strutture sono ancora oggetto di studio.",
      game: "Protezione percentuale, penetrazione e torri di pietra sono regole fantastiche. Non descrivono una corazza reale, né una sua debolezza alle spore. I ponti sono fantasia delle fratture, non costruzioni umane contemporanee ai dinosauri.",
      sources: [
        {
          title:
            "Natural History Museum, Ankylosaurs: The dinosaurs with built-in armour",
          url: "https://www.nhm.ac.uk/discover/ankylosaurs-the-dinosaurs-with-built-in-armour.html",
        },
      ],
    },
  },
  "dino-05": {
    title: "Valle della Frattura",
    victory: "Saga completata",
    defeat:
      "Copri più tratti del percorso e distribuisci le difese. Il Custode deve essere liberato prima del portale; usa Pausa per leggere ruggito e coda.",
    arrivalSpeaker: "Tic",
    arrival:
      "L'ultimo frammento è al centro della valle. La frattura trattiene il Custode: liberiamolo difendendo il portale.",
    endingSpeaker: "Lia",
    ending:
      "Il Custode è libero. Il frammento è stabile e le creature possono ritrovare il proprio ambiente. Ora l'Atlante indica una nuova epoca.",
    unlock:
      "Prima saga completata. Puoi tornare alla mappa e rigiocare tutti e cinque i livelli. La prossima saga non è ancora disponibile.",
    next: null,
    card: {
      id: "E5",
      title: "Ali diverse, storie diverse",
      question: "Gli pterosauri erano dinosauri?",
      real: "Gli pterosauri erano rettili volanti distinti dai dinosauri e non sono gli antenati degli uccelli. Gli uccelli attuali sono dinosauri.",
      game: "Gli alleati del Nido sono pterosauri fantastici. Il Custode e le fratture sono invenzioni: la sua liberazione non racconta l'estinzione dei dinosauri non aviani.",
      sources: [
        {
          title:
            "Natural History Museum, Pterosaurs: The truth about these ‘flying dinosaurs’",
          url: "https://www.nhm.ac.uk/discover/the-truth-about-pterosaurs.html",
        },
        {
          title: "Australian Museum, What is a dinosaur?",
          url: "https://australian.museum/learn/dinosaurs/fact-sheets/what-is-a-dinosaur/",
        },
      ],
    },
  },
};
function tutorial(
  entries: readonly { id: string; text: string }[],
  id: string,
): string {
  const entry = entries.find((entry) => entry.id === id);
  if (!entry) throw new Error("Missing tutorial: " + id);
  return entry.text;
}
const fast = enemies.enemies.find((enemy) => enemy.id === "corridore")!,
  armor = enemies.enemies.find((enemy) => enemy.id === "corazzato")!,
  water = enemies.enemies.find((enemy) => enemy.id === "guado")!,
  pack = enemies.enemies.find((enemy) => enemy.id === "branco")!;
const forestTips = [
  tutorial(forest.tutorial, "forest-build") +
    " Prova Resina in A e Spore in B.",
  tutorial(forest.tutorial, "forest-start"),
  tutorial(forest.tutorial, "forest-pause"),
  tutorial(forest.tutorial, "forest-upgrade"),
  `Corridori in arrivo: Carica ${fast.charge}, velocità ${fast.speed}, perdita al portale ${fast.stabilityLoss}. Resina li rallenta e lascia più tempo alle Spore.`,
];
export const riverWarnings = {
  armor: `Corazzato in arrivo: Carica ${armor.charge}, Protezione fisica ${armor.physicalProtection}%, velocità ${armor.speed}, fuga ${armor.stabilityLoss}. Le Spore ignorano quella Protezione; anche il danno fisico funziona.`,
  water: `Guado in arrivo: Carica ${water.charge}, velocità ${water.speed} a terra e in acqua, fuga ${water.stabilityLoss}. Segue la scorciatoia X-Y; le torri colpiscono anche in acqua se in gittata.`,
};
const firstPack = swamp.waves[1]!.groups.find(
    (group) => group.enemy === "branco",
  )!.count,
  largerPack = swamp.waves[4]!.groups.find(
    (group) => group.enemy === "branco",
  )!.count;
export const swampWarnings = {
  first: `Branco in arrivo: ${firstPack} individui, ciascuno con Carica ${pack.charge}, velocità ${pack.speed} e fuga ${pack.stabilityLoss}. Bersagli e ricompense sono individuali.`,
  larger: `Ora il Branco conta ${largerPack} individui per gruppo. Nube copre un’area; Parassita al massimo due bersagli distinti. Conta il tempo di esposizione.`,
  land: `Qui Guado segue Sud sul terreno: nessun ramo acquatico. Velocità base ${water.speed}, fuga ${water.stabilityLoss}, come al Fiume.`,
};
const support = enemies.enemies.find((enemy) => enemy.id === "richiamo")!,
  rock = towers.nodes.find((node) => node.id === "roccia-base")!,
  flock = towers.nodes.find((node) => node.id === "nido-stormo")!;
export const plateauWarnings = {
  stone: `Corazzato: Carica ${armor.charge}, Protezione fisica ${armor.physicalProtection}%. Roccia penetra ${rock.penetration} punti; Spore ignora quella Protezione. Confronta il raggio corto prima di costruire.`,
  support: `Primo Richiamo su Nord: Carica ${support.charge}, fuga ${support.stabilityLoss}. Preavviso ${support.windup} s, poi +${Math.round((support.speedMultiplier! - 1) * 100)}% velocità entro ${support.radius} per ${support.activeDuration} s. Picchiata preferisce i Supporti. Dettagli spiega il canto.`,
  mix: `Stormo: fino a ${flock.targets} bersagli distinti. Sisma: danno d’area senza rallentamento. Immobilizzare Richiamo non lo silenzia. Nessun acquisto obbligatorio.`,
};
export function missionGuide(
  id: MissionId,
  session: WaveSession,
): { text: string; mandatory: boolean } {
  if (session.result) return { text: "", mandatory: false };
  const pre = session.phase === "preparation",
    interval = session.phase === "intermission";
  if (id === "dino-01") {
    const fastWarning = interval && session.wave === 2,
      index = fastWarning
        ? 4
        : pre
          ? session.economy.towers.length >= 2
            ? 1
            : 0
          : interval
            ? 3
            : 2;
    return {
      text: fastWarning
        ? `Corridori: Carica ${fast.charge}, velocità ${fast.speed}, fuga ${fast.stabilityLoss}. Resina li rallenta.`
        : forestTips[index]!,
      mandatory: fastWarning,
    };
  }
  if (id === "dino-05") {
    const bossWave =
      session.level.bossRequirement?.wave ??
      session.level.waves.findIndex((wave) =>
        wave.groups.some((group) => group.enemy === "custode"),
      ) + 1;
    if (pre)
      return {
        text: `Custode all’ondata ${bossWave}: se raggiunge il portale perdi subito, qualunque sia la Stabilità.`,
        mandatory: true,
      };
    if (interval && session.wave === bossWave - 2)
      return { text: bossTailWarning, mandatory: true };
    if (interval && session.wave === bossWave - 1)
      return {
        text: `Custode: fasi a ${bossThresholds} Carica, senza cure. Se raggiunge il portale perdi subito.`,
        mandatory: true,
      };
    if (session.enemies.boss.view()?.status === "neutralized")
      return { text: tutorial(rift.tutorial, "rift-release"), mandatory: true };
    return {
      text: interval
        ? "Controlla i raggi sui diversi tratti prima di avviare. Guado qui segue il terreno, senza scorciatoie."
        : `Il Custode arriva all’ondata ${bossWave}. Puoi mettere in pausa e leggere Dettagli.`,
      mandatory: false,
    };
  }
  if (id === "dino-04") {
    if (interval && session.wave === 1)
      return {
        text: `Corazzato: Protezione ${armor.physicalProtection}%. Roccia penetra ${rock.penetration} punti; Spore ignora la Protezione.`,
        mandatory: true,
      };
    if (interval && session.wave === 3)
      return {
        text: `Richiamo: +${Math.round((support.speedMultiplier! - 1) * 100)}% velocità alle creature vicine. Immobilizzarlo non lo silenzia.`,
        mandatory: true,
      };
    if (interval && session.wave === 4)
      return {
        text: `Stormo: ${flock.targets} bersagli. Sisma: area. Richiamo velocizza le creature vicine; immobilizzarlo non lo silenzia.`,
        mandatory: true,
      };
    return {
      text: pre
        ? tutorial(plateau.tutorial, "plateau-fronts")
        : interval
          ? "I1 e I2 sono ingressi, I è una piazzola. Esamina entrambi i fronti e il finale comune prima di investire."
          : "Il canto agisce solo nel suo raggio. Puoi mettere in pausa, consultare Dettagli e confrontare le difese.",
      mandatory: false,
    };
  }
  if (id === "dino-03") {
    if (interval && session.wave === 1)
      return {
        text: `Branco: ${firstPack} individui, ciascuno con Carica ${pack.charge} e fuga ${pack.stabilityLoss}. Bersagli separati.`,
        mandatory: true,
      };
    if (interval && session.wave === 4)
      return {
        text: `Branco: ${largerPack} per gruppo. Nube copre un’area; Parassita al massimo due bersagli.`,
        mandatory: true,
      };
    if (interval && session.wave === 5)
      return {
        text: `Guado segue Sud sul terreno: nessuna scorciatoia. Velocità ${water.speed}, fuga ${water.stabilityLoss}.`,
        mandatory: true,
      };
    return {
      text: pre
        ? tutorial(swamp.tutorial, "swamp-paths")
        : interval
          ? "Nord e Sud si uniscono prima del portale. Controlla l’ondata annunciata e i raggi prima di investire."
          : "Puoi costruire e migliorare anche in pausa. I rami sono esclusivi per ogni singola torre.",
      mandatory: false,
    };
  }
  if (interval && session.wave === 1)
    return {
      text: `Corazzato: Carica ${armor.charge}, Protezione ${armor.physicalProtection}%, fuga ${armor.stabilityLoss}. Spore ignora la Protezione.`,
      mandatory: true,
    };
  if (interval && session.wave === 3)
    return {
      text: `Guado: Carica ${water.charge}, velocità ${water.speed}, fuga ${water.stabilityLoss}. Scorciatoia X-Y; colpibile anche in acqua.`,
      mandatory: true,
    };
  return {
    text: pre
      ? tutorial(river.tutorial, "river-nido")
      : interval
        ? "Controlla entrambi gli itinerari. G copre il tratto finale comune; H e F aiutano sul Guado. Avvia tu la prossima ondata."
        : "Pausa ferma tutte le creature e i timer. Puoi costruire o migliorare con calma, poi Riprendi.",
    mandatory: false,
  };
}
export function allGuideNotes(id: MissionId): readonly string[] {
  return id === "dino-01"
    ? forestTips
    : id === "dino-02"
      ? [
          tutorial(river.tutorial, "river-nido"),
          river.routeExplanation,
          riverWarnings.armor,
          riverWarnings.water,
        ]
      : id === "dino-03"
        ? [
            tutorial(swamp.tutorial, "swamp-paths"),
            swamp.routeExplanation,
            ...Object.values(swampWarnings),
          ]
        : id === "dino-04"
          ? [
              tutorial(plateau.tutorial, "plateau-fronts"),
              plateau.routeExplanation,
              ...Object.values(plateauWarnings),
            ]
          : [
              rift.routeExplanation,
              rift.importantNotice,
              ...rift.tutorial.map((entry) => entry.text),
            ];
}
