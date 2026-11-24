# Risultati delle strategie

Gioco ordinario in ritmo Rapido, entrambi i percorsi. Si contano separatamente ingresso vivo nel Bronzo e vittoria finale.

## Continuità, 25 semi

| Strategia | Partite | Bronzo | Trascendenza |
| --- | ---: | ---: | ---: |
| first | 50 | 36 | 1 |
| random | 50 | 39 | 9 |
| cautious | 50 | 38 | 34 |
| foresight | 50 | 50 | 50 |
| wait | 50 | 34 | 32 |
| spend | 50 | 40 | 38 |
| heritage | 50 | 38 | 34 |
| ordinary | 50 | 38 | 34 |

## Calibrazione, 100 semi

| Strategia | Partite | Bronzo | Trascendenza |
| --- | ---: | ---: | ---: |
| first | 200 | 109 | 2 |
| random | 200 | 162 | 31 |
| cautious | 200 | 156 | 146 |
| foresight | 200 | 198 | 198 |
| wait | 200 | 148 | 142 |
| spend | 200 | 172 | 156 |
| heritage | 200 | 156 | 146 |
| ordinary | 200 | 156 | 131 |

## Ipotesi

H1. In otto partite prudenti le scadenze raggiungono da sole 101. La crisi corrente può scendere a zero senza annullare quel debito. Un nuovo inverno offre il baratto, ma la ricomparsa è subordinata al calendario e al cooldown.
H2. Confrontare spend e cautious nelle tabelle. Differiscono nella scelta fatta vicino al passaggio. La differenza di vittorie misura la strategia nel suo complesso, senza isolare l’effetto della sola ricarica.
H3. Sui mondi 5 e 18 la prudente perde su entrambe le vie per la somma di scadenza e crisi preesistente. Gli stessi quattro tentativi attendisti vincono 0 volte.
H4. La previdente considera i debiti. Le sue vittorie misurano quanto è efficace anticipare i costi con le regole attuali. La preferenza di un giocatore richiede una sessione osservata.

## Differenze accoppiate sui semi di calibrazione

Differenza di vittorie finali rispetto alla prudente, in punti percentuali. Intervallo percentile del bootstrap a 95%, 4.000 ricampionamenti dei 100 mondi. Le due vie dello stesso mondo restano insieme.

| Strategia | Differenza | Intervallo |
| --- | ---: | ---: |
| foresight | +26.0 | +17.5 a +34.5 |
| wait | -2.0 | -6.5 a +2.0 |
| spend | +5.0 | -4.5 a +14.5 |
| heritage | +0.0 | +0.0 a +0.0 |
| ordinary | -7.5 | -12.5 a -3.0 |

## Influenza e ricomparsa dell’inverno

| Strategia | Passaggi osservati | Influenza media prima | Influenza media dopo | Inverni ripetuti |
| --- | ---: | ---: | ---: | ---: |
| cautious | 354 | 33.3 | 46.6 | 0 |
| spend | 370 | 32.0 | 46.8 | 0 |
| wait | 322 | 32.9 | 46.4 | 0 |
I passaggi sono quelli effettivamente raggiunti. Il file passaggi.ndjson conserva ogni tick, Influenza prima e dopo e tutti gli incontri dell’inverno per seme e via.
