export interface WaterSegment {readonly path:string;readonly from:number;readonly to:number;}
export function inWater(kind:string,path:string,distance:number,segment?:WaterSegment):boolean{
  return kind==="guado"&&segment!==undefined&&path===segment.path&&distance>=segment.from&&distance<=segment.to;
}
