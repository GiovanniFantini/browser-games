import towerData from "../../docs/dati-torri.json";
import enemyData from "../../docs/dati-nemici.json";
import type { CombatEvent } from "../combat/types";
import type { Family } from "../field/catalog";

export type TowerDefinition = (typeof towerData.nodes)[number];
export interface BuiltTower {
  readonly uid: string;
  readonly slot: string;
  readonly node: string;
  readonly paid: number;
}
export interface EconomyResult {
  readonly ok: boolean;
  readonly message: string;
  readonly balance: number;
  readonly change: number;
  readonly tower: BuiltTower | null;
}
export interface TransactionQuote {
  readonly id: number;
  readonly attempt: string;
  readonly action: "branch" | "sell";
  readonly uid: string;
  readonly slot: string;
  readonly sourceNode: string;
  readonly sourcePaid: number;
  readonly target: string | null;
  readonly amount: number;
  readonly refundPercent: number;
}
export interface Offer {
  readonly allowed: boolean;
  readonly message: string;
  readonly cost: number;
  readonly after: number;
  readonly missing: number;
}
export const towerDefinitions: readonly TowerDefinition[] = towerData.nodes;
export function towerDefinition(id: string): TowerDefinition {
  const node=towerData.nodes.find(definition=>definition.id===id);
  if(!node)throw new Error("Unknown tower node: "+id);
  return node;
}
export class AttemptEconomy {
  readonly attempt: string;
  readonly initial: number;
  private balanceValue: number;
  private started=false;
  private towerSerial=0;
  private quoteSerial=0;
  private slots: ReadonlySet<string>;
  private available: ReadonlySet<string>;
  private inventory=new Map<string,BuiltTower>();
  private quotes=new Map<number,TransactionQuote>();
  private credited=new Set<string>();
  private waveBonuses=new Set<string>();
  constructor(attempt: string, initial: number, slots: readonly string[], available: readonly string[]) {
    if(!attempt || !Number.isSafeInteger(initial) || initial<0 || !slots.length || slots.some(slot=>!slot) || new Set(slots).size!==slots.length)
      throw new Error("Invalid economy attempt");
    for(const id of available){
      const node=towerDefinition(id);
      if(node.parent&&!available.includes(node.parent))throw new Error("An unlocked node needs its parent");
    }
    this.attempt=attempt;this.initial=initial;this.balanceValue=initial;
    this.slots=new Set(slots);this.available=new Set(available);
  }
  get balance(): number {return this.balanceValue;}
  get refundPercent(): number {return this.started ? 70 : 100;}
  get firstWaveStarted(): boolean {return this.started;}
  get towers(): readonly BuiltTower[] {return [...this.inventory.values()];}
  at(slot: string): BuiltTower | null {return this.inventory.get(slot) ?? null;}
  byUid(uid: string): BuiltTower | null {return this.towers.find(tower=>tower.uid===uid) ?? null;}
  unlocked(node: string): boolean {return this.available.has(node);}
  markFirstWaveStarted(): void {this.started=true;}
  refund(tower: BuiltTower): number {return Math.floor(tower.paid*this.refundPercent/100);}
  private result(ok: boolean,message: string,change=0,tower: BuiltTower|null=null): EconomyResult {
    return {ok,message,balance:this.balanceValue,change,tower};
  }
  private offer(cost: number,reason=""): Offer {
    const missing=Math.max(0,cost-this.balanceValue);
    return {allowed:!reason&&!missing,message:reason || (missing ? "Mancano "+missing+" Scintille." : "Disponibile."),
      cost,after:this.balanceValue-cost,missing};
  }
  buildOffer(family: Family,slot: string): Offer {
    const base=towerDefinition(family+"-base");
    return this.offer(base.cost,!this.slots.has(slot) ? "Scegli una piazzola della mappa." : this.at(slot)
      ? "La piazzola è occupata. Puoi ispezionare o vendere la difesa presente."
      : !this.unlocked(base.id) ? "Questa famiglia non è disponibile nell’arsenale di questa prova." : "");
  }
  build(family: Family,slot: string): EconomyResult {
    const offer=this.buildOffer(family,slot);
    if(!offer.allowed)return this.result(false,offer.message);
    const node=towerDefinition(family+"-base");
    const tower=Object.freeze({uid:this.attempt+":tower:"+(++this.towerSerial),slot,node:node.id,paid:node.cost});
    this.balanceValue-=node.cost;this.inventory.set(slot,tower);
    return this.result(true,node.family+" costruita sulla piazzola "+slot+". Spese "+node.cost+" Scintille.",-node.cost,tower);
  }
  upgradeOffer(uid: string,target: string,expectedNode?: string): Offer {
    const tower=this.byUid(uid),node=towerDefinition(target);
    return this.offer(node.cost,!tower ? "Questa difesa non è più presente." : expectedNode&&tower.node!==expectedNode
      ? "La difesa è cambiata: riapri il confronto."
      : node.parent!==tower.node ? "Questo miglioramento non è il passaggio diretto della difesa. I rami sono esclusivi."
      : !this.unlocked(target) ? "Questo profilo non è disponibile nell’arsenale di questa prova." : "");
  }
  private invalidate(uid: string): void {
    for(const [id,quote]of this.quotes)if(quote.uid===uid)this.quotes.delete(id);
  }
  private upgrade(tower: BuiltTower,target: TowerDefinition): EconomyResult {
    const updated=Object.freeze({...tower,node:target.id,paid:tower.paid+target.cost});
    this.balanceValue-=target.cost;this.inventory.set(tower.slot,updated);this.invalidate(tower.uid);
    return this.result(true,target.family+" · "+target.name+" attiva. Spese "+target.cost+" Scintille.",-target.cost,updated);
  }
  upgradeCommon(uid: string,expectedNode: string): EconomyResult {
    const tower=this.byUid(uid);
    if(!tower)return this.result(false,"Questa difesa non è più presente.");
    if(tower.node!==expectedNode)return this.result(false,"La difesa è cambiata: riapri il confronto.");
    const current=towerDefinition(tower.node),child=towerData.nodes.find(node=>node.parent===current.id);
    if(current.parent||!child)return this.result(false,"Il miglioramento comune non è disponibile: consulta i rami della difesa.");
    const offer=this.upgradeOffer(uid,child.id,expectedNode);
    return offer.allowed ? this.upgrade(tower,child) : this.result(false,offer.message);
  }
  prepareBranch(uid: string,target: string): TransactionQuote | EconomyResult {
    const tower=this.byUid(uid),node=towerDefinition(target);
    const offer=this.upgradeOffer(uid,target);
    if(!tower||!offer.allowed)return this.result(false,offer.message);
    if(!towerDefinition(tower.node).parent)return this.result(false,"Prima serve il miglioramento comune.");
    return this.quote("branch",tower,node.id,node.cost);
  }
  prepareSell(uid: string): TransactionQuote | EconomyResult {
    const tower=this.byUid(uid);
    return tower ? this.quote("sell",tower,null,this.refund(tower)) : this.result(false,"Questa difesa non è più presente.");
  }
  private quote(action: TransactionQuote["action"],tower: BuiltTower,target: string|null,amount: number): TransactionQuote {
    const quote=Object.freeze({id:++this.quoteSerial,attempt:this.attempt,action,uid:tower.uid,slot:tower.slot,
      sourceNode:tower.node,sourcePaid:tower.paid,target,amount,refundPercent:this.refundPercent});
    this.quotes.set(quote.id,quote);return quote;
  }
  cancel(quote: TransactionQuote): void {if(this.quotes.get(quote.id)===quote)this.quotes.delete(quote.id);}
  confirm(quote: TransactionQuote): EconomyResult {
    const known=this.quotes.get(quote.id);
    if(known!==quote||quote.attempt!==this.attempt)return this.result(false,"La conferma non è più valida: riaprila.");
    this.quotes.delete(quote.id);
    const tower=this.at(quote.slot);
    if(!tower||tower.uid!==quote.uid||tower.node!==quote.sourceNode||tower.paid!==quote.sourcePaid)
      return this.result(false,"La difesa è cambiata: riapri la conferma.");
    if(quote.action==="sell"){
      if(quote.refundPercent!==this.refundPercent||quote.amount!==this.refund(tower))
        return this.result(false,"Il rimborso è cambiato: riapri la conferma per leggere il nuovo importo.");
      this.balanceValue+=quote.amount;this.inventory.delete(tower.slot);this.invalidate(tower.uid);
      return this.result(true,"Difesa venduta. Restituite "+quote.amount+" Scintille.",quote.amount);
    }
    if(!quote.target)return this.result(false,"Miglioramento mancante.");
    const offer=this.upgradeOffer(tower.uid,quote.target,quote.sourceNode);
    if(!offer.allowed)return this.result(false,offer.message);
    const target=towerDefinition(quote.target);
    if(target.cost!==quote.amount)return this.result(false,"Il costo è cambiato: riapri la conferma.");
    return this.upgrade(tower,target);
  }
  applyCombatReward(attempt: string,event: CombatEvent,enemyKind: string): EconomyResult {
    if(attempt!==this.attempt)return this.result(false,"L’evento appartiene a un altro tentativo.");
    const definition=enemyData.enemies.find(enemy=>enemy.id===enemyKind);
    if(event.type!=="neutralized"||!event.enemy||!definition||event.amount!==definition.reward)
      return this.result(false,"Questo evento non assegna una ricompensa valida.");
    if(this.credited.has(event.enemy))return this.result(true,"Ricompensa già conteggiata.");
    if(!Number.isSafeInteger(this.balanceValue+definition.reward))throw new Error("Unsafe economy balance");
    this.credited.add(event.enemy);this.balanceValue+=definition.reward;
    return this.result(true,"Neutralizzazione: "+definition.reward+" Scintille.",definition.reward);
  }
  awardWaveBonus(attempt:string,wave:string,bonus:number):EconomyResult{
    if(attempt!==this.attempt||!wave||!Number.isSafeInteger(bonus)||bonus<0)
      return this.result(false,"Bonus d’ondata non valido per questo tentativo.");
    if(this.waveBonuses.has(wave))return this.result(true,"Bonus già conteggiato.");
    if(!Number.isSafeInteger(this.balanceValue+bonus))throw new Error("Unsafe wave bonus balance");
    this.waveBonuses.add(wave);this.balanceValue+=bonus;
    return this.result(true,"Ondata risolta: "+bonus+" Scintille.",bonus);
  }
}
