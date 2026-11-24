## Giudizio finale: GO ALLA PUBBLICAZIONE

Non ho trovato difetti bloccanti. Il GO copre solo questa tappa opzionale e la build indicata in `build-sha256.json`. Ho letto codice e artefatti senza eseguire nulla e **non ho ricalcolato gli hash**. Ho confrontato i nomi dei file tra `dist`, `build.txt` e manifesto, e ho ritrovato nel worker compilato le correzioni della preliminare. Prima del deploy va verificata la corrispondenza degli SHA-256.

| Ambito | Esito |
| --- | --- |
| `?rimedi` | **GO** |
| `?studio=inverno` | **GO** |
| Build, campagna ordinaria compresa | **GO** |

### Punti della preliminare

| Punto | Esito |
| --- | --- |
| Crisi a 100 in `winterStudy` | **Chiuso.** Dissoluzione immediata (`events.ts:405-408`), con test a legittimità 90. Dall'esito si esporta il diario. |
| Tick del registro | **Chiuso.** Ritorno immediato (`campaign.ts:338`). |
| Salvataggio e riapertura | **Chiuso.** Il test rilegge il salvataggio prodotto da quel tick (`reckoning.test.ts:131`). La ripresa a udienza aperta lascia lo stato invariato. |
| Minimo di popolazione | **Chiuso nel codice** (`reckoning.ts:191`), senza test dedicato. |
| Eredità alla dissoluzione | **Chiuso** (`reckoning.ts:207`). |
| Cronaca e diario | **Chiuso.** La cronaca registra alternative e scelta, il diario anche la scadenza. |
| Zero `open` | **Chiuso.** 3000 righe: 2826 arrivi al registro, 174 finali con dissoluzione o altro esito, nessuna assenza. |
| Matrici ricalcolate | **Chiuso.** In `verifica-1` le vittorie sono 97 = 0+10+42+45. In calibrazione sono 571 = 148+172+137+114. Le popolazioni del bivio mostrano già il +3%. |
| Registro nel browser | **Chiuso.** Cinque rimedi con diario e due immagini coerenti col testo finale. |
| Ambito e criteri | **Chiuso.** Vittorie sulle campagne intere, preferenza A/B sulla fetta guidata. Il calo della previdente da 50 a 45 è dichiarato. |
| Controlli | 88 test superati; lint e build senza errori. |

La campagna ordinaria resta protetta: rimedi, debiti e nuove regole dipendono dalla modalità. I salvataggi usano database separati e i vecchi file ricevono valori predefiniti. Cambiano per tutti il diorama, gli avvisi, l'arrotondamento degli abitanti e la selezione dei retaggi.

### Difetti minori, da correggere dopo
- **Registro in `?rimedi`:** può non aprirsi, ma la Tavola e l'isolamento ne parlano come di un fatto certo. Il testo della partenza del clan è già condizionale.
- **Etichetta:** la cronaca scrive «Accetta il conto», mentre il pulsante del registro dice «Riscuoti la quota».
- **Influenza:** il tetto al passaggio non è annunciato. Con la Tavola rinnovata agisce anche verso il Medioevo (`reckoning.ts:192-195`).
- **Prova guidata:** se una conquista porta in un'era oltre il Bronzo, il registro non si apre più. La partita continua fino a un altro esito.
- **Regressione o conquista:** con il baratto ancora attivo, il disgelo può ripresentarsi.
- **Import manipolati:** è ancora accettata un'udienza `advance` non pronta, che non si può risolvere.
- **Diario:** sta in `sessionStorage` e si perde chiudendo la scheda. La cronaca resta nel salvataggio.

### Limiti della prova
- **Equilibrio non dimostrato:** il baratto prevale in 68 stati su 200, cioè il 34%. Prima erano 54. Il +3% è stato introdotto dopo quel risultato e misurato sugli stessi semi 101-200. `Stato.md` lo dichiara, ma manca una conferma su semi indipendenti.
- **Metrica sensibile:** conta il segno delle differenze, quindi uno scarto minimo di popolazione può decidere il confronto. 221 confronti su 600 sono pari.
- **Soglia del 30%:** `Confronto.md` la attribuisce al piano, ma non l'ho trovata nei documenti Markdown del gioco.
- **Altre opzioni:** la caccia non è mai preferita e resta non dominata in 27 osservazioni su 600. Il dato è solo in `dominanze.json` e va riportato in `Confronto.md`.
- **Pacchetto completo:** i risultati non isolano l'effetto dei soli rimedi.
- **Agenti:** sostituiscono soltanto il test su carta. Tre lettori simulati non sono utenti.
- **Browser:** il registro è stato provato solo in italiano. Le prove partono da salvataggi preparati. Il percorso naturale è coperto dal simulatore.
- **Ritmo:** circa 2,3 minuti di simulazione, letture escluse. Il traguardo di 12-15 minuti resta da misurare con persone.

### Cosa non approvo
Il GO **non** copre l'estensione alle ere avanzate, il passaggio a regole predefinite, l'equilibrio dei rami o l'usabilità con persone reali. Restano aperte le cinque e le dodici sessioni e il verdetto sui semi 1001-1100. Ogni modifica a motore, interfaccia o testi richiede una nuova candidata, con test, lint, build e prova browser ripetuti.