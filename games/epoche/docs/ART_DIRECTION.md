# Direzione artistica e interfaccia

> Versione 0.2 · Decisione: **vista principale di profilo, stile disegnato a mano ispirato a Hollow Knight: Silksong.**

## Obiettivo
A metà strada tra **Empire Earth** (troppo datato) e **Football Manager** (troppo centrato sui dati):
**al centro un diorama vivente visto di profilo, disegnato a mano; ai lati statistiche eleganti.**

Riferimento di stile: **Hollow Knight: Silksong**. Prendiamo:
- il **disegno a mano** con contorni morbidi e forme pulite;
- i **livelli di profondità** (parallasse): primo piano, piano di gioco, sfondo, cielo;
- le **palette cupe con pochi colori accesi** che indicano ciò che conta;
- la **leggibilità**: come in Silksong un nemico si stacca dallo sfondo, in Epoche un problema
  (campo secco, incendio, epidemia) si riconosce al volo da forma e colore.

Non prendiamo: l'animazione dei personaggi fotogramma per fotogramma, i combattimenti, i toni dark-fantasy
(il mondo di Epoche è storico, non fiabesco).

Riferimento di genere per la vista di profilo: **Kingdom Two Crowns**, che gestisce un regno visto di lato
senza controllo diretto delle unità (ma in pixel art: noi restiamo sul disegno a mano).

## Principi
1. **Leggibile prima che bello.** Ogni stato importante si vede senza leggere: colore, forma, movimento.
   Le etichette sulla mappa sono un aiuto in più, mai l'unico segnale.
2. **Il diorama racconta, i pannelli spiegano.** La scena mostra *cosa* succede; i pannelli dicono *perché* e *quanto*.
3. **Costruito a moduli, non dipinto in un unico pezzo.** Ogni elemento (capanna, campo, albero, fiume, fumo)
   è un pezzo separato con più stati, così la scena può crescere, seccarsi, bruciare, ricostruirsi.
4. **Il mondo cambia con le ere.** Diorama e interfaccia evolvono: la progressione è anche una ricompensa visiva.
5. **Pochi colori semantici**, coerenti in tutto il gioco.

## Le due viste

### 1. Diorama dell'insediamento (vista principale, di profilo)
La civiltà vista di lato, come una sezione di paesaggio che si estende in orizzontale.

```
  cielo         ░░░░░░░░ nuvole, sole/luna, meteo, stagioni ░░░░░░░░░░░░░░░░░░
  sfondo        ▲▲ montagne ▲▲▲        ▲▲▲ (parallasse lenta) ▲▲▲▲
  piano medio      colline · boschi · fiume lontano · altri villaggi
  piano di gioco  [campi]  [capanne] [fuoco] [granaio]  [recinti]  [bosco]
  primo piano   ▓▓ erba, rocce, rami (parallasse veloce, semitrasparente) ▓▓
```

- **Scorrimento orizzontale** tra le zone dell'insediamento (campi, centro abitato, bosco, fiume, confine).
  Lo zoom è limitato: si avvicina per i dettagli, si allontana per una visione d'insieme.
- **L'insediamento cresce in larghezza e in altezza**: capanne → villaggio → città con mura → metropoli con
  edifici alti. Nelle ere avanzate la scena può avere più "strati" (porto, quartieri, periferie).
- **Figure lontane e semplici** (sagome) che si muovono: contadini, carovane, soldati, folle.
  Animazioni brevi e ripetute, mai personaggi da controllare.
- **Ciclo giorno/notte, stagioni e meteo** lenti: fanno percepire il tempo e sono anche informazione
  (luci accese di notte = vitalità; poche luci = popolazione in calo o epidemia).

### 2. Mappa del mondo (vista dall'alto, secondaria)
- Per territori, altre civiltà, rotte commerciali, fronti di guerra, migrazioni.
- **Stile più semplice**: una carta illustrata nello stile dell'era (pietra/pelle, pergamena, carta stampata, vetro).
- Si apre con un pulsante o con lo zoom indietro dal diorama.
- Cliccando su un'altra civiltà se ne vede un diorama "in lontananza" (meno dettagliato).

## Feedback visivi nel diorama
| Stato | Segnale |
|---|---|
| Sostentamento basso | Campi che passano da verde/oro a giallo bruciato, poi brulli; granai vuoti e aperti |
| Sostentamento in eccesso | Granai stracolmi, topi, sacchi all'aperto, razziatori sullo sfondo |
| Salute bassa | Colori desaturati, poche luci, stracci neri appesi, figure che si muovono lente |
| Stabilità bassa | Fumo, piccoli fuochi, folle radunate, porte sbarrate |
| Ambiente basso | Boschi dello sfondo che si diradano, fiume torbido, cielo velato |
| Prosperità alta | Più edifici, colori caldi, bancarelle, carovane e barche |
| Coesione alta | Feste, falò comuni, stendardi |
| Fede alta | Totem, templi e processioni più presenti nella scena |
| Guerra | Palizzate, guardie, bagliori all'orizzonte, profughi che attraversano la scena |
| Crisi grave | Tutta la palette vira (es. tinta rossastra per la guerra, verde malato per l'epidemia) |

**Regola:** ogni attributo fuori dalla zona sana deve avere almeno **un segnale visibile entro 2 secondi** di sguardo.

## Layout dello schermo (desktop, 1920×1080 di riferimento, minimo 1366×768)

```
┌───────────────────────────────────────────────────────────────────────┐
│ [Era · Anno]  [⏸ 1× 2× 4×]   Popolazione  Influenza ◆  Legittimità  │ barra superiore
├──────────────┬────────────────────────────────────────┬───────────────┤
│  ATTRIBUTI   │                                        │  POLITICHE    │
│  (schede FM) │     DIORAMA DI PROFILO                 │  (cursori a   │
│  Materiale   │     ◄─── scorrimento orizzontale ───►  │   due poli)   │
│  Sociale     │                                        │               │
│  Potenza     │                          [🗺 Mondo]    │  CONSIGLIO    │
│  Complessità │                                        │  (ritratto +  │
│              │                                        │   parere)     │
├──────────────┴────────────────────────────────────────┴───────────────┤
│ CRONACA: notizie recenti                 [ Dilemma in attesa ● ]      │ barra inferiore
└───────────────────────────────────────────────────────────────────────┘
```
- Pannelli laterali **comprimibili** per una vista "solo diorama" contemplativa.
- I **dilemmi** si aprono come carte illustrate sopra il diorama (con pausa automatica).
- Riferimento ufficiale: **`docs/reference/mockup-neolitico-v3.png`** (vedi §Mockup di riferimento).

## Mockup di riferimento
| Versione | File | Stato | Cosa ci ha insegnato |
|---|---|---|---|
| v0 | `reference/mockup-neolitico-v0.png` | Superato | Layout e pannelli giusti; vista dall'alto realistica, un dipinto unico non modulare, problemi leggibili solo dalle etichette |
| v1 | `reference/mockup-neolitico-v1.png` | Superato | Profilo e cursori a due poli funzionano; stile acquerello troppo chiaro, troppo cielo, segnali contraddittori |
| v2 | `reference/mockup-neolitico-v2.png` | Zoom ravvicinato | Stile vicino a Silksong, segnali chiari (grano giallo, sacchi, fiume in secca); buono come zoom massimo, figure troppo dettagliate |
| **v3** | `reference/mockup-neolitico-v3.png` | **✅ Riferimento** | Zoom di partenza corretto, primo piano in silhouette, figure semplici, fuoco come punto focale |

### Regole fissate dal mockup v3
- **Inquadratura di partenza**: si vedono insieme almeno 3 elementi dell'insediamento (es. campi, villaggio, recinti/fiume).
  Lo zoom ravvicinato (stile v2) è il massimo consentito.
- **Primo piano scuro, quasi silhouette**, che incornicia la scena; sfondo freddo e nebbioso; piano di gioco caldo.
- **Punto focale luminoso** (fuoco, lampade, finestre): è l'elemento più chiaro della scena.
- **Figure**: sagome piccole e semplici, pochi fotogrammi. I volti esistono solo nei ritratti (Consiglio, dilemmi).
- **Contorni a inchiostro** su edifici ed elementi del piano di gioco, più leggeri o assenti sullo sfondo.
- **Coerenza scena–numeri**: ogni attributo con ▼ o fuori zona ha un segnale nel diorama (nel v3: Sostentamento →
  terra spaccata e grano secco; Ambiente → fiume in secca; eccesso nel granaio → sacchi all'aperto).
- Lo spazio vuoto del piano di gioco si riempie con la vita del villaggio (passanti, animali, attrezzi), in proporzione a Popolazione e Prosperità.

## Le schede attributi (l'anima "FM")
- Numero grande 1–20 con **colore per fascia**: 1–5 rosso · 6–10 arancio · 11–15 verde · 16–20 blu/oro.
- Dietro il numero una **barra con la zona sana** evidenziata; se il valore è fuori zona la barra lo segnala
  anche con un'icona (non solo con il colore).
- **Freccia di tendenza** e **mini-grafico** degli ultimi 100 anni.
- **Tooltip "perché"**: scomposizione dei contributi (+2,1 dalle politiche agricole, −1,4 dalla siccità…).
- Con *Sapere* basso i valori appaiono come intervalli sfumati ("11–15").
- Attributi non ancora attivi **in grigio** con l'era in cui si attivano (non nascosti).

## I cursori delle politiche
- **Due poli con un nome**, non percentuali: *Comune ↔ Familiare*, *Nomadismo ↔ Stanzialità*.
- Sotto il cursore, il **compromesso in poche parole** (es. "Più cibo · Più erosione").
- Al passaggio del mouse: costo in Influenza, effetti ▲▼ sugli attributi, tempo prima che l'effetto arrivi.

## Evoluzione dello stile per era
| Era | Diorama | Cornice dell'interfaccia |
|---|---|---|
| Genesi | Niente diorama: spazio, poi pianeta, poi zoom fino alla valle (vedi `ERAS.md`) | Nessuna cornice, solo luce |
| Preistoria | Grotte, accampamenti, savane e foreste; palette terre e ocra | Pietra, pitture rupestri |
| Neolitico → Bronzo | Villaggi, campi, primi templi; verdi, ori del grano, bronzo | Argilla, tavolette |
| Antichità → Medioevo | Mura, città, castelli, cattedrali; colori da manoscritto | Pergamena, miniature, inchiostro |
| Moderna → Industriale | Porti, manifatture, ciminiere; seppia, poi grigi fumosi | Carta stampata, incisioni |
| Contemporanea → Futuro | Skyline, infrastrutture, poi architetture future; contrasti alti, luci | Vetro, luce, interfacce pulite |

## Produzione delle immagini
### Come sono costruiti i disegni
- Ogni era ha un **kit di pezzi**: terreni (in pezzi affiancabili orizzontalmente), edifici (3–4 stati: nuovo,
  normale, degradato, distrutto), vegetazione, acqua, figure (sagome con 2–6 fotogrammi), effetti (fumo, fuoco, pioggia).
- **Livelli di profondità** separati: cielo, sfondo lontano, sfondo vicino, piano di gioco, primo piano.
- Luci, nebbia, tinte di crisi e giorno/notte si ottengono con **filtri in tempo reale** (PixiJS), non disegnando
  versioni diverse di ogni pezzo.
- Formato: immagini a 2× la risoluzione di riferimento, raccolte in atlanti di texture.

### Chi li disegna
| Fase | Soluzione |
|---|---|
| Prototipo (Fasi 1–2) | Disegni provvisori: forme semplici, anche generate con AI, **solo per uso interno** |
| Definizione dello stile | Un illustratore crea la **guida di stile** e il kit completo di un'era (Neolitico) |
| Produzione | Lo stesso illustratore (o un piccolo gruppo) produce i kit delle altre ere seguendo la guida |

> Su Steam i contenuti generati con AI vanno dichiarati e molti giocatori li accolgono male:
> per la versione in vendita l'arte finale dovrebbe essere fatta da persone.

### Stima del lavoro (indicativa)
- Kit di un'era: ~40–80 pezzi + 10–20 piccole animazioni.
- Molto meno di un gioco come Silksong: niente personaggi animati in dettaglio, niente combattimenti, niente livelli da esplorare.
- Il costo cresce con il numero di ere: è una ragione in più per pubblicare con poche ere complete e aggiungerne altre dopo.

## Tipografia (proposta)
- Titoli: un serif con carattere (es. *Cormorant* o *EB Garamond*), con varianti per era.
- Testi e numeri: un sans leggibile con cifre tabulari (es. *Inter* o *IBM Plex Sans*).
- Solo font con licenza compatibile con l'uso commerciale (OFL).

## Audio (indicazioni iniziali)
- Musica adattiva per era e per "umore" della civiltà (prospera / tesa / crisi), atmosferica e contenuta.
- Suoni ambientali legati alla zona del diorama inquadrata (fiume, mercato, campane, macchine).
- Suoni di interfaccia discreti; un suono distintivo per i dilemmi.

## Accessibilità
- Colori semantici **sempre** accompagnati da forma o icona.
- Modalità per daltonici, scala dell'interfaccia (90–150%), testi ridimensionabili.
- Opzione per ridurre la parallasse e gli effetti di movimento.
- Scorciatoie: spazio = pausa, 1/2/3 = velocità, A/D o frecce = scorrimento del diorama, M = mappa del mondo.

## Da fare
- [ ] Moodboard: Silksong (palette, profondità), Kingdom Two Crowns (composizione di profilo), illustrazione storica.
- [x] Schizzo della schermata principale con il diorama neolitico di profilo (mockup v3).
- [ ] Prova di leggibilità: lo stesso villaggio in 4 stati (normale, siccità, epidemia, rivolta), riconoscibili senza etichette.
- [ ] Studio della scheda attributo (3 varianti) partendo dal mockup v0.
- [ ] Ricerca illustratore per la guida di stile.
