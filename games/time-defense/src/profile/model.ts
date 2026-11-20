import { missionIds } from "../mission/content";
import type { MissionId } from "../mission/content";
export const profileKey="time-defense.profile.v1";
export interface Stamp {readonly at:number;readonly id:string;}
export interface Preferences {readonly stamp:Stamp;readonly motion:"system"|"reduce";readonly music:number;readonly effects:number;readonly muted:boolean;}
export interface BestResult {readonly ratio:number;readonly seconds:number;}
export interface Profile {readonly version:1;readonly epoch:Stamp;readonly visited:readonly MissionId[];readonly wins:Readonly<Partial<Record<MissionId,BestResult>>>;readonly seenIntro:boolean;readonly skipped:readonly MissionId[];readonly preferences:Preferences;}
export type ProfileIssue="corrupt"|"future";
export type Decoded={readonly profile:Profile;readonly issue:null}|{readonly profile:null;readonly issue:ProfileIssue};
export const starsForRatio=(ratio:number):number=>ratio>=.75?3:ratio>=.4?2:1;
export const freshProfile=():Profile=>({version:1,epoch:{at:0,id:"initial"},visited:[],wins:{},seenIntro:false,skipped:[],preferences:{stamp:{at:0,id:"initial"},motion:"system",music:.35,effects:.6,muted:false}});
export function canEnter(profile:Profile,id:MissionId):boolean{const index=missionIds.indexOf(id);return index===0||index>0&&Boolean(profile.wins[missionIds[index-1]!]);}
export function sagaComplete(profile:Profile):boolean{return missionIds.every(id=>Boolean(profile.wins[id]));}
const object=(value:unknown):value is Record<string,unknown>=>typeof value==="object"&&value!==null&&!Array.isArray(value);
const finite=(v:unknown,min:number,max:number):v is number=>typeof v==="number"&&Number.isFinite(v)&&v>=min&&v<=max;
const stamp=(v:unknown):v is Stamp=>object(v)&&finite(v.at,0,Number.MAX_SAFE_INTEGER)&&Number.isSafeInteger(v.at)&&typeof v.id==="string"&&v.id.length>0&&v.id.length<=100;
const ids=(v:unknown):v is MissionId[]=>Array.isArray(v)&&v.length<=missionIds.length&&v.every(id=>missionIds.includes(id))&&new Set(v).size===v.length;
export function decodeProfile(raw:string):Decoded{
  if(raw.length>65536)return{profile:null,issue:"corrupt"};
  let value:unknown;try{value=JSON.parse(raw);}catch{return{profile:null,issue:"corrupt"};}
  if(object(value)&&typeof value.version==="number"&&value.version>1)return{profile:null,issue:"future"};
  if(!object(value)||value.version!==1||!stamp(value.epoch)||!ids(value.visited)||!ids(value.skipped)||typeof value.seenIntro!=="boolean"||!object(value.wins)||!object(value.preferences))return{profile:null,issue:"corrupt"};
  const p=value.preferences;
  if(!stamp(p.stamp)||(p.motion!=="system"&&p.motion!=="reduce")||!finite(p.music,0,1)||!finite(p.effects,0,1)||typeof p.muted!=="boolean")return{profile:null,issue:"corrupt"};
  const wins:Partial<Record<MissionId,BestResult>>={};let previous=true;
  if(Object.keys(value.wins).some(id=>!missionIds.includes(id as MissionId)))return{profile:null,issue:"corrupt"};
  for(const id of missionIds){const best=value.wins[id];if(best!==undefined){if(!previous||!object(best)||!finite(best.ratio,Number.MIN_VALUE,1)||!finite(best.seconds,0,Number.MAX_SAFE_INTEGER)||!value.visited.includes(id))return{profile:null,issue:"corrupt"};wins[id]={ratio:best.ratio,seconds:best.seconds};}else previous=false;}
  const visited=value.visited,skipped=value.skipped;
  const profile:Profile={version:1,epoch:{...value.epoch},visited:missionIds.filter(id=>visited.includes(id)),wins,seenIntro:value.seenIntro,skipped:missionIds.filter(id=>skipped.includes(id)),preferences:{stamp:{...p.stamp},motion:p.motion,music:p.music,effects:p.effects,muted:p.muted}};
  if(profile.visited.some(id=>!canEnter(profile,id))||profile.skipped.some(id=>!profile.visited.includes(id)))return{profile:null,issue:"corrupt"};
  return{profile,issue:null};
}
export const compareStamp=(a:Stamp,b:Stamp):number=>a.at-b.at||(a.id<b.id?-1:a.id>b.id?1:0);
export function mergeProfiles(a:Profile,b:Profile):Profile{
  const generation=compareStamp(a.epoch,b.epoch);if(generation)return generation>0?a:b;
  const wins:Partial<Record<MissionId,BestResult>>={};for(const id of missionIds){const x=a.wins[id],y=b.wins[id];if(x||y)wins[id]=x&&y?{ratio:Math.max(x.ratio,y.ratio),seconds:Math.min(x.seconds,y.seconds)}:{...(x??y)!};}
  const pref=compareStamp(a.preferences.stamp,b.preferences.stamp)>=0?a.preferences:b.preferences;
  return{version:1,epoch:a.epoch,visited:missionIds.filter(id=>a.visited.includes(id)||b.visited.includes(id)),wins,seenIntro:a.seenIntro||b.seenIntro,skipped:missionIds.filter(id=>a.skipped.includes(id)||b.skipped.includes(id)),preferences:pref};
}
export function visitProfile(p:Profile,id:MissionId):Profile{if(!canEnter(p,id)||p.visited.includes(id))return p;return{...p,visited:missionIds.filter(level=>level===id||p.visited.includes(level))};}
export function winProfile(p:Profile,id:MissionId,ratio:number,seconds:number):Profile{
  if(!canEnter(p,id)||!finite(ratio,Number.MIN_VALUE,1)||!finite(seconds,0,Number.MAX_SAFE_INTEGER))return p;
  const best=p.wins[id];return{...visitProfile(p,id),wins:{...p.wins,[id]:{ratio:Math.max(ratio,best?.ratio??0),seconds:Math.min(seconds,best?.seconds??Infinity)}}};
}
export const encodeProfile=(profile:Profile):string=>JSON.stringify(profile);
