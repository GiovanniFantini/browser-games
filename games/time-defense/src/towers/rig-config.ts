import type { Family } from "../field/catalog";
import type { Point } from "../field/geometry";
export interface RigConfig {
  readonly family: Family;
  readonly column: number;
  readonly height: number;
  readonly headWidth: number;
  readonly mounts: readonly Point[];
  readonly allySize: number;
  readonly arms: readonly [number, number];
}
const point=(x:number,y:number):Point=>({x,y});
const make=(family:Family,column:number,height:number,headWidth=0,mounts:readonly Point[]=[],allySize=0,arms:readonly[number,number]=[0,0]):RigConfig=>
  ({family,column,height,headWidth,mounts,allySize,arms});
export const rigConfigs:Readonly<Record<string,RigConfig>>={
  "resina-base":make("resina",0,180,72,[point(51,-79)]),
  "resina-radici":make("resina",1,195,78,[point(55,-85)]),
  "resina-colla":make("resina",2,165,100,[point(43,-76)]),
  "resina-ambra":make("resina",3,210,85,[point(38,-87)]),
  "spore-base":make("spore",0,135,100,[point(14,-93)]),
  "spore-corolla":make("spore",1,145,90,[point(-26,-109),point(27,-106)]),
  "spore-nube":make("spore",2,140,190,[point(0,-107)]),
  "spore-parassita":make("spore",3,170,50,[point(-10,-110)]),
  "nido-base":make("nido",0,185,0,[point(0,-146)],88),
  "nido-vedetta":make("nido",1,205,0,[point(0,-166)],92),
  "nido-stormo":make("nido",2,195,0,[point(0,-163),point(-77,-109),point(74,-109)],62),
  "nido-picchiata":make("nido",3,215,0,[point(0,-178)],105),
  "roccia-base":make("roccia",0,150,0,[point(-39,-102),point(39,-102)],0,[75,75]),
  "roccia-massiccio":make("roccia",1,170,0,[point(-45,-113),point(45,-113)],0,[90,90]),
  "roccia-frantuma":make("roccia",2,150,0,[point(-38,-102),point(38,-102)],0,[52,108]),
  "roccia-sisma":make("roccia",3,115,0,[point(-42,-78),point(42,-78)],0,[90,90]),
};
export function rigConfig(node:string):RigConfig{
  const config=rigConfigs[node];if(!config)throw new Error("Unknown tower rig: "+node);return config;
}
