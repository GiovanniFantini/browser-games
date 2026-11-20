import * as THREE from 'three';
import { mesh } from './geometry.ts';
import { curvedLoft,curvedLock,type Point } from './goku-surfaces.ts';

type Palette={blue:number;fold:number;skin:number;belt:number;beltShade:number};
function fabricMap(){
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;
  const c=canvas.getContext('2d')!;c.fillStyle='#375da0';c.fillRect(0,0,256,256);
  c.translate(0,256);c.scale(1,-1);
  // A small painted collar and fold atlas on a genuinely curved cloth surface.
  c.fillStyle='#ffc18b';c.beginPath();c.moveTo(110,256);c.lineTo(146,256);c.lineTo(128,200);c.closePath();c.fill();
  c.strokeStyle='#243f72';c.lineWidth=6;c.lineCap='round';
  c.beginPath();c.moveTo(107,256);c.bezierCurveTo(116,218,138,165,157,126);c.stroke();
  c.strokeStyle='#6081b5';c.lineWidth=3;c.beginPath();c.moveTo(149,256);c.bezierCurveTo(141,221,116,146,99,108);c.stroke();
  c.strokeStyle='#294980';c.lineWidth=2;
  for(const side of [-1,1]){
    c.beginPath();c.moveTo(128+side*39,202);c.quadraticCurveTo(128+side*28,161,128+side*32,135);c.stroke();
    c.beginPath();c.moveTo(128+side*38,92);c.quadraticCurveTo(128+side*24,103,128+side*20,120);c.stroke();
  }
  const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;return map;
}
function cord(parent:THREE.Object3D,colour:number,p:Point[],widths:number[],depths:number[]){return mesh(curvedLock(p,widths,depths,5,6),colour,parent);}
export function addGokuClothes(body:THREE.Group,C:Palette){
  const shirt=new THREE.Mesh(curvedLoft([[.95,.31,.18,.19],[1.11,.29,.20,.20],[1.34,.345,.215,.215],[1.48,.32,.17,.19],[1.56,.31,.125,.15]],16,10,(p,a,t)=>{
    const front=Math.max(0,Math.cos(a));p.z+=front*.006*Math.sin(t*15+a*4);
    // The gi spans the clavicle and slopes onto the deltoid. Its old narrow
    // top ended beside the neck and left each shoulder looking like a cap.
    p.y-=.068*Math.sin(a)**2*THREE.MathUtils.smoothstep(t,.75,1);
  }),new THREE.MeshToonMaterial({color:0xffffff,map:fabricMap()}));
  shirt.castShadow=true;shirt.receiveShadow=true;body.add(shirt);
  mesh(curvedLoft([[.73,.33,.20,.21],[.83,.345,.205,.22],[.97,.31,.19,.20],[1.015,.305,.19,.20]],16,6,(p,a,t)=>{
    p.y+=(1-t)**3*.13*Math.exp(-((p.x/.11)**2))*Math.max(0,Math.cos(a))**4;
    p.z+=.008*Math.sin(a*5)*Math.sin(t*Math.PI);
  }),C.blue,body);
  // Rounded belt edges and soft, curved cloth tails.
  mesh(curvedLoft([[.982,.308,.191,.202],[.994,.322,.207,.215],[1.045,.324,.210,.217],[1.067,.311,.194,.206]],16,5),C.belt,body);
  cord(body,C.belt,[[-.045,1.03,.215],[0,1.025,.265],[.05,1.025,.218]],[.033,.04,.03],[.018,.022,.015]);
  cord(body,C.belt,[[-.018,1.01,.245],[-.065,.85,.27],[-.115,.66,.28]],[.038,.041,.03],[.008,.010,.006]);
  cord(body,C.belt,[[.035,1.015,.245],[.115,.87,.265],[.17,.73,.27]],[.034,.038,.026],[.008,.009,.006]);
  const staff=new THREE.Group();staff.name='nyoibo';staff.position.set(0,1.24,-.27);staff.rotation.z=-.42;body.add(staff);
  mesh(new THREE.CylinderGeometry(.034,.034,1.80,10),0x963129,staff);
  mesh(new THREE.CylinderGeometry(.038,.038,.045,10),0xb87037,staff,0,.89,0);
  mesh(new THREE.CylinderGeometry(.038,.038,.045,10),0xb87037,staff,0,-.89,0);
  cord(body,0x97432e,[[-.26,1.54,-.13],[.1,1.29,-.238],[.24,1.05,-.18]],[.018,.018,.018],[.018,.018,.018]);
}
