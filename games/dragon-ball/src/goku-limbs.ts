import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { material } from './geometry.ts';
import { profileSampler } from './goku-surfaces.ts';

type Ring = [y: number, width: number, front: number, back: number, material: number, z?: number];
type Palette = { skin:number; blue:number; wrist:number; trousers:number; shoe:number; belt:number };

// Continuous surfaces span the elbow/knee. Only the weights change at the joint.
// This avoids the separate caps and dark joint rings of the rejected rigid limbs.
function limb(parent:THREE.Group,name:string,controls:Ring[],colours:number[],bendY:number,sides=12,landmarks:number[]=[],anchorTop=false){
  const sample=profileSampler(controls.map(r=>[r[0],r[1],r[2],r[3],0,r[5]??0]));
  const min=controls[0][0],max=controls[controls.length-1][0];
  const heights=new Set<number>(Array.from({length:20},(_,i)=>THREE.MathUtils.lerp(min,max,i/19)));
  landmarks.forEach(y=>heights.add(y));
  controls.forEach((r,i)=>{if(i===0||r[4]!==controls[i-1][4])heights.add(r[0]);});
  const rings:Ring[]=[...heights].sort((a,b)=>a-b).map(y=>{
    const [,w,front,back,,z]=sample(y);let row=0;
    while(row<controls.length-1&&y>=controls[row+1][0])row++;
    return [y,w,front,back,controls[row][4],z];
  });
  const geometry=new THREE.BufferGeometry(),positions:number[]=[],indices:number[]=[],skinIndices:number[]=[],weights:number[]=[];
  for(const [y,w,front,back,,z=0] of rings)for(let i=0;i<sides;i++){
    const a=i/sides*Math.PI*2,cos=Math.cos(a);
    positions.push(Math.sin(a)*w,y,z+cos*(cos>=0?front:back));
    const blend=THREE.MathUtils.smoothstep(-y,bendY-.075,bendY+.075);
    if(anchorTop){
      const fixed=1-THREE.MathUtils.smoothstep(-y,-.015,.08);
      skinIndices.push(0,1,2,0);weights.push(fixed,(1-fixed)*(1-blend),(1-fixed)*blend,0);
    }else{skinIndices.push(0,1,0,0);weights.push(1-blend,blend,0,0);}
  }
  for(let row=0;row<rings.length-1;row++){
    const start=indices.length;
    for(let i=0;i<sides;i++){const a=row*sides+i,b=row*sides+(i+1)%sides;indices.push(a,b,a+sides,b,b+sides,a+sides);}
    geometry.addGroup(start,indices.length-start,rings[row][4]);
  }
  for(const [row,reverse] of [[0,true],[rings.length-1,false]] as const){
    const start=indices.length;
    for(let i=1;i<sides-1;i++){const a=row*sides,b=a+i,c=a+i+1;indices.push(...(reverse?[a,c,b]:[a,b,c]));}
    geometry.addGroup(start,indices.length-start,rings[row][4]);
  }
  // Reorder triangles by material so each cloth/skin region needs one group.
  const batches=new Map<number,number[]>();
  for(const group of geometry.groups){const key=group.materialIndex??0,batch=batches.get(key)??[];batch.push(...indices.slice(group.start,group.start+group.count));batches.set(key,batch);}
  const groupedIndices:number[]=[];geometry.clearGroups();
  for(const [materialIndex,batch] of batches){geometry.addGroup(groupedIndices.length,batch.length,materialIndex);groupedIndices.push(...batch);}
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setIndex(groupedIndices);geometry.computeVertexNormals();
  geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(skinIndices,4));geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));
  const upper=new THREE.Bone(),lower=new THREE.Bone();upper.name=name+'-upper';lower.name=name+'-lower';lower.position.y=-bendY;upper.add(lower);
  const bones:THREE.Bone[]=[];
  if(anchorTop){const anchor=new THREE.Bone();anchor.name=name+'-torso';anchor.add(upper);parent.add(anchor);bones.push(anchor,upper,lower);}else{parent.add(upper);bones.push(upper,lower);}
  const model=new THREE.SkinnedMesh(geometry,colours.map(material));model.name=name;model.castShadow=true;model.receiveShadow=true;parent.add(model);
  parent.updateWorldMatrix(true,true);const skeleton=new THREE.Skeleton(bones);model.bind(skeleton);
  return {upper,lower,model,sampleProfile:sample};
}

export function gokuArm(body:THREE.Group,side:number,C:Palette){
  const arm=new THREE.Group();arm.name=side<0?'left-shoulder':'right-shoulder';arm.position.set(side*.30,1.68,0);body.add(arm);
  const {upper,lower:elbow,sampleProfile:sampleArm}=limb(arm,'goku-arm',[
    [-.84,.005,.008,.008,0,.012],[-.822,.032,.034,.029,0,.012],
    [-.80,.065,.075,.062,0,.012],[-.765,.09,.091,.077,0,.012],[-.68,.08,.087,.077,1],
    [-.60,.092,.093,.085,1],[-.575,.092,.093,.088,0],[-.49,.105,.102,.102,0],
    [-.405,.095,.093,.09,0],[-.35,.088,.086,.087,0],[-.30,.102,.10,.105,0],
    [-.22,.119,.114,.118,0],[-.12,.119,.112,.116,0],[-.035,.107,.095,.102,0],
    [.012,.072,.063,.075,0],[.033,.03,.027,.03,0],[.042,.003,.003,.003,0],
  ],[C.skin,C.wrist,C.blue],.35,12,[-.12,-.035,.012,.033],true);
  // A thumb integrated into the moving forearm, without a separate wrist pivot.
  const thumb=new THREE.Mesh(new THREE.SphereGeometry(1,12,6),material(C.skin));thumb.scale.set(.038,.058,.037);thumb.position.set(-side*.071,-.352,.061);elbow.add(thumb);thumb.castShadow=true;
  const creases:THREE.BufferGeometry[]=[];
  for(const x of [-.048,-.016,.016,.048]){
    const points=[-.36,-.385,-.40].map(y=>{
      const [,w,front,,,z=0]=sampleArm(y-.35);
      return new THREE.Vector3(x,y,z+front*Math.sqrt(Math.max(0,1-(x/w)**2))+.0015);
    });
    creases.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),3,.0015,3,false));
  }
  const creaseGeometry=mergeGeometries(creases,false);creases.forEach(g=>g.dispose());
  if(creaseGeometry)elbow.add(new THREE.Mesh(creaseGeometry,new THREE.MeshBasicMaterial({color:0xad764e,transparent:true,opacity:.65,depthWrite:false})));
  upper.rotation.z=side*.10;return {arm:upper,elbow};
}

export function gokuLeg(body:THREE.Group,side:number,C:Palette){
  const leg=new THREE.Group();leg.name=side<0?'left-hip':'right-hip';leg.position.set(side*.173,1.02,0);body.add(leg);
  const {lower:knee}=limb(leg,'goku-leg',[
    [-.975,.115,.22,.10,3,.038],[-.96,.135,.245,.11,2,.038],[-.895,.125,.218,.11,2,.036],
    [-.84,.087,.09,.09,3],[-.79,.099,.104,.10,3],[-.76,.112,.115,.113,0],
    [-.68,.145,.142,.145,0],[-.57,.159,.15,.158,0],[-.46,.163,.152,.16,0],
    [-.38,.173,.158,.17,0],[-.23,.184,.172,.18,0],[-.08,.173,.165,.175,0],[.03,.138,.135,.145,0],
  ],[C.trousers,C.trousers,C.shoe,C.belt],.46);
  return {leg,knee};
}
