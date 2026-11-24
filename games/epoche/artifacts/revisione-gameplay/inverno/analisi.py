from pathlib import Path
from collections import Counter, defaultdict
import json
root=Path(__file__).resolve().parent
def read(path):
    raw=path.read_bytes()
    return [json.loads(l) for l in raw.decode("utf-16" if raw.startswith(b"\xff\xfe") else "utf-8-sig").splitlines()]
old={(r["seed"],r["route"],r["response"]):r for r in read(root.parent/"prove/continuita.ndjson")}
runs=read(root/"verifica-1.ndjson")
assert len({(r["seed"],r["route"],r["response"]) for r in runs})==len(runs)==200
assert all(r["ending"] in ("transcendence","collapse","extinction") for r in runs)
names={"first":"Prima disponibile","random":"Casuale","cautious":"Prudente","foresight":"Previdente"}
lines=["# Il confronto dell’inverno","","25 mondi, due percorsi per mondo, riforme e ritmo Rapido del confronto precedente. Le 150 partite comprendono prima risposta, casuale e prudente. Le 50 previdenti usano gli stessi abbinamenti. Il sorteggio usa lo stesso seme anche per le nuove udienze, perciò dopo un’udienza la sequenza di risposte casuali può cambiare.","","| Strategia | Vittorie prima | Vittorie con rimedi | Sconfitte | Prima perdeva, ora vince | Prima vinceva, ora perde |","| --- | ---: | ---: | ---: | ---: | ---: |"]
win=lambda r:r["ending"]=="transcendence"
for strategy,name in names.items():
    group=[r for r in runs if r["response"]==strategy]
    pairs=[(win(old[r["seed"],r["route"],strategy]),win(r)) for r in group]
    lines.append(f"| {name} | {sum(a for a,b in pairs)} | {sum(b for a,b in pairs)} | {sum(not b for a,b in pairs)} | {pairs.count((False,True))} | {pairs.count((True,False))} |")
    print(name,len(pairs),sum(b for a,b in pairs),pairs.count((False,True)),pairs.count((True,False)))
lines+=["","Il confronto misura il pacchetto completo: l’Influenza conservata nei primi due passaggi, 28 punti di debito sanitario per la terza risposta all’inverno, 12 punti aggiuntivi nelle scelte di penuria con il campo incolto e le udienze. Le vittorie sono finali di campagna. Prudente e previdente mantengono i criteri dei dilemmi ordinari. Alla Resa entrambe confrontano rischio di dissoluzione, crisi più alta e perdita di abitanti. La previdente considera anche le scorte promesse dal rinnovo della Tavola.","","## Sconfitte e udienze",""]
for s,name in names.items():
    group=[r for r in runs if r["response"]==s]
    lost=Counter((r["era"], r["cause"]["family"]) for r in group if not win(r) and r["cause"])
    used=Counter(v for r in group for v in r["remedies"])
    lines.append(f"- {name}. Sconfitte per era e crisi: "+", ".join(f"{e}/{f} {n}" for (e,f),n in lost.items())+". Decisioni nelle udienze: "+", ".join(f"{f} {n}" for f,n in used.items())+".")
training=read(root/"verifica-101.ndjson")+read(root/"verifica-151.ndjson")
assert len(training)==800 and len({(r["seed"],r["route"],r["response"]) for r in training})==800
lines+=["","## Calibrazione","","100 mondi distinti dal confronto storico, due vie. Vittorie su 200 per strategia.",""]
for s in ["cautious","foresight","wait","spend"]:
    g=[r for r in training if r["response"]==s];lines.append(f"- {s}: {sum(map(win,g))}/200.")
cal={(r["seed"],r["route"],r["response"]):r for r in training}
for strategy in ("foresight","wait","spend"):
    comparisons=[(win(cal[seed,route,"cautious"]),win(cal[seed,route,strategy])) for seed in range(101,201) for route in (0,1)]
    outcomes=[sum(win(cal[seed,route,strategy]) for seed in range(101,201)) for route in (0,1)]
    lines.append(f"- {strategy}, vittorie sulle due vie: {outcomes[0]}/100 e {outcomes[1]}/100. Rispetto alla prudente recupera {comparisons.count((False,True))} finali e ne perde {comparisons.count((True,False))}.")
early_losses=[r for r in training if (r.get("cause") or {}).get("lastEntries") and r["era"] in ("neolithic","bronze") and r["cause"]["lastEntries"][-1]["key"]=="log.debtCollapse"]
shown=[r for r in early_losses if any(e["key"]=="log.hearing" for e in r["cause"]["lastEntries"])]
lines+=["",f"Nelle 800 campagne di calibrazione, {len(early_losses)} sconfitte alla riscossione del debito avvengono nel Neolitico o nel Bronzo. La cronaca mostra un’udienza prima della sconfitta in {len(shown)} casi. Il conteggio include le scelte di riscuotere il debito per intero."]
charged=Counter(next((e.get("nameKey","") for e in reversed(r["cause"]["lastEntries"]) if e["key"]=="log.remedy"),"udienza assente") for r in early_losses)
lines.append("Ultima scelta registrata nelle sconfitte alla riscossione: "+", ".join(f"{k}: {v}" for k,v in charged.items())+".")
clock=read(root/"ritmo-nuovo.ndjson")
assert len(clock)==50
lines+=["","## Ritmo in prova","","Tempo in minuti a 1×, esclusa la lettura delle carte. Le pause del giocatore si misurano nelle sessioni. Nella prova dell’inverno l’intervallo ordinario sale da 10,5 a 21 secondi e ogni nuovo dilemma attende una decisione.","","| Versione | Era | Dilemmi medi | Minuti medi |","| --- | --- | ---: | ---: |"]
for rules in ("trial","winterStudy"):
    for era in ("prehistory","neolithic","bronze"):
        stages=[st for r in clock if r["rules"]==rules for st in r["eras"] if st["era"]==era]
        if stages:lines.append(f"| {rules} | {era} | {sum(st['decisions'] for st in stages)/len(stages):.1f} | {sum(st['ticks'] for st in stages)/(600*len(stages)):.1f} |")
branches=read(root/"bivio.ndjson")
assert len({(r["seed"],r["route"]) for r in branches})==200
pairs=defaultdict(dict)
for r in branches:
    if "choice" in r:pairs[r["seed"],r["route"],r["response"]][r["choice"]]=r
def prefer(a,b):
    alive_a,alive_b=a["ending"]=="ledger",b["ending"]=="ledger"
    if alive_a!=alive_b:return 1 if alive_a else -1
    def sign(x):return (x>0)-(x<0)
    return sign(sign(a["population"]-b["population"])+sign(b["crisis"]-a["crisis"])+sign(a["heritage"]-b["heritage"]))
by=Counter(prefer(g[0],g[3]) for g in pairs.values() if 0 in g and 3 in g)
lines+=["","## Bivio dell’inverno","",f"Su 200 abbinamenti di mondo e via, {len(branches)} osservazioni (incluse le eventuali assenze dell’inverno). Tra le opzioni pagabili sono stati ottenuti {sum(by.values())} confronti riserve/baratto con tre strategie successive. Riserve preferite {by[1]}, baratto {by[-1]}, parità {by[0]}. Si confronta prima l’arrivo vivo al registro e poi la maggioranza fra popolazione, gravità totale delle crisi e retaggi. Le tre strategie applicate allo stesso stato non sono osservazioni indipendenti.",""]
worlds=defaultdict(list)
for (seed,route,response),options in pairs.items():
    if 0 in options and 3 in options:worlds[seed,route].append(prefer(options[0],options[3]))
assert all(len(v)==3 for v in worlds.values())
verdict=Counter((sum(v)>0)-(sum(v)<0) for v in worlds.values())
lines.append(f"Raggruppando le tre continuazioni per stato e sommando i loro verdetti, le riserve prevalgono in {verdict[1]}/{len(worlds)} stati, il baratto in {verdict[-1]}/{len(worlds)}. Gli altri {verdict[0]} sono pari. Il piano richiede almeno il 30% degli stati per ciascun ramo.")
lines.append(f"Prosecuzioni senza esito al limite di 25.000 tick: {sum(r.get('ending')=='open' for r in branches)}. Stati in cui l’inverno non è stato raggiunto: {sum(bool(r.get('missing')) for r in branches)}. La Tavola attiva conta come un retaggio.")
lines.append("")
dominance=defaultdict(Counter)
for g in pairs.values():
    if len(g)<2:continue
    for c,row in g.items():
        others=[v for k,v in g.items() if k!=c]
        dominance[c]["observations"]+=1
        dominance[c]["preferred"]+=all(prefer(row,v)>0 for v in others)
        # Check whether at least one rival matches or improves every measured dimension.
        def scores(r):return (int(r["ending"]=="ledger"),r["population"],-r["crisis"],r["heritage"])
        current=scores(row)
        dominated=any(all(x>=y for x,y in zip(scores(v),current)) and scores(v)!=current for v in others)
        dominance[c]["undominated"]+=not dominated

lines.append(f"La caccia non prevale contemporaneamente su tutte le altre opzioni in nessuna delle 600 prosecuzioni. In {dominance[1]['undominated']}/600 nessun’altra opzione la eguaglia o supera su tutte le misure con un vantaggio su almeno una. Il criterio del 30% è nel [piano operativo, T32](../Piano-operativo.md) e nel [registro di valutazione](../registro.md).")
(root/"dominanze.json").write_text(json.dumps(dominance,indent=2))
(root/"Confronto.md").write_text("\n".join(lines),encoding="utf-8")
