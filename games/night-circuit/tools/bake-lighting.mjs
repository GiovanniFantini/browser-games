// Deterministic, local lightmap baking. Node standard library only; no image assets.
import { deflateSync } from 'node:zlib';
import { writeFileSync,mkdirSync,readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.join(root,'public/generated');mkdirSync(out,{recursive:true});
const crcTable=Array.from({length:256},(_,n)=>{for(let j=0;j<8;j++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
function chunk(type,data){const name=Buffer.from(type),payload=Buffer.concat([name,data]);let crc=0xffffffff;for(const b of payload)crc=crcTable[(crc^b)&255]^(crc>>>8);const head=Buffer.alloc(4),tail=Buffer.alloc(4);head.writeUInt32BE(data.length);tail.writeUInt32BE((crc^0xffffffff)>>>0);return Buffer.concat([head,payload,tail]);}
function png(size,rgb){const header=Buffer.alloc(13);header.writeUInt32BE(size);header.writeUInt32BE(size,4);header[8]=8;header[9]=2;const rows=Buffer.alloc(size*(size*3+1));for(let y=0;y<size;y++){rows[y*(size*3+1)]=0;for(let x=0;x<size*3;x++)rows[y*(size*3+1)+1+x]=Math.max(0,Math.min(255,Math.round(rgb[y*size*3+x]*255)));}return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(rows,{level:9})),chunk('IEND',Buffer.alloc(0))]);}
function bake(file,size,bounds,sources){const rgb=new Float32Array(size*size*3);for(let i=0;i<rgb.length;i+=3){rgb[i]=.017;rgb[i+1]=.022;rgb[i+2]=.022;}for(const source of sources){const [x,z,rx,rz,r,g,b]=source;const u=(x-bounds[0])/bounds[2]*size,v=(z-bounds[1])/bounds[3]*size,ax=rx/bounds[2]*size,az=rz/bounds[3]*size;for(let py=Math.max(0,Math.floor(v-az*2.5));py<Math.min(size,v+az*2.5);py++)for(let px=Math.max(0,Math.floor(u-ax*2.5));px<Math.min(size,u+ax*2.5);px++){const d=((px-u)/ax)**2+((py-v)/az)**2,p=Math.exp(-d*1.7),i=(py*size+px)*3;rgb[i]+=r*p;rgb[i+1]+=g*p;rgb[i+2]+=b*p;}}writeFileSync(path.join(out,file),png(size,rgb));}
const sources=[];
for(const [index,[ox,oz]] of [[0,[0,0]],[1,[1080,0]],[2,[1080,1080]],[3,[0,1080]]]){
  for(let a=-480;a<=480;a+=120)for(let b=-420;b<=420;b+=120)for(const side of [-1,1]){
    const cool=(Math.round((a+480)/120)+Math.round((b+420)/120)+(side>0?1:0)+index)%3===0;
    const color=cool?[.12,.32,.37]:[.43,.28,.11];
    sources.push([ox+a+side*14,oz+b,13,22,...color],[ox+b,oz+a+side*14,22,13,...color]);
  }
  for(let x=-420;x<=420;x+=120)for(let z=-420;z<=420;z+=120){sources.push([ox+x-20,oz+z-38,10,7,.22,.1,.05],[ox+x+20,oz+z-38,9,8,.04,.16,.18]);}
}
const tunnel=[];for(let z=-342;z<=-262;z+=16)for(const x of [-8.5,6])tunnel.push([x,z,8,10,.77,.57,.23]);
for(let z=-342;z<=-262;z+=16)tunnel.push([0,z+8,13,8,.13,.22,.18]);
bake('city-lightmap.png',512,[-600,-600,2800,2600],sources);
bake('underpass-lightmap.png',512,[-24,-360,48,116],tunnel);
writeFileSync(path.join(root,'src/gen/lighting/bake.json'),JSON.stringify({version:1,cityBounds:[-600,-600,2800,2600],underpassBounds:[-24,-360,48,116],sources:sources.length,underpassSources:tunnel.length,size:512})+'\n');
const catalog=JSON.parse(readFileSync(path.join(root,'src/data/career.json'),'utf8'));
console.log(`Lightmap generate: ${sources.length+tunnel.length} sorgenti statiche, ${catalog.districts.length} quartieri.`);
