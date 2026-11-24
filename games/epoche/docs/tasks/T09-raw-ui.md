# T09: Interfaccia grezza

**Dipende da:** T08 · **Stima:** L

## Obiettivo
Si gioca la Preistoria nel browser: schede degli attributi stile FM, cursori delle politiche, barra superiore
con tempo e risorse. Grafica semplice ma con il **layout definitivo**; niente mappa (al centro un segnaposto).

## Contesto
- `docs/ART_DIRECTION.md` → "Layout dello schermo", "Le schede attributi", "I cursori delle politiche".
- Riferimento visivo: `docs/reference/mockup-neolitico-v3.png` (solo per layout e pannelli; il diorama non si fa ora).
- `AGENTS.md` → testi solo da `src/i18n`.

## Da fare
1. Layout a griglia CSS: barra superiore, colonna sinistra (attributi), centro (segnaposto "Diorama, Fase 2"),
   colonna destra (politiche), barra inferiore (riservata alla cronaca, vuota). Minimo 1366×768, riferimento 1920×1080.
   Palette scura e calda come nel mockup, con variabili CSS in `src/ui/theme.css`.
2. **Barra superiore**: era e anno ("300.000 a.C." a inizio partita, formattato dalla UI, separatore delle migliaia della lingua),
   pulsanti ⏸ 1× 2× 4× con stato attivo, Popolazione, Influenza (con massimo), Legittimità %, livello di Complessità.
3. **Scheda attributo** (`AttributeCard`):
   - nome, valore intero grande con colore per fascia (1–5 rosso, 6–10 arancio, 11–15 verde, 16–20 blu);
   - barra 1–20 con la zona sana evidenziata e un indicatore del valore;
   - icona ▲/▼ se il valore è fuori zona (non solo colore) e freccia di tendenza basata sullo storico;
   - mini-grafico SVG (sparkline) dello storico, componente fatto a mano;
   - tooltip "perché" con i contributi di `explainTarget`, ordinati per valore assoluto;
   - attributi dormienti in grigio con la scritta "dalla [era]" (per ora un testo generico "non ancora attivo").
   Raggruppati per Materiale / Sociale / Potenza.
4. **Cursore politica** (`PolicySlider`):
   - nome, cursore 0–100 con etichette dei due poli, frase del compromesso sotto;
   - indicatore separato per `target` e `effective` (si vede che l'effetto sta ancora arrivando);
   - durante il trascinamento, anteprima (`previewPolicy`) con costo in Influenza ed effetti ▲▼ sugli attributi, ritardo e rampa;
   - il comando parte al rilascio. In pausa il cambio resta in coda fino alla ripresa. Se viene rifiutato, il cursore torna alla posizione precedente e compare un messaggio breve.
5. Scorciatoie: Spazio = pausa/riprendi, 1/2/3 = 1×/2×/4×.
6. Lingua: tutti i testi in `it.json` ed `en.json`; selettore di lingua semplice in un angolo (salvato in `localStorage`, accesso protetto da try/catch).
7. Test con Vitest per la logica isolabile (colore per fascia, formattazione dell'anno, calcolo della tendenza). Verifica nel browser il rendering e le interazioni.

## Fuori ambito
- Diorama, PixiJS, eventi, cronaca, salvataggi, consiglio.
- Animazioni elaborate.

## Criteri di accettazione
- [x] `npm run dev`: si vedono le 7 schede attive, le 7 dormienti in grigio e i 6 cursori della Preistoria.
- [x] Il tempo scorre, si mette in pausa e cambia velocità da pulsanti e tastiera.
- [x] Con il tempo in corso, spostando `fire` a destra si vedono costo ed effetti in anteprima. Dopo il rilascio il primo tick utile scala l'Influenza e, trascorso il ritardo, si osserva la tendenza in calo di Ambiente.
- [x] Il tooltip di ogni attributo mostra contributi la cui somma corrisponde al target.
- [x] Un attributo fuori zona mostra l'icona ▲/▼ oltre al colore.
- [x] Cambiando lingua tutti i testi cambiano (nessun testo italiano fisso nei componenti).
- [x] Screenshot a 1920×1080 e 1366×768 conservati nelle evidenze locali.
- [x] `npm run lint` e `npm test` passano; `PLANS.md` aggiornato.
