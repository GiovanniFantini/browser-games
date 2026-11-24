# Statistiche della civiltà

> Come le schede dei giocatori in Football Manager: numeri da 1 a 20 che raccontano un carattere.

## Principi
1. **Scala 1–20** per gli attributi (leggibile, familiare a chi gioca FM). Internamente valori decimali (es. 13,4).
2. **Ogni attributo ha una zona sana.** Fuori zona, verso il basso o verso l'alto, nascono problemi.
3. **Nessun attributo è "più alto = meglio" in assoluto.**
4. **Gli attributi si influenzano a vicenda** (grafo di dipendenze, vedi [`SYSTEMS.md`](SYSTEMS.md)).
5. **La precisione dipende dal Sapere**: con *Sapere* basso i valori sono mostrati come intervalli
   (es. "11–15"), come gli attributi nascosti dagli scout in FM.

## Attributi visibili (14)

### Materiale
| Attributo | Descrive | Zona sana tipica | Eccesso → |
|---|---|---|---|
| **Sostentamento** | Cibo e acqua disponibili | 10–17 | Sovrappopolazione, spreco, decadenza |
| **Prosperità** | Ricchezza, produzione, commercio | 8–16 | Disuguaglianza, lusso, mollezza |
| **Infrastrutture** | Strade, edifici, reti | 8–16 | Costi di manutenzione enormi, rigidità |
| **Salute** | Igiene, medicina, longevità | 9–18 | Invecchiamento della popolazione |
| **Ambiente** | Stato di terre, foreste, clima locale | 10–20 | *(Nessun eccesso, ma frena lo sfruttamento)* |

### Sociale
| Attributo | Descrive | Zona sana tipica | Eccesso → |
|---|---|---|---|
| **Coesione** | Senso di appartenenza, unità | 9–16 | Conformismo, xenofobia |
| **Stabilità** | Ordine interno, assenza di disordini | 8–15 | Stagnazione, innovazione bloccata |
| **Fede** | Forza delle credenze condivise | 6–14 | Fanatismo, guerre religiose, freno alla scienza |
| **Cultura** | Arte, identità, prestigio culturale | 6–18 | Elitismo, distacco dal popolo |
| **Sapere** | Istruzione, conoscenza diffusa | 6–20 | *(Raro)* Disillusione, crisi di fede |
| **Libertà** | Autonomia degli individui | 6–16 | Frammentazione, individualismo |

### Potenza
| Attributo | Descrive | Zona sana tipica | Eccesso → |
|---|---|---|---|
| **Militare** | Forza e preparazione armata | 6–14 | Militarismo, colpo di stato |
| **Innovazione** | Capacità di scoprire e adottare novità | 6–18 | Shock sociali, perdita di tradizioni |
| **Prestigio** | Peso diplomatico, reputazione esterna | 5–17 | Invidia, coalizioni ostili |

> Le zone sane **si spostano con le ere** (es. la *Libertà* "sana" nel Medioevo è più bassa che in età moderna)
> e con gli attributi nascosti.

## Attributi nascosti (6): il carattere

Non sono visibili all'inizio. Si scoprono con il tempo, con eventi rivelatori o con *Sapere* alto.
Cambiano lentissimamente (secoli).

| Attributo | Effetto |
|---|---|
| **Resilienza** | Quanto la civiltà regge le crisi e quanto in fretta si riprende. |
| **Ambizione** | Spinta all'espansione e alla competizione; alta = cresce in fretta ma rischia di più. |
| **Adattabilità** | Facilità nell'accettare politiche nuove (riduce il costo di Influenza e l'inerzia). |
| **Memoria** | Peso del passato: traumi e glorie restano a lungo. Alta = identità forte ma rancori duraturi. |
| **Coerenza** | Quanto la cultura è unitaria; bassa = rischio di frammentazione. |
| **Corruttibilità** | Predisposizione a corruzione e clientelismo quando cresce la Complessità. |

Gli attributi nascosti vengono generati nella **Genesi** (vedi [`ERAS.md`](ERAS.md)) e modificati da grandi eventi.

## Valori derivati (non 1–20)

| Valore | Calcolo (concettuale) | Uso |
|---|---|---|
| **Popolazione** | Numero assoluto; cresce con Sostentamento e Salute, cala con crisi e guerre | Base della Complessità |
| **Complessità** | f(popolazione, territorio, istituzioni, tecnologia) | Sblocca famiglie di problemi e costi |
| **Legittimità** (0–100%) | f(Coesione, Stabilità, coerenza delle politiche con la cultura) | Moltiplicatore dell'efficacia delle politiche |
| **Influenza** | Si rigenera in base a Legittimità e Coesione | Risorsa per agire |
| **Felicità** per gruppo sociale | Media pesata di attributi rilevanti per gruppo | Rivolte, migrazioni, contro-movimenti |

## Gruppi sociali
Come le fazioni di Democracy (ma meno numerosi). Compaiono con la Complessità:
- Preistoria: *Anziani, Cacciatori, Raccoglitori*.
- Antichità: *Sacerdoti, Guerrieri, Contadini, Mercanti, Schiavi/servi*.
- Più avanti: *Clero, Nobiltà, Borghesia, Operai, Intellettuali*…

Ogni gruppo ha preferenze sugli attributi e sulle politiche. Gruppi scontenti e numerosi generano eventi.

## Visualizzazione (in sintesi)
- Scheda attributi stile FM: numero grande, colore per fascia (rosso/arancio/verde/blu), **barra della zona sana**
  dietro al valore, mini-grafico dell'andamento (ultimi 100 anni), freccia di tendenza.
- Il "radar" del carattere (esagono con 6 punte) per gli attributi nascosti scoperti.
- Dettagli in [`ART_DIRECTION.md`](ART_DIRECTION.md).
