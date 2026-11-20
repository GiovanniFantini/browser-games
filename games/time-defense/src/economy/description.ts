import signals from "../../docs/dati-segnali.json";
import effects from "../../docs/dati-effetti-combattimento.json";
import type { TowerDefinition } from "./model";
const value=(number:number):string=>String(number).replace(".",",");
export function describeTower(node:TowerDefinition):string{
  const details=[node.family+" · "+node.name,
    node.kind.startsWith("spore")?node.damage+" Carica/s "+(node.kind==="spore-area"?"nell’area":"per marchio"):"Danno fisico "+node.damage+(node.id==="resina-colla"?" al solo bersaglio iniziale":""),
    "Intervallo "+value(node.interval)+" s","Gittata "+node.range];
  if(node.duration)details.push("Durata "+value(node.duration)+" s");
  if(node.targets&&node.targets>1)details.push("Fino a "+node.targets+" bersagli distinti");
  if(node.penetration)details.push("Ignora "+node.penetration+" punti di Protezione fisica sul proprio colpo");
  if(node.area)details.push("Raggio dell’area "+node.area);
  if(node.sharedReduction)details.push("Riduce la Protezione fisica di "+node.sharedReduction+" punti per "+value(node.reductionDuration!)+" s dopo il colpo");
  if(node.maxMarks)details.push("Massimo "+node.maxMarks+" bersagli, compresi i semi in volo");
  if(node.maxAreas)details.push("Massimo "+node.maxAreas+" aree per torre");
  if(node.id==="resina-colla")details.push("Rallentamento in uscita "+value(effects["resina-colla"].linger)+" s");
  if(node.id==="resina-ambra")details.push("Dopo l’arresto: immunità condivisa a nuovi arresti "+value(signals.root.normalImmunity)+" s, sul Custode "+value(signals.root.bossImmunity)+" s");
  details.push(node.note.replace(/[.\s]+$/,""));
  return details.join(". ")+".";
}
