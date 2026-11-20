import { containsPoint } from "../field/geometry";
import type { Rect } from "../field/geometry";

interface Fade {
  alpha:number;
  faded:boolean;
  since:number|null;
  lastTime:number;
  changedAt:number;
}

/** Visual state only, timed by the simulation so pause also freezes the transition. */
export class TowerOcclusion {
  private readonly fades=new Map<string,Fade>();

  retain(uids:ReadonlySet<string>):void {
    for(const uid of this.fades.keys())if(!uids.has(uid))this.fades.delete(uid);
  }

  opacity(uid:string,tower:Rect,enemies:readonly Rect[],time:number,selected:boolean,
    reduced:boolean,settled:boolean):number {
    if(!uid)return 1; // An unbuilt preview already has its own half-opacity treatment.
    let state=this.fades.get(uid);
    if(!state||time<state.lastTime){state={alpha:1,faded:false,since:null,lastTime:time,changedAt:-Infinity};this.fades.set(uid,state);}
    const dt=Math.max(0,time-state.lastTime);state.lastTime=time;
    if(settled){state.alpha=1;state.faded=false;state.since=null;state.changedAt=-Infinity;return 1;}

    let covered=0,centerCovered=0;
    for(const enemy of enemies){
      const area=enemy.width*enemy.height;if(area<=0)continue;
      const width=Math.max(0,Math.min(tower.x+tower.width,enemy.x+enemy.width)-Math.max(tower.x,enemy.x));
      const height=Math.max(0,Math.min(tower.y+tower.height,enemy.y+enemy.height)-Math.max(tower.y,enemy.y));
      const fraction=width*height/area;covered=Math.max(covered,fraction);
      if(containsPoint(tower,{x:enemy.x+enemy.width/2,y:enemy.y+enemy.height/2}))centerCovered=Math.max(centerCovered,fraction);
    }
    // Entry needs sustained meaningful cover, not a corner touch. The lower exit
    // threshold and hold keep feet, tails and neighbouring pack members from flickering.
    const changing=state.faded?covered<0.22:centerCovered>=0.45;
    if(changing){
      state.since??=time;
      const delay=state.faded?0.5:0.1,minimumHold=state.faded?0.8:0.35;
      if(time-state.since+1e-9>=delay&&time-state.changedAt+1e-9>=minimumHold){state.faded=!state.faded;state.changedAt=time;state.since=null;}
    }else state.since=null;

    const target=state.faded?0.55:1;
    if(reduced)state.alpha=target;
    else if(dt>0)state.alpha=target+(state.alpha-target)*Math.exp(-dt/0.08);
    if(Math.abs(state.alpha-target)<1e-4)state.alpha=target;
    return Math.max(selected?0.6:0.55,Math.min(1,state.alpha));
  }
}
