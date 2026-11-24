# T10. Verifica locale della Fase 1

Dipende da T07 e T09. Stima S.

## Obiettivo

Verificare dal pacchetto di Epoche il motore, il bilanciamento iniziale e la prima tappa giocabile della Preistoria.

## Contesto

- [Piano e contratti](../../PLANS.md)
- [Architettura tecnica](../TECH.md#qualità)
- [Simulatore e determinismo](T07-headless-sim.md)
- [Interfaccia](T09-raw-ui.md)

## Da fare

1. Da `games/epoche` esegui lint, test e build. Verifica nel browser il flusso della T09.
2. Aggiungi `sim:check` al pacchetto di Epoche. Per cinque semi esegui 1000 anni con `idle` e 3000 con `growth`, la finestra dello scenario T06. Il controllo fallisce se:
   - un attributo assume un valore non finito o fuori dalla scala 1–20;
   - in uno scenario `idle` più della metà degli attributi attivi è fuori dalla zona sana a fine simulazione;
   - in uno scenario `growth` nessun attributo attivo esce mai dalla zona sana.
3. Raccogli i risultati in `PLANS.md`, incluso il valore iniziale delle soglie e le anomalie riproducibili.

La scheda riguarda le verifiche locali. Ogni intervento di CI/CD richiede l'autorizzazione esplicita prevista dalle [istruzioni generali](../../../../AGENTS.md).

## Criteri di accettazione

- [x] `npm run lint`, `npm test`, `npm run build` e `npm run sim:check` passano da `games/epoche`.
- [x] Si verifica che `sim:check` rilevi una regressione di bilanciamento con un dato di test perturbato.
- [x] La tappa giocabile è verificata nel browser ai due formati indicati in T09.
- [x] `PLANS.md` riporta l'esito della verifica locale e lo stato della Fase 1.
