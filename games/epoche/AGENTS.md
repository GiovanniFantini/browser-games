# Epoche

Si applicano le [istruzioni generali di BrowserGames](../../AGENTS.md). Le regole qui sotto riguardano Epoche.

## Stato e ambito

Epoche è un gestionale di civiltà desktop per browser. Il giocatore imposta politiche a cursore e osserva come cambiano gli attributi della civiltà. La campagna locale attraversa dieci ere dalla Genesi al Futuro. Il [piano della Fase 1](PLANS.md) raccoglie il contratto del motore minimo. Le [verifiche della campagna](docs/CAMPAIGN_VERIFICATION.md) coprono le fasi successive.

- Leggi il [README](README.md), il [design di riferimento](docs/GAME_DESIGN.md), la [scheda del compito](docs/tasks/README.md) e i contratti pertinenti in [PLANS.md](PLANS.md).
- Esegui i compiti autorizzati da Giovanni. Aggiorna i documenti di design quando cambia una scelta confermata. Registra in PLANS.md le decisioni tecniche e le questioni aperte.
- Lavora in `games/epoche/`. Il pacchetto, le dipendenze, il codice e le risorse del gioco appartengono a questa cartella. I comandi senza prefisso lanciati dalla radice del repository riguardano la raccolta o altri giochi.
- I comandi npm delle schede si intendono eseguiti da `games/epoche`, dopo il compito che li introduce. Preferisci le dipendenze previste nel piano e motiva le aggiunte.

## Motore e contenuti

- `src/engine/` è indipendente da `src/ui/`, `src/map/`, `src/worker/`, React, Zustand e PixiJS. Usa TypeScript strict e `unknown` con validazione per i dati di tipo incerto.
- Nell'engine usa `Rng` e il contatore dei tick. Il tempo reale resta nel Worker. Usa un ordine stabile per gli elementi che partecipano alla simulazione.
- Le azioni che alterano la simulazione passano da comandi serializzabili. `step()` restituisce il nuovo stato senza mutare quello ricevuto. I componenti React leggono lo store e inviano comandi.
- I dati di gioco e i valori di bilanciamento stanno in `src/content/`, con schemi Zod. I testi visibili al giocatore stanno nei dizionari di `src/i18n/`, in italiano e inglese. Usa nomi inglesi nel codice e italiano nella documentazione.

## Verifica

- Verifica i criteri della scheda e registra l'esito in `PLANS.md`. Esegui i controlli locali disponibili per la tappa. Usa test accanto al modulo per la logica isolata e `tests/` per integrazione e determinismo.
- Verifica nel browser le modifiche al gioco visibile e al collegamento tra Worker e interfaccia. Registra le dimensioni e i casi provati quando riguardano il layout.
- La [T10](docs/tasks/T10-local-verification.md) riguarda la verifica locale. Per modifiche a pipeline o configurazioni CI/CD serve l'autorizzazione esplicita di Giovanni secondo le istruzioni generali.
