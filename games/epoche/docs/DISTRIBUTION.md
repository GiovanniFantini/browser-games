# Distribuzione

## Campagna browser

La [campagna completa](https://giovannifantini.github.io/browser-games/epoche-campagna/) si apre dalla raccolta BrowserGames.

Da `games/epoche`:

```powershell
npm run build
```

La campagna completa si trova in `dist/`. I salvataggi della campagna sono locali al browser e all'origine del sito. Per spostarli usa il file JSON esportato dal gioco.

## Desktop Windows

Il progetto Tauri è sotto `src-tauri/` e carica la stessa build browser. `npm run desktop:info` rileva WebView2 sul PC di verifica. Il comando `npm run desktop:build` si ferma durante `cargo metadata` perché Cargo non è installato. Mancano anche Rust e Visual Studio Build Tools con MSVC e Windows SDK. Il progetto prevede un installer NSIS dopo la compilazione. [Prerequisiti Windows Tauri](https://v2.tauri.app/start/prerequisites/) · [Installer Windows](https://v2.tauri.app/distribute/windows-installer/)

## Testo per la pagina Steam

### Italiano

Epoche è un gestionale di civiltà in tempo reale con pausa. Guida un popolo dalla Preistoria al Futuro, stabilisci le sue politiche e osservane gli effetti sul paesaggio, sulle risorse e sui rapporti fra i gruppi. Mantieni un equilibrio fra crescita e territorio, negozia con le civiltà vicine e lascia una dottrina che guidi il popolo quando sei via. La cronaca racconta ciò che è accaduto e le decisioni che lo hanno cambiato.

### English

Epoche is a real-time civilization management game with pause. Guide a people from Prehistory to the Future, set their policies, and see how your choices shape the landscape, resources and social groups. Balance growth with the demands it places on the land, negotiate with nearby civilizations, and leave a doctrine to guide your people while you are away. The chronicle records the events and decisions that changed their history.

### Decisioni di pubblicazione

La proposta commerciale è un acquisto unico per la campagna completa, con eventuali espansioni per nuovi scenari. Prezzo, licenza, account Steamworks e illustrazioni definitive richiedono una decisione di Giovanni. Il testo della scheda è pronto per quella sede.
