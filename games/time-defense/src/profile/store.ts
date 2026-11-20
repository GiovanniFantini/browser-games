import { compareStamp,decodeProfile,encodeProfile,freshProfile,mergeProfiles,profileKey,visitProfile,winProfile } from "./model";
import type { Preferences,Profile,ProfileIssue } from "./model";
import type { MissionId } from "../mission/content";
export interface ProfileStorage {getItem(key:string):string|null;setItem(key:string,value:string):void;}
export type StorageIssue=ProfileIssue|"unavailable"|"removed"|null;
export type ProfileChange="update"|"reset"|"storage";
export class ProfileStore {
  private value:Profile=freshProfile();private port:ProfileStorage|null;private writable=true;private listeners=new Set<(kind:ProfileChange)=>void>();private now:()=>number;private writer:string;private serial=0;private hadDisk=false;
  issue:StorageIssue=null;original:string|null=null;
  constructor(port:ProfileStorage|null,now:()=>number=Date.now,writer:string=Math.random().toString(36).slice(2)){this.port=port;this.now=now;this.writer=writer;const loaded=this.read();if(loaded)this.value=loaded;else if(this.writable)this.persist();}
  get profile():Profile{return this.value;}
  get saved():boolean{return this.issue===null;}
  get epoch():string{return this.value.epoch.at+":"+this.value.epoch.id;}
  subscribe(listener:(kind:ProfileChange)=>void):()=>void{this.listeners.add(listener);return()=>{this.listeners.delete(listener);};}
  private emit(kind:ProfileChange):void{for(const listener of this.listeners)listener(kind);}
  private read():Profile|null{try{if(!this.port)throw new Error("Storage unavailable");const raw=this.port.getItem(profileKey);if(raw===null){if(this.hadDisk){this.issue="removed";this.writable=false;}return null;}const decoded=decodeProfile(raw);if(!decoded.profile){this.original=raw;this.issue=decoded.issue;this.writable=false;return null;}this.hadDisk=true;return decoded.profile;}catch{this.issue="unavailable";this.writable=false;return null;}}
  private persist():void{if(!this.writable)return;try{if(!this.port)throw new Error("Storage unavailable");this.port.setItem(profileKey,encodeProfile(this.value));this.issue=null;this.original=null;this.hadDisk=true;}catch{this.issue="unavailable";this.writable=false;}}
  private synchronize():ProfileChange{
    if(!this.writable)return"update";const disk=this.read();if(!disk)return"update";const oldEpoch=this.epoch;this.value=mergeProfiles(this.value,disk);return this.epoch===oldEpoch?"update":"reset";
  }
  private change(update:(p:Profile)=>Profile,expectedEpoch?:string):boolean{
    const kind=this.synchronize();if(expectedEpoch&&expectedEpoch!==this.epoch){this.emit(kind);return false;}
    const next=decodeProfile(encodeProfile(update(this.value)));if(!next.profile)return false;this.value=next.profile;this.persist();this.emit(kind);return true;
  }
  visit(id:MissionId,epoch?:string):void{this.change(p=>visitProfile(p,id),epoch);}
  win(id:MissionId,ratio:number,seconds:number,epoch:string):boolean{return this.change(p=>winProfile(p,id,ratio,seconds),epoch);}
  introSeen():void{if(!this.value.seenIntro)this.change(p=>({...p,seenIntro:true}));}
  skip(id:MissionId):void{this.change(p=>p.visited.includes(id)?{...p,skipped:[...new Set([...p.skipped,id])]}:p);}
  settings(patch:Partial<Pick<Preferences,"motion"|"music"|"effects"|"muted">>):void{this.change(p=>({...p,preferences:{...p.preferences,...patch,stamp:{at:Math.max(this.now(),p.preferences.stamp.at+1),id:this.writer}}}));}
  retry():void{if(this.issue==="corrupt"||this.issue==="future"||this.issue==="removed")return;this.writable=true;const kind=this.synchronize();this.persist();this.emit(kind);}
  replace(profile:Profile):void{
    // Only explicit, confirmed reset/import may replace unreadable or removed data.
    const disk=this.read(),at=Math.max(this.now(),this.value.epoch.at+1,(disk?.epoch.at??0)+1);this.value={...profile,epoch:{at,id:this.writer+":"+(++this.serial)}};this.writable=true;this.issue=null;this.persist();this.emit("reset");
  }
  external():void{
    try{if(!this.port)throw new Error("Storage unavailable");const raw=this.port.getItem(profileKey);if(raw===null){this.issue="removed";this.writable=false;this.emit("storage");return;}}catch{this.issue="unavailable";this.writable=false;this.emit("storage");return;}
    const disk=this.read();if(!disk){this.emit("storage");return;}const oldEpoch=this.epoch,order=compareStamp(disk.epoch,this.value.epoch);this.value=mergeProfiles(this.value,disk);this.writable=true;this.issue=null;this.original=null;
    if(order<=0&&encodeProfile(this.value)!==encodeProfile(disk))this.persist();this.emit(this.epoch===oldEpoch?"update":"reset");
  }
}
export function browserProfileStore():ProfileStore{
  // Resolve the browser getter on every attempt, so Retry also recovers a permission failure.
  const port:ProfileStorage={getItem:key=>window.localStorage.getItem(key),setItem:(key,value)=>window.localStorage.setItem(key,value)};
  const store=new ProfileStore(port);window.addEventListener("storage",event=>{if(event.key===profileKey||event.key===null)store.external();});return store;
}
