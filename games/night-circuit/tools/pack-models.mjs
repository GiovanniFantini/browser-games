// Compact self-contained GLB geometry with the standard KHR_mesh_quantization extension.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const folder=path.join(root,'public/models');
let before=0,after=0;
for(const file of fs.readdirSync(folder).filter(n=>n.endsWith('.glb')&&(!process.argv[2]||n===process.argv[2]+'.glb'))){
 const name=path.join(folder,file),bytes=fs.readFileSync(name),jsonLength=bytes.readUInt32LE(12),json=JSON.parse(bytes.subarray(20,20+jsonLength));
 if(json.extensionsUsed?.includes('KHR_mesh_quantization'))continue;
 const bin=bytes.subarray(28+jsonLength),types=new Map();
 for(const mesh of json.meshes)for(const primitive of mesh.primitives)for(const [semantic,index] of Object.entries(primitive.attributes))types.set(index,semantic);
 const accessors=new Map(json.accessors.map((a,i)=>[a.bufferView,{a,i}]));const parts=[];let length=0;
 json.bufferViews.forEach((view,index)=>{
  const entry=accessors.get(index),old=bin.subarray(view.byteOffset??0,(view.byteOffset??0)+view.byteLength);let output=old;
  if(entry&&entry.a.componentType===5126&&['POSITION','NORMAL','TEXCOORD_0'].includes(types.get(entry.i))){
   const {a,i}=entry,type=types.get(i),n=a.type==='VEC2'?2:3,stride=type==='POSITION'?8:4;output=Buffer.alloc(a.count*stride);
   for(let j=0;j<a.count;j++)for(let k=0;k<n;k++){
    const value=old.readFloatLE((a.byteOffset??0)+(j*n+k)*4);
    if(type==='POSITION')output.writeInt16LE(Math.max(-32768,Math.min(32767,Math.round(value*4096))),j*stride+k*2);
    else if(type==='NORMAL')output.writeInt8(Math.max(-127,Math.min(127,Math.round(value*127))),j*stride+k);
    else output.writeUInt16LE(Math.max(0,Math.min(65535,Math.round(value*65535))),j*stride+k*2);
   }
   a.componentType=type==='POSITION'?5122:type==='NORMAL'?5120:5123;a.byteOffset=0;
   if(type==='POSITION'){a.min=a.min?.map(v=>Math.round(v*4096));a.max=a.max?.map(v=>Math.round(v*4096));a.normalized=false;}
   else a.normalized=true;
   view.byteStride=stride;
  }
  view.byteOffset=length;view.byteLength=output.length;parts.push(output);length+=output.length;
  if(length%4){const pad=Buffer.alloc(4-length%4);parts.push(pad);length+=pad.length;}
 });
 for(const node of json.nodes)if(node.mesh!==undefined){
  if(node.matrix){for(let c=0;c<3;c++)for(let r=0;r<4;r++)node.matrix[c*4+r]/=4096;}
  else node.scale=(node.scale??[1,1,1]).map(v=>v/4096);
 }
 json.extensionsUsed=[...(json.extensionsUsed??[]),'KHR_mesh_quantization'];json.extensionsRequired=[...(json.extensionsRequired??[]),'KHR_mesh_quantization'];json.buffers[0].byteLength=length;
 let text=Buffer.from(JSON.stringify(json));if(text.length%4)text=Buffer.concat([text,Buffer.alloc(4-text.length%4,32)]);
 const head=Buffer.alloc(20);head.writeUInt32LE(0x46546c67);head.writeUInt32LE(2,4);head.writeUInt32LE(28+text.length+length,8);head.writeUInt32LE(text.length,12);head.writeUInt32LE(0x4e4f534a,16);
 const binHead=Buffer.alloc(8);binHead.writeUInt32LE(length);binHead.writeUInt32LE(0x004e4942,4);
 const result=Buffer.concat([head,text,binHead,...parts]);fs.writeFileSync(name,result);before+=bytes.length;after+=result.length;
}
console.log(`GLB quantizzati: ${(before/1e6).toFixed(2)} -> ${(after/1e6).toFixed(2)} MB`);
