import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mesh } from './geometry.ts';
import { applyCharacterCel } from './character-cel.ts';
import { gokuArm, gokuLeg } from './goku-limbs.ts';
import { curvedLoft, profileSampler } from './goku-surfaces.ts';
import { addGokuHair as addHair } from './goku-hair.ts';
import { addGokuClothes as addGi } from './goku-clothes.ts';
import type { Character } from './characters.ts';

type Point = [number, number, number];
type Ring = [y: number, width: number, front: number, back: number, x?: number, z?: number];
const C = { skin: 0xffc18b, shade: 0xd88e54, ink: 0x171820, blue: 0x375da0, fold: 0x20385e, seam: 0x182741, trousers: 0x375da0, belt: 0xe4e2d4, beltShade: 0xa5a9a5, wrist: 0xb82326, shoe: 0x202128, tail: 0x88522f };

// Organic surfaces sampled from cubic control profiles.
function loft(parent:THREE.Object3D,colour:number,rings:Ring[],sides=12){
  return mesh(curvedLoft(rings,sides,Math.max(6,rings.length+3)),colour,parent);
}
function line(parent:THREE.Object3D,colour:number,points:Point[],width=.007,segments=8){
  return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),segments,width,3,false),colour,parent);
}
function joint(parent:THREE.Object3D,name:string,position:Point){const group=new THREE.Group();group.name=name;group.position.set(...position);parent.add(group);return group;}


// Broad cheeks over a small, short chin.
const headRings:Ring[]=[[-.35,.035,.07,.055],[-.315,.12,.185,.13],[-.245,.25,.25,.20],[-.14,.30,.28,.255],[.02,.329,.28,.297],[.18,.32,.26,.29],[.31,.25,.18,.23],[.39,.075,.05,.07],[.405,.005,.005,.005]];
const sampleHead=profileSampler(headRings);
function faceDepth(x:number,y:number){
  const [,w,depth]=sampleHead(y);
  const base=depth*Math.pow(Math.max(0,1-(x/w)**2),.40);
  const nose=.025*Math.exp(-((x/.045)**2+((y+.112)/.047)**2));
  const cheeks=.008*(Math.exp(-(((x-.17)/.10)**2+((y+.14)/.10)**2))+Math.exp(-(((x+.17)/.10)**2+((y+.14)/.10)**2)));
  return base+nose+cheeks;
}
function faceAtlas(){
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=1024;const c=canvas.getContext('2d')!;
  for(let frame=0;frame<2;frame++){
    c.save();c.translate(0,frame*512);c.strokeStyle='#191921';c.lineCap='round';c.lineJoin='round';
    for(const side of [-1,1]){
      c.save();c.translate(256,0);c.scale(side,1);
      // BT3's eye shape is broad and oblique, cut by a descending inner brow.
      if(frame===0){
        // Open, nearly round whites with a slanted upper-inner edge, as on Kid Goku.
        c.fillStyle='#fffdf2';c.lineWidth=4;c.beginPath();c.moveTo(27,269);c.bezierCurveTo(53,234,114,192,151,209);c.bezierCurveTo(184,224,184,310,153,337);c.quadraticCurveTo(99,357,45,329);c.quadraticCurveTo(27,306,27,269);c.closePath();c.fill();c.stroke();
        c.fillStyle='#111219';c.beginPath();c.ellipse(74,282,14,25,-.10,0,Math.PI*2);c.fill();
      }else{c.lineWidth=5;c.beginPath();c.moveTo(29,294);c.quadraticCurveTo(96,320,166,283);c.stroke();}
      c.fillStyle='#11121a';c.beginPath();c.moveTo(18,238);c.lineTo(157,184);c.lineTo(169,204);c.lineTo(27,255);c.closePath();c.fill();
      c.lineWidth=3;c.beginPath();c.moveTo(105,364);c.lineTo(148,358);c.moveTo(115,373);c.lineTo(140,368);c.stroke();
      c.restore();
    }
    // Neutral closed mouth. No permanent grin or drawn-on teeth.
    c.strokeStyle='#523126';c.lineWidth=3;c.beginPath();c.moveTo(222,410);c.quadraticCurveTo(256,409,290,410);c.stroke();
    c.strokeStyle='#a16a48';c.lineWidth=2;c.beginPath();c.moveTo(250,342);c.quadraticCurveTo(242,354,257,354);c.stroke();
    c.restore();
  }
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.repeat.y=.5;texture.offset.y=.5;
  return texture;
}
function addFace(head:THREE.Group,atlas:THREE.Texture){
  const positions:number[]=[],uv:number[]=[],indices:number[]=[],nx=16,ny=14;
  for(let iy=0;iy<=ny;iy++)for(let ix=0;ix<=nx;ix++){
    const u=ix/nx,v=iy/ny,x=(u-.5)*.637,y=.265-v*.565;
    positions.push(x,y,faceDepth(x,y)+.009);uv.push(u,1-v);
    if(ix<nx&&iy<ny){const a=iy*(nx+1)+ix;indices.push(a,a+nx+1,a+1,a+1,a+nx+1,a+nx+2);}
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();
  const face=new THREE.Mesh(g,new THREE.MeshBasicMaterial({map:atlas,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}));face.name='goku-face';face.renderOrder=2;head.add(face);

}
function addEars(head:THREE.Group){
  for(const side of [-1,1]){
    const ear=joint(head,'ear',[side*.345,-.095,-.02]);ear.rotation.y=side*.65;
    // Concave bowl and rounded C-shaped helix, angled out from the skull.
    const positions:number[]=[0,0,-.012],indices:number[]=[],segments=16;
    for(let ring=1;ring<=3;ring++)for(let i=0;i<segments;i++){
      const r=ring/3,a=i/segments*Math.PI*2;
      positions.push(Math.cos(a)*.065*r,Math.sin(a)*.105*r,.018-.03*(1-r*r));
      const v=1+(ring-1)*segments+i,next=1+(ring-1)*segments+(i+1)%segments;
      if(ring===1)indices.push(0,v,next);
      else indices.push(v-segments,v,next-segments,v,next,next-segments);
    }
    const backCenter=positions.length/3;positions.push(0,0,-.035);
    const backStart=positions.length/3;
    for(let i=0;i<segments;i++){const a=i/segments*Math.PI*2;positions.push(Math.cos(a)*.065,Math.sin(a)*.105,-.02);}
    for(let i=0;i<segments;i++){
      const j=(i+1)%segments,front=1+2*segments+i,frontNext=1+2*segments+j;
      indices.push(backCenter,backStart+j,backStart+i,front,backStart+i,frontNext,frontNext,backStart+i,backStart+j);
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();mesh(g,C.skin,ear);
    const helix=Array.from({length:12},(_,i)=>{const a=THREE.MathUtils.lerp(-Math.PI*.80,Math.PI*.80,i/11);return new THREE.Vector3(side*Math.cos(a)*.055,Math.sin(a)*.087,.027);});
    mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(helix),16,.01,5,false),C.skin,ear);
    line(ear,0xaf7851,[[side*.005,-.055,.009],[side*.023,-.012,.012],[side*.008,.025,.014]],.0025,6);
  }
}

const faceRamp=new THREE.DataTexture(new Uint8Array([215,238,255]),3,1,THREE.RedFormat);
faceRamp.minFilter=THREE.NearestFilter;faceRamp.magFilter=THREE.NearestFilter;faceRamp.needsUpdate=true;
function softenFaceLighting(head:THREE.Group){
  const copies=new Map<THREE.Material,THREE.MeshToonMaterial>();
  head.traverse(node=>{
    if(!(node instanceof THREE.Mesh)||!(node.material instanceof THREE.MeshToonMaterial))return;
    const old=node.material;
    if(old.color.getHex()!==C.skin&&old.color.getHex()!==C.shade)return;
    if(!copies.has(old)){const copy=old.clone();copy.gradientMap=faceRamp;copies.set(old,copy);}
    node.material=copies.get(old)!;
  });
}
// Under-chin normals lean forward so the darkest cel band no longer reads as a beard.
function softenChin(g:THREE.BufferGeometry){
  const p=g.attributes.position,n=g.attributes.normal,v=new THREE.Vector3(),f=new THREE.Vector3();
  for(let i=0;i<p.count;i++){
    if(p.getZ(i)<0)continue;
    const k=THREE.MathUtils.smoothstep(-p.getY(i),.15,.30)*.65;if(!k)continue;
    v.set(n.getX(i),n.getY(i),n.getZ(i));f.set(v.x,-.15,Math.max(v.z,.5)).normalize();
    v.lerp(f,k).normalize();n.setXYZ(i,v.x,v.y,v.z);
  }
  n.needsUpdate=true;
}
function mergeParts(root:THREE.Group){
  const staticNames=new Set(['ear','goku-hair','gi-skirt','nyoibo','hand']);
  const staticGroups:THREE.Object3D[]=[];root.traverse(node=>{if(staticNames.has(node.name))staticGroups.push(node);});
  for(const group of staticGroups){
    const parent=group.parent!;group.updateMatrix();
    for(const child of [...group.children])if(child instanceof THREE.Mesh){
      child.updateMatrix();child.geometry=child.geometry.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(group.matrix,child.matrix));
      child.position.set(0,0,0);child.rotation.set(0,0,0);child.scale.set(1,1,1);parent.add(child);
    }
    parent.remove(group);
  }
  const parents:THREE.Object3D[]=[];root.traverse(p=>parents.push(p));
  for(const parent of parents){
    const batches=new Map<THREE.Material,THREE.Mesh[]>();
    for(const child of parent.children)if(child instanceof THREE.Mesh && child.material instanceof THREE.MeshToonMaterial){const batch=batches.get(child.material)??[];batch.push(child);batches.set(child.material,batch);}
    for(const [material,parts] of batches){if(parts.length<2)continue;
      const copies=parts.map(p=>{p.updateMatrix();const g=p.geometry.clone().applyMatrix4(p.matrix);g.deleteAttribute('uv');return g;});
      const merged=mergeGeometries(copies,false);copies.forEach(g=>g.dispose());if(!merged)continue;
      const object=new THREE.Mesh(merged,material);object.castShadow=true;object.receiveShadow=true;parent.add(object);parts.forEach(p=>parent.remove(p));
    }
  }
}

export function createKidGoku():Character {
  const root=new THREE.Group();root.name='goku';root.userData.modelRevision='kid-goku-ps2-opus-cycle-4';
  const body=joint(root,'goku-body',[0,0,0]);
  const head=joint(body,'goku-head',[0,2.10,0]);head.scale.set(.99,.99,.99);root.userData.portraitTarget=2.27;
  softenChin(mesh(curvedLoft(headRings,24,20,(p,a)=>{if(Math.cos(a)>0)p.z=faceDepth(p.x,p.y);}),C.skin,head).geometry);addEars(head);
  const atlas=faceAtlas();addFace(head,atlas);addHair(head);
  loft(body,C.skin,[[1.64,.09,.085,.09],[1.83,.085,.08,.09]],10);
  const gi=joint(body,'goku-gi',[0,.065,0]);gi.scale.set(.91,1.09,.94);addGi(gi,C);
  const arms=[gokuArm(body,-1,C),gokuArm(body,1,C)],legs=[gokuLeg(body,-1,C),gokuLeg(body,1,C)];
  const tail=joint(body,'goku-tail',[0,1.12,-.17]);
  line(tail,C.tail,[[0,0,0],[.27,-.035,-.29],[.60,.05,-.34],[.80,.28,-.28],[.79,.46,-.18],[.68,.53,-.12]],.055,20);
  mergeParts(root);
  // No cast-shadow blotches from hair or chin on the face, as in the PS2 model.
  head.traverse(node=>{if(node instanceof THREE.Mesh)node.receiveShadow=false;});
  applyCharacterCel(root);
  softenFaceLighting(head);
  return {root,animate(time,speed,airborne=false){
    const stride=Math.sin(time*9.5)*Math.min(speed,1)*.62;
    legs.forEach(({leg,knee},i)=>{leg.rotation.x=airborne?(i===0?-.7:.28):(i===0?stride:-stride);knee.rotation.x=airborne?.85:Math.max(0,(i===0?-stride:stride))*.65;});
    arms.forEach(({arm,elbow},i)=>{arm.rotation.x=airborne?-1.25:(i===0?-stride:stride)*.8;arm.rotation.z=(i===0?-1:1)*.12;elbow.rotation.x=-.14;});
    if(root.userData.pose==='ready'){
      arms[0].arm.rotation.set(-.72,0,-.4);arms[1].arm.rotation.set(-.48,0,.42);arms.forEach(({elbow})=>elbow.rotation.x=-1.0);
      legs[0].leg.rotation.z=-.10;legs[1].leg.rotation.z=.10;
    }else{legs.forEach(({leg})=>leg.rotation.z=0);}
    if(root.userData.pose==='carry'){arms[0].arm.rotation.x=-2.35;arms[0].elbow.rotation.x=-.5;arms[1].arm.rotation.x=-.4;}
    if(root.userData.pose==='lift')arms.forEach(({arm,elbow})=>{arm.rotation.x=-2.65;elbow.rotation.x=-.2;});
    body.position.y=Math.sin(time*2.3)*.007+Math.abs(stride)*.025;
    head.rotation.y=speed<.1?Math.sin(time*.6)*.018:0;
    tail.rotation.y=Math.sin(time*1.8)*.12;tail.rotation.z=Math.sin(time*1.5)*.035;
    atlas.offset.y=time%4.4>4.25?0:.5;
  }};
}
