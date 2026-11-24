# Architettura tecnica

## Requisiti che guidano le scelte
1. **Simulazione al centro**: tempo reale persistente, offline catch-up, determinismo, bilanciamento automatico.
2. **Interfaccia ricca di dati** (schede, grafici, cursori, tooltip) **+ diorama di profilo animato** (parallasse, pezzi con stati, filtri di luce) e una mappa del mondo secondaria.
3. **Solo browser, desktop**, salvataggi locali (nessun server per ora).
4. **Monetizzabile in futuro**: deve poter diventare un'app desktop (Steam) senza riscrivere tutto.

## Stack scelto

| Ambito | Scelta | Perché |
|---|---|---|
| Linguaggio | **TypeScript** (strict) | Tipi forti su un modello dati ricco; meno bug nella simulazione. |
| Build/dev | **Vite** | Veloce, standard, supporto nativo ai Web Worker. |
| Interfaccia (pannelli) | **React** | Ideale per schede, cursori, tooltip, liste: la parte "FM". |
| Stato UI | **Zustand** | Semplice, leggero, si aggiorna bene da messaggi del Worker. |
| Diorama e mappa | **PixiJS** (WebGL) | Rendering 2D veloce di livelli in parallasse, sprite disegnati a mano, filtri (luce, nebbia, tinte di crisi). |
| Simulazione | **TypeScript puro in un Web Worker** | Non blocca l'interfaccia; lo stesso codice gira in Node per test e bilanciamento. |
| Casualità | **PRNG con seme** (es. implementazione mulberry32/xoshiro) | Determinismo e riproducibilità. |
| Dati di gioco | **File TS/JSON validati con Zod** | Politiche, eventi, ere sono *contenuto*, modificabile senza toccare il motore. |
| Salvataggi | **IndexedDB** (via Dexie) | Più capiente e robusto di localStorage; salvataggi versionati. |
| Grafici | Componenti SVG propri (sparkline) + eventuale libreria leggera | Pieno controllo dello stile. |
| Test | **Vitest** | Integrato con Vite; test del motore in Node. |
| i18n | Stringhe in file di traduzione da subito (it, en) | Indispensabile per vendere all'estero. |
| Desktop (futuro) | **Tauri** | Wrapper leggero per pubblicare su Steam con lo stesso codice. |

> **Perché non un motore di gioco completo (Phaser, Godot)?** Il gioco è per l'80% interfaccia e simulazione
> e per il 20% scena animata. React + PixiJS danno il meglio su entrambi i fronti; Phaser renderebbe
> più scomoda la parte di interfaccia, Godot complicherebbe la distribuzione su browser.

## Architettura

```
┌────────────── Main thread ──────────────┐        ┌──────── Web Worker ────────┐
│                                         │        │                            │
│  React UI  ◄──── Zustand store ◄────────┼─snap───┤   Simulation Engine        │
│  (pannelli, cursori, cronaca)           │        │   - tick loop fisso        │
│                                         │        │   - attributi / grafo      │
│  PixiJS Map ◄─── map view-model ◄───────┤        │   - politiche, eventi      │
│                                         │        │   - crisi, guerra, IA      │
│  Input ─────── comandi ─────────────────┼─cmd───►│   - PRNG con seme          │
│  (sposta cursore, scegli opzione,       │        │                            │
│   pausa, velocità)                      │        │   Content (dati validati)  │
│                                         │        │                            │
│  Persistence (IndexedDB) ◄──────────────┼─save───┤   Serializer               │
└─────────────────────────────────────────┘        └────────────────────────────┘
```

### Regole architetturali
1. **Il motore non conosce l'interfaccia.** Nessun import di React/Pixi nel motore. Comunica solo con messaggi.
2. **Tutto passa da comandi.** Ogni azione del giocatore è un comando serializzabile
   (`{ type: 'SET_POLICY', policyId, value, tick }`). Questo permette replay, debug e test. La velocità di esecuzione è gestita dal Worker anche durante la pausa.
3. **Snapshot verso la UI** a frequenza limitata (es. 4–10 al secondo), non a ogni tick.
4. **Il motore è puro e deterministico**: niente `Math.random()`, niente `Date.now()` dentro la simulazione.
5. **Contenuto separato dal codice**: aggiungere un evento non deve richiedere modifiche al motore.

## Salvataggi
- Salvataggio automatico ogni N secondi reali e alla chiusura della pagina (`visibilitychange`/`pagehide`).
- Formato: `{ version, seed, tick, state, commandLog? , savedAt }`.
- **Migrazioni versionate**: ogni modifica al formato aggiunge una funzione di migrazione `vN → vN+1`.
- **Esporta/Importa** salvataggio come file (protezione contro la pulizia dei dati del browser).
- Più slot di salvataggio (una partita persistente principale + slot sperimentali).
- Consigliato chiedere `navigator.storage.persist()` per ridurre il rischio che il browser cancelli i dati.

## Offline catch-up
- Alla riapertura: `elapsed = min(now - savedAt, CAP)`.
- Il Worker esegue i tick mancanti in **modalità veloce** (senza snapshot intermedi), con la Dottrina attiva.
- Stop anticipato su crisi o dilemmi "decisivi".
- Barra di avanzamento "La storia continua…" e poi la Cronaca dell'assenza.
- Obiettivo di prestazioni: 8 ore di gioco offline simulate in **< 3 secondi**.

## Struttura delle cartelle (proposta)

Epoche ha un pacchetto indipendente in BrowserGames. `package.json`, lockfile e build risiedono sotto `games/epoche/`. I comandi delle schede si eseguono da questa cartella.

```
games/epoche/
├─ docs/                    # design, mockup e schede dei compiti
├─ src/
│  ├─ engine/               # simulazione pura (nessuna dipendenza da UI)
│  │  ├─ core/              # tick loop, PRNG, tipi base, comandi
│  │  ├─ systems/           # attributes, policies, events, complexity, crises, war, ai, offline
│  │  ├─ state/             # modello dello stato e serializzazione
│  │  └─ index.ts
│  ├─ content/              # DATI di gioco (validati con Zod)
│  │  ├─ eras/
│  │  ├─ attributes.ts
│  │  ├─ policies/
│  │  ├─ events/
│  │  ├─ archetypes/
│  │  └─ schema.ts
│  ├─ worker/               # bridge tra engine e main thread
│  ├─ ui/                   # React: layout, pannelli, componenti
│  │  ├─ panels/
│  │  ├─ components/
│  │  └─ store/
│  ├─ map/                  # PixiJS: rendering della mappa e view-model
│  ├─ persistence/          # IndexedDB, migrazioni, export/import
│  ├─ i18n/                 # it.json, en.json
│  └─ main.tsx
├─ tools/
│  └─ sim/                  # simulatore headless per il bilanciamento (Node)
├─ tests/
├─ public/assets/           # immagini, audio, font
├─ AGENTS.md
├─ CLAUDE.md
├─ PLANS.md
└─ README.md
```

## Qualità
- ESLint + Prettier; TypeScript `strict: true`.
- Test obbligatori per il motore (ogni sistema ha test unitari + test di determinismo:
  stesso seme e stessi comandi → stesso hash di stato).
- La [verifica locale della Fase 1](tasks/T10-local-verification.md) comprende lint, test, build, una simulazione breve e una prova nel browser.

## Telemetria (futuro, opzionale)
Solo con consenso esplicito: statistiche anonime su durata delle sessioni, cause di collasso, politiche più usate.
Utile per il bilanciamento dopo il lancio.
