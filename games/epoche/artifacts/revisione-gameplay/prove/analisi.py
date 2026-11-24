"""Run after the continuity, calibration and branch simulations."""
import json
from collections import Counter, defaultdict
from random import Random
from statistics import mean
from pathlib import Path

base = Path(__file__).resolve().parent
def rows(name):
    return [json.loads(line) for line in (base / name).read_text(encoding="utf-8-sig").splitlines()]

history = rows("continuita.ndjson")
training = [row for start in (101, 126, 151, 176) for row in rows(f"{start}-{start+24}.ndjson")]
control = rows("1-25.ndjson")
for group, length in [(history,400),(training,1600),(control,50)]:
    assert len({(r["seed"],r["route"],r["response"]) for r in group}) == len(group) == length
    assert all(r["ending"] != "open" for r in group)
assert sum(r["decisions"] for r in history if r["response"] in ("first","random","cautious")) == 4869
assert all(r["ending"]=="transcendence" for r in control)
assert Counter(r["era"] for r in history if r["response"]=="cautious" and r["ending"]=="collapse")=={"neolithic":12,"future":4}
original = json.loads((base.parent / "originale" / "seme1.json").read_text(encoding="utf-8-sig"))
replay = next(r for r in history if (r["seed"],r["route"],r["response"])==(1,0,"cautious"))
assert all(replay[k]==v for k,v in original.items())

def table(data):
    return [(s,len(g),sum(r["reachedBronze"] for r in g),sum(r["ending"]=="transcendence" for r in g))
            for s in dict.fromkeys(r["response"] for r in data)
            for g in [[r for r in data if r["response"]==s]]]
out=["# Risultati delle strategie","", "Gioco ordinario in ritmo Rapido, entrambi i percorsi. Si contano separatamente ingresso vivo nel Bronzo e vittoria finale."]
for name,group in [("Continuità, 25 semi",history),("Calibrazione, 100 semi",training)]:
    out.extend(["","## "+name,"","| Strategia | Partite | Bronzo | Trascendenza |","| --- | ---: | ---: | ---: |"])
    out.extend("| %s | %d | %d | %d |"%r for r in table(group))
summary=defaultdict(dict)
for r in history+training:
    summary[(r["seed"],r["route"])][r["response"]]={"ending":r["ending"],"bronze":r["reachedBronze"]}
(base/"per-seme.ndjson").write_text("".join(json.dumps({"seed":s,"route":v,"strategies":g})+"\n" for (s,v),g in sorted(summary.items())))
out.extend(["","## Ipotesi","", "H1. In otto partite prudenti le scadenze raggiungono da sole 101. La crisi corrente può scendere a zero senza annullare quel debito. Un nuovo inverno offre il baratto, ma la ricomparsa è subordinata al calendario e al cooldown.",
"H2. Confrontare spend e cautious nelle tabelle. Differiscono nella scelta fatta vicino al passaggio. La differenza di vittorie misura la strategia nel suo complesso, senza isolare l’effetto della sola ricarica.",
"H3. Sui mondi 5 e 18 la prudente perde su entrambe le vie per la somma di scadenza e crisi preesistente. Gli stessi quattro tentativi attendisti vincono %d volte." % sum(r["ending"]=="transcendence" for r in history if r["seed"] in (5,18) and r["response"]=="wait"),
"H4. La previdente considera i debiti. Le sue vittorie misurano quanto è efficace anticipare i costi con le regole attuali. La preferenza di un giocatore richiede una sessione osservata."])
out.extend(["","## Differenze accoppiate sui semi di calibrazione","","Differenza di vittorie finali rispetto alla prudente, in punti percentuali. Intervallo percentile del bootstrap a 95%, 4.000 ricampionamenti dei 100 mondi. Le due vie dello stesso mondo restano insieme.","","| Strategia | Differenza | Intervallo |","| --- | ---: | ---: |"])
for policy in ("foresight","wait","spend","heritage","ordinary"):
    delta=[sum((summary[seed,route][policy]["ending"]=="transcendence")-(summary[seed,route]["cautious"]["ending"]=="transcendence") for route in (0,1))/2 for seed in range(101,201)]
    rng=Random(23)
    boot=sorted(sum(rng.choices(delta,k=100)) for _ in range(4000))
    out.append(f"| {policy} | {sum(delta):+.1f} | {boot[100]:+.1f} a {boot[3899]:+.1f} |")
transitions=rows("passaggi.ndjson")
assert len(transitions)==150
out.extend(["","## Influenza e ricomparsa dell’inverno","","| Strategia | Passaggi osservati | Influenza media prima | Influenza media dopo | Inverni ripetuti |","| --- | ---: | ---: | ---: | ---: |"])
for policy in ("cautious","spend","wait"):
    subset=[r for r in transitions if r["response"]==policy]
    advances=[a for r in subset for a in r["transitions"]]
    repeats=[b-a for r in subset for a,b in zip(r["winters"],r["winters"][1:])]
    out.append(f"| {policy} | {len(advances)} | {mean(a['before'] for a in advances):.1f} | {mean(a['after'] for a in advances):.1f} | {len(repeats)} |")
    if repeats:out.append(f"")
out.append("I passaggi sono quelli effettivamente raggiunti. Il file passaggi.ndjson conserva ogni tick, Influenza prima e dopo e tutti gli incontri dell’inverno per seme e via.")
(base/"Strategie.md").write_text("\n".join(out)+"\n",encoding="utf-8")

def branch_report():
    games=defaultdict(dict)
    for row in rows("rami.ndjson"):
        key=row["seed"],row["tick"],row["response"],row["event"]
        games[key][row["choice"]]=row
    assert len({(s,t) for s,t,_,_ in games})==200 and len(games)==600
    stats=defaultdict(Counter)
    def better(a,b):
        aw,bw=a["ending"]=="transcendence",b["ending"]=="transcendence"
        if aw!=bw:return aw
        def sign(x):return (x>0)-(x<0)
        return sign(a["population"]-b["population"])+sign(b["crisis"]-a["crisis"])+sign(a["heritage"]-b["heritage"])>0
    for (_,_,_,event),options in games.items():
        if len(options)<2:continue
        for i,row in options.items():
            others=[o for j,o in options.items() if j!=i]
            stats[event,i]["observations"]+=1
            stats[event,i]["preferred"]+=all(better(row,o) for o in others)
            stats[event,i]["beats_any"]+=any(better(row,o) for o in others)
    records=[dict(event=e,choice=c,**counts) for (e,c),counts in sorted(stats.items())]
    for r in records:r["flag"]=("oltre 65%" if r["preferred"]/r["observations"]>0.65 else "mai preferita nel campione" if not r["beats_any"] else "")
    (base/"dominanze.json").write_text(json.dumps(records,indent=2))
if __name__=="__main__":branch_report()
