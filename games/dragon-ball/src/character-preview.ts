import * as THREE from 'three';
import { character } from './characters';

const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(innerWidth,innerHeight); renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
renderer.toneMapping=THREE.NeutralToneMapping;
renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFShadowMap;
document.body.prepend(renderer.domElement);
renderer.domElement.setAttribute('aria-label','Modelli tridimensionali di Goku e Bulma');
const scene = new THREE.Scene(); scene.background = new THREE.Color(0xe5f1fc);
scene.add(new THREE.HemisphereLight(0xe5f5ff,0x617184,1.9));
const sun = new THREE.DirectionalLight(0xfff4e4,2.2); sun.position.set(-4,7,6); sun.castShadow=true; sun.shadow.mapSize.set(1024,1024); sun.shadow.normalBias=0.02; scene.add(sun);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({opacity:0.13})); floor.rotation.x=-Math.PI/2; floor.receiveShadow=true; scene.add(floor);
const goku=character('goku'), bulma=character('bulma'); goku.root.position.x=-1.15; bulma.root.position.x=1.15;
const models=new THREE.Group();models.add(goku.root,bulma.root);scene.add(models);
const camera=new THREE.PerspectiveCamera(35,innerWidth/innerHeight,0.1,100);
let angle=0,desiredAngle=0,distance=8.6,close=false,walking=false,jumping=false,drag=false,previous=0;
let previousTime=performance.now(),time=0;
const button=(id:string)=>document.getElementById(id) as HTMLButtonElement;
function selectView(id:string){for(const item of ['front','side','back','close'])button(item).setAttribute('aria-pressed',String(item===id));}
button('front').onclick=()=>{close=false;desiredAngle=0;selectView('front');};
button('side').onclick=()=>{close=false;desiredAngle=Math.PI/2;selectView('side');};
button('back').onclick=()=>{close=false;desiredAngle=Math.PI;selectView('back');};
button('close').onclick=()=>{close=!close;desiredAngle=0;selectView(close?'close':'front');};
button('walk').onclick=()=>{walking=!walking;button('walk').setAttribute('aria-pressed',String(walking));};
button('jump').onclick=()=>{jumping=true;time=0;};
renderer.domElement.addEventListener('pointerdown',e=>{drag=true;previous=e.clientX;renderer.domElement.setPointerCapture(e.pointerId);});
renderer.domElement.addEventListener('pointermove',e=>{if(drag){desiredAngle+=(e.clientX-previous)*0.01;previous=e.clientX;}});
renderer.domElement.addEventListener('pointerup',()=>{drag=false;});
renderer.domElement.addEventListener('wheel',e=>{e.preventDefault();distance=THREE.MathUtils.clamp(distance+e.deltaY*0.005,4.8,12);},{passive:false});
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
renderer.setAnimationLoop(now=>{
  const dt=Math.min(0.05,(now-previousTime)/1000);previousTime=now;time+=dt;
  angle+=(desiredAngle-angle)*Math.min(1,dt*8);goku.root.rotation.y=angle;bulma.root.rotation.y=angle;
  const target=new THREE.Vector3(0,close?2.25:1.55,0);
  const desired=new THREE.Vector3(0,close?2.8:3.1,close?5.6:distance);camera.position.lerp(desired,Math.min(1,dt*8));camera.lookAt(target);
  goku.root.position.x=close?-1:-1.15;bulma.root.position.x=close?1:1.15;
  // Align heads only in the inspection view; the game's relative heights stay unchanged.
  goku.root.position.y=close?0.61:0;
  const hop=jumping?Math.max(0,Math.sin(Math.min(time,0.75)/0.75*Math.PI))*0.65:0;
  if(jumping&&time>0.75)jumping=false;
  if(!close)goku.root.position.y=hop;
  bulma.root.position.y=hop;
  goku.animate(time,walking?0.8:0,jumping);bulma.animate(time+0.4,walking?0.8:0,jumping);
  document.getElementById('names')!.hidden=close;
  renderer.render(scene,camera);
});
